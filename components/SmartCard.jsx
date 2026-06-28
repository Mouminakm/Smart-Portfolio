// components/SmartCard.jsx
// The standard white rounded card used across the app — soft border, gentle
// shadow, consistent padding. Wrap any grouped content in <SmartCard>...</SmartCard>.
// Pass `style` to tweak per-use (e.g. extra margin) without changing the base look.

import { StyleSheet, View } from "react-native";
import { colors, radius, shadow, spacing } from "../theme/theme";

export default function SmartCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,        // 18
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,            // 20
    ...shadow.card,                 // soft premium shadow
  },
});