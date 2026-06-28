// app/profile-setup.jsx
// Onboarding screen 3 — Profile setup (spec S1). Restyled to the navy/teal
// identity (grouped SmartCards). Logic, fields, validation and navigation
// unchanged.

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { PrimaryButton } from "../components/Buttons";
import ConsultantListField from "../components/ConsultantListField";
import HospitalPickerField from "../components/HospitalPickerField";
import MultiPickerField from "../components/MultiPickerField";
import PickerField from "../components/PickerField";
import SmartCard from "../components/SmartCard";
import { useAuth } from "../contexts/AuthContext";
import { UK_PORTFOLIOS } from "../data/portfolios";
import { UK_SPECIALTIES } from "../data/specialties";
import { saveProfile } from "../profile";
import { colors, radius, spacing } from "../theme/theme";

export default function ProfileSetupScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [specialty, setSpecialty] = useState("");
  const [portfolios, setPortfolios] = useState([]);
  const [gmcNumber, setGmcNumber] = useState("");
  const [trainingNumber, setTrainingNumber] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [consultants, setConsultants] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  async function handleContinue() {
    if (!specialty) {
      setErrorMessage("Please choose your specialty.");
      return;
    }
    if (portfolios.length === 0) {
      setErrorMessage("Please choose at least one portfolio platform.");
      return;
    }
    if (consultants.length === 0) {
      setErrorMessage("Please add at least one consultant you work with.");
      return;
    }
    setErrorMessage("");
    setIsBusy(true);
    try {
      if (user) {
        await saveProfile(user.uid, { specialty, portfolios, gmcNumber, trainingNumber, consultants, hospitals });
      }
      router.push("/permissions");
    } catch (error) {
      router.push("/permissions");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Set up your profile</Text>
        <Text style={styles.subtitle}>
          This tells the app which entry types and fields apply to you.
        </Text>

        <Text style={styles.sectionHeading}>Specialty & training</Text>
        <SmartCard style={styles.sectionCard}>
          <PickerField
            label="Specialty / training programme"
            placeholder="Select your specialty"
            options={UK_SPECIALTIES}
            value={specialty}
            onSelect={setSpecialty}
          />
          <ConsultantListField
            label="Consultants you work with"
            value={consultants}
            onChange={setConsultants}
          />
        </SmartCard>

        <Text style={styles.sectionHeading}>Hospitals</Text>
        <SmartCard style={styles.sectionCard}>
          <Text style={styles.label}>Your hospital(s)</Text>
          <Text style={styles.helpText}>
            Add the hospital(s) where you operate. When you dictate, just say which
            one — entries fill the correct hospital automatically.
          </Text>
          <HospitalPickerField value={hospitals} onChange={setHospitals} />
        </SmartCard>

        <Text style={styles.sectionHeading}>Portfolio</Text>
        <SmartCard style={styles.sectionCard}>
          <MultiPickerField
            label="Portfolio platform(s)"
            placeholder="Select up to two"
            options={UK_PORTFOLIOS}
            selected={portfolios}
            onChange={setPortfolios}
            maxSelect={2}
          />
        </SmartCard>

        <Text style={styles.sectionHeading}>Account (optional)</Text>
        <SmartCard style={styles.sectionCard}>
          <Text style={styles.label}>GMC number</Text>
          <TextInput
            style={styles.input}
            placeholder="7-digit number"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            value={gmcNumber}
            onChangeText={setGmcNumber}
          />
          <Text style={styles.label}>Training number / NTN</Text>
          <TextInput
            style={styles.input}
            placeholder="Your national training number"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            value={trainingNumber}
            onChangeText={setTrainingNumber}
          />
        </SmartCard>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <PrimaryButton onPress={handleContinue} style={styles.continueBtn}>
          {isBusy ? "Saving…" : "Continue"}
        </PrimaryButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: spacing.xxl, paddingTop: spacing.xxxl + spacing.xl },
  title: { fontSize: 28, fontWeight: "700", color: colors.text, textAlign: "center" },
  subtitle: {
    fontSize: 15, color: colors.textSecondary, textAlign: "center",
    lineHeight: 22, marginTop: spacing.md, marginBottom: spacing.xl,
  },
  sectionHeading: {
    fontSize: 12, fontWeight: "700", color: colors.textSecondary,
    textTransform: "uppercase", letterSpacing: 1,
    marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  sectionCard: { padding: spacing.lg, marginBottom: spacing.xs },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6, marginTop: 4 },
  helpText: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm, lineHeight: 17 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    fontSize: 16, color: colors.text, marginBottom: spacing.md,
    backgroundColor: colors.card,
  },
  error: { color: colors.error, fontSize: 14, marginVertical: spacing.md, textAlign: "center" },
  continueBtn: { marginTop: spacing.lg },
});