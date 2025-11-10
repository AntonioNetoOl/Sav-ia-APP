import { Button, Text, View } from "react-native";
import { removeToken } from "../utils/storage";

export default function HomeScreen({ navigation }) {
  const handleLogout = async () => {
    await removeToken();
    navigation.replace("Login");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Bem-vindo à Home!</Text>
      <Button title="Sair (limpar token)" onPress={handleLogout} />
    </View>
  );
}
