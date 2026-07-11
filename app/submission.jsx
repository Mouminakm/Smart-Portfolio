// app/submission.jsx
// Core loop screen — Submission via WebView (spec F8).
// Loads the real eLogbook Add Operation form, builds an injection plan from the
// dictated entry (EntryContext), waits for the Angular form to render, then
// auto-fills every field. The user reviews and submits on eLogbook itself.
//
// This build carries a DIAGNOSTICS layer: every stage and every field posts a
// labelled message (tag "diag-2026-06-29a") to the Expo terminal so failures are visible.

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import AppButton from "../components/AppButton";
import { useAuth } from "../contexts/AuthContext";
import { useEntry } from "../contexts/EntryContext";
import { getSpecialtyData } from "../data/specialtySchemas";
import { buildInjectionPlan } from "../lib/buildInjectionPlan";
import { buildFullInjectionScript, FORM_URL } from "../platforms/elogbook/adapter";
import { loadProfile } from "../profile";
import { colors, spacing } from "../theme/theme";

const BUILD_TAG = "diag-2026-06-29a";

// Diagnostics switch. false for testers/production (no console spam, clean
// status bar). Flip to true to get the full per-field submission report in the
// Expo terminal again if you ever need to debug a submission. The injection
// script is unchanged either way — this only gates the app-side logging.
const DEBUG = false;

