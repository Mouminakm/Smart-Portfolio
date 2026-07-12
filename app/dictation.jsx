// app/dictation.jsx
// Core loop screen — Dictation (spec S3). Restyled to the navy/teal clinical
// design system. ALL logic unchanged: recording, hold-to-finish, transcribe ->
// parse, patient-field exclusions, options hint, consultant exception.
// Tap = record; hold 1s = finish.

import { Ionicons } from "@expo/vector-icons";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { File } from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/Buttons";
import NavyHeader from "../components/NavyHeader";
import SmartCard from "../components/SmartCard";
import { useAuth } from "../contexts/AuthContext";
import { useEntry } from "../contexts/EntryContext";
import { PATIENT_IDENTIFIER_FIELDS } from "../lib/patientFields";
import { getPlatformAdapter } from "../platforms";
import { loadProfile } from "../profile";
import { colors, radius, spacing, type } from "../theme/theme";

const HOLD_DURATION = 1000; // milliseconds you must hold to finish

const TRANSCRIBE_URL = "https://europe-west2-smart-portfolio-d9c94.cloudfunctions.net/transcribe";
const PARSE_URL = "https://europe-west2-smart-portfolio-d9c94.cloudfunctions.net/parse";

export default function DictationScreen() {
  const router = useRouter();
  // Read which platform/entry type was tapped on Home. For eLogbook's Operation
  // log these are undefined, so everything below falls back to the old behaviour.
  const { platform, entryType } = useLocalSearchParams();
  const { user } = useAuth();
  const { setTranscript, setFieldValues, setConfirmed, resetEntry } = useEntry();
  const [consultants, setConsultants] = useState([]);

  const [status, setStatus] = useState("paused"); // "recording" | "paused" | "finished"
  const [isHolding, setIsHolding] = useState(false);
  const [processing, setProcessing] = useState("");
  const [ready, setReady] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  useEffect(() => {
    resetEntry();
  }, []);

  const [userSpecialty, setUserSpecialty] = useState("");

  useEffect(() => {
    async function load() {
      if (user) {
        const p = await loadProfile(user.uid);
        setConsultants((p && p.consultants) || []);
        setUserSpecialty((p && p.specialty) || "");
      }
    }
    load();
  }, [user]);

  // Ask the platform's adapter for the schema. Each adapter knows how ITS
  // platform is keyed — eLogbook by specialty, ISCP/Turas by entry type — so
  // this screen doesn't need to know. Missing platform falls back to eLogbook.
  const adapter = getPlatformAdapter(platform);
  const schema = adapter.getSchema({ specialty: userSpecialty, entryType });



  // ---- Recording pulse ----
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (status === "recording" && !isHolding) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(0);
    }
  }, [status, isHolding]);
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  // ---- Hold-to-finish ----
  const holdProgress = useRef(new Animated.Value(0)).current;
  const holdCompleted = useRef(false);

  function startHold() {
    if (status === "finished") return;
    holdCompleted.current = false;
    setIsHolding(true);
    holdProgress.setValue(0);
    Animated.timing(holdProgress, { toValue: 1, duration: HOLD_DURATION, useNativeDriver: true }).start(({ finished }) => {
      if (finished) {
        holdCompleted.current = true;
        setIsHolding(false);
        finishRecording();
      }
    });
  }

  function endHold() {
    if (status === "finished") return;
    if (holdCompleted.current) return;
    holdProgress.stopAnimation();
    Animated.timing(holdProgress, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    setIsHolding(false);
    startRecording();
  }

  async function startRecording() {
    if (status === "recording") return;
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setProcessing("Microphone permission denied. Enable it in your phone settings.");
      return;
    }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    try {
      if (recorderState.isRecording) await recorder.stop();
    } catch (e) {}
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStatus("recording");
    } catch (e) {
      setProcessing("Couldn't start recording. Try again.");
    }
  }

  async function finishRecording() {
    setStatus("finished");
    try {
      // Get the signed-in user's Firebase ID token — the short-lived "pass"
      // that proves this is a real signed-in user. We send it with each backend
      // call so the Cloud Functions can verify who's calling.
      const token = user ? await user.getIdToken() : null;
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setProcessing("No audio was captured. Go back and try again.");
        return;
      }
      setProcessing("Transcribing your dictation…");
      const base64Audio = await new File(uri).base64();
      const tRes = await fetch(TRANSCRIBE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ audioBase64: base64Audio, mimeType: "audio/m4a", specialty: userSpecialty }),
      });
      const tData = await tRes.json();
      if (tData.transcript === undefined) {
        setProcessing("Transcription failed: " + (tData.error || "unknown"));
        return;
      }
      const transcriptText = tData.transcript || "";
      setTranscript(transcriptText);

      setProcessing("Extracting fields…");
      const fieldsForClaude = schema.fields
        .filter((f) => !f.appOnly && f.submitsToPlatform !== false && !PATIENT_IDENTIFIER_FIELDS.includes(f.id))
        .map((f) => ({ id: f.id, label: f.label, inputType: f.inputType, options: f.options || undefined }));
      // Procedure names help Claude match a spoken procedure to the real list.
      // Only some platforms have a catalogue (eLogbook does; ISCP doesn't), so
      // we ask the adapter and default to none.
      const procedureNames = adapter.getProcedureNames
        ? adapter.getProcedureNames({ specialty: userSpecialty })
        : [];
      const pRes = await fetch(PARSE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ transcript: transcriptText, fields: fieldsForClaude, procedureNames, consultantNames: consultants }),
      });
      const pData = await pRes.json();
      if (!pData.fields) {
        setProcessing("Field extraction failed: " + (pData.error || "unknown"));
        return;
      }
      const seeded = {};
      const seededTicks = {};
      schema.fields.forEach((f) => {
        const value = pData.fields[f.id] || "";
        seeded[f.id] = value;
        if (value !== "") seededTicks[f.id] = true;
      });
      setFieldValues(seeded);
      setConfirmed(seededTicks);
      setProcessing("");
      setReady(true);
    } catch (e) {
      setProcessing("Something went wrong: " + e.message);
    }
  }

  const buttonScale = holdProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });
  const chargeScale = holdProgress.interpolate({ inputRange: [0, 1], outputRange: [1.15, 1.6] });
  const chargeOpacity = holdProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  let hint = "Tap to record · hold to finish";
  if (isHolding) hint = "Keep holding to finish…";
  else if (status === "recording") hint = "Recording — hold to finish";

  function FieldRow({ field }) {
    const optionsHint =
      field.options && field.options.length && field.id !== "responsibleconsultant"
        ? field.options.map((o) => o.label.split(":")[0].trim()).join(" · ")
        : null;
    return (
      <View style={styles.fieldRow}>
        <View style={styles.pendingCircle} />
        <View style={styles.fieldTextWrap}>
          <Text style={styles.fieldText}>
            {field.label}
            {field.required ? <Text style={styles.required}> *</Text> : null}
          </Text>
          {optionsHint && <Text style={styles.optionsHint}>{optionsHint}</Text>}
        </View>
      </View>
    );
  }

  if (!schema || !Array.isArray(schema.fields)) {
    return (
      <View style={styles.container}>
        <NavyHeader title="Dictation" />
        <View style={styles.notReadyWrap}>
          <Text style={styles.notReadyText}>
            Dictation for your specialty isn't available yet. It's coming soon.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavyHeader title="Dictation" pill={schema.label || "Operation log"} />

      {/* ===== TOP: checklist ===== */}
      <View style={styles.checklistArea}>
      <ScrollView contentContainerStyle={styles.checklistContent}>
      {/* Patient-data notice (InfoBanner style) */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={18} color={colors.navy} style={{ marginRight: spacing.sm, marginTop: 1 }} />
            <Text style={styles.infoText}>
              Patient identifiers are never recorded. If your portfolio needs them, enter them
              directly on {adapter.displayName} at the submission step.
            </Text>
          </View>

          <Text style={styles.checklistTitle}>Checklist</Text>
          <SmartCard style={styles.checklistCard}>
            {schema.fields
              .filter(
                (field) =>
                  !PATIENT_IDENTIFIER_FIELDS.includes(field.id) &&
                  field.id !== "operationspecialty" &&
                  !field.appOnly
              )
              .map((field) => (
                <FieldRow key={field.id} field={field} />
              ))}
          </SmartCard>
        </ScrollView>
      </View>

      {/* ===== BOTTOM: record control ===== */}
      <View style={styles.controlArea}>
        {processing ? (
          <Text style={styles.doneText}>{processing}</Text>
        ) : ready ? (
          <>
            <View style={styles.readyRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.readyText}>Ready to fill {adapter.displayName}</Text>
            </View>
            <PrimaryButton
             href={{ pathname: "/submission", params: { platform: platform || "elogbook", entryType: entryType || undefined } }}
            style={{ paddingHorizontal: 40 }}
            >
              Open in {adapter.displayName}
            </PrimaryButton>
          </>
        ) : (
          <>
            <View style={styles.recordWrap}>
              <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
              <Animated.View style={[styles.chargeRing, { transform: [{ scale: chargeScale }], opacity: chargeOpacity }]} />
              <Pressable onPressIn={startHold} onPressOut={endHold}>
                <Animated.View
                  style={[
                    styles.recordButton,
                    status === "recording" && styles.recordButtonActive,
                    { transform: [{ scale: buttonScale }] },
                  ]}
                >
                  <Ionicons
                    name={status === "recording" ? "stop" : "mic"}
                    size={36}
                    color={colors.onNavy}
                  />
                </Animated.View>
              </Pressable>
            </View>
            <Text style={styles.controlHint}>{hint}</Text>
            {status !== "recording" && !isHolding ? (
              <Text style={styles.controlCaption}>
                Speak naturally to fill the fields above. Items marked
                <Text style={styles.required}> *</Text> are required. You'll review
                and submit everything on {adapter.displayName}.
              </Text>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  notReadyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl },
  notReadyText: { ...type.body, color: colors.textSecondary, textAlign: "center" },

  checklistArea: { flex: 2 },
  checklistContent: { padding: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.lg },

  explainer: { ...type.helper, lineHeight: 19, marginBottom: spacing.lg },
  required: { color: colors.error, fontWeight: "700" },

  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  infoText: { flex: 1, fontSize: 13, color: colors.navy, lineHeight: 18 },

  checklistTitle: { ...type.cardTitle, marginBottom: spacing.md },
  checklistCard: { padding: spacing.lg },

  fieldRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.lg },
  pendingCircle: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: colors.border,
    marginRight: spacing.md, marginTop: 2,
  },
  fieldTextWrap: { flex: 1 },
  fieldText: { ...type.body },
  optionsHint: { fontSize: 11, color: colors.textMuted, marginTop: 3, lineHeight: 15 },

  controlArea: {
    flex: 1, alignItems: "center", justifyContent: "center",
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.card,
  },
  recordWrap: { width: 88, height: 88, alignItems: "center", justifyContent: "center" },
  pulseRing: { position: "absolute", width: 88, height: 88, borderRadius: 44, backgroundColor: colors.teal },
  chargeRing: { position: "absolute", width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: colors.teal, backgroundColor: "transparent" },
  recordButton: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.teal, alignItems: "center", justifyContent: "center" },
  recordButtonActive: { backgroundColor: colors.recording },
  controlHint: { ...type.helper, marginTop: spacing.lg, textAlign: "center" },
  controlCaption: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 17,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  doneText: { ...type.cardTitle, marginBottom: spacing.lg, textAlign: "center" },
  readyRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.lg },
  readyText: { ...type.cardTitle, color: colors.success, marginLeft: spacing.sm },
});