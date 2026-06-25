// components/ConsultantListField.jsx
// A small list editor for consultant names. Controlled component: the parent
// holds the array (value) and gets updates via onChange — same pattern as the
// pickers. The user types a name, taps Add, and it appears in the list below
// with a remove (✕) on each.

import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ConsultantListField({ label, value = [], onChange }) {
  // Local state only for the text being typed — the saved list lives in `value`.
  const [draft, setDraft] = useState("");

  function addName() {
    const name = draft.trim();
    if (!name) return;                          // ignore empty
    if (value.includes(name)) {                 // ignore duplicates
      setDraft("");
      return;
    }
    onChange([...value, name]);                 // report the new list up to the parent
    setDraft("");                               // clear the input for the next one
  }

  function removeName(nameToRemove) {
    onChange(value.filter((n) => n !== nameToRemove));
  }

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {/* Type a name + Add button, side by side. */}
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="e.g. Mr A Smith"
          placeholderTextColor="#aaaaaa"
          autoCapitalize="words"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addName}             // pressing the keyboard's return adds it too
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addBtn} onPress={addName}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* The current list. Each name has a ✕ to remove it. */}
      {value.length === 0 ? (
        <Text style={styles.empty}>No consultants added yet.</Text>
      ) : (
        value.map((name) => (
          <View key={name} style={styles.chip}>
            <Text style={styles.chipText}>{name}</Text>
            <TouchableOpacity onPress={() => removeName(name)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.remove}>✕</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: "600", color: "#1a1a1a", marginBottom: 6, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#1a1a1a",
  },
  addBtn: {
    marginLeft: 8,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  addBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "600" },
  empty: { fontSize: 14, color: "#888888", fontStyle: "italic" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  chipText: { fontSize: 15, color: "#1a1a1a", flex: 1 },
  remove: { fontSize: 16, color: "#dc2626", fontWeight: "600", paddingLeft: 12 },
});