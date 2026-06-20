// app/home.jsx
// Core loop screen — Home / entry chooser (spec S3).
// The landing screen of the main app: the user picks what to dictate.
// Static shell: the entry types are placeholders. In Phase 2 these become
// data-driven from your platform schema, and each will eventually tell the
// Dictation screen which set of fields to load.

import { StyleSheet, Text, View } from "react-native";
import AppButton from "../components/AppButton";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>What would you like to dictate?</Text>

      {/* Context "pill": which portfolio this entry will go to. Static for now;
          later it reflects the user's saved profile (S2), so they always know
          where their entry is headed before they start. */}
      <View style={styles.contextPill}>
        <Text style={styles.contextText}>Surgical · eLogbook + ISCP</Text>
      </View>

      {/* The entry-type choices, shown as buttons (spec S3).
          All lead to the Dictation screen for now; later each will pass along
          which entry type was chosen. The wrapping View uses "gap" to space
          the buttons evenly — gap puts equal space between children without
          adding a margin to each one. */}
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
  // A rounded "pill" badge, centred horizontally (alignSelf: "center").
  contextPill: {
    alignSelf: "center",
    backgroundColor: "#eef2ff",
    borderRadius: 999, // a very large radius makes the ends fully rounded
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 32,
  },
  contextText: { fontSize: 13, fontWeight: "600", color: "#2563eb" },
  choices: { gap: 14 }, // even spacing between the three buttons
});