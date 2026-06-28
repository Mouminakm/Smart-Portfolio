// app/(tabs)/_layout.jsx
// The tab navigator for the main app — now with an icon above each label.

import { Tabs } from "expo-router";
// Ionicons is one icon set from @expo/vector-icons, a library of ready-made
// icons that comes with every Expo project. No installation needed.
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
    screenOptions={{
      headerShown: false, // each screen uses its own NavyHeader instead
      tabBarActiveTintColor: "#14B8A6", // clinical teal (active tab)
      tabBarInactiveTintColor: "#64748B", // secondary grey (inactive)
    }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          // tabBarIcon is a FUNCTION the tab bar calls to draw the icon.
          // It hands us { color, size, focused }:
          //  - color & size already match the active/inactive colours set
          //    above, so the icon recolours itself when selected — free.
          //  - focused is true for the open tab; we use it to show a FILLED
          //    icon when selected and an OUTLINE when not.
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}