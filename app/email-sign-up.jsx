// app/email-sign-up.jsx
// Onboarding — Create an account with email & password (spec S1). Restyled to
// the navy/teal identity. Auth logic, validation, and error mapping unchanged.

import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PrimaryButton } from "../components/Buttons";
import { useAuth } from "../contexts/AuthContext";
import { colors, radius, spacing } from "../theme/theme";

export default function EmailSignUpScreen() {
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function handleSignUp() {
    setErrorMessage("");
    if (!email || !password) {
      setErrorMessage("Please enter an email and password.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setErrorMessage("The two passwords don't match.");
      return;
    }
    setIsBusy(true);
    try {
      await signUp(email, password);
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
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Use any email and a password of at least 6 characters.</Text>

        <View style={styles.form}>
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
            placeholder="At least 6 characters"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter your password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            value={confirm}
            onChangeText={setConfirm}
          />

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          <PrimaryButton onPress={handleSignUp} style={{ marginTop: spacing.sm }}>
            {isBusy ? "Creating account…" : "Create account"}
          </PrimaryButton>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function friendlyError(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with that email already exists. Try signing in instead.";
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/network-request-failed":
      return "No connection. Check your internet and try again.";
    default:
      return "Something went wrong creating your account. Please try again.";
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
  form: {},
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
  error: { color: colors.error, fontSize: 14, marginBottom: spacing.lg, textAlign: "center" },
});