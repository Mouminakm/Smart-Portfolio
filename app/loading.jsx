// app/loading.jsx
// Shown briefly while AuthContext checks sign-in + onboarding status, so we
// never flash the wrong screen on launch or sign-in.

import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function LoadingScreen() {
  // ActivityIndicator is React Native's built-in spinner.
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" },
});