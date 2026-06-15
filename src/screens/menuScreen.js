// src/screens/menuScreen.js
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getMe } from "../api/menuClient";
import BottomNavigation from "../components/bottomNavigation";
import { EXTERNAL_LINKS } from "../constants/externalLinks";
import { removeToken } from "../utils/storage";

const { width } = Dimensions.get("window");

const SCREEN_BG = "#05271A";
const GRADIENT_COLORS = ["#083726", "#072F20", "#05271A"];
const TOP_LOGO_SRC = require("../../assets/savoia-cruz.png");
const WATERMARK_SRC = require("../../assets/Logo-savoia.png");

const TOP_SPACING = Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 24;
const CARD_WIDTH = width;
const PANEL_PADDING = 18;
const GRID_GAP = 12;
const GRID_CARD_WIDTH = Math.floor((CARD_WIDTH - PANEL_PADDING * 2 - GRID_GAP) / 2);

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

async function openUrl(url, fallbackTitle = "Link indisponível") {
  if (!url) {
    Alert.alert(fallbackTitle, "Este link será configurado em breve.");
    return;
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Link inválido", "Não foi possível abrir este link.");
      return;
    }
    await Linking.openURL(url);
  } catch (_error) {
    Alert.alert("Erro", "Não foi possível abrir o link.");
  }
}

function MenuCard({ label, icon, iconLib = "ion", onPress }) {
  const IconComponent = iconLib === "mci" ? MaterialCommunityIcons : Ionicons;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuCard, pressed && styles.menuCardPressed]}
    >
      <View style={styles.menuIconWrap}>
        <IconComponent name={icon} size={31} color="#F1E6A8" />
      </View>
      <Text style={styles.menuCardLabel}>{label}</Text>
    </Pressable>
  );
}

function MenuSection({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>{children}</View>
    </View>
  );
}

