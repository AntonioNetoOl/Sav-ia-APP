// src/screens/forgotResetScreen.js
import { Ionicons } from "@expo/vector-icons";
//import { Asset } from "expo-asset";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
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
import { forgotReset } from "../api/client";
import SvButton from "../components/svButton";
import SvInput from "../components/svInput";
import useAuthAssets from "../hooks/useAuthAssets";
import { isStrongPassword } from "../utils/masks";

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

export default function ForgotResetScreen({ route, navigation }) {
  useAuthAssets();
  const insets = useSafeAreaInsets();
  const backTop = Platform.OS === "web" ? 16 : (insets.top || 0) + 8;
  const token = route?.params?.token || "";

  /*// Mitigação: pré-carregar asset do watermark para reduzir falhas intermitentes de render
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const asset = Asset.fromModule(require("../../assets/Logo-savoia.png"));
        await asset.downloadAsync();
      } catch {
        // fallback silencioso
      } finally {
        if (!alive) return;
      }
    })();
    return () => {
      alive = false;
    };
  }, []); */

  const [senha, setSenha] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({ senha: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  // Animação de ENTRADA
  const screenAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(screenAnim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
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

  // “Respirar” watermark
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

  // Animação de SAÍDA (para Login)
  const exitAnim = useRef(new Animated.Value(0)).current;
  const exitFade = exitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const exitSlide = exitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.08],
  });
  const leavingRef = useRef(false);
  const goLoginAnimated = () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    Animated.timing(exitAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    });
  };

  // voltar
  const handleBack = () => navigation.goBack();

  // validação local
  const validate = () => {
    const e = {};
    if (!isStrongPassword(senha)) e.senha = "Senha muito curta (mín. 6).";
    if (confirm !== senha) e.confirm = "As senhas não coincidem.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReset = async () => {
    if (loading) return;
    if (!validate()) return;

    try {
      setLoading(true);
      await forgotReset(token, senha);

      Alert.alert("Sucesso", "Senha atualizada!", [
        { text: "OK", onPress: goLoginAnimated },
      ]);
      if (Platform.OS === "web") setTimeout(goLoginAnimated, 900);
    } catch (err) {
      const status = err?.response?.status;
      const payload = err?.response?.data || {};
      const msg =
        payload.erro || payload.message || "Não foi possível trocar a senha.";

      if (status === 422) {
        setErrors((prev) => ({
          ...prev,
          senha: "Senha muito curta (mín. 6).",
        }));
        return;
      }
      if (status === 401 || status === 403) {
        Alert.alert("Sessão expirada", "Refaça a verificação do código.");
        return;
      }

      Alert.alert("Ops!", msg);
      console.log("forgot_reset_failed", payload || err?.message);
    } finally {
      setLoading(false);
    }
  };

  // limpar erros ao digitar
  const onSenhaChange = (t) => {
    setSenha(t);
    if (errors.senha) setErrors((p) => ({ ...p, senha: "" }));
    if (errors.confirm && confirm === t)
      setErrors((p) => ({ ...p, confirm: "" }));
  };
  const onConfirmChange = (t) => {
    setConfirm(t);
    if (errors.confirm) setErrors((p) => ({ ...p, confirm: "" }));
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
            style={[
              styles.watermarkWrap,
              { opacity: Animated.multiply(wmOpacity, exitFade) },
            ]}
            pointerEvents="none"
            collapsable={false}
          >
            <Animated.View
              style={[
                styles.watermarkClip,
                {
                  transform: [
                    { scale: Animated.multiply(wmScale, breatheScale) },
                    { translateX: exitSlide },
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
            style={[
              styles.backBtn,
              {
                opacity: Animated.multiply(cardOpacity, exitFade),
                top: backTop,
                transform: [{ translateX: exitSlide }],
              },
            ]}
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
              opacity: Animated.multiply(cardOpacity, exitFade),
              transform: [
                { translateY: cardTranslateY },
                { translateX: exitSlide },
              ],
            }}
          >
            <View
              style={styles.shadowWrap}
              renderToHardwareTextureAndroid={Platform.OS === "android"}
              // Importante: NÃO usar shouldRasterizeIOS aqui (pode quebrar o BlurView no iOS).
            >
              <View style={styles.cardWrap}>
                <BlurView
                  intensity={Platform.OS === "ios" ? 18 : 30}
                  tint={Platform.OS === "ios" ? "dark" : "light"}
                  style={[StyleSheet.absoluteFill, styles.blurLayer]}
                  pointerEvents="none"
                />
                <View style={styles.blurOverlay} pointerEvents="none" />

                <View style={styles.cardContent}>
                  <Text style={styles.title}>Defina sua nova senha</Text>

                  <SvInput
                    label="NOVA SENHA"
                    placeholder="Crie uma senha"
                    value={senha}
                    onChangeText={onSenhaChange}
                    secureTextEntry
                    secureToggle
                    error={errors.senha}
                  />
                  <SvInput
                    label="CONFIRMAR NOVA SENHA"
                    placeholder="Repita a senha"
                    value={confirm}
                    onChangeText={onConfirmChange}
                    secureTextEntry
                    secureToggle
                    style={{ marginTop: 12 }}
                    error={errors.confirm}
                  />

                  <SvButton
                    title="Salvar"
                    onPress={handleReset}
                    loading={loading}
                    style={{ marginTop: 16 }}
                  />
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

  shadowWrap: {
    width: CARD_WIDTH,
    borderRadius: RADIUS,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  cardWrap: {
    borderRadius: RADIUS,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor:
      Platform.OS === "ios"
        ? "rgba(255,255,255,0.10)"
        : "rgba(255,255,255,0.16)",
  },

  blurLayer: { zIndex: 0 },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    backgroundColor:
      Platform.OS === "ios" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0)",
  },

  cardContent: { padding: 18, position: "relative", zIndex: 2 },

  title: { color: "#fff", fontSize: 18, fontWeight: "900", marginBottom: 10 },
});
