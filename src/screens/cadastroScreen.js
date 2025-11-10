// src/screens/CadastroScreen.js
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
  StyleSheet,
  View,
} from "react-native";
import { sendEmailCode } from "../api/client"; // <<< não salvamos aqui!
import SvButton from "../components/svButton";
import SvInput from "../components/svInput";
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

const LOGO_SIZE = width * 0.88;
const LOGO_SCALE = 1.02;
const EDGE_HIDE = Math.max(6, Math.round(width * 0.012));
const LOGO_TOP = height * 0.065;

export default function CadastroScreen({ navigation }) {
  const screenAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(screenAnim, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  }, [screenAnim]);

  // “respirar” da watermark
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

  const cardTranslateY = screenAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const cardOpacity    = screenAnim;
  const wmOpacity      = screenAnim;
  const wmScale        = screenAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] });
  const backOpacity    = screenAnim;

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
  const onNameChange  = (v) => setNome(sanitizeNameLive(v));
  const onCpfChange   = (v) => setCpf(formatCPF(v));
  const onPhoneChange = (v) => setNumero(formatPhone(v));

  const validate = () => {
    const e = {};
    if (!isValidFullName(nome)) e.nome = "Informe nome e sobrenome (apenas letras).";
    if (!isValidCPF(cpf)) e.cpf = "CPF inválido.";
    if (!isValidEmail(email)) e.email = "E-mail inválido.";
    if (!isStrongPassword(senha)) e.senha = "Senha muito curta (mín. 6).";
    if (confirmSenha !== senha) e.confirmSenha = "As senhas não coincidem.";
    if (!isValidPhoneBR(numero)) e.numero = "Telefone inválido.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // >>> NÃO salva nada aqui! Só manda o código (quando possível) e navega.
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
      // sucesso: código enviado → navega e já inicia timer em 30s
      navigation.navigate("VerifyEmail", {
        email: form.email,
        alreadySent: true,
        cooldown: 30,
      });
    } catch (e) {
      const status  = e?.response?.status;
      const payload = e?.response?.data || {};
      const msg =
        payload.erro ||
        payload.message ||
        "Falha ao iniciar verificação.";

      if (status === 409) {
        // Backend agora pode retornar { campos: { email: boolean, cpf: boolean } }
        const campos = payload.campos || {};
        setErrors(prev => {
            const next = { ...prev, cpf: undefined, email: undefined };
            if (campos?.cpf)   next.cpf   = "Este CPF já está vinculado a um usuário.";
            if (campos?.email) next.email = "Este E-mail já está vinculado a um usuário.";
            return next;
          });
        Alert.alert("Atenção", msg);
        return;
      } else if (status === 429) {
        // Cooldown ativo (código enviado recentemente) → pode ir para verify com timer
        Alert.alert("Ops!", "Aguarde alguns segundos antes de solicitar novo código.");
        navigation.navigate("VerifyEmail", {
          email: form.email,
          alreadySent: true,
          cooldown: 30,
        });
        return;
      } else if (status === 400 || status === 422) {
        // Dados inválidos pelo back → NÃO navega
        Alert.alert("Atenção", msg);
        return;
      } else {
        // Erro genérico / rede
        Alert.alert("Ops!", msg);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Animated.timing(screenAnim, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => {
      navigation.goBack();
    });
  };

  // posicionamento do botão voltar (web costuma precisar de menos top)
  const backTop = Platform.select({ web: 16, ios: 48, android: 48 });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          minHeight: height,
          alignItems: "center",
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
      >
        <View style={styles.container} pointerEvents="auto">
          {Platform.OS === "web" && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(5,39,26,0.98)", zIndex: -2 }]} />
          )}

          <Animated.View style={[StyleSheet.absoluteFill, { opacity: cardOpacity, zIndex: -1 }]} pointerEvents="none">
            <LinearGradient
              colors={GRADIENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <Animated.View style={[styles.watermarkWrap, { opacity: wmOpacity }]} pointerEvents="none">
            <Animated.View style={[styles.watermarkClip, { transform: [{ scale: Animated.multiply(wmScale, breatheScale) }] }]}>
              <Image source={require("../../assets/Logo-savoia.png")} style={styles.watermarkImage} resizeMode="contain" accessible={false} />
              <View style={styles.ringMask} />
            </Animated.View>
          </Animated.View>

          <Animated.View style={[styles.backBtn, { opacity: backOpacity, top: backTop }]}>
            <Pressable onPress={handleBack} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="arrow-back" size={26} color="#fff" />
            </Pressable>
          </Animated.View>

          <Animated.View style={{ opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }}>
            <View
              style={styles.shadowWrap}
              renderToHardwareTextureAndroid
              shouldRasterizeIOS
              pointerEvents="auto"
            >
              <View style={styles.cardWrap}>
                <BlurView
                  intensity={30}
                  tint="light"
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                  accessible={false}
                />
                <View style={styles.cardContent}>
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
                    onSubmitEditing={handleCadastro}
                    returnKeyType="done"
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
                  />

                  <SvButton
                    title={loading ? "Enviando..." : "Pronto"}
                    onPress={handleCadastro}
                    loading={loading}
                    disabled={loading}
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
    backgroundColor: "transparent",
  },

    container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
   // 👇 fixes web: absoluteFill (gradiente/watermark) precisa da largura total
    width: "100%",
   position: "relative",
  },

  watermarkWrap: { position: "absolute", top: LOGO_TOP, alignItems: "center", justifyContent: "center", width: LOGO_SIZE, height: LOGO_SIZE },
  watermarkClip: { width: "100%", height: "100%", borderRadius: LOGO_SIZE / 2, overflow: "hidden", position: "relative" },
  watermarkImage: { width: "100%", height: "100%", opacity: 0.08, transform: [{ scale: LOGO_SCALE }], alignSelf: "center", backgroundColor: "transparent" },
  ringMask: { ...StyleSheet.absoluteFillObject, borderRadius: LOGO_SIZE / 2, borderWidth: EDGE_HIDE, borderColor: "#072F20", backgroundColor: "transparent" },

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
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  cardContent: { padding: 18 },
});
