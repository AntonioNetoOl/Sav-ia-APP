// src/navigation/appNavigator.js
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import CadastroScreen from "../screens/cadastroScreen";
import HomeScreen from "../screens/homeScreen";
import LoginScreen from "../screens/loginScreen";
import SplashScreen from "../screens/splashScreen";

import ForgotCodeScreen from "../screens/forgotCodeScreen";
import ForgotEmailScreen from "../screens/forgotEmailScreen";
import ForgotResetScreen from "../screens/forgotResetScreen";
import VerifyEmailScreen from "../screens/verifyEmailScreen";

import LoyaltyInfoScreen from "../screens/loyaltyInfoScreen";
import MenuScreen from "../screens/menuScreen";
import ProfileScreen from "../screens/profileScreen";
import SubsedesScreen from "../screens/subsedesScreen";

const Stack = createNativeStackNavigator();

export const STACK_BG = "#05271A";
const IS_ANDROID = Platform.OS === "android";

function PlaceholderScreen({ navigation, route }) {
  const title = route?.params?.title || "Área em desenvolvimento";
  const description =
    route?.params?.description ||
    "Esta área já está reservada e será detalhada em uma próxima etapa.";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: STACK_BG,
        paddingTop: IS_ANDROID ? 42 : 56,
        paddingHorizontal: 20,
      }}
    >
      <Pressable
        onPress={() => navigation.goBack()}
        style={{ paddingVertical: 12 }}
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>← Voltar</Text>
      </Pressable>

      <View
        style={{
          flex: 1,
          borderRadius: 24,
          marginTop: 18,
          marginBottom: 28,
          padding: 24,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255,255,255,0.10)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.16)",
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 24,
            fontWeight: "900",
            textAlign: "center",
          }}
        >
          {title}
        </Text>

        <Text
          style={{
            color: "rgba(255,255,255,0.76)",
            fontSize: 15,
            lineHeight: 22,
            marginTop: 14,
            textAlign: "center",
          }}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

const SavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: STACK_BG,
    card: STACK_BG,
    border: "transparent",
    text: "#fff",
    primary: "#0C6A3D",
  },
};

const modalLike = Platform.select({
  web: {
    presentation: "card",
    animation: "fade",
    detachPreviousScreen: true,
    contentStyle: { backgroundColor: STACK_BG },
  },
  default: {
    presentation: "card",
    animation: "fade",
    detachPreviousScreen: IS_ANDROID ? false : true,
    contentStyle: { backgroundColor: STACK_BG },
  },
});

export default function AppNavigator() {
  useEffect(() => {
    if (IS_ANDROID) {
      SystemUI.setBackgroundColorAsync(STACK_BG).catch(() => {});
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: STACK_BG }}>
      <NavigationContainer theme={SavTheme}>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            animation: "fade",
            headerShadowVisible: false,
            contentStyle: { backgroundColor: STACK_BG },
            gestureEnabled: true,
            detachPreviousScreen: IS_ANDROID ? false : true,
            ...(IS_ANDROID
              ? { statusBarStyle: "light", statusBarColor: STACK_BG }
              : {}),
          }}
        >
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{ headerShown: false, gestureEnabled: false }}
          />

          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Cadastro"
            component={CadastroScreen}
            options={{ headerShown: false, ...modalLike }}
          />

          <Stack.Screen
            name="VerifyEmail"
            component={VerifyEmailScreen}
            options={{ headerShown: false, ...modalLike }}
          />

          <Stack.Screen
            name="ForgotEmail"
            component={ForgotEmailScreen}
            options={{ headerShown: false, ...modalLike }}
          />

          <Stack.Screen
            name="ForgotCode"
            component={ForgotCodeScreen}
            options={{ headerShown: false, ...modalLike }}
          />

          <Stack.Screen
            name="ForgotReset"
            component={ForgotResetScreen}
            options={{ headerShown: false, ...modalLike }}
          />

          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              headerShown: false,
              animation: "fade_from_bottom",
            }}
          />

          <Stack.Screen
            name="Menu"
            component={MenuScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Subsedes"
            component={SubsedesScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="LoyaltyInfo"
            component={LoyaltyInfoScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Benefits"
            component={PlaceholderScreen}
            initialParams={{
              title: "Meus benefícios",
              description:
                "Aqui você poderá acompanhar benefícios disponíveis, utilizados ou futuros.",
            }}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Payments"
            component={PlaceholderScreen}
            initialParams={{
              title: "Pagamentos",
              description:
                "Esta tela terá abas para histórico de pagamentos, cartões cadastrados e cadastro de cartão.",
            }}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="FAQ"
            component={PlaceholderScreen}
            initialParams={{
              title: "Dúvidas frequentes",
              description:
                "Aqui ficarão as principais dúvidas sobre conta, associação, carteirinha, fidelidade e pagamentos.",
            }}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Settings"
            component={PlaceholderScreen}
            initialParams={{
              title: "Configurações",
              description:
                "Preferências do app, notificações e segurança serão organizadas aqui.",
            }}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="TermsPrivacy"
            component={PlaceholderScreen}
            initialParams={{
              title: "Termos e privacidade",
              description:
                "Esta área exibirá termos de uso, política de privacidade e informações sobre dados.",
            }}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}
