// app/webview-test.jsx
// Phase 7, stage 3: inject the EASY-LAYER fills (text/date/textarea + selects)
// into the live eLogbook form on demand, and report which fields landed.
// Waits for the form to exist first (Angular renders it late).

import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import AppButton from "../components/AppButton";

// --- Test values (hard-coded for now; no real patient data) ---
// Selects use the EXACT visible option text from our schema/DOM capture.
const TEST_VALUES = {
  text: {
    "#dateofoperation": "23-06-2026",
    "#operationnotes": "Test injection: elective endoscopic third ventriculostomy. Primary surgeon, consultant supervised. No complications.",
  },
  selects: {
    "#operationspecialty": "Neurosurgery",
    "#cepod": "Elective: Surgery at convenient time",
    "#asagrade": "Fit and Well",
    "#supervision": "Performed",
  },
};

// This whole function is sent INTO the page and run there when we tap Fill.
// It waits for the form, fills the easy fields, and posts back a report.
function buildFillScript(values) {
  return `
  (function() {
    function fireInput(el) {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function fillText(selector, value) {
      var el = document.querySelector(selector);
      if (!el) return { selector: selector, ok: false, reason: 'not found' };
      el.value = value; fireInput(el);
      return { selector: selector, ok: true };
    }
    function selectByLabel(selector, labelText) {
      var sel = document.querySelector(selector);
      if (!sel) return { selector: selector, ok: false, reason: 'not found' };
      var target = labelText.trim().toLowerCase();
      var match = Array.from(sel.options).find(function(o){ return o.text.trim().toLowerCase() === target; });
      if (!match) return { selector: selector, ok: false, reason: 'no option matches: ' + labelText };
      sel.value = match.value; fireInput(sel);
      return { selector: selector, ok: true };
    }

    var values = ${JSON.stringify(values)};

    // Wait for the form to exist (a known field), then fill. Poll up to ~15s.
    var tries = 0;
    function run() {
      tries++;
      if (!document.querySelector('#operationnotes')) {
        if (tries < 30) return setTimeout(run, 500);
        window.ReactNativeWebView.postMessage(JSON.stringify({ type:'fill', error:'form never appeared' }));
        return;
      }
      var results = [];
      Object.keys(values.text).forEach(function(sel){ results.push(fillText(sel, values.text[sel])); });
      Object.keys(values.selects).forEach(function(sel){ results.push(selectByLabel(sel, values.selects[sel])); });
      window.ReactNativeWebView.postMessage(JSON.stringify({ type:'fill', results: results }));
    }
    run();
  })();
  true;
  `;
}

export default function WebViewTestScreen() {
  const webRef = useRef(null);
  const [report, setReport] = useState("Log in and go to the Add Operation form, then tap Fill.");
// Navigate the WebView to the Add Operation form (works once logged in).
const FORM_URL = "https://client.elogbook.org/eLogbook/Operations/OperationMaintain/Add";
function goToForm() {
  setReport("Going to the Add Operation form…");
  // Tell the page to navigate. If not logged in, eLogbook will show login.
  webRef.current.injectJavaScript(`window.location.href = ${JSON.stringify(FORM_URL)}; true;`);
}
  function fillForm() {
    setReport("Filling…");
    webRef.current.injectJavaScript(buildFillScript(TEST_VALUES));
  }

  function handleMessage(event) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "fill") {
        if (data.error) {
          setReport("Fill failed: " + data.error);
        } else {
          // Build a readable per-field summary.
          const lines = data.results.map(
            (r) => (r.ok ? "✓ " : "✗ ") + r.selector + (r.ok ? "" : " — " + r.reason)
          );
          setReport(lines.join("\n"));
        }
      }
    } catch (e) {
      setReport("Raw: " + event.nativeEvent.data);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.banner}>eLogbook (injection test)</Text>

      <View style={styles.controls}>
        <AppButton onPress={goToForm}>Go to Add Operation</AppButton>
        <View style={{ height: 8 }} />
        <AppButton onPress={fillForm}>Fill form (test)</AppButton>
      </View>

      <View style={styles.reportPanel}>
        <Text style={styles.reportText}>{report}</Text>
      </View>

      <WebView
        ref={webRef}
        source={{ uri: "https://client.elogbook.org/eLogbook/Operations/OperationMaintain/Add" }}
        style={styles.web}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        onMessage={handleMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  banner: { fontSize: 13, fontWeight: "600", color: "#2563eb", textAlign: "center", paddingVertical: 6 },
  controls: { paddingHorizontal: 16, paddingBottom: 6 },
  reportPanel: { backgroundColor: "#f3f4f6", padding: 10, borderTopWidth: 1, borderTopColor: "#e5e7eb", maxHeight: 160 },
  reportText: { fontSize: 11, color: "#1a1a1a", fontFamily: "monospace" },
  web: { flex: 1 },
});