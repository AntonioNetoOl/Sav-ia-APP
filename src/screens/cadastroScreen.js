// src/screens/CadastroScreen.js
import { Ionicons } from "@expo/vector-icons";
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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sendEmailCode } from "../api/client";
import GlassCard from "../components/glassCard";
import SvButton from "../components/svButton";
import SvInput from "../components/svInput";
import useAuthAssets from "../hooks/useAuthAssets";
import {
  formatCPF,
  formatPhone,
  isStrongPassword,
  isValidCPF,
  isValidEmail,
  isValidFullName,
  isValidPhoneBR,
  normSpaces,
  sanitizeName,
  sanitizeNameLive,
} from "../utils/masks";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = Math.min(500, width - 20);
const RADIUS = 18;

const GRADIENT_COLORS = ["#083726", "#072F20", "#05271A"];
const BG = "#05271A";

// Watermark
const LOGO_SIZE = width * 0.88;
const LOGO_SCALE = 1.02;
const EDGE_HIDE = Math.max(6, Math.round(width * 0.012));
const LOGO_TOP = height * 0.065;

/*const isAndroid = Platform.OS === "android";
const androidApi = isAndroid ? Number(Platform.Version) : 0;
const androidHasNativeBlur = isAndroid && androidApi >= 31;

const enableBlur =
  Platform.OS === "ios" || Platform.OS === "web" || androidHasNativeBlur;
*/

// Estratégia estável: blur real só no iOS (evita artefatos no Android e o “escurecer após clique” no Web).
// Se quiser testar blur no Web após o patch do tint, você pode trocar para:
// const preferBlur = Platform.OS === "ios" || Platform.OS === "web";
const preferBlur = Platform.OS === "ios";

