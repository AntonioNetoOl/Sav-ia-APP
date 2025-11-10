// src/components/svInput.js
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { formatCPF, formatPhone } from "../utils/masks";

export default function SvInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  secureToggle,        // ativa o "olho"
  mask,                // "cpf" | "phone"
  error,               // string com mensagem de erro
  style,
  inputStyle,
  ...rest
}) {
  const [show, setShow] = useState(false);

  const handleChange = (txt) => {
    let v = txt;
    if (mask === "cpf") v = formatCPF(txt);
    if (mask === "phone") v = formatPhone(txt);
    onChangeText?.(v);
  };

  const isPassword = !!secureTextEntry;
  const showSecure = isPassword && secureToggle;

  const rightIcon = useMemo(() => {
    if (!showSecure) return null;
    return (
      <Pressable onPress={() => setShow((s) => !s)} hitSlop={12} style={styles.icon}>
        <Ionicons name={show ? "eye-off" : "eye"} size={20} color="#6B7280" />
      </Pressable>
    );
  }, [showSecure, show]);

  return (
    <View style={[style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.fieldWrap, error && styles.fieldError]}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="rgba(0,0,0,0.45)"
          style={[styles.input, inputStyle]}
          value={value ?? ""}
          onChangeText={handleChange}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={isPassword && !show}
          {...rest}
        />
        {rightIcon}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  fieldWrap: {
    height: 48,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  fieldError: {
    borderColor: "rgba(239,68,68,0.8)",
  },
  input: { fontSize: 16, color: "#111827", paddingVertical: 0 },
  icon: { position: "absolute", right: 12 },
  error: { color: "#FCA5A5", marginTop: 6, fontWeight: "700" },
});
