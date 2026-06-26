// app/(tabs)/settings.jsx
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import SettingsRow from "../../components/SettingsRow";
import { useAuth } from "../../contexts/AuthContext";
import { loadProfile } from "../../profile";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        if (user) {
          const data = await loadProfile(user.uid);
          setProfile(data);
        }
      }
      load();
    }, [user])
  );

  function show(value) {
    return value ? value : "Not set";
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.editWrap}>
        <AppButton onPress={() => router.push("/edit-profile")}>Edit profile</AppButton>
      </View>

      <Text style={styles.sectionHeading}>Specialty & training</Text>
      <SettingsRow label="Specialty" value={show(profile && profile.specialty)} />
      <SettingsRow
        label="Consultants"
        value={show(profile && profile.consultants && profile.consultants.join(", "))}
      />
      <SettingsRow
        label="Hospital(s)"
        value={show(
          profile &&
            profile.hospitals &&
            profile.hospitals.map((h) => h.display || h.short || h.name).join(", ")
        )}
      />

      <Text style={styles.sectionHeading}>Portfolio</Text>
      <SettingsRow
        label="Platform(s)"
        value={show(profile && profile.portfolios && profile.portfolios.join(", "))}
      />

      <Text style={styles.sectionHeading}>Subscription</Text>
      <SettingsRow label="Plan" value="Free trial" />

      <Text style={styles.sectionHeading}>Account</Text>
      <SettingsRow label="Email" value={show(user && user.email)} />
      <SettingsRow label="GMC number" value={show(profile && profile.gmcNumber)} />
      <SettingsRow label="Training number (NTN)" value={show(profile && profile.trainingNumber)} />

      <Text style={styles.sectionHeading}>Privacy & data</Text>
      <SettingsRow label="Data consent" value="Granted" />
      <SettingsRow label="Delete my data" value="" />

      <Text style={styles.sectionHeading}>Preferences</Text>
      <SettingsRow
        label="Reflection detail"
        value={(profile && profile.reflectionDetail) || "Low"}
      />
      <SettingsRow label="Notifications" value="On" />
      
      <View style={styles.signOutWrap}>
        <AppButton onPress={signOut}>Sign out</AppButton>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 24, paddingBottom: 40 },
  editWrap: { marginBottom: 8 },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 4,
  },
  signOutWrap: { marginTop: 28 },
});