import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, StyleSheet, View } from "react-native";

const isAndroid = Platform.OS === "android";
const androidApi = isAndroid ? Number(Platform.Version) : 0;

export default function GlassCard({
  width,
  radius = 18,
  padding = 18,
  children,
  style,
  contentStyle,
  shadowStyle,

  blur = true,

  androidBlurMode = "fallback",

  blurIntensity = 18,

  androidElevation = 0,

  scrimOpacityIOS = 0.06,
  scrimOpacityAndroid = 0.14,
  scrimOpacityWeb = 0.08,

  // evita Web escurecer
  tintIOS = "dark",
  tintAndroid = "default",
  tintWeb = "default",
}) {
  const canUseAndroidNativeBlur = isAndroid && androidApi >= 31;
  const useBlur =
    Boolean(blur) &&
    (!isAndroid || (androidBlurMode === "native" && canUseAndroidNativeBlur));

  const tint = Platform.select({
    ios: tintIOS,
    android: tintAndroid,
    web: tintWeb,
    default: "default",
  });

  const scrimOpacity = Platform.select({
    ios: scrimOpacityIOS,
    android: scrimOpacityAndroid,
    web: scrimOpacityWeb,
    default: 0.08,
  });

  const baseBg = `rgba(255,255,255,${scrimOpacity})`;

  const outerShadow = Platform.select({
    ios: styles.shadowIOS,
    android: androidElevation > 0 ? { elevation: androidElevation } : null,
    web: null,
    default: null,
  });

  return (
    <View
      style={[
        { width, borderRadius: radius, backgroundColor: baseBg },
        outerShadow,
        shadowStyle,
      ]}
    >
      {/* Surface faz clipping; borda é desenhada por overlay (não insets) */}
      <View
        style={[
          styles.surface,
          { borderRadius: radius, backgroundColor: baseBg },
          style,
        ]}
      >
        {/* Blur real (iOS / e Android 31+ se androidBlurMode="native") */}
        {useBlur && (
          <BlurView
            intensity={blurIntensity}
            tint={tint}
            style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
            pointerEvents="none"
          />
        )}

        {/* Fallback “glass” (Android padrão + opcionalmente Web se quiser consistência) */}
        {!useBlur && (
          <LinearGradient
            colors={[
              "rgba(255,255,255,0.18)",
              "rgba(255,255,255,0.10)",
              "rgba(255,255,255,0.14)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
            pointerEvents="none"
          />
        )}

        <View style={[{ padding }, contentStyle]}>{children}</View>

        {/* Borda por overlay (evita “anel”/inset e efeito de dupla superfície) */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: radius,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.25)",
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    overflow: "hidden",
  },
  shadowIOS: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
});
