import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import api from "../src/api/client";
import SocioScreen from "../src/screens/socioScreen";
import PaymentsScreen from "../src/screens/paymentsScreen";

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
        <Stack.Screen name="Payments" component={PaymentsScreen} />
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

test("mostra vencimento e status do último lançamento separadamente, inclusive para sócio inativo", async () => {
  api.defaults.adapter = jest.fn(async (config) => response(config, config.url.endsWith("/plans") ? { plans: [] } : {
    ...summary("socio_inativo"),
    payments: { nextChargeDueAt: "2026-10-10", latestStatus: "paid", recurrenceEnabled: false },
  }));
  await renderArea();
  expect(screen.getByText(/Vencimento informado: 10\/10\/2026/)).toBeOnTheScreen();
  expect(screen.getByText(/Último lançamento: Pago/)).toBeOnTheScreen();
  expect(screen.getByText(/Recorrência: desativada/)).toBeOnTheScreen();
  expect(screen.getByText("Sócio inativo")).toBeOnTheScreen();
});

test.each([undefined, null, {}, { recurrenceEnabled: "false" }])("dados de pagamento incompletos não afirmam ausência de cobrança ou recorrência desativada: %j", async (payments) => {
  api.defaults.adapter = jest.fn(async (config) => response(config, config.url.endsWith("/plans") ? { plans: [] } : { ...summary(), payments }));
  await renderArea();
  expect(screen.getByText(/Vencimento indisponível/)).toBeOnTheScreen();
  expect(screen.getByText(/Situação do último lançamento indisponível/)).toBeOnTheScreen();
  expect(screen.getByText(/Recorrência: não informada/)).toBeOnTheScreen();
  expect(screen.queryByText(/Recorrência: desativada/)).toBeNull();
});

test("resposta com campos nulos informa ausência de vencimento sem afirmar quitação", async () => {
  api.defaults.adapter = jest.fn(async (config) => response(config, config.url.endsWith("/plans") ? { plans: [] } : {
    ...summary(), payments: { nextChargeDueAt: null, latestStatus: null, recurrenceEnabled: false },
  }));
  await renderArea();
  expect(screen.getByText(/Nenhum vencimento informado/)).toBeOnTheScreen();
  expect(screen.getByText(/Nenhum lançamento informado/)).toBeOnTheScreen();
  expect(screen.queryByText(/em dia|Último lançamento: Pago/i)).toBeNull();
});

test.each(["2026-02-30", "2026-05-10Tinválido", 42, "", "2026-13-01"])("vencimento inválido não é exibido como data válida: %j", async (nextChargeDueAt) => {
  api.defaults.adapter = jest.fn(async (config) => response(config, config.url.endsWith("/plans") ? { plans: [] } : {
    ...summary(), payments: { nextChargeDueAt, latestStatus: "desconhecido", recurrenceEnabled: null },
  }));
  await renderArea();
  expect(screen.getByText(/Vencimento indisponível/)).toBeOnTheScreen();
  expect(screen.getByText(/Situação do último lançamento indisponível/)).toBeOnTheScreen();
});

test.each([
  ["scheduled", "Agendado"], ["pending", "Aguardando pagamento"], ["paid", "Pago"],
  ["failed", "Falhou"], ["cancelled", "Cancelado"], ["refunded", "Estornado"],
])("traduz o estado financeiro %s sem alterar o estado associativo", async (status, label) => {
  api.defaults.adapter = jest.fn(async (config) => response(config, config.url.endsWith("/plans") ? { plans: [] } : {
    ...summary("socio_ativo"), payments: { nextChargeDueAt: "2026-05-10T00:00:00.000Z", latestStatus: status, recurrenceEnabled: true },
  }));
  await renderArea();
  expect(screen.getByText(new RegExp(`Último lançamento: ${label}`))).toBeOnTheScreen();
  expect(screen.getByText(/Vencimento informado: 10\/05\/2026/)).toBeOnTheScreen();
  expect(screen.getByText(/Recorrência: ativa/)).toBeOnTheScreen();
  expect(screen.getByText("Sócio ativo")).toBeOnTheScreen();
  expect(screen.queryByText(/dias de atraso|inativação em/i)).toBeNull();
});

