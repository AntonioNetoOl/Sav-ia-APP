// App.js
import { Platform, StatusBar as RNStatusBar } from "react-native";
import "react-native-gesture-handler";
import AppNavigator from "./src/navigation/appNavigator";

export default function App() {
  return (
    <>
      {Platform.OS === "android" && (
        <RNStatusBar barStyle="light-content" backgroundColor="#05271A" />
      )}
      <AppNavigator />
    </>
  );
}
