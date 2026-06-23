// app/record-test.jsx
// TEMPORARY Stage-1 test for Phase 4: prove microphone recording + playback
// work in Expo Go, in isolation, before integrating into the Dictation screen.

import {
    AudioModule,
    RecordingPresets,
    setAudioModeAsync,
    useAudioPlayer,
    useAudioRecorder,
    useAudioRecorderState,
} from "expo-audio";
import { File } from "expo-file-system";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import AppButton from "../components/AppButton";
import schema from "../schemas/elogbook_neurosurgery_operation_log.json";

// Paste the Function URL that `firebase deploy` printed, between the quotes.
const PING_URL = "https://ping-2nfo2acdaa-nw.a.run.app";
const TRANSCRIBE_URL = "https://europe-west2-smart-portfolio-d9c94.cloudfunctions.net/transcribe";
const PARSE_URL = "https://europe-west2-smart-portfolio-d9c94.cloudfunctions.net/parse";


export default function RecordTestScreen() {
  // The recorder, set to good-quality audio.
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  // Live info about the recorder (isRecording, duration, …).
  const recorderState = useAudioRecorderState(recorder);

  const [recordingUri, setRecordingUri] = useState(null); // saved file, once we have one
  const [statusText, setStatusText] = useState("Tap Record to start.");
  const [pingResult, setPingResult] = useState("");
  const [transcript, setTranscript] = useState("");
  const [fieldValues, setFieldValues] = useState(null); // editable values: id -> text
  const [confirmed, setConfirmed] = useState({});        // ticked state: id -> true/false
  // A player bound to the latest recording, so we can play it back.
  const player = useAudioPlayer(recordingUri ? { uri: recordingUri } : undefined);

  async function startRecording() {
    // Ask for microphone permission (the OS prompt appears the first time).
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setStatusText("Microphone permission denied. Enable it in your phone's settings to record.");
      return;
    }
    // iOS needs recording mode switched on explicitly.
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });

    setRecordingUri(null);
    await recorder.prepareToRecordAsync(); // get ready
    recorder.record(); // start
    setStatusText("Recording… tap Stop when done.");
  }

  async function stopRecording() {
    await recorder.stop();
    // After stopping, the recorder exposes the saved file's location (a URI).
    setRecordingUri(recorder.uri);
    setStatusText("Recorded! Tap Play to hear it back.");
  }
