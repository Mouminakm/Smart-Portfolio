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
        headerShown: false, // every screen uses its own NavyHeader / hero
      }}
    >
      {/* Checking auth/profile — show only the spinner. */}
      <Stack.Protected guard={isLoading}>
        <Stack.Screen name="loading" />
      </Stack.Protected>

      {/* Signed in AND setup done -> the main app. */}
      <Stack.Protected guard={!isLoading && isSignedIn && hasCompletedOnboarding}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="record-test" />
        <Stack.Screen name="webview-test" />
        <Stack.Screen name="dictation" />
        <Stack.Screen name="review" />
        <Stack.Screen name="submission" />
      </Stack.Protected>

      {/* Signed in but setup NOT done -> the setup flow. */}
      <Stack.Protected guard={!isLoading && isSignedIn && !hasCompletedOnboarding}>
        <Stack.Screen name="profile-setup" />
        <Stack.Screen name="permissions" />
      </Stack.Protected>

      {/* Signed out -> onboarding / auth. */}
      <Stack.Protected guard={!isLoading && !isSignedIn}>
        <Stack.Screen name="index" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="email-sign-in" />
        <Stack.Screen name="email-sign-up" />
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