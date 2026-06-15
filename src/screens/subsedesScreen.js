// src/screens/subsedesScreen.js
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

const SCREEN_BG = "#05271A";

export default function SubsedesScreen({ navigation }) {
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
          <Ionicons name="map-outline" size={62} color="#F1E6A8" />
          <Text style={styles.title}>Subsedes da Savóia</Text>
          <Text style={styles.text}>Em breve, esta área terá a lista de subsedes e detalhes de cada unidade.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SCREEN_BG },
  content: {
    flexGrow: 1,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 16 : 28,
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingVertical: 10 },
  backText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  card: {
    flex: 1,
    minHeight: 360,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    marginTop: 18,
  },
  title: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", marginTop: 14, textAlign: "center" },
  text: { color: "rgba(255,255,255,0.78)", fontSize: 14, lineHeight: 21, marginTop: 12, textAlign: "center" },
});
