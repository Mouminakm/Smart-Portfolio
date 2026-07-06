// app/delete-account.jsx
// Account deletion (spec F11 + app-store requirement).
//
// A deliberately friction-ful screen: the user must type their password and
// confirm a dialog before anything happens. It calls deleteAccount(password)
// from AuthContext, which re-confirms identity, deletes their Firestore profile,
// then deletes the auth account — after which the auth listener routes them back
// to the welcome screen automatically. Nothing is stored or sent from here
// beyond that deletion.

import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { colors, radius, spacing } from "../theme/theme";

export default function DeleteAccountScreen() {
  const { deleteAccount } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  // Step 1 of deletion: validate there's a password, then ask for a final
  // confirmation via a native dialog before doing anything irreversible.
  function confirmDelete() {
    setErrorMessage("");
    if (!password) {
      setErrorMessage("Enter your password to confirm.");
      return;
    }
    Alert.alert(
      "Delete account?",
      "This permanently deletes your account and profile. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: runDelete },
      ]
    );
  }

  // Step 2: actually delete. On success the auth listener signs us out and
  // routes to the welcome screen, so we don't navigate manually here.
  async function runDelete() {
    setIsBusy(true);
    try {
      await deleteAccount(password);
    } catch (error) {
      setIsBusy(false);
      setErrorMessage(friendlyError(error.code));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Native header just for this screen, giving a title + Back button. */}
      <Stack.Screen
        options={{ headerShown: true, title: "Delete account", headerBackTitle: "Back" }}
      />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Delete your account</Text>
        <Text style={styles.body}>
          This permanently deletes your Smart Portfolio account and your saved profile —
          your specialty, hospitals, consultants, and any GMC or training number. Your
          logbook entries live in eLogbook and are not affected. This cannot be undone.
        </Text>

        <Text style={styles.label}>Confirm your password</Text>
        <TextInput
          style={styles.input}
          placeholder="Your password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
        />

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          onPress={confirmDelete}
          disabled={isBusy}
          style={({ pressed }) => [
            styles.deleteBtn,
            pressed && styles.deleteBtnPressed,
            isBusy && styles.disabled,
          ]}
        >
          <Text style={styles.deleteText}>
            {isBusy ? "Deleting…" : "Permanently delete my account"}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.cancelWrap}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Turn Firebase error codes into plain-English messages.
function friendlyError(code) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "That password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "No connection. Check your internet and try again.";
    default:
      return "Couldn't delete the account. Please try again.";
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xxl, paddingBottom: spacing.xxxl },
  title: { fontSize: 24, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  body: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.xxl },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
    marginBottom: spacing.lg,
  },
  error: { color: colors.error, fontSize: 14, marginBottom: spacing.lg, textAlign: "center" },
  deleteBtn: {
    backgroundColor: colors.error,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnPressed: { opacity: 0.85 },
  deleteText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.5 },
  cancelWrap: { marginTop: spacing.lg, alignItems: "center" },
  cancelText: { color: colors.textSecondary, fontSize: 15, fontWeight: "600" },
});
