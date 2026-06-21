// app/email-sign-up.jsx
// Onboarding — Create an account with email & password (spec S1).
// Uses useAuth().signUp (Firebase createUserWithEmailAndPassword).
// On success the auth gate redirects into the app automatically.

import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput
} from "react-native";
import AppButton from "../components/AppButton";
import { useAuth } from "../contexts/AuthContext";

export default function EmailSignUpScreen() {
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function handleSignUp() {
    setErrorMessage("");

    // Checks we can do ourselves, before calling Firebase — faster feedback
    // and fewer pointless network calls.
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
      // Creates the account AND signs the new user in. The gate then
      // redirects them into the app — no manual navigation needed.
      await signUp(email, password);
    } catch (error) {
      setErrorMessage(friendlyError(error.code));
      setIsBusy(false);
    }
  }

  return (
    // KeyboardAvoidingView lifts content above the keyboard. On iOS we use
    // "padding"; Android handles most of this itself, so we pass undefined.
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* ScrollView lets you scroll to any field the keyboard would cover.
          keyboardShouldPersistTaps lets a tap reach a button while the
          keyboard is open, instead of just dismissing the keyboard. */}
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create your account</Text>

      <Text style={styles.subtitle}>
        Use any email and a password of at least 6 characters.
      </Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor="#aaaaaa"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="At least 6 characters"
        placeholderTextColor="#aaaaaa"
        secureTextEntry={true}
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.label}>Confirm password</Text>
      <TextInput
        style={styles.input}
        placeholder="Re-enter your password"
        placeholderTextColor="#aaaaaa"
        secureTextEntry={true}
        autoCapitalize="none"
        value={confirm}
        onChangeText={setConfirm}
      />

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
 
      <AppButton onPress={handleSignUp}>
        {isBusy ? "Creating account…" : "Create account"}
      </AppButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Firebase sign-up error codes → plain English.
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
    flex: { flex: 1, backgroundColor: "#ffffff" },
    // flexGrow lets the content fill the screen and still centre when short,
    // but grow and scroll when the keyboard makes space tight.
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
  error: { color: "#dc2626", fontSize: 14, marginBottom: 16, textAlign: "center" },
});