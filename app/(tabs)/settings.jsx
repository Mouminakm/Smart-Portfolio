// app/(tabs)/settings.jsx
// Profile & Settings — the account hub (spec S2). Now a tab.

import { ScrollView, StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import SettingsRow from "../../components/SettingsRow"; // ../../ to climb out of (tabs)
import { useAuth } from "../../contexts/AuthContext"; // sign out function



export default function SettingsScreen() {
  const { signOut } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeading}>Specialty & training</Text>
      <SettingsRow label="Discipline" value="Surgical" />
      <SettingsRow label="Specialty" value="Trauma & Orthopaedics" />
      <SettingsRow label="Training level" value="ST3" />
      <SettingsRow label="Curriculum" value="JCST 2021" />

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

      <View style={{ marginTop: 28 }}>
        <AppButton onPress={signOut}>Sign out</AppButton>
      </View>
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