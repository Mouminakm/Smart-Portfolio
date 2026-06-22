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
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../components/AppButton";
// Paste the Function URL that `firebase deploy` printed, between the quotes.
const PING_URL = "https://ping-2nfo2acdaa-nw.a.run.app";

export default function RecordTestScreen() {
  // The recorder, set to good-quality audio.
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  // Live info about the recorder (isRecording, duration, …).
  const recorderState = useAudioRecorderState(recorder);

  const [recordingUri, setRecordingUri] = useState(null); // saved file, once we have one
  const [statusText, setStatusText] = useState("Tap Record to start.");
  const [pingResult, setPingResult] = useState("");

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
  function playRecording() {
    player.seekTo(0); // back to the start
    player.play();
    setStatusText("Playing…");
  }

  const isRecording = recorderState.isRecording;

  return (
    <View style={styles.container}>
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
          <Text style={styles.uri}>{"Saved file:\n" + recordingUri}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#ffffff" },
  title: { fontSize: 24, fontWeight: "bold", color: "#1a1a1a", textAlign: "center", marginBottom: 12 },
  status: { fontSize: 15, color: "#555555", textAlign: "center", marginBottom: 28 },
  uri: { fontSize: 12, color: "#888888", marginTop: 24, textAlign: "center" },
});