import AsyncStorage from "@react-native-async-storage/async-storage";

export async function saveToken(token) {
  try {
    await AsyncStorage.setItem("token", token);
  } catch (error) {
    console.error("Erro ao salvar token:", error);
  }
}

export async function getToken() {
  try {
    return await AsyncStorage.getItem("token");
  } catch (error) {
    console.error("Erro ao buscar token:", error);
    return null;
  }
}

export async function removeToken() {
  try {
    await AsyncStorage.removeItem("token");
  } catch (error) {
    console.error("Erro ao remover token:", error);
  }
}
