// app/(tabs)/home.jsx
// Core loop screen — Home / entry chooser (spec S3). Now a tab.

import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton"; // ../../ to climb out of (tabs)

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>What would you like to dictate?</Text>

      <View style={styles.contextPill}>
        <Text style={styles.contextText}>Surgical · eLogbook + ISCP</Text>
      </View>

      <View style={styles.choices}>
        <AppButton href="/dictation">Operation log</AppButton>
        <AppButton href="/dictation">Workplace-based assessment</AppButton>
        <AppButton href="/dictation">Reflection</AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 40, backgroundColor: "#ffffff" },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 20,
  },
  contextPill: {
    alignSelf: "center",
    backgroundColor: "#eef2ff",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 32,
  },
  contextText: { fontSize: 13, fontWeight: "600", color: "#2563eb" },
  choices: { gap: 14 },
});