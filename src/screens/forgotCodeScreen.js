// src/screens/ForgotCodeScreen.js
import { Ionicons } from "@expo/vector-icons";
//import { Asset } from "expo-asset";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { forgotStart, forgotVerify } from "../api/client";
import GlassCard from "../components/glassCard";
import SvButton from "../components/svButton";
import SvInput from "../components/svInput";
import useAuthAssets from "../hooks/useAuthAssets";
import useCountdown from "../hooks/useCountdown";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = Math.min(420, width - 32);
const RADIUS = 18;
const GRADIENT_COLORS = ["#083726", "#072F20", "#05271A"];
const BG = "#05271A";

// Watermark
const LOGO_SIZE = width * 0.88;
const LOGO_SCALE = 1.02;
const EDGE_HIDE = Math.max(6, Math.round(width * 0.012));
const LOGO_TOP = height * 0.065;

export default function ForgotCodeScreen({ route, navigation }) {
  useAuthAssets();
  const insets = useSafeAreaInsets();
  const backTop = Platform.OS === "web" ? 16 : (insets.top || 0) + 8;
  const email = String(route?.params?.email || "")
    .trim()
    .toLowerCase();

  // === animações de entrada (card / watermark) ===
  const screenAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(screenAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [screenAnim]);
  const cardTranslateY = screenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });
  const cardOpacity = screenAnim;
  const wmOpacity = screenAnim;
  const wmScale = screenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1],
  });

  // watermark “respirar”
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
  }, [breathe]);
  const breatheScale = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  // back
  const handleBack = () => navigation.replace("ForgotEmail", { email });

  // === estado ===
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { left, reset } = useCountdown(60);

  useEffect(() => {
    reset(60);
  }, [reset]);

  const handleVerify = async () => {
    if (loading) return;
    setError("");

    const normalized = code.replace(/\D/g, "").slice(0, 6);
    if (!/^\d{6}$/.test(normalized)) {
      setError("Digite o código de 6 dígitos.");
      return;
    }

    try {
      setLoading(true);
      const { data } = await forgotVerify(email, normalized);
      const token = data?.token;
      if (!token) throw new Error("Token temporário ausente.");
      navigation.navigate("ForgotReset", { token });
    } catch (err) {
      const status = err?.response?.status;
      const payload = err?.response?.data || {};
      const msg = payload.erro || payload.message || "Código inválido.";

      if (status === 410)
        setError("Código não encontrado ou expirado. Reenvie o código.");
      else if (status === 429)
        setError("Muitas tentativas. Reenvie um novo código.");
      else if (status === 400) setError("Código inválido.");
      else setError(msg);

      console.log("forgot_verify_failed", payload || err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (loading || left > 0) return;
    setError("");

    try {
      setLoading(true);
      await forgotStart(email);
      reset(60);
      Alert.alert("Reenviado", "Verifique seu e-mail.");
    } catch (err) {
      const payload = err?.response?.data || {};
      const msg =
        payload.erro || payload.message || "Não foi possível reenviar.";
      setError(msg);
      console.log("forgot_resend_failed", payload || err?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          backgroundColor: BG,
          minHeight: height,
        }}
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
      >
        <View style={styles.container}>
          <LinearGradient
            colors={GRADIENT_COLORS}
            style={StyleSheet.absoluteFill}
          />

          {/* Watermark */}
          <Animated.View
            style={[styles.watermarkWrap, { opacity: wmOpacity }]}
            pointerEvents="none"
            collapsable={false}
          >
            <Animated.View
              style={[
                styles.watermarkClip,
                {
                  transform: [
                    { scale: Animated.multiply(wmScale, breatheScale) },
                  ],
                },
              ]}
              collapsable={false}
            >
              <Image
                key={`wm-${route?.key || "sem-rota"}`}
                source={require("../../assets/Logo-savoia.png")}
                style={styles.watermarkImage}
                resizeMode="contain"
                accessible={false}
                fadeDuration={0}
              />
              <View style={styles.ringMask} />
            </Animated.View>
          </Animated.View>

          {/* voltar */}
          <Animated.View
            style={[styles.backBtn, { opacity: cardOpacity, top: backTop }]}
          >
            <Pressable
              onPress={handleBack}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-back" size={26} color="#fff" />
            </Pressable>
          </Animated.View>

          {/* card */}
          <Animated.View
            style={{
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
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
              <Text style={styles.title}>Digite o código enviado</Text>
              <Text style={styles.sub}>{email}</Text>

              <SvInput
                label="CÓDIGO"
                placeholder="000000"
                value={code}
                onChangeText={(t) => {
                  setError("");
                  setCode(t.replace(/\D/g, "").slice(0, 6));
                }}
                keyboardType="number-pad"
                error={error}
              />

              <SvButton
                title="Validar"
                onPress={handleVerify}
                loading={loading}
                style={{ marginTop: 16 }}
              />

              <View style={{ marginTop: 12, alignItems: "center" }}>
                <Pressable
                  disabled={left > 0 || loading}
                  onPress={handleResend}
                >
                  <Text
                    style={{
                      color: left > 0 ? "rgba(255,255,255,0.6)" : "#fff",
                      fontWeight: "900",
                    }}
                  >
                    {left > 0 ? `Reenviar (${left}s)` : "Reenviar"}
                  </Text>
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
    backgroundColor: BG,
  },

  // watermark
  watermarkWrap: {
    position: "absolute",
    top: LOGO_TOP,
    alignItems: "center",
    justifyContent: "center",
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    zIndex: 0,
    ...(Platform.OS === "ios"
      ? { needsOffscreenAlphaCompositing: true }
      : null),
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

  backBtn: {
    position: "absolute",
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
    zIndex: 5,
  },

  title: { color: "#fff", fontSize: 18, fontWeight: "900" },
  sub: { color: "rgba(255,255,255,0.9)", marginTop: 6, marginBottom: 12 },
});
