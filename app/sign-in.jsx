// app/sign-in.jsx
// Onboarding — Create your account (spec S1). Restyled to the navy/teal
// identity. All navigation destinations unchanged.

import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme/theme";

export default function SignInScreen() {
  return (
    <View style={styles.container}>
      {/* Navy hero, consistent with the welcome screen */}
      <View style={styles.hero}>
        <View style={styles.logoBadge}>
          <Ionicons name="mic" size={28} color={colors.onNavy} />
        </View>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          Sign up to save your profile and entries securely. We'll never post
          anything on your behalf.
        </Text>
      </View>

      <View style={styles.content}>
        {/* Working path: email sign-up (primary) */}
        <Link href="/email-sign-up" style={styles.emailButton}>
          Sign up with email
        </Link>

        {/* Placeholders — wired up in the development-build phase */}
        <Link href="/profile-setup" style={styles.googleButton}>
          Sign up with Google
        </Link>
        <Link href="/profile-setup" style={styles.appleButton}>
          Sign up with Apple
        </Link>

        <Text style={styles.existingText}>Already have an account?</Text>
        <Link href="/email-sign-in" style={styles.signInButton}>
          Sign in
        </Link>
      </View>
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
    width: 56, height: 56, borderRadius: radius.md,
    backgroundColor: colors.tealDeep,
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: { fontSize: 26, fontWeight: "700", color: colors.onNavy, textAlign: "center" },
  subtitle: {
    fontSize: 14, color: "#CBD5E1", textAlign: "center",
    lineHeight: 21, marginTop: spacing.sm,
  },

  content: { flex: 1, padding: spacing.xxl, justifyContent: "center" },

  emailButton: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
    fontSize: 16, fontWeight: "600", color: colors.onNavy,
    textAlign: "center", overflow: "hidden",
  },
  googleButton: {
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
    fontSize: 16, fontWeight: "600", color: colors.text,
    textAlign: "center", overflow: "hidden",
    backgroundColor: colors.card,
  },
  appleButton: {
    backgroundColor: "#000000",
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    fontSize: 16, fontWeight: "600", color: "#ffffff",
    textAlign: "center", overflow: "hidden",
  },
  existingText: {
    textAlign: "center", color: colors.textSecondary,
    fontSize: 14, marginTop: spacing.xxl, marginBottom: spacing.sm,
  },
  signInButton: {
    fontSize: 16, fontWeight: "600", color: colors.teal,
    textAlign: "center", paddingVertical: spacing.sm,
  },
});