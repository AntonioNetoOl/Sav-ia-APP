// src/screens/forgotEmailScreen.js
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
import { forgotStart } from "../api/client";
import SvButton from "../components/svButton";
import SvInput from "../components/svInput";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = Math.min(420, width - 32);
const RADIUS = 18;

const GRADIENT_COLORS = ["#083726", "#072F20", "#05271A"];
const BG = "#05271A";

// Watermark / logo
const LOGO_SIZE = width * 0.88;
const LOGO_SCALE = 1.02;
const EDGE_HIDE = Math.max(6, Math.round(width * 0.012));
const LOGO_TOP = height * 0.065;

export default function ForgotEmailScreen({ navigation, route }) {
  const prefillEmail = route?.params?.email || "";

  // animações
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  }, [enter]);

  const cardTY   = enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const cardOp   = enter;
  const wmScaleE = enter.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] });

  // “respirar” logo
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

  // animação de voltar
  const exit = useRef(new Animated.Value(0)).current;
  const [exiting, setExiting] = useState(false);
  const handleBack = () => {
    if (exiting) return;
    setExiting(true);
    Animated.timing(exit, { toValue: 1, duration: 220, useNativeDriver: true }).start(() => {
      navigation.replace("Login");
    });
  };
  const exitFade  = exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const exitSlide = exit.interpolate({ inputRange: [0, 1], outputRange: [0, width * 0.08] });

  // estado
  const [email, setEmail] = useState(prefillEmail);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (e) => /\S+@\S+\.\S+/.test(String(e).trim());

  const handleSend = async () => {
    if (loading) return;
    setError("");

    const normalized = String(email).trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      setError("E-mail inválido.");
      return;
    }

    try {
      setLoading(true);
      // Backend: POST /api/usuarios/auth/forgot/start  { email }
      await forgotStart(normalized);
      Alert.alert("Verifique seu e-mail", "Enviamos um código de 6 dígitos.");
      navigation.replace("ForgotCode", { email: normalized });
    } catch (e) {
      const status  = e?.response?.status;
      const payload = e?.response?.data || {};
      const msg = payload.erro || payload.message || "Não foi possível iniciar a recuperação.";

      if (status === 404) {
        setError("Usuário não encontrado para este e-mail.");
      } else if (status === 429) {
        setError("Aguarde alguns segundos antes de solicitar novo código.");
      } else if (status === 400) {
        setError("E-mail inválido.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
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
          <Animated.View style={[styles.watermarkWrap, { opacity: Animated.multiply(cardOp, exitFade) }]} pointerEvents="none">
            <Animated.View style={[styles.watermarkClip, { transform: [{ scale: Animated.multiply(wmScaleE, breatheScale) }] }]}>
              <Image source={require("../../assets/Logo-savoia.png")} style={styles.watermarkImage} resizeMode="contain" accessible={false} />
              <View style={styles.ringMask} />
            </Animated.View>
          </Animated.View>

          {/* voltar */}
          <Animated.View style={[styles.backBtn, { opacity: Animated.multiply(cardOp, exitFade), transform: [{ translateX: exitSlide }] }]}>
            <Pressable onPress={handleBack} hitSlop={10} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="arrow-back" size={26} color="#fff" />
            </Pressable>
          </Animated.View>

          {/* card */}
          <Animated.View style={{ opacity: Animated.multiply(cardOp, exitFade), transform: [{ translateY: cardTY }, { translateX: exitSlide }] }}>
            <View style={styles.shadowWrap} renderToHardwareTextureAndroid shouldRasterizeIOS>
              <View style={styles.cardWrap}>
                <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.cardContent}>
                  <Text style={styles.title}>Esqueci minha senha</Text>
                  <Text style={styles.subtitle}>Digite o e-mail cadastrado para enviarmos um código de verificação.</Text>

                  <SvInput
                    label="E-MAIL"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    importantForAutofill="no"
                    textContentType="emailAddress"
                    error={error}
                  />

                  <SvButton title="Enviar código" onPress={handleSend} loading={loading} style={{ marginTop: 16 }} />
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
  backBtn: { position: "absolute", top: 48, left: 20, width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },

  // Watermark / logo
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
