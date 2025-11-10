// src/components/svButton.js
import * as Haptics from "expo-haptics";
import { useRef } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from "react-native";

export default function SvButton({ title, onPress, loading = false, disabled = false, style, textStyle }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();

  const handlePress = async () => {
    if (loading || disabled) return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    onPress?.();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={handlePress}
        style={[styles.button, (disabled || loading) && styles.disabled, style]}
        disabled={disabled || loading}
      >
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={[styles.text, { marginLeft: 10 }, textStyle]}>Carregando...</Text>
          </View>
        ) : (
          <Text style={[styles.text, textStyle]}>{title}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0C6A3D",
  },
  text: { color: "#fff", fontSize: 20, fontWeight: "800" },
  disabled: { opacity: 0.7 },
  loaderWrap: { flexDirection: "row", alignItems: "center" },
});
