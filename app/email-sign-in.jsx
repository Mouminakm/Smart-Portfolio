// app/email-sign-in.jsx
// Onboarding screen 2b — Sign in with email & password (spec S1).
// Now REAL: captures email/password, calls Firebase via useAuth().signIn,
// and shows friendly errors. On success, the auth gate redirects automatically.

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
import AppButton from "../components/AppButton";
import { useAuth } from "../contexts/AuthContext";

export default function EmailSignInScreen() {
  const { signIn } = useAuth();

  // One piece of state per input. These now hold exactly what the user types.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  // For showing a problem and disabling the button while we wait on Firebase.
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  // Runs when the Sign in button is tapped.
  async function handleSignIn() {
    setErrorMessage(""); // clear any previous error

    // Basic check before we even call Firebase.
    if (!email || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setIsBusy(true); // show "Signing in…" and block double-taps
    try {
      // Wait for Firebase. If the details are right, this succeeds and the
      // auth gate notices and redirects us into the app automatically.
      await signIn(email, password);
      // No navigation needed here — the gate handles it.
    } catch (error) {
      // Turn Firebase's error code into something a human understands.
      setErrorMessage(friendlyError(error.code));
      setIsBusy(false); // let them try again
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Sign in</Text>
      <Text style={styles.subtitle}>Welcome back. Enter your details to continue.</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor="#aaaaaa"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}                    // show the current state...
        onChangeText={setEmail}          // ...and update it on every keystroke
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Your password"
        placeholderTextColor="#aaaaaa"
        secureTextEntry={true}
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

      {/* Only shows when there's an error to report. */}
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      {/* onPress runs our real handler. Label changes while it's working. */}
      <AppButton onPress={handleSignIn}>
        {isBusy ? "Signing in…" : "Sign in"}
      </AppButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Maps Firebase error codes to plain-English messages.
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
  flex: { flex: 1, backgroundColor: "#ffffff" },
  container: { flexGrow: 1, justifyContent: "center", padding: 24, backgroundColor: "#ffffff" },
    title: { fontSize: 28, fontWeight: "bold", color: "#1a1a1a", textAlign: "center" },
  subtitle: {
    fontSize: 16,
    color: "#555555",
    textAlign: "center",
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 32,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#1a1a1a", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#1a1a1a",
    marginBottom: 18,
  },
  rememberRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#cccccc",
    marginRight: 10,
  },
  checkboxChecked: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  checkmark: { color: "#ffffff", fontSize: 14, fontWeight: "700", textAlign: "center", lineHeight: 20 },
  rememberText: { fontSize: 15, color: "#1a1a1a" },
  error: { color: "#dc2626", fontSize: 14, marginBottom: 16, textAlign: "center" },
});