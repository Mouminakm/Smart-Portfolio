// app/email-sign-in.jsx
// Onboarding — Sign in with email & password (spec S1). Restyled to the
// navy/teal identity. Auth logic, checkbox state, and error mapping unchanged.

import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PrimaryButton } from "../components/Buttons";
import { useAuth } from "../contexts/AuthContext";
import { colors, radius, spacing } from "../theme/theme";

export default function EmailSignInScreen() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function handleSignIn() {
    setErrorMessage("");
    if (!email || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }
    setIsBusy(true);
    try {
      await signIn(email, password);
    } catch (error) {
      setErrorMessage(friendlyError(error.code));
      setIsBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>Welcome back. Enter your details to continue.</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Your password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.rememberRow} onPress={() => setKeepSignedIn((v) => !v)}>
          <View style={[styles.checkbox, keepSignedIn && styles.checkboxChecked]}>
            {keepSignedIn && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.rememberText}>Keep me signed in</Text>
        </Pressable>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <PrimaryButton onPress={handleSignIn}>
          {isBusy ? "Signing in…" : "Sign in"}
        </PrimaryButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function friendlyError(code) {
  switch (code) {
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "No connection. Check your internet and try again.";
    default:
      return "Something went wrong signing in. Please try again.";
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, justifyContent: "center", padding: spacing.xxl },
  title: { fontSize: 28, fontWeight: "700", color: colors.text, textAlign: "center" },
  subtitle: {
    fontSize: 15, color: colors.textSecondary, textAlign: "center",
    lineHeight: 22, marginTop: spacing.md, marginBottom: spacing.xxl,
  },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.lg,
    backgroundColor: colors.card,
  },
  rememberRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.xl },
  checkbox: {
    width: 22, height: 22, borderRadius: 5,
    borderWidth: 1, borderColor: colors.border,
    marginRight: spacing.sm,
    alignItems: "center", justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: colors.teal, borderColor: colors.teal },
  checkmark: { color: colors.onNavy, fontSize: 14, fontWeight: "700" },
  rememberText: { fontSize: 15, color: colors.text },
  error: { color: colors.error, fontSize: 14, marginBottom: spacing.lg, textAlign: "center" },
});