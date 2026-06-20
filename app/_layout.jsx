// app/_layout.jsx
// The root navigator: a STACK holding onboarding, the tabbed main app,
// and the dictation flow that stacks on top of the tabs.

import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#ffffff" },
        headerShadowVisible: false,
        headerTintColor: "#1a1a1a",
      }}
    >
      {/* Onboarding screens (shown before the main app) */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" options={{ title: "Create account" }} />
      <Stack.Screen name="email-sign-in" options={{ title: "Sign in" }} />
      <Stack.Screen name="profile-setup" options={{ title: "Profile setup" }} />
      <Stack.Screen name="permissions" options={{ title: "Before you start" }} />

      {/* The tabbed main app. headerShown:false because the tab navigator
          provides its OWN header — without this you'd get two stacked headers. */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* The dictation flow — these stack on TOP of the tabs when opened. */}
      <Stack.Screen name="dictation" options={{ title: "Dictation" }} />
      <Stack.Screen name="review" options={{ title: "Review & edit" }} />
      <Stack.Screen name="submission" options={{ title: "Submit" }} />
    </Stack>
  );
}