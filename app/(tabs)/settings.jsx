// app/(tabs)/settings.jsx
// Settings — restyled to the navy/teal design system. Grouped into SmartCard
// sections under a NavyHeader. Logic, data, and actions unchanged.

import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton, SecondaryButton } from "../../components/Buttons";
import NavyHeader from "../../components/NavyHeader";
import SettingsRow from "../../components/SettingsRow";
import SmartCard from "../../components/SmartCard";
import { useAuth } from "../../contexts/AuthContext";
import { loadProfile } from "../../profile";
import { colors, spacing } from "../../theme/theme";

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
    <View style={styles.container}>
      <NavyHeader title="Settings" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.editWrap}>
          <PrimaryButton onPress={() => router.push("/edit-profile")}>Edit profile</PrimaryButton>
        </View>

        <Text style={styles.sectionHeading}>Specialty & training</Text>
        <SmartCard style={styles.sectionCard}>
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
        </SmartCard>

        <Text style={styles.sectionHeading}>Portfolio</Text>
        <SmartCard style={styles.sectionCard}>
          <SettingsRow
            label="Platform(s)"
            value={show(profile && profile.portfolios && profile.portfolios.join(", "))}
          />
        </SmartCard>

        <Text style={styles.sectionHeading}>Subscription</Text>
        <SmartCard style={styles.sectionCard}>
          <SettingsRow label="Plan" value="Free trial" />
        </SmartCard>

        <Text style={styles.sectionHeading}>Account</Text>
        <SmartCard style={styles.sectionCard}>
          <SettingsRow label="Email" value={show(user && user.email)} />
          <SettingsRow label="GMC number" value={show(profile && profile.gmcNumber)} />
          <SettingsRow label="Training number (NTN)" value={show(profile && profile.trainingNumber)} />
        </SmartCard>

        <Text style={styles.sectionHeading}>Privacy & data</Text>
        <SmartCard style={styles.sectionCard}>
          <SettingsRow label="Data consent" value="Granted" />
          <SettingsRow label="Delete my data" value="" />
        </SmartCard>

        <Text style={styles.sectionHeading}>Preferences</Text>
        <SmartCard style={styles.sectionCard}>
          <SettingsRow label="Reflection detail" value={(profile && profile.reflectionDetail) || "Low"} />
          <SettingsRow label="Notifications" value="On" />
        </SmartCard>

        <View style={styles.signOutWrap}>
          <SecondaryButton onPress={signOut}>Sign out</SecondaryButton>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xxl, paddingBottom: spacing.xxxl },
  editWrap: { marginBottom: spacing.sm, marginTop: spacing.xs },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  sectionCard: { padding: spacing.sm },
  signOutWrap: { marginTop: spacing.xxl },
});