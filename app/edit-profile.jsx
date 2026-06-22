// app/edit-profile.jsx
// Edit the signed-in user's saved profile: specialty, platforms, GMC number,
// reflection detail. Pre-fills from Firestore, saves back, returns to Settings.

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
import AppButton from "../components/AppButton";
import MultiPickerField from "../components/MultiPickerField";
import PickerField from "../components/PickerField";
import { useAuth } from "../contexts/AuthContext";
import { UK_PORTFOLIOS } from "../data/portfolios";
import { UK_SPECIALTIES } from "../data/specialties";
import { loadProfile, saveProfile } from "../profile";

const REFLECTION_LEVELS = ["Low", "Medium"];

export default function EditProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // Editable copies of the saved values, seeded from Firestore below.
  const [specialty, setSpecialty] = useState("");
  const [portfolios, setPortfolios] = useState([]);
  const [gmcNumber, setGmcNumber] = useState("");
  const [reflectionDetail, setReflectionDetail] = useState("Low");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load the saved profile once, then copy its values into the editors so they
  // start on what's stored, not blank. (|| fallbacks handle missing fields.)
  useEffect(() => {
    async function load() {
      if (user) {
        const p = await loadProfile(user.uid);
        if (p) {
          setSpecialty(p.specialty || "");
          setPortfolios(p.portfolios || []);
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
    setErrorMessage("");
    setIsSaving(true);
    try {
      // merge:true (in saveProfile) leaves other fields — training number,
      // the onboarding flag — untouched.
      await saveProfile(user.uid, { specialty, portfolios, gmcNumber, reflectionDetail });
      router.back(); // return to Settings, which reloads and shows the changes
    } catch (error) {
      setIsSaving(false);
      setErrorMessage("Couldn't save. Check your connection and try again.");
    }
  }

  // Spinner while fetching, so the editors don't flash empty values first.
  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <PickerField
          label="Specialty / training programme"
          placeholder="Select your specialty"
          options={UK_SPECIALTIES}
          value={specialty}
          onSelect={setSpecialty}
        />

        <MultiPickerField
          label="Portfolio platform(s)"
          placeholder="Select up to two"
          options={UK_PORTFOLIOS}
          selected={portfolios}
          onChange={setPortfolios}
          maxSelect={2}
        />

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
          placeholderTextColor="#aaaaaa"
          keyboardType="number-pad"
          value={gmcNumber}
          onChangeText={setGmcNumber}
        />

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <AppButton onPress={handleSave}>
          {isSaving ? "Saving…" : "Save changes"}
        </AppButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#ffffff" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" },
  container: { flexGrow: 1, padding: 24, paddingTop: 32, backgroundColor: "#ffffff" },
  label: { fontSize: 13, fontWeight: "600", color: "#1a1a1a", marginBottom: 6, marginTop: 4 },
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