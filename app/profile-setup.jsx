// app/profile-setup.jsx
// Onboarding screen 3 — Profile setup (spec S1).
// Now built from the reusable <ProfileField> component.

import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
// Import our component. "../" climbs up out of app/ to the project root,
// then into components/. No ".jsx" on the end — it's added automatically.
import ProfileField from "../components/ProfileField";

export default function ProfileSetupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your profile</Text>
      <Text style={styles.subtitle}>
        This tells the app which entry types and fields apply to you.
      </Text>

      {/* Same component each time; different text passed in through props.
          Compare this to the five long blocks we had before. */}
      <ProfileField label="Discipline" placeholder="Medical or Surgical" />
      <ProfileField
        label="Specialty / training programme"
        placeholder="e.g. Trauma & Orthopaedics"
      />
      <ProfileField label="Portfolio platform" placeholder="e.g. eLogbook + ISCP" />
      <ProfileField label="GMC number (optional)" placeholder="7-digit number" />
      <ProfileField
        label="Training number / NTN (optional)"
        placeholder="Your national training number"
      />

      <Link href="/permissions" style={styles.button}>
        Continue
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#1a1a1a", textAlign: "center" },
  subtitle: {
    fontSize: 16,
    color: "#555555",
    textAlign: "center",
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 28,
  },
  // The field styles now live in ProfileField.jsx, so they're gone from here.
  button: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 14,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 20,
  },
});