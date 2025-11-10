import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
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
import { sendEmailCode, verifyEmailCode } from "../api/client";
import SvButton from "../components/svButton";
import SvInput from "../components/svInput";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = Math.min(420, width - 32);
const RADIUS = 18;

const GRADIENT_COLORS = ["#083726", "#072F20", "#05271A"];
const BG = "#05271A";

const LOGO_SIZE = width * 0.88;
const LOGO_SCALE = 1.02;
const EDGE_HIDE = Math.max(6, Math.round(width * 0.012));
const LOGO_TOP = height * 0.065;

// cooldown do backend: 30s
const RESEND_SECONDS = 30;

export default function VerifyEmailScreen({ navigation, route }) {
  const emailParam  = route?.params?.email || "";
  const alreadySent = !!route?.params?.alreadySent;

  useEffect(() => {
    if (!emailParam) {
      Alert.alert("Atenção", "E-mail não informado.");
      navigation.replace("Login");
    }
  }, [emailParam, navigation]);

  // animações
  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  }, [enterAnim]);
  const cardTranslateY = enterAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const cardOpacity = enterAnim;

  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 3800, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 3800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);
  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });

  const backAnim = useRef(new Animated.Value(0)).current;
  const handleBack = () => {
    Animated.timing(backAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start(() => {
      navigation.goBack();
    });
  };
  const backStyle = {
    opacity: backAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [{ translateX: backAnim.interpolate({ inputRange: [0, 1], outputRange: [0, width * 0.08] }) }],
  };

  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Timer de reenvio: usa "cooldown" se vier na navegação; senão, fallback em alreadySent
  const cooldownParam = Number(route?.params?.cooldown);
  const initialLeft =
    Number.isFinite(cooldownParam)
      ? Math.max(0, Math.min(RESEND_SECONDS, cooldownParam))
      : (alreadySent ? RESEND_SECONDS : 0);

  const [left, setLeft] = useState(initialLeft);
  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [left]);

  const onConfirm = async () => {
    setErr("");
    if (!/^\d{6}$/.test(code)) {
      setErr("Digite o código numérico de 6 dígitos.");
      return;
    }
    try {
      setLoading(true);
      await verifyEmailCode(emailParam, code);
      Alert.alert("Tudo certo!", "E-mail verificado com sucesso.");
      navigation.replace("Login", { email: emailParam });
    } catch (e) {
      const msg =
        e?.response?.data?.erro ||
        e?.response?.data?.message ||
        "Código inválido ou expirado.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (left > 0) return;
    try {
      await sendEmailCode({ email: emailParam });
      setLeft(RESEND_SECONDS);
    } catch (e) {
      Alert.alert(
        "Ops!",
        e?.response?.data?.erro || e?.response?.data?.message || "Falha ao reenviar código."
      );
      setLeft(0);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, backgroundColor: BG }}
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
      >
        <View style={styles.container}>
          <LinearGradient colors={GRADIENT_COLORS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

          {/* Watermark */}
          <View style={styles.watermarkWrap} pointerEvents="none">
            <Animated.View style={[styles.watermarkClip, { transform: [{ scale: breatheScale }] }]}>
              <Image source={require("../../assets/Logo-savoia.png")} style={styles.watermarkImage} resizeMode="contain" accessible={false} />
              <View style={styles.ringMask} />
            </Animated.View>
          </View>

          {/* voltar */}
          <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </Pressable>

          {/* card */}
          <Animated.View style={[backStyle, { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }]}>
            <View style={styles.shadowWrap} renderToHardwareTextureAndroid shouldRasterizeIOS>
              <View style={styles.cardWrap}>
                <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.cardContent}>
                  <Text style={styles.title}>Confirme seu e-mail</Text>
                  <Text style={styles.subtitle}>
                    Enviamos um código de 6 dígitos para {"\n"}
                    <Text style={{ fontWeight: "800", color: "#fff" }}>{emailParam}</Text>
                  </Text>

                  <SvInput
                    label="CÓDIGO"
                    placeholder="••••••"
                    value={code}
                    onChangeText={(t) => setCode(t.replace(/\D+/g, "").slice(0, 6))}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    importantForAutofill="no"
                    textContentType="oneTimeCode"
                    error={err}
                  />

                  <SvButton title="Confirmar" onPress={onConfirm} loading={loading} style={{ marginTop: 16 }} />

                  <View style={{ marginTop: 12, alignItems: "center" }}>
                    <Pressable onPress={onResend} disabled={left > 0}>
                      <Text style={{ color: left > 0 ? "rgba(255,255,255,0.6)" : "#fff", fontWeight: "900" }}>
                        {left > 0 ? `Reenviar código em ${left}s` : "Reenviar código"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: BG },

  backBtn: {
    position: "absolute",
    top: 48,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },

  watermarkWrap: { position: "absolute", top: LOGO_TOP, alignItems: "center", justifyContent: "center", width: LOGO_SIZE, height: LOGO_SIZE },
  watermarkClip: { width: "100%", height: "100%", borderRadius: LOGO_SIZE / 2, overflow: "hidden", position: "relative" },
  watermarkImage: { width: "100%", height: "100%", opacity: 0.08, transform: [{ scale: LOGO_SCALE }], alignSelf: "center", backgroundColor: "transparent" },
  ringMask: { ...StyleSheet.absoluteFillObject, borderRadius: LOGO_SIZE / 2, borderWidth: EDGE_HIDE, borderColor: "#072F20", backgroundColor: "transparent" },

  shadowWrap: { width: CARD_WIDTH, borderRadius: 18, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 14 },
  cardWrap: { borderRadius: RADIUS, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", backgroundColor: "rgba(255,255,255,0.16)" },
  cardContent: { padding: 18 },

  title: { color: "#fff", fontSize: 18, fontWeight: "900" },
  subtitle: { color: "rgba(255,255,255,0.85)", marginTop: 6, marginBottom: 12, lineHeight: 20, textAlign: "center" },
});
