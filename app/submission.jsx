// app/submission.jsx
// Core loop screen — Submission via WebView (spec F8).
// Static shell. In Phase 7 this opens the real portfolio site in a WebView
// (an embedded web browser), pre-filled, and the user submits there.
// Today it's a placeholder representing that, so the loop is walkable.

import { StyleSheet, Text, View } from "react-native";
import AppButton from "../components/AppButton";

export default function SubmissionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submit to your portfolio</Text>
      <Text style={styles.subtitle}>
        Your portfolio site opens here with the form already filled in. Check it
        over and submit on the site itself — Smart Portfolio never submits for you.
      </Text>

      {/* Mock "browser" frame standing in for the real WebView (Phase 7). */}
      <View style={styles.browserFrame}>
        {/* Fake address bar */}
        <View style={styles.addressBar}>
          <View style={styles.lockIcon} />
          <Text style={styles.addressText}>elogbook.org</Text>
        </View>

        {/* Fake pre-filled form, just to convey the idea */}
        <View style={styles.pageBody}>
          <Text style={styles.pageHeading}>New operation entry</Text>
          <View style={styles.formLine} />
          <View style={styles.formLine} />
          <View style={styles.formLine} />
          <View style={styles.formLineShort} />
          <Text style={styles.prefillNote}>Fields pre-filled from your dictation</Text>
        </View>
      </View>

      {/* Closes the loop: back to Home to start another entry. */}
      <AppButton href="/home">Done — back to home</AppButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 32, backgroundColor: "#ffffff" },
  title: { fontSize: 26, fontWeight: "bold", color: "#1a1a1a", textAlign: "center" },
  subtitle: {
    fontSize: 15,
    color: "#555555",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 24,
  },
  // flex: 1 makes the frame stretch to fill the space between text and button.
  browserFrame: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 12,
    overflow: "hidden", // keeps the inner content within the rounded corners
    marginBottom: 24,
  },
  addressBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  lockIcon: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e", // little green "secure" dot
    marginRight: 8,
  },
  addressText: { fontSize: 13, color: "#555555" },
  pageBody: { padding: 16, flex: 1 },
  pageHeading: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 16 },
  // Light blue bars = "filled" fields.
  formLine: {
    height: 18,
    borderRadius: 5,
    backgroundColor: "#dbeafe",
    marginBottom: 12,
  },
  formLineShort: {
    height: 18,
    width: "55%",
    borderRadius: 5,
    backgroundColor: "#dbeafe",
    marginBottom: 16,
  },
  prefillNote: { fontSize: 13, color: "#2563eb", fontStyle: "italic" },
});