// app/sign-in.jsx
// Onboarding screen 2 — Create your account (spec S1).
// Static shell. Google/Apple are the primary way to create an account;
// a "Sign in" link leads to the email/password screen for returning users.
// Real auth (Firebase) gets wired up in Phase 3.

import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function SignInScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>
        Sign up to save your profile and entries securely. We'll never post
        anything on your behalf.
      </Text>

      {/* Primary: create an account with Google or Apple.
          For now these just advance to Profile setup (placeholder). */}
      <Link href="/profile-setup" style={styles.googleButton}>
        Sign up with Google
      </Link>

      <Link href="/profile-setup" style={styles.appleButton}>
        Sign up with Apple
      </Link>

      {/* Secondary: existing users go to the email/password sign-in screen. */}
      <Text style={styles.existingText}>Already have an account?</Text>
      <Link href="/email-sign-in" style={styles.signInButton}>
        Sign in
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#1a1a1a", textAlign: "center" },
  subtitle: {
    fontSize: 16,
    color: "#555555",
    textAlign: "center",
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 40,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 14,
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
    overflow: "hidden",
  },
  appleButton: {
    backgroundColor: "#000000",
    borderRadius: 10,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    overflow: "hidden",
  },
  existingText: {
    textAlign: "center",
    color: "#888888",
    fontSize: 14,
    marginTop: 32,
    marginBottom: 8,
  },
  // A text-style (secondary) button, so it reads as less prominent than sign-up.
  signInButton: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
    textAlign: "center",
    paddingVertical: 8,
  },
});