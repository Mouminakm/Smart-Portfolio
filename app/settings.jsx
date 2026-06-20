// app/settings.jsx
// Profile & Settings — the account hub (spec S2).
// Static shell: values are placeholders; each section becomes real across
// Phases 3–8. Built from the reusable <SettingsRow> component.

import { ScrollView, StyleSheet, Text } from "react-native";
import SettingsRow from "../components/SettingsRow";

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Specialty drives which entry types and fields the app shows (S2). */}
      <Text style={styles.sectionHeading}>Specialty & training</Text>
      <SettingsRow label="Discipline" value="Surgical" />
      <SettingsRow label="Specialty" value="Trauma & Orthopaedics" />
      <SettingsRow label="Training level" value="ST3" />
      <SettingsRow label="Curriculum" value="JCST 2021" />

      {/* The chosen platform sets the submission target and field schema. */}
      <Text style={styles.sectionHeading}>Portfolio</Text>
      <SettingsRow label="Platform(s)" value="eLogbook + ISCP" />

      <Text style={styles.sectionHeading}>Subscription</Text>
      <SettingsRow label="Plan" value="Free trial" />

      <Text style={styles.sectionHeading}>Account</Text>
      <SettingsRow label="Name" value="Not set" />
      <SettingsRow label="Signed in with" value="Google" />
      <SettingsRow label="GMC number" value="Not set" />
      <SettingsRow label="Training number (NTN)" value="Not set" />

      <Text style={styles.sectionHeading}>Privacy & data</Text>
      <SettingsRow label="Data consent" value="Granted" />
      <SettingsRow label="Delete my data" value="" />

      <Text style={styles.sectionHeading}>Preferences</Text>
      <SettingsRow label="Reflection detail" value="Low" />
      <SettingsRow label="Notifications" value="On" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 24, paddingBottom: 40 },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 4,
  },
});