test("histórico acessível pela área do sócio identifica exemplos e permite voltar", async () => {
  api.defaults.adapter = jest.fn(async (config) => response(config, config.url.endsWith("/plans") ? { plans: [] }
    : config.url.endsWith("/summary") ? { ...summary("socio_ativo"), payments: { nextChargeDueAt: null, latestStatus: null, recurrenceEnabled: false } } : []));
  await renderArea();
  await fireEvent.press(screen.getByRole("button", { name: /Pagamentos.*Ver histórico de demonstração/s }));
  expect(screen.getByText("Demonstração: os lançamentos, totais e cartões abaixo são exemplos. Eles não representam seus pagamentos.")).toBeOnTheScreen();
  await fireEvent.press(screen.getByText("Voltar"));
  expect(screen.getByText("Área do sócio")).toBeOnTheScreen();
});

function chargeTiming(fields = {}) {
  return {
    chargeId: "11", chargeStatus: "pending", dueDate: "2026-05-10", asOfDate: "2026-05-13",
    timeZone: "America/Sao_Paulo", daysOverdue: 3, phase: "grace_period",
    firstReminderDate: "2026-05-11", lastReminderDate: "2026-05-17", inactiveDate: "2026-05-18",
    ...fields,
  };
}

test("mostra o calendário de uma cobrança antiga sem confundir com o último lançamento pago", async () => {
  api.defaults.adapter = jest.fn(async (config) => response(config, config.url.endsWith("/plans") ? { plans: [] } : {
    ...summary("socio_ativo"),
    payments: { nextChargeDueAt: "2026-06-10", latestStatus: "paid", recurrenceEnabled: true, chargeTiming: chargeTiming() },
  }));
  await renderArea();
  expect(screen.getByText(/Cobrança registrada nº 11/)).toBeOnTheScreen();
  expect(screen.getByText(/Vencimento desta cobrança: 10\/05\/2026/)).toBeOnTheScreen();
  expect(screen.getByText(/3 dias de atraso nesta cobrança/)).toBeOnTheScreen();
  expect(screen.getByText(/Prazo de tolerância desta cobrança: até 17\/05\/2026/)).toBeOnTheScreen();
  expect(screen.getByText(/Situação em 13\/05\/2026 — São Paulo/)).toBeOnTheScreen();
  expect(screen.getByText(/Vencimento informado: 10\/06\/2026/)).toBeOnTheScreen();
  expect(screen.getByText(/Último lançamento: Pago/)).toBeOnTheScreen();
  expect(screen.getByText("Sócio ativo")).toBeOnTheScreen();
});

test("retorno à tela atualiza o calendário recebido sem mudar o estado associativo", async () => {
  let timing = chargeTiming();
  api.defaults.adapter = jest.fn(async (config) => response(config, config.url.endsWith("/plans") ? { plans: [] } : {
    ...summary("nao_socio"), payments: { chargeTiming: timing },
  }));
  const navigation = await renderArea();
  expect(screen.getByText(/3 dias de atraso nesta cobrança/)).toBeOnTheScreen();
  await act(async () => navigation.navigate("Home"));
  timing = chargeTiming({ asOfDate: "2026-05-18", daysOverdue: 8, phase: "grace_expired" });
  await act(async () => navigation.goBack());
  expect(screen.getByText(/8 dias de atraso nesta cobrança/)).toBeOnTheScreen();
  expect(screen.getByText("Não sócio")).toBeOnTheScreen();
  expect(screen.queryByText(/3 dias de atraso nesta cobrança/)).toBeNull();
});

test("falha ao voltar à tela descarta o calendário anterior e oferece nova tentativa", async () => {
  api.defaults.adapter = jest.fn(async (config) => response(config, config.url.endsWith("/plans") ? { plans: [] } : {
    ...summary("socio_ativo"), payments: { chargeTiming: chargeTiming() },
  }));
  const navigation = await renderArea();
  expect(screen.getByText(/Cobrança registrada nº 11/)).toBeOnTheScreen();
  await act(async () => navigation.navigate("Home"));
  api.defaults.adapter = jest.fn(async () => { throw new Error("Rede indisponível no teste"); });
  await act(async () => navigation.goBack());
  expect(screen.queryByText(/Cobrança registrada nº/)).toBeNull();
  expect(screen.queryByText(/dias de atraso nesta cobrança/)).toBeNull();
  expect(screen.queryByText("Não sócio")).toBeNull();
  expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeOnTheScreen();
});

