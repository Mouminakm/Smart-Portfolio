// app/review.jsx
// Core loop screen — Review & edit (spec F7).
// After dictation, the user checks and fixes every field before submitting.
// Static shell: values are placeholders; real editing arrives in Phase 5.

import { ScrollView, StyleSheet, Text, View } from "react-native";
import AppButton from "../components/AppButton";

export default function ReviewScreen() {
  // Placeholder "captured" values. In Phase 5 these come from the AI output.
  const captured = [
    { label: "Date of operation", value: "14 June 2026" },
    { label: "Procedure", value: "Dynamic hip screw" },
    { label: "Level of supervision", value: "Supervised – trainer scrubbed" },
    { label: "Operative role", value: "Performed" },
    { label: "Reflection / learning points", value: "Tap to review the paraphrased reflection." },
  ];

  return (
    // ScrollView lets the content scroll if it's taller than the screen —
    // important here, since a full set of fields plus a button can overflow.
    // (A plain View doesn't scroll; anything past the bottom edge is unreachable.)
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Review your entry</Text>
      <Text style={styles.subtitle}>
        Check each field and fix anything before submitting. Nothing is sent
        until you confirm.
      </Text>

      {captured.map((item, index) => (
        <View key={index} style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>{item.label}</Text>
          <Text style={styles.fieldValue}>{item.value}</Text>
          {/* "Edit" is a visual cue for now; tappable editing comes in Phase 5. */}
          <Text style={styles.editHint}>Edit</Text>
        </View>
      ))}

      {/* Forward to submission. We build /submission next. */}
      <AppButton href="/submission">Looks good — continue</AppButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  // On a ScrollView, padding goes on contentContainerStyle, not style.
  content: { padding: 24, paddingTop: 32, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "bold", color: "#1a1a1a", textAlign: "center" },
  subtitle: {
    fontSize: 15,
    color: "#555555",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 24,
  },
  fieldCard: {
    borderWidth: 1,
    borderColor: "#e2e2e2",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#888888" },
  fieldValue: { fontSize: 16, color: "#1a1a1a", marginTop: 4 },
  editHint: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
    marginTop: 8,
  },
  button: {}, // (unused here; AppButton carries its own styling)
});