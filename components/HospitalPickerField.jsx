// components/HospitalPickerField.jsx
// Multi-select hospital picker. The user searches the bundled eLogbook hospital
// list and adds one or more hospitals they work at; each is stored WITH its
// exact eLogbook id. At submission, the dictated hospital is matched against
// this small list (reliable — no national-list collisions).
// Controlled: parent passes `value` (array of { id, name, display }) and `onChange`.

import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import hospitalData from "../schemas/elogbook_hospitals.json";



export default function HospitalPickerField({ value, onChange }) {
  const [query, setQuery] = useState("");

  // value is an array; default to [] so .map/.some are safe.
  const hospitals = value || [];

  const normQuery = query.trim().toLowerCase().replace(/^the\s+/, "");

  // Filter the bundled list as the user types (starts-with ranked first).
  const matches = useMemo(() => {
    if (normQuery.length < 2) return [];
    const all = hospitalData.hospitals;
    const starts = [];
    const contains = [];
    for (const h of all) {
      const s = h.search;
      if (s.startsWith(normQuery)) starts.push(h);
      else if (s.includes(normQuery)) contains.push(h);
      if (starts.length >= 20) break;
    }
    return [...starts, ...contains].slice(0, 15);
  }, [normQuery]);

  function add(h) {
    // Don't add the same hospital twice (match on id).
    if (hospitals.some((x) => x.id === h.id)) {
      setQuery("");
      return;
    }
    onChange([...hospitals, { id: h.id, name: h.name, display: h.display || h.short || h.name }]);
    setQuery(""); // clear search after adding
  }

  function remove(id) {
    onChange(hospitals.filter((x) => x.id !== id));
  }

  return (
    <View style={styles.wrap}>
      {/* Added hospitals as chips */}
      {hospitals.length > 0 && (
        <View style={styles.chips}>
          {hospitals.map((h) => (
            <View key={h.id} style={styles.chip}>
              <Text style={styles.chipText}>{h.display || h.short || h.name}</Text>
              <Pressable onPress={() => remove(h.id)} hitSlop={8}>
                <Text style={styles.chipRemove}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Search box to add another */}
      <TextInput
        style={styles.input}
        placeholder="Search to add a hospital…"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="words"
        autoCorrect={false}
      />

      {/* Results */}
      {matches.length > 0 && (
        <View style={styles.results}>
          {matches.map((h) => (
            <Pressable key={h.id} style={styles.resultRow} onPress={() => add(h)}>
              <Text style={styles.resultText}>{h.display || h.short || h.name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {normQuery.length >= 2 && matches.length === 0 && (
        <Text style={styles.noMatch}>No match — check the spelling.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { fontSize: 14, color: "#2563eb", fontWeight: "600", marginRight: 8 },
  chipRemove: { fontSize: 13, color: "#2563eb", fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#ffffff",
  },
  results: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    marginTop: 6,
    overflow: "hidden",
  },
  resultRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  resultText: { fontSize: 15, color: "#1a1a1a" },
  noMatch: { fontSize: 13, color: "#888888", marginTop: 8, fontStyle: "italic" },
});