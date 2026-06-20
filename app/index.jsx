// app/index.jsx
// Onboarding screen 1 — Welcome & how it works (spec S1).
// The "index" file in app/ is the app's starting screen.

import { Link } from "expo-router"; // lets a tap travel to another screen
import { StyleSheet, Text, View } from "react-native";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      {/* Headline + value proposition */}
      <Text style={styles.title}>Smart Portfolio</Text>
      <Text style={styles.subtitle}>
        Dictate your logbook and portfolio entries by voice, then review and
        submit them to your training portfolio.
      </Text>

      {/* "How it works" — four short steps */}
      <Text style={styles.sectionHeading}>How it works</Text>

      <View style={styles.step}>
        <Text style={styles.stepNumber}>1</Text>
        <View style={styles.stepTextWrap}>
          <Text style={styles.stepLabel}>Speak</Text>
          <Text style={styles.stepDesc}>Dictate your entry in your own words.</Text>
        </View>
      </View>

      <View style={styles.step}>
        <Text style={styles.stepNumber}>2</Text>
        <View style={styles.stepTextWrap}>
          <Text style={styles.stepLabel}>Structure</Text>
          <Text style={styles.stepDesc}>AI sorts what you said into the right fields.</Text>
        </View>
      </View>

      <View style={styles.step}>
        <Text style={styles.stepNumber}>3</Text>
        <View style={styles.stepTextWrap}>
          <Text style={styles.stepLabel}>Review</Text>
          <Text style={styles.stepDesc}>Check and edit everything before it goes anywhere.</Text>
        </View>
      </View>

      <View style={styles.step}>
        <Text style={styles.stepNumber}>4</Text>
        <View style={styles.stepTextWrap}>
          <Text style={styles.stepLabel}>Submit</Text>
          <Text style={styles.stepDesc}>Your portfolio site opens pre-filled; you submit there.</Text>
        </View>
      </View>

      {/* Forward button. We build its destination, /sign-in, in the next step. */}
      <Link href="/sign-in" style={styles.button}>
        Get started
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#555555",
    textAlign: "center",
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 32,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  // Each step is a ROW: flexDirection "row" arranges children left-to-right
  // (the default is top-to-bottom). So the number sits beside its text.
  step: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    backgroundColor: "#2563eb",
    width: 28,
    height: 28,
    borderRadius: 14, // half of width/height makes a circle
    textAlign: "center",
    lineHeight: 28, // vertically centres the number in the circle
    marginRight: 14,
  },
  stepTextWrap: {
    flex: 1, // take the remaining width so long text wraps neatly
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  stepDesc: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  button: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 14,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 32,
  },
});