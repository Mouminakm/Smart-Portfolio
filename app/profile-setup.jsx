// app/profile-setup.jsx
// Onboarding screen 3 — Profile setup (spec S1).
// Specialty (single picker) + portfolios (multi-select, up to two) + GMC/training.

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
import AppButton from "../components/AppButton";
import ConsultantListField from "../components/ConsultantListField";
import HospitalPickerField from "../components/HospitalPickerField";
import MultiPickerField from "../components/MultiPickerField";
import PickerField from "../components/PickerField";
import { useAuth } from "../contexts/AuthContext";
import { UK_PORTFOLIOS } from "../data/portfolios";
import { UK_SPECIALTIES } from "../data/specialties";
import { saveProfile } from "../profile";

export default function ProfileSetupScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [specialty, setSpecialty] = useState("");
  const [portfolios, setPortfolios] = useState([]); // an array — up to two platforms
  const [gmcNumber, setGmcNumber] = useState("");
  const [trainingNumber, setTrainingNumber] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [consultants, setConsultants] = useState([]); // names of consultants the user works with
  const [hospitals, setHospitals] = useState([]); // hospitals the user operates at
async function handleContinue() {
    // Required fields must be set before continuing.
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
      router.push("/permissions"); // don't trap them if the save fails
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

        {/* Specialty — single-choice picker from the UK list. */}
        <PickerField
          label="Specialty / training programme"
          placeholder="Select your specialty"
          options={UK_SPECIALTIES}
          value={specialty}
          onSelect={setSpecialty}
        />

        {/* Portfolio — multi-select, up to two platforms. */}
        <MultiPickerField
          label="Portfolio platform(s)"
          placeholder="Select up to two"
          options={UK_PORTFOLIOS}
          selected={portfolios}
          onChange={setPortfolios}
          maxSelect={2}
        />
        {/* Consultants the user works with — at least one required. */}
        <ConsultantListField
          label="Consultants you work with"
          value={consultants}
          onChange={setConsultants}
        />
        {/* Hospital(s) the user operates at — picked from the eLogbook list so
            entries auto-fill the correct hospital. */}
        <Text style={styles.label}>Your hospital(s)</Text>
        <Text style={styles.helpText}>
          Add the hospital(s) where you operate. When you dictate, just say which
          one — entries fill the correct hospital automatically.
        </Text>
        <HospitalPickerField value={hospitals} onChange={setHospitals} />
        <Text style={styles.label}>GMC number (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="7-digit number"
          placeholderTextColor="#aaaaaa"
          keyboardType="number-pad"
          value={gmcNumber}
          onChangeText={setGmcNumber}
        />

        <Text style={styles.label}>Training number / NTN (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Your national training number"
          placeholderTextColor="#aaaaaa"
          autoCapitalize="characters"
          value={trainingNumber}
          onChangeText={setTrainingNumber}
        />

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <AppButton onPress={handleContinue}>
          {isBusy ? "Saving…" : "Continue"}
        </AppButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#ffffff" },
  container: { flexGrow: 1, padding: 24, paddingTop: 60, backgroundColor: "#ffffff" },
  title: { fontSize: 28, fontWeight: "bold", color: "#1a1a1a", textAlign: "center" },
  subtitle: {
    fontSize: 16,
    color: "#555555",
    textAlign: "center",
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 28,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#1a1a1a", marginBottom: 6, marginTop: 4 },
  helpText: { fontSize: 12, color: "#888888", marginBottom: 8, lineHeight: 17 },
  input: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#1a1a1a",
    marginBottom: 18,
  },
  error: { color: "#dc2626", fontSize: 14, marginBottom: 14, textAlign: "center" },
});