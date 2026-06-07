// src/navigation/appNavigator.js
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { Platform, View } from "react-native";

import CadastroScreen from "../screens/cadastroScreen";
import HomeScreen from "../screens/homeScreen";
import LoginScreen from "../screens/loginScreen";
import SplashScreen from "../screens/splashScreen";

import ForgotCodeScreen from "../screens/forgotCodeScreen";
import ForgotEmailScreen from "../screens/forgotEmailScreen";
import ForgotResetScreen from "../screens/forgotResetScreen";
import VerifyEmailScreen from "../screens/verifyEmailScreen";

const Stack = createNativeStackNavigator();

export const STACK_BG = "#05271A";
const IS_ANDROID = Platform.OS === "android";

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
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}
