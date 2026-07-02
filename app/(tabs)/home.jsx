// app/(tabs)/home.jsx
// Core loop screen — Home / entry chooser (spec S3).
// The entry types shown are driven by the portfolios the user picked in their
// profile: each portfolio contributes its own entry types. Built pathways are
// tappable; unbuilt ones show as "coming soon". (Logic unchanged — restyled to
// the navy/teal clinical design system.)

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import NavyHeader from "../../components/NavyHeader";
import SmartCard from "../../components/SmartCard";
import { useAuth } from "../../contexts/AuthContext";
import { ENTRY_TYPES_BY_PORTFOLIO } from "../../data/entryTypes";
import { UK_PORTFOLIOS } from "../../data/portfolios";

import { loadProfile } from "../../profile";
import { colors, radius, spacing, type } from "../../theme/theme";

// A friendly greeting based on the time of day.
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [portfolios, setPortfolios] = useState([]);
  const [specialty, setSpecialty] = useState("");

  // Reload the profile whenever Home is focused, so changing portfolios in
  // Settings updates the entry chooser immediately.
  useFocusEffect(
    useCallback(() => {
      async function load() {
        if (user) {
          const p = await loadProfile(user.uid);
          setPortfolios((p && p.portfolios) || []);
          setSpecialty((p && p.specialty) || "");
        }
      }
      load();
    }, [user])
  );

  return (
    <View style={styles.container}>
      <NavyHeader subtitle={greeting()} title="Smart Portfolio" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Context pill — who the user is, from their profile. */}
        {specialty ? (
          <View style={styles.contextPill}>
            <Text style={styles.contextText}>Surgical trainee · {specialty}</Text>
          </View>
        ) : null}

        <Text style={styles.heading}>What would you like to dictate?</Text>

        {portfolios.length === 0 ? (
          <Text style={styles.empty}>
            No portfolios set yet. Add one in Settings to see what you can dictate.
          </Text>
        ) : (
          portfolios.map((portfolio) => {
            const entryTypes = ENTRY_TYPES_BY_PORTFOLIO[portfolio] || [];
            return (
              <View key={portfolio} style={styles.group}>
                <Text style={styles.groupHeading}>
                  {(UK_PORTFOLIOS.find((p) => p.id === portfolio) || {}).name || portfolio}
                </Text>

                {entryTypes.length === 0 ? (
                  <Text style={styles.comingSoonNote}>Entry types coming soon</Text>
                ) : (
                  entryTypes.map((et) => (
                    <Pressable
                      key={et.label}
                      disabled={!et.available}
                      onPress={() => et.available && router.push(et.route)}
                      style={({ pressed }) => [pressed && et.available && { opacity: 0.9 }]}
                    >
                      <SmartCard style={[styles.choiceCard, !et.available && styles.choiceCardDisabled]}>
                        <View style={styles.choiceRow}>
                          {/* Left icon tile */}
                          <View style={[styles.iconTile, !et.available && styles.iconTileDisabled]}>
                            <Ionicons
                              name={et.available ? "mic" : "lock-closed"}
                              size={22}
                              color={et.available ? colors.teal : colors.textMuted}
                            />
                          </View>

                          {/* Title + subtitle */}
                          <View style={styles.choiceTextWrap}>
                            <Text style={[styles.choiceTitle, !et.available && styles.mutedTitle]}>
                              {et.label}
                            </Text>
                            {et.subtitle ? (
                              <Text style={styles.choiceSubtitle}>{et.subtitle}</Text>
                            ) : null}
                          </View>

                          {/* Right: chevron or coming-soon tag */}
                          {et.available ? (
                            <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
                          ) : (
                            <Text style={styles.comingSoonTag}>Coming soon</Text>
                          )}
                        </View>
                      </SmartCard>
                    </Pressable>
                  ))
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xxxl },

  contextPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.muted,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  contextText: { color: colors.tealDeep, fontSize: 13, fontWeight: "600" },

  heading: { ...type.sectionHeading, marginBottom: spacing.xl },
  empty: { ...type.body, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xl, lineHeight: 22 },

  group: { marginBottom: spacing.xxl },
  groupHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.teal,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.md,
  },

  choiceCard: { padding: spacing.lg, marginBottom: spacing.md },
  choiceCardDisabled: { backgroundColor: colors.muted },
  choiceRow: { flexDirection: "row", alignItems: "center" },

  iconTile: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: colors.muted,
    alignItems: "center", justifyContent: "center",
    marginRight: spacing.lg,
  },
  iconTileDisabled: { backgroundColor: "#E2E8F0" },
  iconGlyph: { fontSize: 20 },

  choiceTextWrap: { flex: 1 },
  choiceTitle: { ...type.cardTitle },
  mutedTitle: { color: colors.textMuted },
  choiceSubtitle: { ...type.helper, marginTop: 2 },

  chevron: { fontSize: 28, color: colors.textMuted, fontWeight: "300", marginLeft: spacing.sm },

  comingSoonTag: {
    fontSize: 11, fontWeight: "700", color: colors.textMuted,
    backgroundColor: colors.pendingBg,
    borderRadius: radius.pill,
    paddingVertical: 3, paddingHorizontal: spacing.sm,
    overflow: "hidden",
  },
  comingSoonNote: { ...type.helper, fontStyle: "italic" },
});