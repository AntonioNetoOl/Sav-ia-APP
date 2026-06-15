// src/screens/loyaltyInfoScreen.js
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

const SCREEN_BG = "#05271A";

export default function LoyaltyInfoScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={SCREEN_BG} />
      <LinearGradient colors={["#083726", "#072F20", "#05271A"]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={21} color="#FFFFFF" />
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
        <View style={styles.card}>
          <Ionicons name="gift-outline" size={62} color="#F1E6A8" />
          <Text style={styles.title}>Programa de fidelidade</Text>
          <Text style={styles.text}>O progresso considera 12 mensalidades confirmadas no sistema.</Text>
          <Text style={styles.text}>Ao completar o ciclo, o benefício definido pela Savóia poderá ser liberado.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SCREEN_BG },
  content: { flexGrow: 1, paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 16 : 28, paddingHorizontal: 18, paddingBottom: 32 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingVertical: 10 },
  backText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  card: { borderRadius: 24, backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)", alignItems: "center", padding: 24, marginTop: 18 },
  title: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", marginTop: 14, textAlign: "center" },
  text: { color: "rgba(255,255,255,0.78)", fontSize: 15, lineHeight: 23, marginTop: 14, textAlign: "center" },
});
