// app/permissions.jsx
// Onboarding screen 4 — Permissions & consent (spec S1, F11).
// Static shell: the consent box and mic request become real in Phase 4.
// This is the last onboarding screen; its button ends the flow for now.

import { StyleSheet, Text, View } from "react-native";
import AppButton from "../components/AppButton";
import { useAuth } from "../contexts/AuthContext";

export default function PermissionsScreen() {
  const { signIn } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Before you start</Text>
      <Text style={styles.subtitle}>
        A couple of quick things so you know exactly how your dictation is handled.
      </Text>

      {/* Microphone — why the app needs it */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Microphone access</Text>
        <Text style={styles.cardBody}>
          Smart Portfolio records your voice so it can transcribe your entry.
          We'll ask your phone for microphone permission when you start your
          first dictation.
        </Text>
      </View>

      {/* Data handling — the F11 transparency points */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>How your data is handled</Text>
        <Text style={styles.cardBody}>
          Your audio is sent to Deepgram to be turned into text, and that text
          is sent to Anthropic (Claude) to structure your entry. Never include
          patient-identifiable details — no names, hospital numbers or dates of
          birth.
        </Text>
      </View>

      {/* Consent — placeholder tick for now (becomes real in Phase 4) */}
      <View style={styles.consentRow}>
        <View style={styles.checkbox} />
        <Text style={styles.consentText}>
          I understand and agree to how my data is handled.
        </Text>
      </View>

      {/* End of onboarding. For now this loops back to Welcome ("/").
          Later this will enter the main app and mark onboarding complete. */}
      <AppButton onPress={signIn}>Finish setup</AppButton>
    </View>
  );
}

const styles = StyleSheet.create({
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
  card: {
    borderWidth: 1,
    borderColor: "#e2e2e2",
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", marginBottom: 6 },
  cardBody: { fontSize: 14, color: "#666666", lineHeight: 21 },
  consentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#cccccc",
    marginRight: 10,
  },
  consentText: { flex: 1, fontSize: 14, color: "#1a1a1a", lineHeight: 20 },
  button: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 14,
    borderRadius: 10,
    overflow: "hidden",
  },
});