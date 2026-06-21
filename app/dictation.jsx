// app/dictation.jsx
// Core loop screen — Dictation (spec S3).
// Checklist is rendered from the schema as a single flat list, in the schema's
// own order. Fields flagged showOptions display their choices in brackets.
// Tap = record/pause; hold 1s = finish.

import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AppButton from "../components/AppButton";
import schema from "../schemas/elogbook_neurosurgery_operation_log.json";

const HOLD_DURATION = 1000; // milliseconds you must hold to finish

export default function DictationScreen() {
  const [status, setStatus] = useState("paused"); // "recording" | "paused" | "finished"
  const [isHolding, setIsHolding] = useState(false);

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
        setStatus("finished");
      }
    });
  }

  function endHold() {
    if (status === "finished") return;
    if (holdCompleted.current) return;
    holdProgress.stopAnimation();
    Animated.timing(holdProgress, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    setIsHolding(false);
    setStatus((current) => (current === "recording" ? "paused" : "recording"));
  }

  const buttonScale = holdProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const chargeScale = holdProgress.interpolate({ inputRange: [0, 1], outputRange: [1.15, 1.75] });
  const chargeOpacity = holdProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  let hint = "Tap to record · hold to finish";
  if (isHolding) hint = "Keep holding to finish…";
  else if (status === "recording") hint = "Recording — tap to pause · hold to finish";

  // One checklist row. If the field is flagged showOptions and has options,
  // we build a "(a / b / c)" hint from the option labels. We take the part
  // before any ":" so long labels (like CEPOD's) show just the keyword —
  // "Elective: Surgery at convenient time" becomes "Elective".
  function FieldRow({ field }) {
    const optionsHint =
      field.showOptions && field.options
        ? field.options.map((o) => o.label.split(":")[0].trim()).join(" / ")
        : null;

    return (
      <View style={styles.fieldRow}>
        <View style={styles.pendingCircle} />
        <View style={styles.fieldTextWrap}>
          <Text style={styles.fieldText}>{field.label}</Text>
          {/* Only renders when there's a hint to show. */}
          {optionsHint && <Text style={styles.optionsHint}>({optionsHint})</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ===== TOP TWO-THIRDS: checklist (scrollable) ===== */}
      <View style={styles.checklistArea}>
      <ScrollView contentContainerStyle={styles.checklistContent}>
          <Text style={styles.schemaContext}>
            {schema.platform} · {schema.entryType.replace("_", " ")}
          </Text>

          {/* Privacy notice (spec F11): the app never records patient
              identifiers. If the portfolio needs a patient ID, the user
              adds it directly on the website at the submission step. */}
          <View style={styles.noticeBanner}>
            <Text style={styles.noticeText}>
              Patient ID should not be recorded to keep the app free of patient-identifiable details. 

              If your portfolio requires one, you'll have to enter it manually on the website at the submission step.
            
            </Text>
          </View>

          {/* One flat list, straight from the schema, in its original order. */}
          {schema.fields.map((field) => (
            <FieldRow key={field.id} field={field} />
          ))}
        </ScrollView>
      </View>

      {/* ===== BOTTOM ONE-THIRD: record control ===== */}
      <View style={styles.controlArea}>
        {status === "finished" ? (
          <>
            <Text style={styles.doneText}>Recording finished</Text>
            <AppButton href="/review" style={{ paddingHorizontal: 40 }}>
              Review and edit
            </AppButton>
          </>
        ) : (
          <>
            <Animated.View
              style={[
                styles.pulseRing,
                { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
              ]}
            />
            <Animated.View
              style={[
                styles.chargeRing,
                { transform: [{ scale: chargeScale }], opacity: chargeOpacity },
              ]}
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

  checklistArea: { flex: 2 },
  checklistContent: { padding: 24, paddingTop: 28, paddingBottom: 16 },
  schemaContext: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563eb",
    textTransform: "capitalize",
    marginBottom: 16,
  },
  noticeBanner: {
    backgroundColor: "#eff6ff", // soft blue "info" background
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  noticeText: { fontSize: 13, color: "#1e40af", lineHeight: 19 },
  // alignItems flex-start so the circle lines up with the first line of text
  // (some rows now have a second line for the options hint).
  fieldRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  pendingCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#cccccc",
    marginRight: 14,
    marginTop: 1,
  },
  fieldTextWrap: { flex: 1 },
  fieldText: { fontSize: 15, color: "#1a1a1a" },
  optionsHint: { fontSize: 12, color: "#999999", marginTop: 2 },

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
  recordButtonActive: { backgroundColor: "#dc2626" },
  recordButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  controlHint: { fontSize: 13, color: "#888888", marginTop: 16, textAlign: "center" },
  doneText: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", marginBottom: 16 },
});