export default function CadastroScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  useAuthAssets();

  const screenAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(screenAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [screenAnim]);

  // “respirar” da watermark
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

  const backOpacity = screenAnim;

  // ===== estado do formulário =====
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [numero, setNumero] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // handlers
  const onNameChange = (v) => setNome(sanitizeNameLive(v));
  const onCpfChange = (v) => setCpf(formatCPF(v));
  const onPhoneChange = (v) => setNumero(formatPhone(v));

  const validate = () => {
    const e = {};
    if (!isValidFullName(nome))
      e.nome = "Informe nome e sobrenome (apenas letras).";
    if (!isValidCPF(cpf)) e.cpf = "CPF inválido.";
    if (!isValidEmail(email)) e.email = "E-mail inválido.";
    if (!isStrongPassword(senha)) e.senha = "Senha muito curta (mín. 6).";
    if (confirmSenha !== senha) e.confirmSenha = "As senhas não coincidem.";
    if (!isValidPhoneBR(numero)) e.numero = "Telefone inválido.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // >>> NÃO salva nada aqui! Só manda o código e navega.
  const handleCadastro = async () => {
    if (loading) return;
    if (!validate()) return;

    setLoading(true);

    const form = {
      nome: normSpaces(sanitizeName(nome)),
      cpf,
      email: String(email).trim().toLowerCase(),
      senha,
      numero,
    };

    try {
      await sendEmailCode(form);
      navigation.navigate("VerifyEmail", {
        email: form.email,
        alreadySent: true,
        cooldown: 30,
      });
    } catch (e) {
      const status = e?.response?.status;
      const payload = e?.response?.data || {};
      const msg =
        payload.erro || payload.message || "Falha ao iniciar verificação.";

      if (status === 409) {
        const campos = payload.campos || {};
        setErrors((prev) => {
          const next = { ...prev, cpf: undefined, email: undefined };
          if (campos?.cpf)
            next.cpf = "Este CPF já está vinculado a um usuário.";
          if (campos?.email)
            next.email = "Este E-mail já está vinculado a um usuário.";
          return next;
        });
        Alert.alert("Atenção", msg);
        return;
      } else if (status === 429) {
        Alert.alert(
          "Ops!",
          "Aguarde alguns segundos antes de solicitar novo código."
        );
        navigation.navigate("VerifyEmail", {
          email: form.email,
          alreadySent: true,
          cooldown: 30,
        });
        return;
      } else if (status === 400 || status === 422) {
        Alert.alert("Atenção", msg);
        return;
      } else {
        Alert.alert("Ops!", msg);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Animated.timing(screenAnim, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
  };

  // ===== Safe area / header space =====
  const BACK_SIZE = 40;
  const BACK_GAP = 12;

  // top real do botão, respeitando notch
  const backTop = Platform.OS === "web" ? 16 : (insets.top || 0) + 8;

  // reserva de espaço para o card não “entrar” atrás do botão
  const headerSpace = backTop + BACK_SIZE + BACK_GAP;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <ScrollView
        style={{ flex: 1, backgroundColor: BG }}
        contentContainerStyle={{
          flexGrow: 1,
          minHeight: height,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: BG,
          paddingTop: headerSpace,
          paddingBottom: 24,
        }}
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
      >
        <View style={styles.container} pointerEvents="box-none">
          {/* Fundo */}
          <Animated.View
            style={[StyleSheet.absoluteFill, { opacity: cardOpacity }]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={GRADIENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

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
              pointerEvents="none"
              collapsable={false}
            >
              <Image
                key="wm-cadastro"
                source={require("../../assets/Logo-savoia.png")}
                style={styles.watermarkImage}
                resizeMode="contain"
                accessible={false}
                fadeDuration={0}
              />
              <View style={styles.ringMask} />
            </Animated.View>
          </Animated.View>

          {/* Card */}
          <Animated.View
            style={{
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            }}
          >
            <GlassCard
              width={CARD_WIDTH}
              radius={RADIUS}
              blur={Platform.OS === "ios"}
              androidBlurMode="fallback"
              androidElevation={0}
            >
              <SvInput
                label="NOME COMPLETO"
                placeholder="Digite seu nome completo"
                value={nome}
                onChangeText={onNameChange}
                autoCapitalize="words"
                inputMode="text"
                maxLength={80}
                error={errors.nome}
              />
              <SvInput
                label="CPF"
                placeholder="000.000.000-00"
                value={cpf}
                onChangeText={onCpfChange}
                keyboardType="number-pad"
                mask="cpf"
                error={errors.cpf}
                style={{ marginTop: 12 }}
              />
              <SvInput
                label="E-MAIL"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                error={errors.email}
                style={{ marginTop: 12 }}
              />
              <SvInput
                label="SENHA"
                placeholder="Crie uma senha"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                secureToggle
                error={errors.senha}
                style={{ marginTop: 12 }}
              />
              <SvInput
                label="CONFIRMAR SENHA"
                placeholder="Repita a senha"
                value={confirmSenha}
                onChangeText={setConfirmSenha}
                secureTextEntry
                secureToggle
                error={errors.confirmSenha}
                style={{ marginTop: 12 }}
                returnKeyType="next"
              />
              <SvInput
                label="TELEFONE"
                placeholder="(xx) xxxxx-xxxx"
                value={numero}
                onChangeText={onPhoneChange}
                keyboardType="phone-pad"
                mask="phone"
                error={errors.numero}
                style={{ marginTop: 12, marginBottom: 16 }}
                returnKeyType="done"
                onSubmitEditing={handleCadastro}
              />

              <SvButton
                title={loading ? "Enviando..." : "Pronto"}
                onPress={handleCadastro}
                loading={loading}
                disabled={loading}
              />
            </GlassCard>
          </Animated.View>

          {/* Botão voltar */}
          <Animated.View
            style={[styles.backBtn, { opacity: backOpacity, top: backTop }]}
          >
            <Pressable
              onPress={handleBack}
              hitSlop={10}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-back" size={26} color="#fff" />
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
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
    zIndex: 30,
    elevation: 30,
  },
});
