// app/dictation.jsx
// Core loop screen — Dictation (spec S3).
// Checklist rendered from the schema (visual). The record button now really
// records; finishing runs transcribe -> parse, saves into the shared entry
// context, and routes to Review. Tap = record/pause; hold 1s = finish.

import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { File } from "expo-file-system";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AppButton from "../components/AppButton";
import { useAuth } from "../contexts/AuthContext";
import { useEntry } from "../contexts/EntryContext";
import { loadProfile } from "../profile";
import schema from "../schemas/elogbook_neurosurgery_operation_log.json";
import procedureData from "../schemas/elogbook_neurosurgery_procedures.json";

const HOLD_DURATION = 1000; // milliseconds you must hold to finish

// Backend URLs (same ones the test screen uses).
const TRANSCRIBE_URL = "https://europe-west2-smart-portfolio-d9c94.cloudfunctions.net/transcribe";
const PARSE_URL = "https://europe-west2-smart-portfolio-d9c94.cloudfunctions.net/parse";

export default function DictationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTranscript, setFieldValues, setConfirmed, resetEntry } = useEntry();
  const [consultants, setConsultants] = useState([]); // user's own consultant names

  const [status, setStatus] = useState("paused"); // "recording" | "paused" | "finished"
  const [isHolding, setIsHolding] = useState(false);
  const [processing, setProcessing] = useState(""); // "" | a progress message
  const [ready, setReady] = useState(false);        // true once fields are parsed

  // ---- Real audio recorder ----
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  // Start a fresh entry whenever this screen first opens.
  useEffect(() => {
    resetEntry();
  }, []);

  // Load the user's saved consultants so we can let Claude pick from them.
  useEffect(() => {
    async function load() {
      if (user) {
        const p = await loadProfile(user.uid);
        setConsultants((p && p.consultants) || []);
      }
    }
    load();
  }, [user]);

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
    Animated.timing(holdProgress, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        holdCompleted.current = true;
        setIsHolding(false);
        finishRecording(); // <-- real finish: stop, transcribe, parse
      }
    });
  }

  function endHold() {
    if (status === "finished") return;
    if (holdCompleted.current) return;
    holdProgress.stopAnimation();
    Animated.timing(holdProgress, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    setIsHolding(false);
    startRecording(); // tap starts recording; hold finishes
  }

 // Start recording. (No pause in the MVP — the user holds to finish.)
 async function startRecording() {
  if (status === "recording") return; // already recording; ignore taps
  const permission = await AudioModule.requestRecordingPermissionsAsync();
  if (!permission.granted) {
    setProcessing("Microphone permission denied. Enable it in your phone settings.");
    return;
  }
  await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });

  // Prepare fresh, then record (the documented expo-audio flow). If a prior
  // session left the recorder running, stop it first so prepare won't throw.
  try {
    if (recorderState.isRecording) {
      await recorder.stop();
    }
  } catch (e) {
    // not recording — fine
  }
  try {
    await recorder.prepareToRecordAsync();
    recorder.record();
    setStatus("recording");
  } catch (e) {
    setProcessing("Couldn't start recording. Try again.");
  }
}

  // Finish: stop the mic, then transcribe and parse, then go to Review.
  async function finishRecording() {
    setStatus("finished");
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setProcessing("No audio was captured. Go back and try again.");
        return;
      }

      // 1) Transcribe
      setProcessing("Transcribing your dictation…");
      const base64Audio = await new File(uri).base64();
      const tRes = await fetch(TRANSCRIBE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64: base64Audio, mimeType: "audio/m4a" }),
      });
      const tData = await tRes.json();
      if (tData.transcript === undefined) {
        setProcessing("Transcription failed: " + (tData.error || "unknown"));
        return;
      }
      const transcriptText = tData.transcript || "";
      setTranscript(transcriptText);

      // 2) Parse into fields
      setProcessing("Extracting fields…");
      // Send the FULL field definitions (including options + inputType) so the
      // parse function can tell Claude the exact allowed values per field.
      // Skip app-only fields (not real platform fields) to keep the prompt tight.
      const fieldsForClaude = schema.fields
        .filter((f) => !f.appOnly && f.submitsToPlatform !== false)
        .map((f) => ({
          id: f.id,
          label: f.label,
          inputType: f.inputType,
          options: f.options || undefined,
        }));
      // Send the procedure name list too, so Claude can pick EXACTLY one from
      // it (more robust than string-matching transcription variations).
      const procedureNames = (procedureData.procedures || []).map((p) => p.name);
      const pRes = await fetch(PARSE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptText,
          fields: fieldsForClaude,
          procedureNames: procedureNames,
          consultantNames: consultants,
        }),
      });
      const pData = await pRes.json();
      if (!pData.fields) {
        setProcessing("Field extraction failed: " + (pData.error || "unknown"));
        return;
      }

      // 3) Seed the shared entry: values + tick anything that came back filled.
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

  const buttonScale = holdProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const chargeScale = holdProgress.interpolate({ inputRange: [0, 1], outputRange: [1.15, 1.75] });
  const chargeOpacity = holdProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  let hint = "Tap to record · hold to finish";
  if (isHolding) hint = "Keep holding to finish…";
  else if (status === "recording") hint = "Recording — hold to finish";

  function FieldRow({ field }) {
    const optionsHint =
      field.showOptions && field.options
        ? field.options.map((o) => o.label.split(":")[0].trim()).join(" / ")
        : null;

    return (
      <View style={styles.fieldRow}>
        <View style={styles.pendingCircle} />
        <View style={styles.fieldTextWrap}>
          <Text style={styles.fieldText}>
            {field.label}
            {field.required ? <Text style={styles.required}> *</Text> : null}
          </Text>
          {optionsHint && <Text style={styles.optionsHint}>({optionsHint})</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ===== TOP: checklist ===== */}
      <View style={styles.checklistArea}>
        <ScrollView contentContainerStyle={styles.checklistContent}>
        <Text style={styles.explainer}>
            Speak naturally to fill these fields. Items marked
            <Text style={styles.required}> *</Text> are required by eLogbook.
            You can review and edit everything on the eLogbook form before saving.
          </Text>

          <View style={styles.noticeBanner}>
            <Text style={styles.noticeText}>
              Patient ID should not be recorded to keep the app free of patient-identifiable
              details. If your portfolio requires one, you'll enter it manually on the website
              at the submission step.
            </Text>
          </View>

          {schema.fields
            .filter(
              (field) =>
                field.id !== "AppPatientAgeDateofBirth_ageyears" &&
                field.id !== "operationspecialty" &&
                !field.appOnly
            )
            .map((field) => (
              <FieldRow key={field.id} field={field} />
            ))}
        </ScrollView>
      </View>

      {/* ===== BOTTOM: record control ===== */}
      <View style={styles.controlArea}>
        {processing ? (
          <Text style={styles.doneText}>{processing}</Text>
        ) : ready ? (
          <>
            <Text style={styles.doneText}>Ready to fill eLogbook</Text>
            <AppButton href="/submission" style={{ paddingHorizontal: 40 }}>
              Open in eLogbook
            </AppButton>
          </>
        ) : (
          <>
            <Animated.View
              style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]}
            />
            <Animated.View
              style={[styles.chargeRing, { transform: [{ scale: chargeScale }], opacity: chargeOpacity }]}
            />
            <Pressable onPressIn={startHold} onPressOut={endHold}>
              <Animated.View
                style={[
                  styles.recordButton,
                  status === "recording" && styles.recordButtonActive,
                  { transform: [{ scale: buttonScale }] },
                ]}
              >
                <Text style={styles.recordButtonText}>
                  {status === "recording" ? "Recording" : "Record"}
                </Text>
              </Animated.View>
            </Pressable>
            <Text style={styles.controlHint}>{hint}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  checklistArea: { flex: 2 },
  checklistContent: { padding: 24, paddingTop: 28, paddingBottom: 16 },
  schemaContext: { fontSize: 12, fontWeight: "600", color: "#2563eb", textTransform: "capitalize", marginBottom: 16 },
  noticeBanner: { backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", borderRadius: 10, padding: 12, marginBottom: 20 },
  noticeText: { fontSize: 13, color: "#1e40af", lineHeight: 19 },
  fieldRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  pendingCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#cccccc", marginRight: 14, marginTop: 1 },
  fieldTextWrap: { flex: 1 },
  fieldText: { fontSize: 15, color: "#1a1a1a" },
  optionsHint: { fontSize: 12, color: "#999999", marginTop: 2 },
  controlArea: { flex: 1, alignItems: "center", justifyContent: "center", borderTopWidth: 1, borderTopColor: "#f0f0f0", paddingHorizontal: 24 },
  pulseRing: { position: "absolute", width: 88, height: 88, borderRadius: 44, backgroundColor: "#2563eb" },
  chargeRing: { position: "absolute", width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: "#2563eb", backgroundColor: "transparent" },
  recordButton: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center" },
  recordButtonActive: { backgroundColor: "#dc2626" },
  recordButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  controlHint: { fontSize: 13, color: "#888888", marginTop: 16, textAlign: "center" },
  doneText: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", marginBottom: 16, textAlign: "center" },
});