// app/index.jsx
// Onboarding screen 1 — Welcome & how it works (spec S1). Restyled to the
// navy/teal identity: a navy hero, then the four-step explainer in a card.
// Navigation (/sign-in) unchanged.

import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/Buttons";
import SmartCard from "../components/SmartCard";
import { colors, radius, spacing, type } from "../theme/theme";

const STEPS = [
  { n: "1", label: "Speak", desc: "Dictate your entry in your own words." },
  { n: "2", label: "Structure", desc: "AI sorts what you said into the right fields." },
  { n: "3", label: "Review", desc: "Check and edit everything before it goes anywhere." },
  { n: "4", label: "Submit", desc: "Your portfolio site opens pre-filled; you submit there." },
];

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      {/* Navy hero */}
      <View style={styles.hero}>
        <View style={styles.logoBadge}>
          <Ionicons name="mic" size={32} color={colors.onNavy} />
        </View>
        <Text style={styles.title}>Smart Portfolio</Text>
        <Text style={styles.subtitle}>
          Dictate your elogbook and portfolio entries by voice, then review and submit them to your
          training portfolio.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionHeading}>How it works</Text>

        <SmartCard style={styles.stepsCard}>
          {STEPS.map((s, i) => (
            <View key={s.n} style={[styles.step, i === STEPS.length - 1 && { marginBottom: 0 }]}>
              <View style={styles.stepNumberWrap}>
                <Text style={styles.stepNumber}>{s.n}</Text>
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={styles.stepLabel}>{s.label}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}
        </SmartCard>

        <PrimaryButton href="/sign-in" style={styles.cta}>Get started</PrimaryButton>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  hero: {
    backgroundColor: colors.navy,
    paddingTop: spacing.xxxl + spacing.xxl,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
    alignItems: "center",
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  logoBadge: {
    width: 64, height: 64, borderRadius: radius.lg,
    backgroundColor: colors.tealDeep,
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { fontSize: 30, fontWeight: "700", color: colors.onNavy, textAlign: "center" },
  subtitle: {
    fontSize: 15, color: "#CBD5E1", textAlign: "center",
    lineHeight: 22, marginTop: spacing.md,
  },

  content: { padding: spacing.xxl },
  sectionHeading: {
    fontSize: 12, fontWeight: "700", color: colors.textSecondary,
    textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.md,
  },

  stepsCard: { padding: spacing.xl },
  step: { flexDirection: "row", alignItems: "center", marginBottom: spacing.lg },
  stepNumberWrap: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.teal,
    alignItems: "center", justifyContent: "center",
    marginRight: spacing.lg,
  },
  stepNumber: { fontSize: 15, fontWeight: "700", color: colors.onNavy },
  stepTextWrap: { flex: 1 },
  stepLabel: { ...type.cardTitle },
  stepDesc: { ...type.helper, marginTop: 2 },

  cta: { marginTop: spacing.xxl },
});