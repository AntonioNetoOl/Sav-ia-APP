process.env.EXPO_PUBLIC_API_URL = "http://test.invalid";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
