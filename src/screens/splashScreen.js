import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Image, StyleSheet, Text, View } from "react-native";
import { getToken } from "../utils/storage";


const { width, height } = Dimensions.get("window");
const SPEED = 1.15;

const BG_GRADIENT = ["#083726", "#072F20", "#05271A"];
const STACK_BG = "#05271A";
const RING_COLOR = "rgba(12,106,61,0.78)";
const SHIMMER_GRADIENT = ["transparent", "rgba(24,160,96,0.28)", "transparent"];
const STRIPE_GRADIENT  = ["rgba(12,106,61,0.22)", "rgba(11,90,52,0.28)"];

const SIZE = width * 0.46;

export default function SplashScreen({ navigation }) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const shimmerX = useRef(new Animated.Value(-1)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const stripe1X = useRef(new Animated.Value(-width * 1.4)).current;
  const stripe2X = useRef(new Animated.Value(-width * 1.8)).current;
  const tagline  = useRef(new Animated.Value(0)).current;

  // >>> Véu que evita o flash branco ao navegar
  const veil = useRef(new Animated.Value(0)).current; // 0..1

  useEffect(() => {
    let mounted = true;

    const enter = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: Math.round(700 * SPEED), useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]);

    const shimmer = Animated.timing(shimmerX, {
      toValue: 1,
      duration: Math.round(1100 * SPEED),
      delay: Math.round(100 * SPEED),
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });

    const rings = Animated.stagger(
      Math.round(160 * SPEED),
      [ring1, ring2, ring3].map((v) =>
        Animated.timing(v, {
          toValue: 1,
          duration: Math.round(900 * SPEED),
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      )
    );

    const stripes = Animated.parallel([
      Animated.timing(stripe1X, {
        toValue: width * 1.2,
        duration: Math.round(1600 * SPEED),
        delay: Math.round(80 * SPEED),
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(stripe2X, {
        toValue: width * 1.6,
        duration: Math.round(1850 * SPEED),
        delay: Math.round(180 * SPEED),
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const showTagline = Animated.timing(tagline, {
      toValue: 1,
      duration: Math.round(420 * SPEED),
      delay: Math.round(120 * SPEED),
      useNativeDriver: true,
    });

    Animated.sequence([
      enter,
      Animated.parallel([shimmer, rings, stripes, showTagline]),
      // >>> Fecha com véu escuro antes de navegar (evita flash)
      Animated.timing(veil, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start(async () => {
      const token = await getToken();
      if (!mounted) return;
      navigation.replace(token ? "Home" : "Login");
    });

    return () => { mounted = false; };
  }, [navigation, opacity, ring1, ring2, ring3, scale, shimmerX, stripe1X, stripe2X, tagline, veil]);

  const shimmerTranslate = shimmerX.interpolate({ inputRange: [-1, 1], outputRange: [-width, width] });
  const rScale  = (v) => v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] });
  const rAlpha  = (v) => v.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0] });

  return (
    <View style={styles.container}>
      <LinearGradient colors={BG_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      {/* Bandeirão */}
      <Animated.View style={[styles.stripeWrap, { transform: [{ translateX: stripe1X }, { rotateZ: "-18deg" }] }]}>
        <LinearGradient colors={STRIPE_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[styles.stripeWrap, { transform: [{ translateX: stripe2X }, { rotateZ: "-18deg" }] }]}>
        <LinearGradient colors={STRIPE_GRADIENT} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Anéis */}
      <Animated.View style={[styles.ring, { opacity: rAlpha(ring1), transform: [{ scale: rScale(ring1) }] }]} />
      <Animated.View style={[styles.ring, { opacity: rAlpha(ring2), transform: [{ scale: rScale(ring2) }] }]} />
      <Animated.View style={[styles.ring, { opacity: rAlpha(ring3), transform: [{ scale: rScale(ring3) }] }]} />

      {/* Shimmer */}
      <Animated.View style={[styles.shimmerWrap, { transform: [{ translateX: shimmerTranslate }, { rotateZ: "-22deg" }] }]} pointerEvents="none">
        <LinearGradient colors={SHIMMER_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Logo */}
      <Animated.Image
        source={require("../../assets/Logo-savoia.png")}
        style={[styles.logo, { opacity, transform: [{ scale }] }]}
        resizeMode="contain"
      />

      {/* Assinatura */}
      <Animated.View
        style={[
          styles.taglineWrap,
          { opacity: tagline, transform: [{ translateY: tagline.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] },
        ]}
      >
        <View style={styles.tagRow}>
          <Image source={require("../../assets/savoia-cruz.png")} style={styles.crossIcon} resizeMode="contain" />
          <Text style={styles.tagline}>A razão da nossa existência!</Text>
        </View>
      </Animated.View>

      {/* >>> Véu anti-flash */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: STACK_BG, opacity: veil },
        ]}
      />
    </View>
  );
}


const STRIPE_W = width * 1.6;
const STRIPE_H = SIZE * 0.9;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: { width: SIZE, height: SIZE },

  ring: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    borderColor: RING_COLOR,
  },

  shimmerWrap: {
    position: "absolute",
    width: width * 1.6,
    height: SIZE * 0.9,
    borderRadius: 20,
  },

  stripeWrap: {
    position: "absolute",
    top: height * 0.28,
    width: STRIPE_W,
    height: STRIPE_H,
    borderRadius: 24,
    opacity: 0.55,
  },

  taglineWrap: {
    position: "absolute",
    bottom: height * 0.20,
    alignItems: "center",
    justifyContent: "center",
  },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  crossIcon: { width: 26, height: 26 },
  tagline: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.28)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
