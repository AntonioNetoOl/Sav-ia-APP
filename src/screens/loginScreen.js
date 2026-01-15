// src/screens/LoginScreen.js
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { loginRequest } from "../api/client";
import GlassCard from "../components/glassCard";
import SvButton from "../components/svButton";
import SvInput from "../components/svInput";
import { TOKEN_FIELD } from "../constants/config";
import useAuthAssets from "../hooks/useAuthAssets";
import {
  formatCPF,
  isValidCPF,
  isValidEmail,
  onlyDigits,
} from "../utils/masks";
import { saveToken } from "../utils/storage";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = Math.min(420, width - 32);
const RADIUS = 18;

const GRADIENT_COLORS = ["#083726", "#072F20", "#05271A"];
const FALLBACK_BG = "#05271A";

const LOGO_SIZE = width * 0.88;
const LOGO_SCALE = 1.02;
const EDGE_HIDE = Math.max(6, Math.round(width * 0.012));
const LOGO_TOP = height * 0.065;

export default function LoginScreen({ navigation }) {
  useAuthAssets();

  // animações
  const cardAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, []);
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 3800,
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 3800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const breatheScale = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  // ======= estado do formulário =======
  const [mode, setMode] = useState("cpf"); // "cpf" | "email"
  const [cpfRaw, setCpfRaw] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChangeCPF = (txt) => setCpfRaw(onlyDigits(txt).slice(0, 11));
  const onChangeEmail = (txt) => setEmail(txt);

  const validate = () => {
    const e = {};
    if (mode === "cpf") {
      if (!isValidCPF(cpfRaw)) e.user = "CPF inválido.";
    } else {
      if (!isValidEmail(email.trim())) e.user = "E-mail inválido.";
    }
    if (!senha) e.senha = "Informe a senha.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (loading) return;
    if (!validate()) return;
    try {
      setLoading(true);
      const identificador = mode === "cpf" ? cpfRaw : email.trim();
      const { data } = await loginRequest(identificador, senha);
      const token =
        data?.[TOKEN_FIELD] || data?.token || data?.access_token || data?.jwt;
      if (!token) throw new Error("Token não retornado pelo servidor.");
      await saveToken(token);
      navigation.replace("Home");
    } catch (err) {
      const msg =
        err?.response?.data?.erro ||
        err?.response?.data?.message ||
        `Request failed with status code ${
          err?.response?.status || ""
        }`.trim() ||
        "Erro ao entrar.";
      setErrors((prev) => ({ ...prev, senha: msg }));
      console.log("LOGIN_ERROR:", err?.response?.data || err?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={FALLBACK_BG} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, backgroundColor: FALLBACK_BG }}
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
      >
        <View style={styles.container}>
          <LinearGradient
            colors={GRADIENT_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* LOGO */}
          <View style={styles.watermarkWrap} pointerEvents="none">
            <Animated.View
              style={[
                styles.watermarkClip,
                { transform: [{ scale: breatheScale }] },
              ]}
            >
              <Image
                source={require("../../assets/Logo-savoia.png")}
                style={styles.watermarkImage}
                resizeMode="contain"
                accessible={false}
              />
              <View style={styles.ringMask} />
            </Animated.View>
          </View>

          {/* Card */}
          <Animated.View
            style={{
              opacity: cardAnim,
              transform: [
                {
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
              ],
            }}
          >
            <GlassCard
              width={CARD_WIDTH}
              radius={RADIUS}
              padding={18}
              blur={Platform.OS === "ios"}
              androidBlurMode="fallback"
              androidElevation={0}
            >
              {/* Seletor CPF/E-mail */}
              <View style={styles.modeRow}>
                <Pressable
                  onPress={() => setMode("cpf")}
                  android_ripple={{ color: "transparent" }}
                  style={({ pressed }) => [
                    styles.modeChip,
                    mode === "cpf" && styles.modeChipActive,
                    pressed && styles.modeChipPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeText,
                      mode === "cpf" && styles.modeTextActive,
                    ]}
                  >
                    CPF
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setMode("email")}
                  android_ripple={{ color: "transparent" }}
                  style={({ pressed }) => [
                    styles.modeChip,
                    mode === "email" && styles.modeChipActive,
                    pressed && styles.modeChipPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeText,
                      mode === "email" && styles.modeTextActive,
                    ]}
                  >
                    E-mail
                  </Text>
                </Pressable>
              </View>

              {mode === "cpf" ? (
                <SvInput
                  label="CPF"
                  placeholder="000.000.000-00"
                  value={formatCPF(cpfRaw)}
                  onChangeText={onChangeCPF}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  importantForAutofill="no"
                  textContentType="username"
                  error={errors.user}
                />
              ) : (
                <SvInput
                  label="E-MAIL"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChangeText={onChangeEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  importantForAutofill="no"
                  textContentType="emailAddress"
                  error={errors.user}
                />
              )}

              <SvInput
                label="SENHA"
                placeholder="Digite sua senha"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                secureToggle
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="password"
                error={errors.senha}
                style={{ marginTop: 14 }}
              />

              <View style={styles.buttonWrap}>
                <SvButton
                  title="Entrar"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                />
              </View>

              <View style={styles.linksRow}>
                <Pressable
                  onPress={() => navigation.navigate("ForgotEmail")}
                  hitSlop={10}
                  android_ripple={{ color: "transparent" }}
                >
                  <Text style={styles.link}>Esqueci minha senha</Text>
                </Pressable>
                <Pressable
                  onPress={() => navigation.navigate("Cadastro")}
                  hitSlop={10}
                  android_ripple={{ color: "transparent" }}
                >
                  <Text style={styles.link}>Cadastre-se</Text>
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: FALLBACK_BG,
  },

  watermarkWrap: {
    position: "absolute",
    top: LOGO_TOP,
    alignItems: "center",
    justifyContent: "center",
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  watermarkClip: {
    width: "100%",
    height: "100%",
    borderRadius: LOGO_SIZE / 2,
    overflow: "hidden",
    position: "relative",
  },
  watermarkImage: {
    width: "100%",
    height: "100%",
    opacity: 0.08,
    transform: [{ scale: LOGO_SCALE }],
    alignSelf: "center",
    backgroundColor: "transparent",
  },
  ringMask: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: LOGO_SIZE / 2,
    borderWidth: EDGE_HIDE,
    borderColor: "#072F20",
    backgroundColor: "transparent",
  },

  modeRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  modeChipActive: {
    backgroundColor: "rgba(12,106,61,0.85)",
    borderColor: "rgba(255,255,255,0.6)",
  },
  modeChipPressed: { opacity: 0.85 },
  modeText: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  modeTextActive: { color: "#fff" },

  buttonWrap: {
    marginTop: 16,
    borderRadius: 14,
    overflow: "hidden",
  },

  linksRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  link: {
    color: "#FFFFFF",
    fontWeight: "900",
    textDecorationLine: "underline",
  },
});
