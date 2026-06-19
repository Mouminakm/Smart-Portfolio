// app/index.jsx
// The Onboarding screen — the first thing a new user sees.
// In Expo Router, the file named "index" inside "app" is automatically
// the app's starting screen, so this is what loads first.

// Bring in the building blocks we need from React Native:
//  - View: a container/box that holds and arranges other things.
//  - Text: displays words (all visible text must sit inside a <Text>).
//  - StyleSheet: a tidy way to define styling, kept separate from the layout.
import { StyleSheet, Text, View } from "react-native";

// A component = a function that returns what to show on screen.
// "export default" makes this the screen Expo Router renders for this route.
export default function OnboardingScreen() {
  return (
    // The outer View fills the screen and centres everything inside it.
    <View style={styles.container}>
      <Text style={styles.title}>Smart Portfolio</Text>

      <Text style={styles.subtitle}>
        Dictate your portfolio and elogbook entries by voice — then review and
        submit them to your training portfolio.
      </Text>
    </View>
  );
}

// Styles live here. StyleSheet.create lets us name a set of styles and
// reuse them above with style={styles.NAME}. React Native arranges things
// using a system called Flexbox; the comments below say what each line does.
const styles = StyleSheet.create({
  container: {
    flex: 1, // fill all available space on the screen
    justifyContent: "center", // centre children top-to-bottom
    alignItems: "center", // centre children left-to-right
    padding: 24, // breathing room from the screen edges
    backgroundColor: "#ffffff", // white background
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 12, // space below the title
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center", // centre the wrapped lines of text
    color: "#555555",
    lineHeight: 24, // a little space between lines, for readability
  },
});