test.each([
  ["not_overdue", 0, "2026-05-09", "scheduled", "Sem atraso nesta cobrança"],
  ["not_overdue", 0, "2026-05-10", "pending", "Sem atraso nesta cobrança"],
  ["grace_period", 1, "2026-05-11", "failed", "1 dia de atraso nesta cobrança"],
  ["grace_period", 7, "2026-05-17", "pending", "7 dias de atraso nesta cobrança"],
  ["grace_expired", 8, "2026-05-18", "failed", "Prazo de tolerância desta cobrança encerrado em 17/05/2026"],
])("apresenta a fase %s com %i dias na data de referência do servidor", async (phase, daysOverdue, asOfDate, chargeStatus, text) => {
  api.defaults.adapter = jest.fn(async (config) => response(config, config.url.endsWith("/plans") ? { plans: [] } : {
    ...summary("socio_ativo"),
    payments: { chargeTiming: chargeTiming({ phase, daysOverdue, asOfDate, chargeStatus }) },
  }));
  await renderArea();
  expect(screen.getByText(new RegExp(text))).toBeOnTheScreen();
  expect(screen.getByText(new RegExp(`Situação em ${asOfDate.split("-").reverse().join("/")} — São Paulo`))).toBeOnTheScreen();
  expect(screen.getByText("Sócio ativo")).toBeOnTheScreen();
  expect(screen.queryByText(/será inativad|inativação em|benefícios bloqueados/i)).toBeNull();
});

test.each([
  [undefined, "Calendário da cobrança indisponível"],
  [null, "Nenhuma cobrança em aberto informada"],
  [{}, "Calendário da cobrança indisponível"],
])("distingue calendário ausente, sem cobrança e incompleto: %j", async (timing, text) => {
  api.defaults.adapter = jest.fn(async (config) => response(config, config.url.endsWith("/plans") ? { plans: [] } : {
    ...summary("socio_inativo"),
    payments: { nextChargeDueAt: "2026-06-10", latestStatus: "paid", recurrenceEnabled: false, chargeTiming: timing },
  }));
  await renderArea();
  expect(screen.getByText(new RegExp(text))).toBeOnTheScreen();
  expect(screen.getByText(/Último lançamento: Pago/)).toBeOnTheScreen();
  expect(screen.getByText(/Recorrência: desativada/)).toBeOnTheScreen();
  expect(screen.getByText("Sócio inativo")).toBeOnTheScreen();
  expect(screen.queryByText(/em dia|todas as cobranças pagas/i)).toBeNull();
});

test.each([
  { chargeId: [11] }, { chargeId: { toString: null, valueOf: null } }, { chargeId: 9007199254740992 },
  { phase: "desconhecida" }, { chargeStatus: "paid" }, { timeZone: "UTC" },
  { dueDate: "2026-02-30" }, { dueDate: "2026-05-10T00:00:00.000Z" },
  { asOfDate: "ontem" }, { lastReminderDate: null },
  { daysOverdue: "3" }, { daysOverdue: 1.5 }, { daysOverdue: -1 }, { daysOverdue: 90 },
  { phase: "not_overdue", daysOverdue: 3 },
  { phase: "not_overdue", daysOverdue: 0 },
  { daysOverdue: 0 }, { asOfDate: "2026-05-18", daysOverdue: 8 },
  { phase: "grace_expired" }, { lastReminderDate: "2026-05-09" },
])("calendário inválido ou contraditório fica indisponível sem afetar outros dados: %j", async (fields) => {
  api.defaults.adapter = jest.fn(async (config) => response(config, config.url.endsWith("/plans") ? { plans: [] } : {
    ...summary("socio_ativo"),
    payments: { nextChargeDueAt: "2026-06-10", latestStatus: "paid", recurrenceEnabled: true, chargeTiming: chargeTiming(fields) },
  }));
  await renderArea();
  expect(screen.getByText(/Calendário da cobrança indisponível/)).toBeOnTheScreen();
  expect(screen.queryByText(/Cobrança registrada nº/)).toBeNull();
  expect(screen.getByText(/Vencimento informado: 10\/06\/2026/)).toBeOnTheScreen();
  expect(screen.getByText(/Último lançamento: Pago/)).toBeOnTheScreen();
  expect(screen.getByText("Sócio ativo")).toBeOnTheScreen();
});
