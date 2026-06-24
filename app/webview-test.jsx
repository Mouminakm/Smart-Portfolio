// app/webview-test.jsx
// Phase 7: easy layer (text/select) + MEDIUM layer (checkbox/radio) injection
// into the live eLogbook Add Operation form, with per-field reporting.

import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import AppButton from "../components/AppButton";

// --- Test values (hard-coded; no real patient data) ---
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
  // Checkboxes: selector -> true/false
  checkboxes: {
    "#private": false,
    "#roboticsurgery": false,
    "#minimalaccess": true,
    "#complicationscheck": false,
  },
  // Radio groups: each is a list of { label, selector }, plus the chosen value.
  radios: [
    {
      value: "Yes",
      options: [
        { label: "No", selector: "#endoscope0" },
        { label: "Yes", selector: "#endoscope1" },
      ],
    },
    {
      value: "No",
      options: [
        { label: "No", selector: "#microscope0" },
        { label: "Yes", selector: "#microscope1" },
      ],
    },
    {
      value: "No",
      options: [
        { label: "Unknown", selector: "#ishubcase0" },
        { label: "No", selector: "#ishubcase1" },
        { label: "Yes", selector: "#ishubcase2" },
      ],
    },
  ],
};

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
    function setCheckbox(selector, value) {
      var el = document.querySelector(selector);
      if (!el) return { selector: selector, ok: false, reason: 'not found' };
      el.checked = !!value; fireInput(el);
      return { selector: selector, ok: true, note: value ? 'checked' : 'unchecked' };
    }
    function setRadio(options, value) {
      var target = String(value).trim().toLowerCase();
      var choice = options.find(function(o){ return o.label.trim().toLowerCase() === target; });
      if (!choice) return { ok: false, reason: 'no radio option matches: ' + value };
      var el = document.querySelector(choice.selector);
      if (!el) return { selector: choice.selector, ok: false, reason: 'not found' };
      el.checked = true; fireInput(el);
      return { selector: choice.selector, ok: true };
    }

    var values = ${JSON.stringify(values)};

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
      Object.keys(values.checkboxes).forEach(function(sel){ results.push(setCheckbox(sel, values.checkboxes[sel])); });
      values.radios.forEach(function(r){ results.push(setRadio(r.options, r.value)); });
      window.ReactNativeWebView.postMessage(JSON.stringify({ type:'fill', results: results }));
    }
    run();
  })();
  true;
  `;
}

export default function WebViewTestScreen() {
  const webRef = useRef(null);
  const [report, setReport] = useState("Open the Add Operation form, then tap Fill.");

  const FORM_URL = "https://client.elogbook.org/eLogbook/Operations/OperationMaintain/Add";
  function goToForm() {
    setReport("Going to the Add Operation form…");
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
          const lines = data.results.map(
            (r) => (r.ok ? "✓ " : "✗ ") + (r.selector || "(radio)") + (r.ok ? (r.note ? " (" + r.note + ")" : "") : " — " + r.reason)
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
        source={{ uri: FORM_URL }}
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
  reportPanel: { backgroundColor: "#f3f4f6", padding: 10, borderTopWidth: 1, borderTopColor: "#e5e7eb", maxHeight: 200 },
  reportText: { fontSize: 11, color: "#1a1a1a", fontFamily: "monospace" },
  web: { flex: 1 },
});