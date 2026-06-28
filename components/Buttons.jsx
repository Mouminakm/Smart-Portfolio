// components/Buttons.jsx
// The two button styles from the design brief:
//   PrimaryButton   — deep navy fill, white text (the main action)
//   SecondaryButton — white fill, navy border + text (secondary action)
// Both: large touch target, rounded, subtle press feedback. They accept either
// an onPress handler or an href (for navigation, via expo-router's useRouter).

import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing } from "../theme/theme";

function useGo(href, onPress) {
  const router = useRouter();
  return () => {
    if (onPress) return onPress();
    if (href) router.push(href);
  };
}

export function PrimaryButton({ children, onPress, href, style, disabled }) {
  const go = useGo(href, onPress);
  return (
    <Pressable
      onPress={go}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles.primary,
        pressed && styles.primaryPressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={styles.primaryText}>{children}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ children, onPress, href, style, disabled }) {
  const go = useGo(href, onPress);
  return (
    <Pressable
      onPress={go}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles.secondary,
        pressed && styles.secondaryPressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={styles.secondaryText}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,        // 12
    paddingVertical: spacing.lg,    // 16 — large, easy to tap
    paddingHorizontal: spacing.xxl, // 24
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.navy },
  primaryPressed: { backgroundColor: colors.navy2 },
  primaryText: { color: colors.onNavy, fontSize: 16, fontWeight: "600" },

  secondary: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  secondaryPressed: { backgroundColor: colors.muted },
  secondaryText: { color: colors.navy, fontSize: 16, fontWeight: "600" },

  disabled: { opacity: 0.5 },
});