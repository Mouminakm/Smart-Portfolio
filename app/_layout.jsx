// app/_layout.jsx
// Root navigator with four states: loading, signed-out, signed-in-needs-setup,
// and signed-in-ready. Exactly one group is active at a time.

import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { EntryProvider } from "../contexts/EntryContext";

function RootNavigator() {
  const { isSignedIn, hasCompletedOnboarding, isLoading } = useAuth();


  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#ffffff" },
        headerShadowVisible: false,
        headerTintColor: "#1a1a1a",
      }}
    >
      {/* Checking auth/profile — show only the spinner. */}
      <Stack.Protected guard={isLoading}>
        <Stack.Screen name="loading" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Signed in AND setup done -> the main app. */}
      <Stack.Protected guard={!isLoading && isSignedIn && hasCompletedOnboarding}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ title: "Edit profile" }} />
        <Stack.Screen name="record-test" options={{ title: "Recording test" }} />
        <Stack.Screen name="dictation" options={{ title: "Dictation" }} />
        <Stack.Screen name="review" options={{ title: "Review & edit" }} />
        <Stack.Screen name="submission" options={{ title: "Submit" }} />
      </Stack.Protected>

      {/* Signed in but setup NOT done -> the setup flow. */}
      <Stack.Protected guard={!isLoading && isSignedIn && !hasCompletedOnboarding}>
        <Stack.Screen name="profile-setup" options={{ title: "Profile setup" }} />
        <Stack.Screen name="permissions" options={{ title: "Before you start" }} />
      </Stack.Protected>

      {/* Signed out -> onboarding / auth. */}
      <Stack.Protected guard={!isLoading && !isSignedIn}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ title: "Create account" }} />
        <Stack.Screen name="email-sign-in" options={{ title: "Sign in" }} />
        <Stack.Screen name="email-sign-up" options={{ title: "Sign up" }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <EntryProvider>
        <RootNavigator />
      </EntryProvider>
    </AuthProvider>
  );
}