// app/dictation.jsx
// Core loop screen — Dictation (spec S3).
// Tap the round button = record/pause. HOLD it for 3s = finish recording.
// On finish, a Review button replaces the record control.
// Real audio + live tick-off arrive in Phase 4 / Phase 5.

import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import AppButton from "../components/AppButton";

const HOLD_DURATION = 3000; // milliseconds you must hold to finish

export default function DictationScreen() {
  // ---- STATE ----
  // status holds ONE of three words. Changing it re-draws the screen.
  const [status, setStatus] = useState("paused"); // "recording" | "paused" | "finished"
  // Whether the finger is currently held down (used to coordinate the visuals).
  const [isHolding, setIsHolding] = useState(false);

  // Placeholder checklist (hard-coded; comes from the schema in Phase 2).
  const fields = [
    "Date of operation",
    "Procedure",
    "Level of supervision",
    "Operative role",
    "Reflection / learning points",
  ];

  // ---- Recording pulse (from last step) ----
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // Pulse only while actively recording AND not mid-hold (so it doesn't
    // clash with the charge ring during a hold).
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
  // holdProgress runs 0 -> 1 over HOLD_DURATION. It drives the button growth
  // and the charge ring, AND its completion tells us the hold finished.
  const holdProgress = useRef(new Animated.Value(0)).current;
  // A ref flag (survives re-draws, doesn't trigger one) to remember whether
  // the hold completed, so we don't also treat the release as a tap.
  const holdCompleted = useRef(false);

  // Finger goes DOWN: begin the 3-second charge.
  function startHold() {
    if (status === "finished") return; // nothing to do once finished
    holdCompleted.current = false;
    setIsHolding(true);
    holdProgress.setValue(0);
    Animated.timing(holdProgress, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: true,
    }).start(({ finished }) => {
      // This callback runs when the animation ENDS. "finished: true" means it
      // ran the full 3s uninterrupted -> the user held long enough. Finish.
      if (finished) {
        holdCompleted.current = true;
        setIsHolding(false);
        setStatus("finished");
      }
    });
  }

  // Finger comes UP: either the hold completed, or it was a short tap.
  function endHold() {
    if (status === "finished") return;
    if (holdCompleted.current) return; // hold already finished it; do nothing

    // Released early -> cancel the charge and treat it as a normal TAP.
    holdProgress.stopAnimation();
    Animated.timing(holdProgress, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    setIsHolding(false);
    // A tap toggles between recording and paused.
    setStatus((current) => (current === "recording" ? "paused" : "recording"));
  }

  // Turn hold progress into a growing button and an expanding charge ring.
  const buttonScale = holdProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const chargeScale = holdProgress.interpolate({ inputRange: [0, 1], outputRange: [1.15, 1.75] });
  const chargeOpacity = holdProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  // The hint under the button changes with the situation.
  let hint = "Tap to record · hold to finish";
  if (isHolding) hint = "Keep holding to finish…";
  else if (status === "recording") hint = "Recording — tap to pause · hold to finish";

  return (
    <View style={styles.container}>
      {/* ===== TOP TWO-THIRDS: field checklist ===== */}
      <View style={styles.checklistArea}>
        <Text style={styles.checklistHeading}>Fields to capture</Text>

        {fields.map((field, index) => (
          <View key={index} style={styles.fieldRow}>
            <View style={styles.pendingCircle} />
            <Text style={styles.fieldText}>{field}</Text>
          </View>
        ))}

        <Text style={styles.transcriptHint}>
          {status === "finished"
            ? "Recording complete."
            : status === "recording"
            ? "Listening… your words will appear here."
            : "Tap the button below and start speaking."}
        </Text>
      </View>

      {/* ===== BOTTOM ONE-THIRD: record control ===== */}
      <View style={styles.controlArea}>
        {status === "finished" ? (
          // Finished: replace the record control with a Review button.
          <>
            <Text style={styles.doneText}>Recording finished</Text>
            <AppButton href="/review" style={{ paddingHorizontal: 40 }}>
              Review and edit
            </AppButton>
          </>
        ) : (
          <>
            {/* Recording pulse (behind the button) */}
            <Animated.View
              style={[
                styles.pulseRing,
                { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
              ]}
            />
            {/* Charge ring — fills/expands as you hold */}
            <Animated.View
              style={[
                styles.chargeRing,
                { transform: [{ scale: chargeScale }], opacity: chargeOpacity },
              ]}
            />

            {/* The round button. onPressIn/onPressOut drive the hold logic. */}
            <Pressable onPressIn={startHold} onPressOut={endHold}>
              <Animated.View
                style={[
                  styles.recordButton,
                  status === "recording" && styles.recordButtonActive,
                  { transform: [{ scale: buttonScale }] },
                ]}
              >
                <Text style={styles.recordButtonText}>
                  {status === "recording" ? "Pause" : "Record"}
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

  checklistArea: { flex: 2, padding: 24, paddingTop: 32 },
  checklistHeading: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  fieldRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  pendingCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#cccccc",
    marginRight: 14,
  },
  fieldText: { fontSize: 16, color: "#1a1a1a" },
  transcriptHint: { fontSize: 14, color: "#aaaaaa", fontStyle: "italic", marginTop: 20 },

  controlArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  pulseRing: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#2563eb",
  },
  chargeRing: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: "#2563eb",
    backgroundColor: "transparent",
  },
  recordButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  recordButtonActive: { backgroundColor: "#dc2626" }, // red while recording
  recordButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  controlHint: { fontSize: 13, color: "#888888", marginTop: 16, textAlign: "center" },
  doneText: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", marginBottom: 16 },
});