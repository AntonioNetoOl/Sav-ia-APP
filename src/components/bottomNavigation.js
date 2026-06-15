// src/components/bottomNavigation.js
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, Dimensions, Platform, Pressable, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");

const TABS = [
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

export default function BottomNavigation({ activeKey = "home", navigation }) {
  const handlePress = (key) => {
    if (key === activeKey) return;

    if (key === "home") {
      navigation.navigate("Home");
      return;
    }

    if (key === "menu") {
      navigation.navigate("Menu");
      return;
    }

    if (key === "carteirinha") {
      Alert.alert("Carteirinha", "A aba Carteirinha será implementada na próxima etapa.");
      return;
    }

    if (key === "socio") {
      Alert.alert("Sócio", "A aba Sócio será implementada na próxima etapa.");
    }
  };

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={styles.nav}>
        {TABS.map((tab) => {
          const focused = tab.key === activeKey;

          return (
            <Pressable
              key={tab.key}
              onPress={() => handlePress(tab.key)}
              style={({ pressed }) => [styles.button, pressed && { opacity: 0.82 }]}
            >
              {tab.icon(focused)}
              <Text style={[styles.label, focused && styles.labelActive]}>{tab.label}</Text>
              {tab.key === "menu" && activeKey !== "menu" && <View style={styles.menuDot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: Platform.OS === "ios" ? 18 : 10,
  },
  nav: {
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
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    position: "relative",
  },
  label: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "700",
  },
  labelActive: {
    color: "#D5C16B",
  },
  menuDot: {
    position: "absolute",
    top: 0,
    right: width * 0.055,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F14242",
  },
});