export default function MenuScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    getMe()
      .then(({ data }) => {
        if (mounted) setUser(data);
      })
      .catch(() => {
        if (mounted) {
          setUser({ name: "torcedor", memberStatus: "nao_socio" });
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const displayName = useMemo(() => user?.name || "torcedor", [user]);

  const handleLogout = useCallback(() => {
    Alert.alert("Sair da conta", "Deseja realmente sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await removeToken();
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  }, [navigation]);

  const handleSupportEmail = () => {
    if (!EXTERNAL_LINKS.supportEmail) {
      Alert.alert("Atendimento", "O e-mail oficial de atendimento será configurado em breve.");
      return;
    }

    const subject = encodeURIComponent("Atendimento APP Savóia");
    openUrl(`mailto:${EXTERNAL_LINKS.supportEmail}?subject=${subject}`, "Atendimento");
  };

  const handleRateApp = () => {
    const url = Platform.OS === "ios" ? EXTERNAL_LINKS.appStoreUrl : EXTERNAL_LINKS.googlePlayUrl;
    openUrl(url, "Avaliação do app");
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={SCREEN_BG} />
      <LinearGradient colors={GRADIENT_COLORS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Image source={WATERMARK_SRC} resizeMode="contain" style={styles.watermark} fadeDuration={0} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} overScrollMode="never">
        <View style={styles.header}>
          <Image source={TOP_LOGO_SRC} resizeMode="contain" style={styles.logo} fadeDuration={0} />
          <Text style={styles.greeting}>{getGreeting()}, {displayName}</Text>
          <Pressable onPress={() => navigation.navigate("Profile")} style={({ pressed }) => [styles.profileButton, pressed && { opacity: 0.86 }]}>
            <Ionicons name="person-outline" size={19} color="#F1E6A8" />
            <Text style={styles.profileButtonText}>Acessar meu perfil</Text>
          </Pressable>
          <Text style={styles.description}>Acesse sua conta, benefícios, pagamentos, sedes e suporte.</Text>
        </View>

        <View style={styles.menuPanel}>
          <MenuSection title="Sede social">
            <MenuCard label="Sede" icon="location-outline" onPress={() => openUrl(EXTERNAL_LINKS.sedeMapsUrl, "Sede social")} />
            <MenuCard label="Subsedes" icon="map-marker-multiple-outline" iconLib="mci" onPress={() => navigation.navigate("Subsedes")} />
          </MenuSection>

          <View style={styles.divider} />

          <MenuSection title="Seção Sócio">
            <MenuCard label="Minha associação" icon="shield-star-outline" iconLib="mci" onPress={() => Alert.alert("Sócio", "A aba Sócio será implementada na próxima etapa.")} />
            <MenuCard label="Como funciona\na fidelidade" icon="gift-outline" iconLib="mci" onPress={() => navigation.navigate("LoyaltyInfo")} />
            <MenuCard label="Meus benefícios" icon="ticket-percent-outline" iconLib="mci" onPress={() => navigation.navigate("Benefits")} />
          </MenuSection>

          <View style={styles.divider} />

          <MenuSection title="Pagamentos">
            <MenuCard label="Histórico de\npagamentos" icon="receipt-outline" onPress={() => navigation.navigate("Payments", { initialTab: "history" })} />
            <MenuCard label="Cartões\ncadastrados" icon="credit-card-outline" iconLib="mci" onPress={() => navigation.navigate("Payments", { initialTab: "cards" })} />
          </MenuSection>

          <View style={styles.divider} />

          <MenuSection title="Ajuda">
            <MenuCard label="Falar com\na Savóia" icon="mail-outline" onPress={handleSupportEmail} />
            <MenuCard label="Dúvidas\nfrequentes" icon="help-circle-outline" onPress={() => navigation.navigate("FAQ")} />
          </MenuSection>

          <View style={styles.divider} />

          <MenuSection title="Conta">
            <MenuCard label="Configurações" icon="settings-outline" onPress={() => navigation.navigate("Settings")} />
            <MenuCard label="Termos e\nprivacidade" icon="document-text-outline" onPress={() => navigation.navigate("TermsPrivacy")} />
          </MenuSection>

          <View style={styles.ratingCard}>
            <View style={styles.ratingIconWrap}>
              <Ionicons name="star-outline" size={24} color="#0B5A38" />
            </View>
            <View style={styles.ratingTextBlock}>
              <Text style={styles.ratingTitle}>Gostando do app?</Text>
              <Text style={styles.ratingText}>Avalie a Savóia e ajude a melhorar nossa experiência.</Text>
            </View>
            <Pressable onPress={handleRateApp} style={({ pressed }) => [styles.ratingButton, pressed && { opacity: 0.86 }]}>
              <Text style={styles.ratingButtonText}>{Platform.OS === "ios" ? "App Store" : "Google Play"}</Text>
            </Pressable>
          </View>

          <Pressable onPress={handleLogout} style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.76 }]}>
            <Ionicons name="log-out-outline" size={20} color="#B72E2E" />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </Pressable>

          <Text style={styles.versionText}>Versão 1.0.0</Text>
        </View>
      </ScrollView>

      <BottomNavigation activeKey="menu" navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  watermark: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    width: Math.min(width * 1.15, 980),
    height: Math.min(width * 1.15, 980),
    opacity: 0.055,
  },
  scrollContent: {
    paddingTop: TOP_SPACING,
    paddingHorizontal: 0,
    paddingBottom: 124,
    alignItems: "center",
  },
  header: {
    width: CARD_WIDTH,
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 18,
    paddingHorizontal: 18,
  },
  logo: {
    width: 96,
    height: 96,
  },
  greeting: {
    marginTop: 6,
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  profileButton: {
    marginTop: 14,
    minHeight: 44,
    borderRadius: 15,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0C6A3D",
    borderWidth: 1,
    borderColor: "rgba(241,230,168,0.48)",
  },
  profileButtonText: {
    color: "#F1E6A8",
    fontSize: 15,
    fontWeight: "800",
  },
  description: {
    maxWidth: 320,
    marginTop: 12,
    color: "rgba(255,255,255,0.74)",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  menuPanel: {
    width: CARD_WIDTH,
    minHeight: 520,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#F7FAF5",
    paddingHorizontal: PANEL_PADDING,
    paddingTop: 28,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 2,
  },
  sectionTitle: {
    color: "#123D2A",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  menuCard: {
    width: GRID_CARD_WIDTH,
    minHeight: 112,
    borderRadius: 16,
    backgroundColor: "rgba(7,83,51,0.90)",
    borderWidth: 1,
    borderColor: "rgba(12,106,61,0.34)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  menuCardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.84,
  },
  menuIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    marginBottom: 9,
  },
  menuCardLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(18,61,42,0.14)",
    marginVertical: 24,
  },
  ratingCard: {
    marginTop: 24,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#EDF5ED",
    borderWidth: 1,
    borderColor: "rgba(12,106,61,0.20)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ratingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(12,106,61,0.10)",
  },
  ratingTextBlock: {
    flex: 1,
  },
  ratingTitle: {
    color: "#123D2A",
    fontSize: 15,
    fontWeight: "900",
  },
  ratingText: {
    color: "rgba(18,61,42,0.72)",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
  ratingButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#0C6A3D",
    borderWidth: 1,
    borderColor: "rgba(12,106,61,0.20)",
  },
  ratingButtonText: {
    color: "#F1E6A8",
    fontSize: 12,
    fontWeight: "900",
  },
  logoutButton: {
    marginTop: 22,
    minHeight: 46,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(183,46,46,0.08)",
    borderWidth: 1,
    borderColor: "rgba(183,46,46,0.16)",
  },
  logoutText: {
    color: "#B72E2E",
    fontSize: 14,
    fontWeight: "900",
  },
  versionText: {
    marginTop: 14,
    color: "rgba(18,61,42,0.46)",
    fontSize: 12,
    textAlign: "center",
  },
});
