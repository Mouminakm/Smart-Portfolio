// app/_layout.jsx
// Root navigator. Wraps the app in the auth context, then uses Stack.Protected
// to show the main app only when signed in, and onboarding only when signed out.

import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

// The navigator reads auth state, so it must live INSIDE the provider — that's
// why it's a separate component from RootLayout below (a component can't read a
// context that it itself renders the provider for).
function RootNavigator() {
  const { isSignedIn } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#ffffff" },
        headerShadowVisible: false,
        headerTintColor: "#1a1a1a",
      }}
    >
      {/* PROTECTED — only reachable when signed IN. When isSignedIn flips to
          true, the router automatically lands the user on the first screen
          here, (tabs) → Home. */}
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="dictation" options={{ title: "Dictation" }} />
        <Stack.Screen name="review" options={{ title: "Review & edit" }} />
        <Stack.Screen name="submission" options={{ title: "Submit" }} />
      </Stack.Protected>

      {/* PUBLIC — only reachable when signed OUT. The onboarding flow. */}
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ title: "Create account" }} />
        <Stack.Screen name="email-sign-in" options={{ title: "Sign in" }} />
        <Stack.Screen name="email-sign-up" options={{ title: "Sign up" }} />
        <Stack.Screen name="profile-setup" options={{ title: "Profile setup" }} />
        <Stack.Screen name="permissions" options={{ title: "Before you start" }} />
      </Stack.Protected>
    </Stack>
  );
}

// RootLayout wraps everything in the provider, then renders the navigator.
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}