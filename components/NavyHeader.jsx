// components/NavyHeader.jsx
// The deep-navy header bar at the top of a screen. Shows a title, optional
// subtitle, and an optional small pill on the right (e.g. the entry type).
// Sits flush at the top; screens render their scrollable content below it.

import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme/theme";

export default function NavyHeader({ title, subtitle, pill }) {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        {pill ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>{pill}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.navy,
    paddingTop: spacing.xxxl + spacing.lg, // room for the status bar
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xxl,
  },
  row: { flexDirection: "row", alignItems: "center" },
  subtitle: { color: colors.sky, fontSize: 13, fontWeight: "600", marginBottom: 2 },
  title: { color: colors.onNavy, fontSize: 26, fontWeight: "700" },
  pill: {
    backgroundColor: colors.navy2,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.teal,
  },
  pillText: { color: colors.teal, fontSize: 12, fontWeight: "600" },
});