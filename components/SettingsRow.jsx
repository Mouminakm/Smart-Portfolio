// components/SettingsRow.jsx
// A reusable settings row: label on the left, current value on the right,
// and a "›" cue hinting it's tappable. Static for now — editing comes later.

import { StyleSheet, Text, View } from "react-native";

export default function SettingsRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.right}>
        {/* numberOfLines={1} stops a long value wrapping and breaking the row. */}
        <Text style={styles.value} numberOfLines={1}>{value}</Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // pushes label left, value+chevron right
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee", // hairline divider between rows
  },
  label: { fontSize: 15, color: "#1a1a1a" },
  right: { flexDirection: "row", alignItems: "center", flexShrink: 1, marginLeft: 12 },
  value: { fontSize: 15, color: "#888888", flexShrink: 1, textAlign: "right" },
  chevron: { fontSize: 18, color: "#cccccc", marginLeft: 8 },
});