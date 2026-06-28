// app/edit-profile.jsx
// Edit the signed-in user's saved profile. Restyled to the navy/teal design
// system (grouped SmartCards under a NavyHeader). Logic, fields, load/save and
// validation are unchanged.

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PrimaryButton } from "../components/Buttons";
import ConsultantListField from "../components/ConsultantListField";
import HospitalPickerField from "../components/HospitalPickerField";
import MultiPickerField from "../components/MultiPickerField";
import NavyHeader from "../components/NavyHeader";
import PickerField from "../components/PickerField";
import SmartCard from "../components/SmartCard";
import { useAuth } from "../contexts/AuthContext";
import { UK_PORTFOLIOS } from "../data/portfolios";
import { UK_SPECIALTIES } from "../data/specialties";
import { loadProfile, saveProfile } from "../profile";
import { colors, radius, spacing } from "../theme/theme";

const REFLECTION_LEVELS = ["Low", "Medium"];

export default function EditProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [specialty, setSpecialty] = useState("");
  const [portfolios, setPortfolios] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [gmcNumber, setGmcNumber] = useState("");
  const [reflectionDetail, setReflectionDetail] = useState("Low");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function load() {
      if (user) {
        const p = await loadProfile(user.uid);
        if (p) {
          setSpecialty(p.specialty || "");
          setPortfolios(p.portfolios || []);
          setConsultants(p.consultants || []);
          setHospitals(p.hospitals || []);
          setGmcNumber(p.gmcNumber || "");
          setReflectionDetail(p.reflectionDetail || "Low");
        }
      }
      setIsLoading(false);
    }
    load();
  }, [user]);

  async function handleSave() {
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
    setIsSaving(true);
    try {
      await saveProfile(user.uid, { specialty, portfolios, consultants, hospitals, gmcNumber, reflectionDetail });
      router.back();
    } catch (error) {
      setIsSaving(false);
      setErrorMessage("Couldn't save. Check your connection and try again.");
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.teal} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <NavyHeader title="Edit profile" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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
              one — we'll fill the correct hospital automatically. Update these when you rotate.
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

          <Text style={styles.sectionHeading}>Preferences & account</Text>
          <SmartCard style={styles.sectionCard}>
            <PickerField
              label="Reflection detail"
              placeholder="Select a level"
              options={REFLECTION_LEVELS}
              value={reflectionDetail}
              onSelect={setReflectionDetail}
            />
            <Text style={styles.label}>GMC number (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="7-digit number"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={gmcNumber}
              onChangeText={setGmcNumber}
            />
          </SmartCard>

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          <PrimaryButton onPress={handleSave} style={styles.saveBtn}>
            {isSaving ? "Saving…" : "Save changes"}
          </PrimaryButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xxxl },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionCard: { padding: spacing.lg, marginBottom: spacing.xs },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6, marginTop: 4 },
  helpText: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm, lineHeight: 17 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
  },
  error: { color: colors.error, fontSize: 14, marginVertical: spacing.md, textAlign: "center" },
  saveBtn: { marginTop: spacing.lg },
});