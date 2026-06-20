// app/(tabs)/_layout.jsx
// The tab navigator for the main app. Because it sits inside the (tabs)
// route group, Expo Router shows Home and Settings as bottom tabs.
// The parentheses group them WITHOUT changing addresses — Home is still
// /home, Settings still /settings, so your existing links keep working.

import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#ffffff" },
        headerShadowVisible: false,
        headerTintColor: "#1a1a1a",
        tabBarActiveTintColor: "#2563eb", // selected tab colour
        tabBarInactiveTintColor: "#888888",
      }}
    >
      {/* "title" sets both the header text and the tab label. */}
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}