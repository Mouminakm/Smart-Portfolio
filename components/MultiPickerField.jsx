// components/MultiPickerField.jsx
// A reusable multi-select picker (tick boxes) with a maximum number of choices.
// Tap the field to open a pop-up list; tap rows to tick/untick; "Done" closes it.
// The field shows the chosen items joined together. selected is an ARRAY.

import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import AppButton from "./AppButton";

export default function MultiPickerField({
  label,
  placeholder,
  options,
  selected,        // array of currently chosen strings
  onChange,        // called with the NEW array
  maxSelect = 2,   // how many may be chosen at once
}) {
  const [open, setOpen] = useState(false);

  // Tick or untick one option, respecting the cap.
  function toggle(item) {
    if (selected.includes(item)) {
      // already chosen -> remove it (keep everything except this one)
      onChange(selected.filter((s) => s !== item));
    } else if (selected.length < maxSelect) {
      // not chosen and under the limit -> add it (spread the old + the new)
      onChange([...selected, item]);
    }
    // at the limit and not chosen -> do nothing
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>

      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={[styles.fieldText, selected.length === 0 && styles.placeholder]}>
          {selected.length > 0 ? selected.join(", ") : placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <Text style={styles.hint}>Select up to {maxSelect}</Text>

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              style={styles.list}
              renderItem={({ item }) => {
                const isSelected = selected.includes(item);
                // grey out unticked rows once we've hit the limit
                const isDisabled = !isSelected && selected.length >= maxSelect;
                return (
                  <Pressable style={styles.option} onPress={() => toggle(item)} disabled={isDisabled}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionSelected,
                        isDisabled && styles.optionDisabled,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              }}
            />

            <View style={styles.doneWrap}>
              <AppButton onPress={() => setOpen(false)}>Done</AppButton>
            </View>
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
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", textAlign: "center" },
  hint: { fontSize: 13, color: "#888888", textAlign: "center", marginTop: 4, marginBottom: 12 },
  list: { maxHeight: 380 }, // cap the list height so "Done" stays visible below it
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#cccccc",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  checkmark: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  optionText: { fontSize: 16, color: "#1a1a1a", flex: 1 },
  optionSelected: { fontWeight: "700", color: "#2563eb" },
  optionDisabled: { color: "#cccccc" },
  doneWrap: { marginTop: 16 },
});