// app/email-sign-in.jsx
// Onboarding screen 2b — Sign in with email & password (spec S1).
// Static shell: you can type into the boxes, but what you type isn't
// captured or checked yet — that needs "state" (a lesson coming soon)
// and real auth via Firebase (Phase 3).

import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AppButton from "../components/AppButton";


export default function EmailSignInScreen() {
    const [keepSignedIn, setKeepSignedIn] = useState(false);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.subtitle}>Welcome back. Enter your details to continue.</Text>

      {/* TextInput is the building block for a typeable box.
          keyboardType shows an email-friendly keyboard; autoCapitalize "none"
          stops it capitalising the first letter of the email. */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor="#aaaaaa"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* secureTextEntry masks the characters as dots. */}
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Your password"
        placeholderTextColor="#aaaaaa"
        secureTextEntry={true}
        autoCapitalize="none"
      />

      {/* "Keep me signed in" — placeholder for now. The square is just a
          visual; making it tick on and off needs state (coming soon). */}
      {/* Pressable makes the whole row tappable. onPress flips the state to
          its opposite — (v) => !v means "whatever it was, make it the other".
          When keepSignedIn is true we add the checkboxChecked style (blue fill)
          and show a white tick inside. */}
      <Pressable
        style={styles.rememberRow}
        onPress={() => setKeepSignedIn((v) => !v)}
      >
        <View style={[styles.checkbox, keepSignedIn && styles.checkboxChecked]}>
          {keepSignedIn && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.rememberText}>Keep me signed in</Text>
      </Pressable>

      {/* Placeholder action: advances the flow for now. */}
      <AppButton href="/profile-setup">Sign in</AppButton>
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
  rememberRow: { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#cccccc",
    marginRight: 10,
  },
  rememberText: { fontSize: 15, color: "#1a1a1a" },
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
  checkboxChecked: {
    backgroundColor: "#2563eb", // blue fill when ticked
    borderColor: "#2563eb",
  },
  // Centre the tick inside the square.
  checkmark: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
  },
});