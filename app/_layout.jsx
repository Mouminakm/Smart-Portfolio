// app/_layout.jsx
// This file configures the app's navigation. Named "_layout" and sitting at
// the top of app/, it wraps EVERY screen. It isn't a screen itself.
//
// <Stack> is the "stack navigator" we've been using: screens are pushed on
// top of one another (like a stack of cards), which is why a link slides a
// new screen in and a back arrow appears. Here we configure its header bar.

import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      // screenOptions applies to EVERY screen, unless a screen overrides it.
      screenOptions={{
        headerStyle: { backgroundColor: "#ffffff" }, // white header bar
        headerShadowVisible: false, // remove the faint line under the bar
        headerTintColor: "#1a1a1a", // colour of the title text and back arrow
      }}
    >
      {/* Each <Stack.Screen> targets one screen by its file name (without
          the .jsx) and sets options just for that screen. */}

      {/* Welcome is the entry screen — hide the header bar completely. */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* Friendly titles replace the raw file names on the other screens. */}
      <Stack.Screen name="sign-in" options={{ title: "Create account" }} />
      <Stack.Screen name="email-sign-in" options={{ title: "Sign in" }} />
      <Stack.Screen name="profile-setup" options={{ title: "Profile setup" }} />
      <Stack.Screen name="permissions" options={{ title: "Before you start" }} />
    </Stack>
  );
}