// components/AppButton.jsx
// A reusable primary button. Use it two ways:
//   1) Navigate:  <AppButton href="/sign-in">Get started</AppButton>
//   2) Run code:  <AppButton onPress={fn}>Start recording</AppButton>
// Optional `style` lets one instance tweak its look (e.g. extra width).

import { Link } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

export default function AppButton({ children, href, onPress, style }) {
  // We pass an ARRAY of styles: the base style first, then the optional
  // override. When two styles set the same property, the LATER one wins — so
  // an override adjusts just what it needs and leaves everything else intact.
  // If no style is passed, the array is just [base, undefined], which React
  // Native happily ignores — so every existing button is unaffected.
  if (href) {
    return (
      <Link href={href} style={[styles.button, style]}>
        {children}
      </Link>
    );
  }

  return (
    <Pressable style={[styles.button, style]} onPress={onPress}>
      <Text style={styles.buttonText}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 14,
    overflow: "hidden",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});