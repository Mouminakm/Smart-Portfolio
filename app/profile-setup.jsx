// app/profile-setup.jsx
// Onboarding screen 3 — Profile setup (spec S1).
// Static shell: the fields below are visual placeholders for now.
// We make them actually selectable in a later phase (state + schema).

import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function ProfileSetupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your profile</Text>
      <Text style={styles.subtitle}>
        This tells the app which entry types and fields apply to you.
      </Text>

      {/* Each "field" is a placeholder card: a label and greyed example text. */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Discipline</Text>
        <Text style={styles.fieldPlaceholder}>Medical or Surgical</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Specialty / training programme</Text>
        <Text style={styles.fieldPlaceholder}>e.g. Trauma & Orthopaedics</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Portfolio platform</Text>
        <Text style={styles.fieldPlaceholder}>e.g. eLogbook + ISCP</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>GMC number (optional)</Text>
        <Text style={styles.fieldPlaceholder}>7-digit number</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Training number / NTN (optional)</Text>
        <Text style={styles.fieldPlaceholder}>Your national training number</Text>
      </View>

      {/* Forward button — its destination /permissions is built next step. */}
      <Link href="/permissions" style={styles.button}>
        Continue
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  // Note: no "justifyContent: center" here — a form reads better flowing
  // from the top down, and it leaves room for all the fields.
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#1a1a1a", textAlign: "center" },
  subtitle: {
    fontSize: 16,
    color: "#555555",
    textAlign: "center",
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 28,
  },
  field: {
    borderWidth: 1,
    borderColor: "#e2e2e2",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#1a1a1a" },
  fieldPlaceholder: { fontSize: 15, color: "#aaaaaa", marginTop: 4 },
  button: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 14,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 20,
  },
});