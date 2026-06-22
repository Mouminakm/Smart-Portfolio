// components/PickerField.jsx
// A reusable "dropdown" for mobile: the field shows the current choice (or a
// placeholder); tapping it opens a pop-up list (a Modal) of options; tapping an
// option selects it and closes. No extra library — built from React Native parts.

import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";

// Props: label (above the field), placeholder (when nothing chosen),
// options (array of strings), value (current choice), onSelect (called with the
// chosen string when the user picks one).
export default function PickerField({ label, placeholder, options, value, onSelect }) {
  const [open, setOpen] = useState(false); // is the pop-up showing?

  function choose(option) {
    onSelect(option); // tell the parent screen the new choice
    setOpen(false);   // close the pop-up
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>

      {/* The field itself — tap to open. Shows the value, or greyed placeholder. */}
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      {/* Modal = a layer shown on top of everything when visible is true.
          transparent lets our dimmed backdrop show through. */}
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)} // Android back button closes it
      >
        {/* Tapping the dimmed area behind the sheet closes the menu. */}
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* The white sheet. Its own Pressable absorbs taps so tapping the
              sheet itself doesn't close the menu. */}
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>

            {/* FlatList renders the options from the array, efficiently. */}
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable style={styles.option} onPress={() => choose(item)}>
                  <Text style={[styles.optionText, item === value && styles.optionSelected]}>
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: "600", color: "#1a1a1a", marginBottom: 6 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  fieldText: { fontSize: 16, color: "#1a1a1a", flex: 1 },
  placeholder: { color: "#aaaaaa" },
  chevron: { fontSize: 14, color: "#888888", marginLeft: 8 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)", // dims the screen behind
    justifyContent: "flex-end", // sheet sits at the bottom and slides up
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
    maxHeight: "75%", // don't cover the whole screen
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 12, textAlign: "center" },
  option: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  optionText: { fontSize: 16, color: "#1a1a1a" },
  optionSelected: { color: "#2563eb", fontWeight: "700" },
});