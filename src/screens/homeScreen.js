import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
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

import GlassCard from "../components/glassCard";
import { removeToken } from "../utils/storage";

const { width, height } = Dimensions.get("window");

const SCREEN_BG = "#05271A";
const GRADIENT_COLORS = ["#083726", "#072F20", "#05271A"];

const TOP_LOGO_SRC = require("../../assets/savoia-cruz.png");
const SAVOIA_LOGO_SRC = require("../../assets/Logo-savoia.png");

const TOP_SPACING =
  Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 18;

const BANNER_WIDTH = Math.min(width - 20, 980);
const AUTOPLAY_DELAY = 6000;
const AUTOPLAY_RESUME_DELAY = 6500;
const WATERMARK_SIZE = Math.min(width * 1.03, 980);

const TOTAL_FIDELITY_PAYMENTS = 12;

/**
 * ALTERE AQUI RAPIDAMENTE O CENÁRIO VISUAL DA HOME:
 * "nao_socio"
 * "socio_inativo"
 * "socio_ativo"
 */
const USER_SCENARIO = "socio_inativo";

const MOCK_USER = {
  nao_socio: {
    nome: "Antonio",
    tipo: "nao_socio",
    notificacoes: 1,
    fidelidadePagamentos: 0,
  },
  socio_inativo: {
    nome: "Antonio",
    tipo: "socio_inativo",
    notificacoes: 2,
    fidelidadePagamentos: 5,
  },
  socio_ativo: {
    nome: "Antonio",
    tipo: "socio_ativo",
    notificacoes: 3,
    fidelidadePagamentos: 8,
  },
};

const EXTERNAL_LINKS = {
  site: "https://www.academicosdasavoia.com.br/",
};

const HOME_BANNERS = [
  {
    id: "banner-1",
    title: "SEJA SÓCIO SAVÓIA",
    subtitle: "Fortaleça a torcida e acompanhe tudo pelo app.",
    cta: "Conhecer área do sócio",
    icon: "shield-crown-outline",
    colors: ["#0C6A3D", "#0A5230", "#083F26"],
    actionType: "internal",
    actionTarget: "socio",
  },
  {
    id: "banner-2",
    title: "NOVIDADES DA TORCIDA",
    subtitle: "Avisos, campanhas e destaques no carrossel principal.",
    cta: "Ver novidades",
    icon: "bullhorn-outline",
    colors: ["#2D6B3A", "#22542D", "#173A20"],
    actionType: "alert",
    actionMessage:
      "Aqui você pode ligar banners a campanhas, avisos ou páginas futuras.",
  },
  {
    id: "banner-3",
    title: "MATERIAL OFICIAL",
    subtitle: "Direcione para o site da Savóia quando quiser.",
    cta: "Abrir site",
    icon: "shopping-outline",
    colors: ["#8A6A24", "#6E531B", "#4E3A13"],
    actionType: "external",
    actionTarget: EXTERNAL_LINKS.site,
  },
];

const BOTTOM_TABS = [
  {
    key: "home",
    label: "Home",
    icon: (focused) => (
      <Ionicons
        name={focused ? "home" : "home-outline"}
        size={22}
        color={focused ? "#D5C16B" : "rgba(255,255,255,0.78)"}
      />
    ),
  },
  {
    key: "carteirinha",
    label: "Carteirinha",
    icon: (focused) => (
      <MaterialCommunityIcons
        name={focused ? "card-account-details" : "card-account-details-outline"}
        size={22}
        color={focused ? "#D5C16B" : "rgba(255,255,255,0.78)"}
      />
    ),
  },
  {
    key: "socio",
    label: "Sócio",
    icon: (focused) => (
      <Ionicons
        name={focused ? "star" : "star-outline"}
        size={22}
        color={focused ? "#D5C16B" : "rgba(255,255,255,0.78)"}
      />
    ),
  },
  {
    key: "menu",
    label: "Menu",
    icon: (focused) => (
      <Ionicons
        name={focused ? "menu" : "menu-outline"}
        size={24}
        color={focused ? "#D5C16B" : "rgba(255,255,255,0.78)"}
      />
    ),
  },
];

const BackgroundLayer = memo(function BackgroundLayer({ breatheScale }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.watermarkWrap}>
        <Animated.View
          style={[
            styles.watermarkClip,
            {
              transform: [{ scale: breatheScale }],
            },
          ]}
        >
          <Image
            source={SAVOIA_LOGO_SRC}
            resizeMode="contain"
            style={styles.watermarkImage}
            fadeDuration={0}
          />
        </Animated.View>
      </View>
    </View>
  );
});

