// app/(tabs)/settings.jsx
// Profile & Settings (spec S2). Now LOADS the signed-in user's saved profile
// from Firestore and shows their real GMC / training number.

import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import SettingsRow from "../../components/SettingsRow";
import { useAuth } from "../../contexts/AuthContext";
import { loadProfile } from "../../profile";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null); // saved profile, once loaded

  // Load this user's profile once, when the screen first appears.
  useEffect(() => {
    async function load() {
      if (user) {
        const data = await loadProfile(user.uid);
        setProfile(data); // null if they haven't saved one yet
      }
    }
    load();
  }, [user]); // re-run if the user changes

  // Small helper: show the saved value, or a fallback if not set/loaded yet.
  function show(value) {
    return value ? value : "Not set";
  }

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
      {/* The user's email comes straight from their auth account. */}
      <SettingsRow label="Email" value={show(user && user.email)} />
      {/* These two now come from the saved profile in Firestore. */}
      <SettingsRow label="GMC number" value={show(profile && profile.gmcNumber)} />
      <SettingsRow
        label="Training number (NTN)"
        value={show(profile && profile.trainingNumber)}
      />

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