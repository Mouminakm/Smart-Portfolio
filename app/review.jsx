// app/review.jsx
// Core loop screen — Review & edit (spec F7).
// Reads the entry from the shared context (filled by Dictation), shows every
// field as editable + tickable, starts with all fields ticked, and offers a
// top "Approve all / Clear all" toggle. Nothing proceeds until the user goes on.

import { useEffect } from "react";
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
import { useEntry } from "../contexts/EntryContext";

import { buildInjectionPlan } from "../lib/buildInjectionPlan";
import schema from "../schemas/elogbook_neurosurgery_operation_log.json";

export default function ReviewScreen() {
  const { fieldValues, setFieldValues, confirmed, setConfirmed } = useEntry();

  // TEMP (Phase 7 wiring): run the translator on the real entry and log the
  // resulting injection plan, so we can verify it before wiring to injection.
  useEffect(() => {
    const plan = buildInjectionPlan(fieldValues, schema);
    console.log("INJECTION PLAN:", JSON.stringify(plan, null, 2));
  }, [fieldValues]);

  // When the screen opens, tick every field as the baseline (the user unticks
  // anything they want to revisit). Runs once on mount.
  useEffect(() => {
    const allTicked = {};
    schema.fields.forEach((f) => {
      allTicked[f.id] = true;
    });
    setConfirmed(allTicked);
  }, []);

  function updateField(id, value) {
    setFieldValues((prev) => ({ ...prev, [id]: value }));
  }

  function toggleConfirmed(id) {
    setConfirmed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Are all fields currently ticked? Drives the top toggle's label/behaviour.
  const allConfirmed = schema.fields.every((f) => confirmed[f.id]);

  function toggleAll() {
    const next = {};
    schema.fields.forEach((f) => {
      next[f.id] = !allConfirmed; // if all on -> turn all off, else turn all on
    });
    setConfirmed(next);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Review your entry</Text>
        <Text style={styles.subtitle}>
          Every field is ticked. Untick or edit anything that needs a change.
          Nothing is sent until you continue.
        </Text>

        {/* Top control: approve all / clear all. */}
        <Pressable style={styles.approveAll} onPress={toggleAll}>
          <View style={[styles.tick, allConfirmed && styles.tickOn]}>
            {allConfirmed ? <Text style={styles.tickMark}>✓</Text> : null}
          </View>
          <Text style={styles.approveAllText}>
            {allConfirmed ? "Clear all ticks" : "Approve all"}
          </Text>
        </Pressable>

        {/* One editable, tickable row per schema field. */}
        {schema.fields.map((f) => (
          <View key={f.id} style={styles.fieldRow}>
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
                value={fieldValues[f.id] || ""}
                onChangeText={(t) => updateField(f.id, t)}
                placeholder="—"
                placeholderTextColor="#bbbbbb"
                multiline
              />
            </View>
          </View>
        ))}

        <View style={{ height: 20 }} />
        <AppButton href="/submission">Looks good — continue</AppButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#ffffff" },
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 24, paddingTop: 32, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "bold", color: "#1a1a1a", textAlign: "center" },
  subtitle: { fontSize: 15, color: "#555555", textAlign: "center", lineHeight: 22, marginTop: 10, marginBottom: 20 },

  approveAll: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
  },
  approveAllText: { fontSize: 15, fontWeight: "600", color: "#1e40af", marginLeft: 10 },

  fieldRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  tick: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: "#cccccc",
    alignItems: "center", justifyContent: "center",
  },
  tickOn: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  tickMark: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  fieldBody: { flex: 1, marginLeft: 10 },
  fieldInput: {
    borderWidth: 1, borderColor: "#dddddd", borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 10, fontSize: 15, color: "#1a1a1a",
  },
});