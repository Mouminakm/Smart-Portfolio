// components/StatusChip.jsx
// A small rounded status pill with icon + label. Three states from the brief:
//   "captured"     — pale green, check
//   "pending"      — pale grey-blue, circle
//   "needs_review" — pale amber, warning
// Status is shown by colour AND text/icon (never colour alone — accessibility).

import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme/theme";

const STATES = {
  captured:     { bg: colors.successBg, fg: colors.success, icon: "✓", label: "Captured" },
  pending:      { bg: colors.pendingBg, fg: colors.textSecondary, icon: "○", label: "Pending" },
  needs_review: { bg: colors.warningBg, fg: colors.warning, icon: "!", label: "Needs review" },
};

export default function StatusChip({ status = "pending", label }) {
  const s = STATES[status] || STATES.pending;
  return (
    <View style={[styles.chip, { backgroundColor: s.bg }]}>
      <Text style={[styles.icon, { color: s.fg }]}>{s.icon}</Text>
      <Text style={[styles.label, { color: s.fg }]}>{label || s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignSelf: "flex-start",
  },
  icon: { fontSize: 12, fontWeight: "700", marginRight: 4 },
  label: { fontSize: 12, fontWeight: "600" },
});