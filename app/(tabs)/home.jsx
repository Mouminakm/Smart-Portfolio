// app/(tabs)/home.jsx
// Core loop screen — Home / entry chooser (spec S3).
// The entry types shown are driven by the portfolios the user picked in their
// profile: each portfolio contributes its own entry types. Built pathways are
// tappable; unbuilt ones show as "coming soon".

import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { ENTRY_TYPES_BY_PORTFOLIO } from "../../data/entryTypes";
import { loadProfile } from "../../profile";

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [portfolios, setPortfolios] = useState([]);

  // Reload the profile whenever Home is focused, so changing portfolios in
  // Settings updates the entry chooser immediately.
  useFocusEffect(
    useCallback(() => {
      async function load() {
        if (user) {
          const p = await loadProfile(user.uid);
          setPortfolios((p && p.portfolios) || []);
        }
      }
      load();
    }, [user])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>What would you like to dictate?</Text>

      {portfolios.length === 0 ? (
        <Text style={styles.empty}>
          No portfolios set yet. Add one in Settings to see what you can dictate.
        </Text>
      ) : (
        portfolios.map((portfolio) => {
          const entryTypes = ENTRY_TYPES_BY_PORTFOLIO[portfolio] || [];
          return (
            <View key={portfolio} style={styles.group}>
              <Text style={styles.groupHeading}>{portfolio}</Text>

              {entryTypes.length === 0 ? (
                <Text style={styles.comingSoonNote}>Entry types coming soon</Text>
              ) : (
                entryTypes.map((et) => (
                  <Pressable
                    key={et.label}
                    style={[styles.choice, !et.available && styles.choiceDisabled]}
                    disabled={!et.available}
                    onPress={() => et.available && router.push(et.route)}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        !et.available && styles.choiceTextDisabled,
                      ]}
                    >
                      {et.label}
                    </Text>
                    {!et.available && (
                      <Text style={styles.comingSoonTag}>Coming soon</Text>
                    )}
                  </Pressable>
                ))
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 24, paddingTop: 40, paddingBottom: 40 },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 28,
  },
  empty: { fontSize: 15, color: "#888888", textAlign: "center", marginTop: 20, lineHeight: 22 },
  group: { marginBottom: 24 },
  groupHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  choiceDisabled: { backgroundColor: "#f0f0f0" },
  choiceText: { fontSize: 16, fontWeight: "600", color: "#ffffff" },
  choiceTextDisabled: { color: "#999999" },
  comingSoonTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999999",
    backgroundColor: "#e0e0e0",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    overflow: "hidden",
  },
  comingSoonNote: { fontSize: 13, color: "#999999", fontStyle: "italic" },
});