// Calls our backend's ping function over the internet and shows the reply.
  // fetch() makes the request; await waits for it; .json() reads the JSON body.
  async function pingBackend() {
    try {
      setPingResult("Pinging…");
      const response = await fetch(PING_URL);
      const data = await response.json();
      setPingResult(data.message + "\n" + data.time);
    } catch (e) {
      setPingResult("Failed: " + e.message);
    }
  }
  // Read the recorded file as base64 text, send it to our backend (which
  // forwards it to Deepgram), and show the transcript that comes back.
  async function transcribeRecording() {
    if (!recordingUri) return;
    try {
      setTranscript("");
      setStatusText("Transcribing…");
      // new File(uri).base64() reads the file's contents as a base64 string.
      const base64Audio = await new File(recordingUri).base64();

      const response = await fetch(TRANSCRIBE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64: base64Audio, mimeType: "audio/m4a" }),
      });
      const data = await response.json();

      if (data.transcript !== undefined) {
        setTranscript(data.transcript || "(no speech detected)");
        setStatusText("Done.");
      } else {
        setTranscript("Error: " + (data.error || "unknown"));
        setStatusText("Transcription failed.");
      }
    } catch (e) {
      setTranscript("Failed: " + e.message);
      setStatusText("Transcription failed.");
    }
  }
  // Update one field's value as the user types.
  function updateField(id, value) {
    setFieldValues((prev) => ({ ...prev, [id]: value }));
  }

  // Tick or untick a field as "confirmed".
  function toggleConfirmed(id) {
    setConfirmed((prev) => ({ ...prev, [id]: !prev[id] }));
  }
  // Send the transcript (plus our schema's field list) to the backend, which
  // asks Claude to return structured { fieldId: value } data. Show the result.
  async function parseTranscript() {
    if (!transcript) return;
    try {
      setStatusText("Extracting fields…");

      // Send only the bits Claude needs: each field's id and label.
      const fieldsForClaude = schema.fields.map((f) => ({ id: f.id, label: f.label }));

      const response = await fetch(PARSE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, fields: fieldsForClaude }),
      });
      const data = await response.json();

      if (data.fields) {
        // Seed an editable value for every schema field: Claude's answer, or
        // an empty string if it didn't mention that field. Tick (confirm) any
        // field that came back with a value; leave empty ones unticked.
        const seeded = {};
        const seededTicks = {};
        schema.fields.forEach((f) => {
          const value = data.fields[f.id] || "";
          seeded[f.id] = value;
          if (value !== "") {
            seededTicks[f.id] = true; // has a value -> start confirmed
          }
        });
        setFieldValues(seeded);
        setConfirmed(seededTicks);
        setStatusText("Fields extracted — review, untick or edit below.");
      } else {
        setStatusText("Parse failed: " + (data.error || "unknown"));
      }
    } catch (e) {
      setStatusText("Parse failed: " + e.message);
    }
  }
  function playRecording() {
    player.seekTo(0); // back to the start
    player.play();
    setStatusText("Playing…");
  }

  const isRecording = recorderState.isRecording;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Recording test</Text>
      <Text style={styles.status}>{statusText}</Text>
      <View style={{ height: 8 }} />
      <AppButton onPress={pingBackend}>Ping backend</AppButton>
      {pingResult ? <Text style={styles.uri}>{pingResult}</Text> : null}
      <View style={{ height: 24 }} />

      {isRecording ? (
        <AppButton onPress={stopRecording}>Stop</AppButton>
      ) : (
        <AppButton onPress={startRecording}>Record</AppButton>
      )}

      {recordingUri ? (
        <>
          <View style={{ height: 12 }} />
          <AppButton onPress={playRecording}>Play recording</AppButton>
          <View style={{ height: 12 }} />
          <AppButton onPress={transcribeRecording}>Transcribe</AppButton>
          {transcript ? <Text style={styles.transcript}>{transcript}</Text> : null}
          {transcript ? (
            <>
              <View style={{ height: 12 }} />
              <AppButton onPress={parseTranscript}>Extract fields (AI)</AppButton>
            </>
          ) : null}
          {fieldValues
            ? schema.fields.map((f) => (
                <View key={f.id} style={styles.fieldRow}>
                  {/* Tap to tick this field as confirmed. */}
                  <Pressable
                    style={[styles.tick, confirmed[f.id] && styles.tickOn]}
                    onPress={() => toggleConfirmed(f.id)}
                  >
                    {confirmed[f.id] ? <Text style={styles.tickMark}>✓</Text> : null}
                  </Pressable>
                  <View style={styles.fieldBody}>
                    <Text style={styles.fieldLabel}>{f.label}</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={fieldValues[f.id]}
                      onChangeText={(t) => updateField(f.id, t)}
                      placeholder="—"
                      placeholderTextColor="#bbbbbb"
                      multiline
                    />
                  </View>
                </View>
              ))
            : null}
          <Text style={styles.uri}>{"Saved file:\n" + recordingUri}</Text>
          </>
      ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#ffffff" },
  container: { flexGrow: 1, padding: 24, paddingTop: 40, backgroundColor: "#ffffff" },
  title: { fontSize: 24, fontWeight: "bold", color: "#1a1a1a", textAlign: "center", marginBottom: 12 },
  status: { fontSize: 15, color: "#555555", textAlign: "center", marginBottom: 28 },
  uri: { fontSize: 12, color: "#888888", marginTop: 24, textAlign: "center" },
  transcript: { fontSize: 15, color: "#1a1a1a", marginTop: 20, textAlign: "center", lineHeight: 22 },
  fieldRow: { flexDirection: "row", alignItems: "flex-start", alignSelf: "stretch", marginTop: 14 },
  tick: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: "#cccccc",
    marginRight: 10, marginTop: 22, alignItems: "center", justifyContent: "center",
  },
  tickOn: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  tickMark: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  fieldBody: { flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#1a1a1a", marginBottom: 4 },
  fieldInput: {
    borderWidth: 1, borderColor: "#dddddd", borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 10, fontSize: 15, color: "#1a1a1a",
  },
});