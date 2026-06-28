// app/permissions.jsx
// Onboarding — Permissions & consent (spec S1, F11). Restyled to the navy/teal
// identity. The consent checkbox is now functional: the user must agree before
// they can finish setup. completeOnboarding() logic unchanged.

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/Buttons";
import SmartCard from "../components/SmartCard";
import { useAuth } from "../contexts/AuthContext";
import { colors, spacing } from "../theme/theme";

export default function PermissionsScreen() {
  const { completeOnboarding } = useAuth();
  const [isBusy, setIsBusy] = useState(false);
  const [agreed, setAgreed] = useState(false); // real consent state

  async function handleFinish() {
    if (!agreed) return; // can't proceed without consent
    setIsBusy(true);
    try {
      await completeOnboarding();
    } catch (error) {
      setIsBusy(false);
    }
  }

  // Placeholder until a hosted terms page exists — see note to revisit.
  function showTerms() {
    Alert.alert(
      "Terms & Privacy",
      "Smart Portfolio assists you in recording logbook entries by voice. You remain responsible for reviewing and submitting all entries. Dictation must never include patient-identifiable information. Audio is processed by Deepgram and text by Anthropic to structure your entry. Full terms will be provided before launch."
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Before you start</Text>
        <Text style={styles.subtitle}>
          A couple of quick things so you know exactly how your dictation is handled.
        </Text>

        <SmartCard style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="mic" size={18} color={colors.tealDeep} style={{ marginRight: spacing.sm }} />
            <Text style={styles.cardTitle}>Microphone access</Text>
          </View>
          <Text style={styles.cardBody}>
            Smart Portfolio records your voice so it can transcribe your entry. We'll ask your
            phone for microphone permission when you start your first dictation.
          </Text>
        </SmartCard>

        <SmartCard style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="shield-checkmark" size={18} color={colors.tealDeep} style={{ marginRight: spacing.sm }} />
            <Text style={styles.cardTitle}>How your data is handled</Text>
          </View>
          <Text style={styles.cardBody}>
            Your audio is sent to Deepgram to be turned into text, and that text is sent to
            Anthropic (Claude) to structure your entry. Never include patient-identifiable
            details — no names, hospital numbers or dates of birth.
          </Text>
        </SmartCard>

        <SmartCard style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="information-circle" size={18} color={colors.tealDeep} style={{ marginRight: spacing.sm }} />
            <Text style={styles.cardTitle}>Your responsibility</Text>
          </View>
          <Text style={styles.cardBody}>
            Smart Portfolio is a tool to assist you — it does not submit anything on your behalf.
            You review and submit every entry yourself on your portfolio, and you remain
            responsible for the accuracy of what you record.
          </Text>
        </SmartCard>

        {/* Functional consent checkbox — Finish is disabled until ticked. */}
        <Pressable style={styles.consentRow} onPress={() => setAgreed((v) => !v)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed ? <Ionicons name="checkmark" size={15} color={colors.onNavy} /> : null}
          </View>
          <Text style={styles.consentText}>
            I understand and agree to how my data is handled, and I accept the{" "}
            <Text style={styles.link} onPress={showTerms}>terms & privacy notice</Text>.
          </Text>
        </Pressable>

        <PrimaryButton onPress={handleFinish} disabled={!agreed || isBusy} style={styles.finishBtn}>
          {isBusy ? "Finishing…" : "Finish setup"}
        </PrimaryButton>

        {!agreed ? (
          <Text style={styles.hint}>Please tick the box above to continue.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xxl, paddingTop: spacing.xxxl + spacing.xl, paddingBottom: spacing.xxxl },
  title: { fontSize: 28, fontWeight: "700", color: colors.text, textAlign: "center" },
  subtitle: {
    fontSize: 15, color: colors.textSecondary, textAlign: "center",
    lineHeight: 22, marginTop: spacing.md, marginBottom: spacing.xl,
  },
  card: { padding: spacing.lg, marginBottom: spacing.md },
  cardHead: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  cardBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },

  consentRow: { flexDirection: "row", alignItems: "flex-start", marginTop: spacing.md, marginBottom: spacing.xl },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 1.5, borderColor: colors.border,
    marginRight: spacing.md, marginTop: 1,
    alignItems: "center", justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: colors.teal, borderColor: colors.teal },
  consentText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  link: { color: colors.teal, fontWeight: "600", textDecorationLine: "underline" },

  finishBtn: {},
  hint: { fontSize: 12, color: colors.textMuted, textAlign: "center", marginTop: spacing.md },
});