export default function SubmissionScreen() {
  const { fieldValues } = useEntry();
  const { user } = useAuth();
  const webRef = useRef(null);
  const [statusMsg, setStatusMsg] = useState("Opening eLogbook…");
  const [filled, setFilled] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [failedFields, setFailedFields] = useState([]);
  const [userHospitals, setUserHospitals] = useState(null); // null = still loading
  const [userSpecialty, setUserSpecialty] = useState("");

  useEffect(() => {
    async function load() {
      if (user) {
        const p = await loadProfile(user.uid);
        setUserHospitals((p && p.hospitals) || []);
        setUserSpecialty((p && p.specialty) || "");
      }
    }
    load();
  }, [user]);

  const specialtyData = getSpecialtyData(userSpecialty);
  const schema = specialtyData ? specialtyData.schema : null;

  const plan =
    userHospitals === null || !schema
      ? null
      : buildInjectionPlan(fieldValues, schema, userHospitals, userSpecialty);

  // Map a selector or name to a friendly field label using the schema.
  function labelFor(idOrSel) {
    if (idOrSel === "procedure") return "Procedure";
    if (idOrSel === "hospital") return "Hospital";
    if (idOrSel === "consultant") return "Responsible consultant";
    if (idOrSel === "radio") return "A yes/no field";
    const field = schema ? schema.fields.find((x) => x.selector === idOrSel) : null;
    return field ? field.label : idOrSel;
  }
  function friendlyFailed(failed) {
    if (!failed || !failed.length) return [];
    return failed.map(labelFor);
  }

  // Pretty-print the full diagnostic report to the Expo terminal.
  function printReport(data) {
    if (!DEBUG) return; // silent for testers; flip DEBUG to true to restore
    const lines = (data.fields || []).map((f) => {
      const mark = f.ok ? "  OK  " : "  XX  ";
      let extra = "";
      if (!f.ok && f.reason === "no_element")
        extra = `  <- field not on this form (selector ${f.sel})`;
      else if (!f.ok && f.reason === "no_matching_option")
        extra = `  <- value "${f.want}" is not one of the dropdown options: [ ${(f.options || []).join("  |  ")} ]`;
      else if (!f.ok && f.reason === "empty")
        extra = "  <- field exists but ended up empty";
      else if (!f.ok) extra = `  <- ${f.reason}`;
      return `${mark}${labelFor(f.sel)}${extra}`;
    });
    const ta = data.typeaheads || {};
    const taLine = (name, t) => {
      if (!t || t.inPlan === false) return `  --  ${name}: not in this entry`;
      if (t.matched) return `  OK  ${name}: matched (${t.matchCount != null ? t.matchCount + " options" : t.options + " options"}${t.polls != null ? ", " + t.polls + " polls" : ""})`;
      let why = t.reason || (t.ready === false ? "typeahead never loaded" : "no match among options");
      let sample = t.sample ? `  offered: [ ${t.sample.filter(Boolean).join("  |  ")} ]` : "";
      let typed = t.typed ? `  (typed "${t.typed}")` : "";
      return `  XX  ${name}: NOT matched — wanted "${t.wanted || t.matched}"${typed} — ${why}${sample}`;
    };
    (DEBUG ? console.log : () => {})(
      "\n===== SUBMISSION DIAGNOSTICS [" + data.tag + "] =====\n" +
      "specialty: " + userSpecialty + "\n" +
      "fields on page: " + data.pageFields + "\n" +
      "SIMPLE FIELDS:\n" + (lines.join("\n") || "  (none)") + "\n" +
      "TYPEAHEADS:\n" +
      taLine("Procedure", ta.procedure) + "\n" +
      taLine("Hospital", ta.hospital) + "\n" +
      taLine("Consultant", ta.consultant) + "\n" +
      "SUMMARY: filled " + data.filled + ", failed [ " + friendlyFailed(data.failed).join(", ") + " ]\n" +
      "TIMING: " + (data.elapsedMs != null ? (data.elapsedMs/1000).toFixed(1) + "s total" : "?") + ", " + (data.fillPasses != null ? data.fillPasses + " fill pass(es)" : "") + "\n" +
      "===================================================\n"
    );
  }

  function handleMessage(event) {
    // When not debugging, make console logging a no-op *inside this handler
    // only*, so the per-stage diagnostic lines stay silent for testers. All the
    // setStatusMsg / setFilled UI updates below still run normally.
    const log = DEBUG ? console.log : () => {};
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type !== "diag") return;

      if (data.stage === "needs_login") {
        log(`[DIAG ${BUILD_TAG}] needs login`);
        setStatusMsg("Please sign in to eLogbook, then it will fill automatically.");
        return;
      }

      if (data.stage === "start") {
        log(`[DIAG ${BUILD_TAG}] script started — ${data.fieldCount} fields, ${data.readyState}, ${data.url}`);
        return;
      }

      if (data.stage === "skip_duplicate") {
        log(`[DIAG ${BUILD_TAG}] skip_duplicate`, JSON.stringify(data));
        return;
      }

      if (data.stage === "waiting") {
        log(`[DIAG ${BUILD_TAG}] waiting for form…`);
        return;
      }

      if (data.stage === "form_ready") {
        log(`[DIAG ${BUILD_TAG}] form ready after ${data.tries} tries — ${data.fieldCount} fields`);
        return;
      }

      if (data.stage === "form_never_appeared") {
        log(`[DIAG ${BUILD_TAG}] form never appeared`);
        setStatusMsg("Couldn't find the eLogbook form. Please make sure you're on the Add Operation page.");
        return;
      }

      if (data.stage === "script_error") {
        log(`[DIAG ${BUILD_TAG}] script error`, data.message);
        return;
      }

      if (data.stage === "report") {
        printReport(data);
        const filledCount = (data.fields || []).filter((f) => f.status === "OK").length;
        setFilled(filledCount);
        setStatusMsg(`Filled ${filledCount} fields. Review and Save on eLogbook.`);
        return;
      }

      log(`[DIAG ${BUILD_TAG}]`, JSON.stringify(data));
    } catch (e) {
      const log = DEBUG ? console.log : () => {};
      log(`[DIAG ${BUILD_TAG}] handleMessage parse error`, e);
    }
  }
  function handleRetry() {
    setNeedsLogin(false);
    setFilled(false);
    setFailedFields([]);
    setStatusMsg("Filling your entry…");
    if (webRef.current) {
      webRef.current.injectJavaScript(buildFullInjectionScript(plan));
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        {!filled && !needsLogin ? (
          <ActivityIndicator size="small" color={colors.teal} style={{ marginRight: spacing.sm }} />
        ) : (
          <Ionicons name="lock-closed" size={14} color={colors.tealDeep} style={{ marginRight: spacing.sm }} />
        )}
        <Text style={styles.statusText}>{statusMsg}</Text>
        <Text style={styles.retryBtn} onPress={handleRetry}>Refill</Text>
      </View>

      {plan ? (
        <WebView
          ref={webRef}
          source={{ uri: FORM_URL }}
          style={styles.web}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          injectedJavaScript={buildFullInjectionScript(plan)}
          onMessage={handleMessage}
        />
      ) : (
        <View style={styles.web} />
      )}

      <View style={styles.footer}>
        <View style={styles.footerNoteRow}>
          <Ionicons name="shield-checkmark" size={16} color={colors.tealDeep} style={{ marginRight: spacing.sm, marginTop: 1 }} />
          <Text style={styles.footerNote}>
            Review on eLogbook and submit there — Smart Portfolio never submits for you.
            Patient details are never auto-filled.
          </Text>
        </View>
        <AppButton href="/home">Done — back to home</AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl + spacing.xxxl, // clear the device status bar / notch
    paddingBottom: spacing.md,
    backgroundColor: colors.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusText: { fontSize: 13, color: colors.navy, flex: 1 },
  retryBtn: { fontSize: 13, color: colors.teal, fontWeight: "700", paddingHorizontal: spacing.sm },
  web: { flex: 1 },
  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  footerNoteRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.md },
  footerNote: { flex: 1, fontSize: 11, color: colors.textSecondary, lineHeight: 16 },
});
