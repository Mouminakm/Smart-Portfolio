// app/submission.jsx
// Core loop screen — Submission via WebView (spec F8).
// PLATFORM-AGNOSTIC: reads which platform this entry is for from the route
// params, looks up that platform's adapter, and lets the adapter supply the form
// URL, the schema, the fill plan and the injected script. The user always
// reviews and submits on the portfolio site itself — we never auto-submit.
//
// This build carries a DIAGNOSTICS layer: every stage and every field posts a
// labelled message (tag "diag-2026-06-29a") to the Expo terminal so failures are visible.

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import AppButton from "../components/AppButton";
import { useAuth } from "../contexts/AuthContext";
import { useEntry } from "../contexts/EntryContext";
import { getPlatformAdapter } from "../platforms";
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
  // True while we're waiting for the user to sign in to the portfolio site, so
  // we know to send them back to the form once they're through.
  const awaitingLogin = useRef(false);
  // Guard: once we've sent the user off to sign in, don't touch the WebView
  // again until they tap Refill. Without this we fight the user's own login
  // navigation and end up in a redirect loop between the error page and the
  // login page.
  const sentToLogin = useRef(false);

  // Which platform is this entry for? Dictation passes it through the route.
  // If it's missing we fall back to eLogbook, so nothing changes for existing
  // entries — but a Turas/ISCP entry now reaches the RIGHT adapter.
  const { platform, entryType } = useLocalSearchParams();
  const adapter = getPlatformAdapter(platform);

  const [statusMsg, setStatusMsg] = useState(`Opening ${adapter.displayName}…`);
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

  // The adapter decides how its schema is keyed — eLogbook by SPECIALTY,
  // Turas/ISCP by ENTRY TYPE — so this screen doesn't need to know.
  const schema = adapter.getSchema({ specialty: userSpecialty, entryType });
  const formUrl = adapter.formUrl({ entryType, schema });

  const plan =
    userHospitals === null || !schema
      ? null
      : adapter.buildPlan(fieldValues, schema, userHospitals, userSpecialty);

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
        setNeedsLogin(true);
        awaitingLogin.current = true;
        setStatusMsg(`Sign in to ${adapter.displayName} below, then tap Refill.`);

        // Some sites don't show a login page when you open a form without a
        // session — ISCP just serves an ERROR at the form's own URL, leaving the
        // user stranded with nothing to sign in to. If the adapter knows where
        // its login lives, take them there ONCE.
        if (adapter.loginUrl && webRef.current && !sentToLogin.current) {
          sentToLogin.current = true;
          const loginUrl = adapter.loginUrl();
          log(`[DIAG ${BUILD_TAG}] sending user to login: ${loginUrl}`);
          webRef.current.injectJavaScript(
            `window.location.href = ${JSON.stringify(loginUrl)}; true;`
          );
        }
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
        setStatusMsg(`Couldn't find the ${adapter.displayName} form. Please check you're on the right page.`);
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
        setStatusMsg(`Filled ${filledCount} fields. Review and Save on ${adapter.displayName}.`);
        return;
      }

      log(`[DIAG ${BUILD_TAG}]`, JSON.stringify(data));
    } catch (e) {
      const log = DEBUG ? console.log : () => {};
      log(`[DIAG ${BUILD_TAG}] handleMessage parse error`, e);
    }
  }
  // The portfolio sites bounce you to their login page, and then — after you
  // sign in — land you on their DASHBOARD, not the form we asked for. So watch
  // navigation: once we're clearly past the login page, send the WebView back
  // to the form. The injected script then runs again and fills as normal.
  function handleNavChange(navState) {
    const url = String(navState.url || "").toLowerCase();
    if (!awaitingLogin.current || navState.loading) return;

    // Back on the form? The injected script runs on this load and fills.
    const onForm = url.split("?")[0] === String(formUrl).toLowerCase().split("?")[0];
    if (onForm) {
      awaitingLogin.current = false;
      sentToLogin.current = false;
      setNeedsLogin(false);
      return;
    }

    // Anywhere else — and this is the subtle bit that caused a redirect loop:
    // if WE sent them to the login page, they are still signing in. Bouncing
    // them back to the form now would hit the same "not logged in" error, which
    // would send them to login again, and round and round. So once we've sent
    // someone to sign in, we leave the WebView alone. They sign in, then tap
    // Refill (the status bar tells them to).
    if (sentToLogin.current) return;

    // Otherwise the SITE bounced them to login of its own accord and they've
    // now landed somewhere that isn't the form (a dashboard, typically) — so
    // take them to the form.
    awaitingLogin.current = false;
    setNeedsLogin(false);
    setStatusMsg("Signed in — opening your form…");
    if (webRef.current) {
      webRef.current.injectJavaScript(
        `window.location.href = ${JSON.stringify(formUrl)}; true;`
      );
    }
  }

  function handleRetry() {
    awaitingLogin.current = false;
    sentToLogin.current = false;
    setNeedsLogin(false);
    setFilled(false);
    setFailedFields([]);
    setStatusMsg("Filling your entry…");

    // Refill always NAVIGATES to the form rather than re-running the script in
    // place. After signing in, the user is on the portfolio's dashboard, not the
    // form — and re-injecting there would do nothing. Navigating is a fresh page
    // load, so the script is injected automatically and fills. If we're already
    // on the form, this simply reloads it, which is harmless.
    if (webRef.current) {
      webRef.current.injectJavaScript(
        `window.location.href = ${JSON.stringify(formUrl)}; true;`
      );
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
          source={{ uri: formUrl }}
          style={styles.web}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          injectedJavaScript={adapter.buildScript(plan)}
          onMessage={handleMessage}
          onNavigationStateChange={handleNavChange}
        />
      ) : (
        <View style={styles.web} />
      )}

      <View style={styles.footer}>
        <View style={styles.footerNoteRow}>
          <Ionicons name="shield-checkmark" size={16} color={colors.tealDeep} style={{ marginRight: spacing.sm, marginTop: 1 }} />
          <Text style={styles.footerNote}>
            Review on {adapter.displayName} and submit there — Smart Portfolio
            never submits for you. Patient details are never auto-filled.
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