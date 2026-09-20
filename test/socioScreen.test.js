import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import api from "../src/api/client";
import SocioScreen from "../src/screens/socioScreen";

const Stack = createNativeStackNavigator();

function response(config, data) {
  return { config, data, status: 200, statusText: "OK", headers: {} };
}

async function renderArea() {
  const navigation = createNavigationContainerRef();
  await render(
    <NavigationContainer ref={navigation}>
      <Stack.Navigator initialRouteName="Socio" screenOptions={{ animation: "none" }}>
        <Stack.Screen name="Socio" component={SocioScreen} />
        <Stack.Screen name="Home">{() => <Text>Início de teste</Text>}</Stack.Screen>
        <Stack.Screen name="Login">{() => <Text>Login de teste</Text>}</Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
  return navigation;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem("token", "session-test-a");
  api.defaults.adapter = jest.fn(async (config) => {
    if (config.url.endsWith("/plans")) return response(config, { plans: [] });
    throw new Error("Rede indisponível no teste");
  });
});

test("falha de resumo não apresenta não sócio nem chamada de associação", async () => {
  await renderArea();
  await act(async () => {});
  expect(screen.queryByText("Não sócio")).toBeNull();
  expect(screen.queryByText("Conhecer planos")).toBeNull();
  expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeOnTheScreen();
});

function summary(memberStatus = "nao_socio", name = "Pessoa Teste") {
  return {
    user: { id: 42, name }, memberStatus,
    statusCard: { title: memberStatus === "nao_socio" ? "Você ainda não é sócio" : "Associação ativa" },
    association: { title: "Associação de teste", linked: memberStatus !== "nao_socio" },
  };
}

test("nova tentativa oculta ações enquanto carrega e aceita não sócio válido", async () => {
  await renderArea();
  let finish;
  api.defaults.adapter = jest.fn((config) => config.url.endsWith("/plans")
    ? Promise.resolve(response(config, { plans: [] }))
    : new Promise((resolve) => { finish = () => resolve(response(config, summary())); }));
  await fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(screen.getByLabelText("Carregando associação")).toBeOnTheScreen();
  expect(screen.queryByText("Conhecer planos")).toBeNull();
  expect(screen.queryByRole("button", { name: "Tentar novamente" })).toBeNull();
  await act(async () => finish());
  expect(await screen.findByText("Não sócio")).toBeOnTheScreen();
  expect(screen.getByText("Conhecer planos")).toBeOnTheScreen();
});

test("401 mostra sessão expirada e oferece retorno ao login", async () => {
  api.defaults.adapter = jest.fn(async (config) => {
    if (config.url.endsWith("/plans")) return response(config, { plans: [] });
    throw { config, response: { status: 401 } };
  });
  await renderArea();
  expect(await screen.findByText("Sua sessão expirou. Entre novamente para consultar sua associação.")).toBeOnTheScreen();
  expect(screen.queryByText("Conhecer planos")).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Entrar novamente" }));
  expect(await screen.findByText("Login de teste")).toBeOnTheScreen();
  expect(await AsyncStorage.getItem("token")).toBeNull();
});

test.each([null, {}, { memberStatus: "desconhecido" }])("resumo inválido não vira não sócio: %j", async (data) => {
  api.defaults.adapter = jest.fn(async (config) => response(config, config.url.endsWith("/plans") ? { plans: [] } : data));
  await renderArea();
  expect(screen.queryByText("Não sócio")).toBeNull();
  expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeOnTheScreen();
});

test("retorno à tela descarta resposta pendente da sessão anterior", async () => {
  let finishOld;
  api.defaults.adapter = jest.fn((config) => {
    if (config.url.endsWith("/plans")) return Promise.resolve(response(config, { plans: [] }));
    if (config.headers.Authorization === "Bearer session-test-a") {
      return new Promise((resolve) => { finishOld = () => resolve(response(config, summary("socio_ativo", "Pessoa anterior"))); });
    }
    return Promise.resolve(response(config, summary("nao_socio", "Pessoa atual")));
  });
  const navigation = await renderArea();
  await act(async () => navigation.navigate("Home"));
  await AsyncStorage.setItem("token", "session-test-b");
  await act(async () => navigation.goBack());
  await act(async () => finishOld());
  expect(screen.queryByText("Olá, Pessoa anterior")).toBeNull();
  expect(await screen.findByText("Olá, Pessoa atual")).toBeOnTheScreen();
  expect(screen.getByText("Não sócio")).toBeOnTheScreen();
});

test("401 atrasado da sessão anterior não encerra a sessão atual", async () => {
  let rejectOld;
  api.defaults.adapter = jest.fn((config) => {
    if (config.url.endsWith("/plans")) return Promise.resolve(response(config, { plans: [] }));
    if (config.headers.Authorization === "Bearer session-test-a") {
      return new Promise((_resolve, reject) => { rejectOld = () => reject({ config, response: { status: 401 } }); });
    }
    return Promise.resolve(response(config, summary("nao_socio", "Pessoa atual")));
  });
  const navigation = await renderArea();
  await act(async () => navigation.navigate("Home"));
  await AsyncStorage.setItem("token", "session-test-b");
  await act(async () => navigation.goBack());
  await act(async () => rejectOld());
  expect(await AsyncStorage.getItem("token")).toBe("session-test-b");
  expect(screen.getByText("Olá, Pessoa atual")).toBeOnTheScreen();
});

test("sem token solicita login sem consultar a API", async () => {
  await AsyncStorage.removeItem("token");
  await renderArea();
  expect(screen.getByRole("button", { name: "Entrar novamente" })).toBeOnTheScreen();
  expect(api.defaults.adapter).not.toHaveBeenCalled();
});

test("mudança de sessão durante a consulta não exibe dados da conta anterior", async () => {
  let finish;
  api.defaults.adapter = jest.fn((config) => config.url.endsWith("/plans")
    ? Promise.resolve(response(config, { plans: [] }))
    : new Promise((resolve) => { finish = () => resolve(response(config, summary("socio_ativo", "Pessoa anterior"))); }));
  await renderArea();
  await AsyncStorage.setItem("token", "session-test-b");
  await act(async () => finish());
  expect(screen.queryByText("Olá, Pessoa anterior")).toBeNull();
  expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeOnTheScreen();
});

test("falha apenas nos planos preserva o resumo válido", async () => {
  api.defaults.adapter = jest.fn(async (config) => {
    if (config.url.endsWith("/plans")) throw new Error("Catálogo indisponível");
    return response(config, summary());
  });
  await renderArea();
  expect(screen.getByText("Não sócio")).toBeOnTheScreen();
  expect(screen.getByText("Não foi possível carregar os planos agora.")).toBeOnTheScreen();
});

test("401 dos planos impede mostrar resumo da sessão encerrada", async () => {
  api.defaults.adapter = jest.fn(async (config) => {
    if (config.url.endsWith("/plans")) throw { config, response: { status: 401 } };
    return response(config, summary());
  });
  await renderArea();
  expect(screen.getByRole("button", { name: "Entrar novamente" })).toBeOnTheScreen();
  expect(screen.queryByText("Não sócio")).toBeNull();
});

test.each([["socio_ativo", "Sócio ativo"], ["socio_inativo", "Sócio inativo"]])("preserva a apresentação válida de %s", async (status, label) => {
  api.defaults.adapter = jest.fn(async (config) => response(config, config.url.endsWith("/plans") ? { plans: [] } : summary(status)));
  await renderArea();
  expect(screen.getByText(label)).toBeOnTheScreen();
  expect(screen.queryByText("Não sócio")).toBeNull();
});
