// components/ProfileField.jsx
// A reusable field "card" — a box showing a label and greyed example text.
// Defined once here, used many times. Lives in components/ (not app/),
// because anything in app/ becomes a screen, and this is a building block.

import { StyleSheet, Text, View } from "react-native";

// A component is a function. Its "props" (inputs) arrive as one object;
// the { label, placeholder } pulls those two values straight out, ready to use.
// (Component names MUST start with a capital letter — that's how React tells a
//  component apart from a plain tag. So ProfileField, not profileField.)
export default function ProfileField({ label, placeholder }) {
  return (
    <View style={styles.field}>
      {/* Curly braces in JSX mean "drop this JavaScript value in here".
          So {label} prints whatever text was passed in for label. */}
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldPlaceholder}>{placeholder}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderColor: "#e2e2e2",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#1a1a1a" },
  fieldPlaceholder: { fontSize: 15, color: "#aaaaaa", marginTop: 4 },
});