function getInitials(name = "") {
  const parts = String(name).trim().split(" ").filter(Boolean);
  if (!parts.length) return "SV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function getGreeting(name = "") {
  return `Olá, ${name || "torcedor"}`;
}

async function openExternalLink(url) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Link inválido", "Não foi possível abrir este link.");
      return;
    }
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert("Erro", "Não foi possível abrir o link.");
  }
}

export default function HomeScreen({ navigation }) {
  const [bannerIndex, setBannerIndex] = useState(0);

  const flatListRef = useRef(null);
  const bannerIndexRef = useRef(0);
  const autoplayTimerRef = useRef(null);
  const userIsDraggingRef = useRef(false);

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
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [breathe]);

  const breatheScale = useMemo(
    () =>
      breathe.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.02],
      }),
    [breathe],
  );

  const user = useMemo(() => {
    return MOCK_USER[USER_SCENARIO] || MOCK_USER.socio_ativo;
  }, []);

  const showFidelityCard = user.tipo !== "nao_socio";

  const clearAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  }, []);

  const goToBanner = useCallback((index, animated = true) => {
    flatListRef.current?.scrollToOffset({
      offset: index * BANNER_WIDTH,
      animated,
    });

    bannerIndexRef.current = index;
    setBannerIndex(index);
  }, []);

  const scheduleAutoplay = useCallback(
    (delay = AUTOPLAY_DELAY) => {
      clearAutoplay();

      if (HOME_BANNERS.length <= 1) return;

      autoplayTimerRef.current = setTimeout(() => {
        if (userIsDraggingRef.current) {
          scheduleAutoplay(AUTOPLAY_RESUME_DELAY);
          return;
        }

        const nextIndex = (bannerIndexRef.current + 1) % HOME_BANNERS.length;
        goToBanner(nextIndex, true);
        scheduleAutoplay(AUTOPLAY_DELAY);
      }, delay);
    },
    [clearAutoplay, goToBanner],
  );

  useEffect(() => {
    scheduleAutoplay(AUTOPLAY_DELAY);
    return clearAutoplay;
  }, [clearAutoplay, scheduleAutoplay]);

  const handleLogout = async () => {
    await removeToken();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const handleProfilePress = () => {
    navigation.navigate("Profile");
  };

  const handleBellPress = () => {
    Alert.alert(
      "Notificações",
      "A central de notificações será implementada depois.",
    );
  };

  const handleBannerPress = (banner) => {
    if (banner.actionType === "external" && banner.actionTarget) {
      openExternalLink(banner.actionTarget);
      return;
    }

    if (banner.actionType === "internal" && banner.actionTarget === "socio") {
      Alert.alert(
        "Área do Sócio",
        "A aba Sócio será implementada na próxima etapa.",
      );
      return;
    }

    Alert.alert(
      "Banner",
      banner.actionMessage || "A ação deste banner será definida depois.",
    );
  };

  const handleBottomTabPress = (key) => {
    if (key === "home") return;

    if (key === "carteirinha") {
      Alert.alert(
        "Carteirinha",
        "A aba Carteirinha será implementada na próxima etapa.",
      );
      return;
    }

    if (key === "socio") {
      Alert.alert("Sócio", "A aba Sócio será implementada na próxima etapa.");
      return;
    }

    if (key === "menu") {
      navigation.navigate("Menu");
    }
  };

  const onMomentumScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(offsetX / BANNER_WIDTH);
    bannerIndexRef.current = nextIndex;
    setBannerIndex(nextIndex);
  };

  const handleScrollBeginDrag = () => {
    userIsDraggingRef.current = true;
    clearAutoplay();
  };

  const handleScrollEndDrag = () => {
    userIsDraggingRef.current = false;
    scheduleAutoplay(AUTOPLAY_RESUME_DELAY);
  };

  const renderBanner = ({ item }) => {
    return (
      <Pressable
        onPress={() => handleBannerPress(item)}
        style={styles.bannerPressable}
      >
        <LinearGradient
          colors={item.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bannerCard}
        >
          <Image
            source={SAVOIA_LOGO_SRC}
            style={styles.bannerBgLogo}
            resizeMode="contain"
            fadeDuration={0}
          />

          <View style={styles.bannerLeft}>
            <View style={styles.bannerIconCircle}>
              <MaterialCommunityIcons
                name={item.icon}
                size={28}
                color="#E4D88A"
              />
            </View>
          </View>

          <View style={styles.bannerRight}>
            <Text style={styles.bannerTitle}>{item.title}</Text>
            <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>

            <View style={styles.bannerCtaRow}>
              <Text style={styles.bannerCta}>{item.cta}</Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color="#F0E2A0"
                style={{ marginLeft: 6 }}
              />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={SCREEN_BG} />
      <BackgroundLayer breatheScale={breatheScale} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        <View style={styles.header}>
          <Pressable onPress={handleBellPress} style={styles.headerIconButton}>
            <Ionicons name="notifications-outline" size={22} color="#F2F2F2" />
            {user.notificacoes > 0 && <View style={styles.notificationDot} />}
          </Pressable>

          <Image
            source={TOP_LOGO_SRC}
            style={styles.headerLogo}
            resizeMode="contain"
            fadeDuration={0}
          />

          <Pressable onPress={handleProfilePress} style={styles.avatarButton}>
            <Text style={styles.avatarText}>{getInitials(user.nome)}</Text>
          </Pressable>
        </View>

        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>{getGreeting(user.nome)}</Text>
          <Text style={styles.greetingSub}>
            Sua central da torcida, com foco em leveza e navegação rápida.
          </Text>
        </View>

        <View style={styles.bannerSection}>
          <View style={styles.bannerViewport}>
            <FlatList
              ref={flatListRef}
              data={HOME_BANNERS}
              renderItem={renderBanner}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled={false}
              snapToInterval={BANNER_WIDTH}
              snapToAlignment="start"
              disableIntervalMomentum
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate={Platform.OS === "ios" ? "fast" : 0.985}
              bounces={false}
              onMomentumScrollEnd={onMomentumScrollEnd}
              onScrollBeginDrag={handleScrollBeginDrag}
              onScrollEndDrag={handleScrollEndDrag}
              scrollEventThrottle={16}
              getItemLayout={(_, index) => ({
                length: BANNER_WIDTH,
                offset: BANNER_WIDTH * index,
                index,
              })}
            />
          </View>

          <View style={styles.paginationRow}>
            {HOME_BANNERS.map((item, index) => {
              const active = index === bannerIndex;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.paginationDot,
                    active && styles.paginationDotActive,
                  ]}
                />
              );
            })}
          </View>
        </View>

        {showFidelityCard && (
          <View style={styles.fidelityCardWrap}>
            <GlassCard
              width={Math.min(width - 20, 980)}
              radius={18}
              padding={16}
              blur={Platform.OS === "ios"}
              androidBlurMode="fallback"
              androidElevation={0}
              scrimOpacityAndroid={0.11}
              scrimOpacityIOS={0.05}
              scrimOpacityWeb={0.08}
              shadowStyle={styles.fidelityCardShadow}
            >
              <View style={styles.fidelityHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Fidelidade</Text>
                  <Text style={styles.sectionSubtitle}>
                    {user.fidelidadePagamentos} de {TOTAL_FIDELITY_PAYMENTS}{" "}
                    mensalidades pagas
                  </Text>
                </View>

                <View style={styles.fidelityBadge}>
                  <Text style={styles.fidelityBadgeText}>
                    {user.tipo === "socio_inativo"
                      ? "Em análise"
                      : "Em progresso"}
                  </Text>
                </View>
              </View>

              <View style={styles.fidelityProgressBlock}>
                <Text style={styles.fidelityCounter}>
                  {user.fidelidadePagamentos}/{TOTAL_FIDELITY_PAYMENTS}
                </Text>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          (user.fidelidadePagamentos /
                            TOTAL_FIDELITY_PAYMENTS) *
                            100,
                          100,
                        )}%`,
                      },
                    ]}
                  />
                </View>

                <View style={styles.progressDotsRow}>
                  {Array.from({ length: TOTAL_FIDELITY_PAYMENTS }).map(
                    (_, index) => {
                      const completed = index < user.fidelidadePagamentos;

                      return (
                        <View
                          key={`payment-${index + 1}`}
                          style={styles.progressDotCell}
                        >
                          <View
                            style={[
                              styles.progressDot,
                              completed && styles.progressDotCompleted,
                            ]}
                          >
                            {completed ? (
                              <Ionicons
                                name="checkmark"
                                size={11}
                                color="#0B2D1F"
                              />
                            ) : (
                              <Text style={styles.progressDotText}>
                                {index + 1}
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    },
                  )}
                </View>
              </View>

              <Text style={styles.fidelityFootnote}>
                Ao completar 12 mensalidades válidas, o benefício ficará
                disponível para resgate.
              </Text>
            </GlassCard>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomNavWrap}>
        <View style={styles.bottomNav}>
          {BOTTOM_TABS.map((tab) => {
            const focused = tab.key === "home";

            return (
              <Pressable
                key={tab.key}
                onPress={() => handleBottomTabPress(tab.key)}
                style={({ pressed }) => [
                  styles.bottomTabButton,
                  pressed && { opacity: 0.82 },
                ]}
              >
                {tab.icon(focused)}
                <Text
                  style={[
                    styles.bottomTabLabel,
                    focused && styles.bottomTabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>

                {tab.key === "menu" && <View style={styles.bottomMenuDot} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },

  scrollContent: {
    paddingTop: TOP_SPACING,
    paddingBottom: 120,
  },

  watermarkWrap: {
    position: "absolute",
    top: height * 0.21,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  watermarkClip: {
    width: WATERMARK_SIZE,
    height: WATERMARK_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },

  watermarkImage: {
    width: "100%",
    height: "100%",
    opacity: 0.08,
  },

  header: {
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  notificationDot: {
    position: "absolute",
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E14B4B",
  },

  headerLogo: {
    width: 54,
    height: 54,
    opacity: 0.98,
  },

  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.6,
  },

  greetingBlock: {
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
  },

  greeting: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  greetingSub: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },

  bannerSection: {
    marginTop: 8,
    alignItems: "center",
  },

  bannerViewport: {
    width: BANNER_WIDTH,
    overflow: "hidden",
    borderRadius: 12,
  },

  bannerPressable: {
    width: BANNER_WIDTH,
  },

  bannerCard: {
    minHeight: 148,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  bannerBgLogo: {
    position: "absolute",
    left: -8,
    top: -16,
    width: 150,
    height: 150,
    opacity: 0.08,
  },

  bannerLeft: {
    width: 78,
    alignItems: "center",
    justifyContent: "center",
  },

  bannerIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  bannerRight: {
    flex: 1,
    paddingLeft: 4,
  },

  bannerTitle: {
    color: "#F5F0D0",
    fontSize: 23,
    lineHeight: 26,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  bannerSubtitle: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },

  bannerCtaRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  bannerCta: {
    color: "#F0E2A0",
    fontWeight: "800",
    fontSize: 13,
  },

  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 6,
  },

  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.28)",
  },

  paginationDotActive: {
    width: 18,
    backgroundColor: "#F0E2A0",
  },

  fidelityCardWrap: {
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  fidelityCardShadow: {
    alignSelf: "center",
  },

  fidelityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  fidelityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(213,193,107,0.16)",
    borderWidth: 1,
    borderColor: "rgba(213,193,107,0.32)",
  },

  fidelityBadgeText: {
    color: "#E8DA92",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 12,
    marginTop: 4,
  },

  fidelityProgressBlock: {
    marginTop: 16,
  },

  fidelityCounter: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 12,
  },

  progressTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#D5C16B",
  },

  progressDotsRow: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
  },

  progressDotCell: {
    width: "16.666%",
    alignItems: "center",
    marginBottom: 12,
  },

  progressDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },

  progressDotCompleted: {
    backgroundColor: "#D5C16B",
    borderColor: "#E8DB94",
  },

  progressDotText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    fontWeight: "800",
  },

  fidelityFootnote: {
    marginTop: 16,
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    lineHeight: 18,
  },

  bottomSpacer: {
    height: 10,
  },

  bottomNavWrap: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: Platform.OS === "ios" ? 18 : 10,
  },

  bottomNav: {
    minHeight: 74,
    borderRadius: 24,
    backgroundColor: "#03311F",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 8,
  },

  bottomTabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    position: "relative",
  },

  bottomTabLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "700",
  },

  bottomTabLabelActive: {
    color: "#D5C16B",
  },

  bottomMenuDot: {
    position: "absolute",
    top: 0,
    right: width * 0.055,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F14242",
  },
});
