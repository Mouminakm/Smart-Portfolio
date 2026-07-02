// app/privacy.jsx
// Privacy notice screen (spec F11).
//
// It displays the notice text held in data/privacyNotice.js — this file is only
// about *showing* that text, so any wording change happens in the data file, not
// here. It's a read-only page: nothing is entered, sent, or stored on this screen.
//
// Because this file lives in the app/ folder, Expo Router automatically turns it
// into a route at "/privacy". The Permissions screen opens it with
// router.push("/privacy").

import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import SmartCard from "../components/SmartCard";
import {
    COMPANY_NAME,
    CONTACT_EMAIL,
    PRIVACY_DISCLAIMER,
    PRIVACY_EFFECTIVE_DATE,
    PRIVACY_SECTIONS,
    PRIVACY_SHORT_VERSION,
    PRIVACY_SUBPROCESSORS,
    PRIVACY_VERSION,
} from "../data/privacyNotice";
import { colors, radius, spacing } from "../theme/theme";

export default function PrivacyScreen() {
  return (
    <View style={styles.flex}>
      {/* Most of the app hides the native header and uses its own NavyHeader.
          For this rarely-visited page we let the navigation stack show a simple
          native header instead — that gives us a title and, importantly, a
          working Back button for free, since we arrived here by pushing. */}
      <Stack.Screen
        options={{ headerShown: true, title: "Privacy notice", headerBackTitle: "Back" }}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Version + effective date */}
        <Text style={styles.meta}>
          Version {PRIVACY_VERSION} · {PRIVACY_EFFECTIVE_DATE}
        </Text>

        {/* Highlighted note at the top */}
        <View style={styles.disclaimer}>
          <Ionicons
            name="information-circle"
            size={18}
            color={colors.navy}
            style={{ marginRight: spacing.sm, marginTop: 1 }}
          />
          <Text style={styles.disclaimerText}>{PRIVACY_DISCLAIMER}</Text>
        </View>

        {/* The plain-English summary */}
        <Text style={styles.h2}>In short</Text>
        {PRIVACY_SHORT_VERSION.map((line, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{line}</Text>
          </View>
        ))}

        {/* The full notice, section by section */}
        {PRIVACY_SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.h2}>{section.heading}</Text>
            {section.paragraphs.map((p, j) => (
              <Text key={j} style={styles.paragraph}>
                {p}
              </Text>
            ))}

            {/* The sub-processor list is easier to read as cards than a table on
                a phone, so we render those cards right after their section. */}
            {section.heading.startsWith("Who processes") &&
              PRIVACY_SUBPROCESSORS.map((sp, k) => (
                <SmartCard key={k} style={styles.spCard}>
                  <Text style={styles.spName}>{sp.name}</Text>
                  <Text style={styles.spDoes}>{sp.does}</Text>
                  <Text style={styles.spMeta}>Where: {sp.where}</Text>
                  <Text style={styles.spNotes}>{sp.notes}</Text>
                </SmartCard>
              ))}
          </View>
        ))}

        {/* Simple contact footer */}
        <Text style={styles.footer}>
          {COMPANY_NAME} · {CONTACT_EMAIL}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xxl, paddingBottom: spacing.xxxl },

  meta: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md },

  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  disclaimerText: { flex: 1, fontSize: 13, color: colors.navy, lineHeight: 18 },

  h2: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  section: { marginTop: spacing.lg },
  paragraph: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.sm,
  },

  bulletRow: { flexDirection: "row", marginBottom: spacing.sm, paddingRight: spacing.md },
  bulletDot: { fontSize: 14, color: colors.teal, marginRight: spacing.sm, lineHeight: 21 },
  bulletText: { flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 21 },

  spCard: { padding: spacing.lg, marginTop: spacing.md },
  spName: { fontSize: 15, fontWeight: "700", color: colors.text },
  spDoes: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  spMeta: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  spNotes: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 19 },

  footer: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xxl,
  },
});
