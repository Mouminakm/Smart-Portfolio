// app/webview-test.jsx
// Phase 7 injection test bench.
//   - Fill form (test): easy (text/select) + medium (checkbox/radio)
//   - Fill procedure/hospital (test): zero-tap typeahead via __ngContext__ changeModel
//   - Fill consultant (test): account-specific select matched by name

import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import AppButton from "../components/AppButton";

const FORM_URL = "https://client.elogbook.org/eLogbook/Operations/OperationMaintain/Add";

// --- Test values (no real patient data) ---
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
  checkboxes: { "#minimalaccess": true },
  radios: [
    { value: "Yes", options: [ { label: "No", selector: "#endoscope0" }, { label: "Yes", selector: "#endoscope1" } ] },
  ],
};

const TEST_PROCEDURE = {
  nodeId: "93",
  searchText: "ventriculostomy",
  name: "Endoscopic third ventriculostomy",
  fullName: "Endoscopic Third Ventriculostomy (Cranial-Csf Circulation)",
};

const TEST_HOSPITAL = {
  id: "2278",
  searchText: "James Paget",
  name: "James Paget University Hospital (Great Yarmouth)",
};

// A name as the user might store it; we match it against the live dropdown.
const TEST_CONSULTANT = "Christopher Uff";

// ---- easy + medium fill ----
function buildFillScript(values) {
  return `
  (function() {
    function fireInput(el){ el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }
    function fillText(s,v){ var el=document.querySelector(s); if(!el) return {selector:s,ok:false,reason:'not found'}; el.value=v; fireInput(el); return {selector:s,ok:true}; }
    function selectByLabel(s,l){ var sel=document.querySelector(s); if(!sel) return {selector:s,ok:false,reason:'not found'}; var t=l.trim().toLowerCase(); var m=Array.from(sel.options).find(function(o){return o.text.trim().toLowerCase()===t;}); if(!m) return {selector:s,ok:false,reason:'no option: '+l}; sel.value=m.value; fireInput(sel); return {selector:s,ok:true}; }
    function setCheckbox(s,v){ var el=document.querySelector(s); if(!el) return {selector:s,ok:false,reason:'not found'}; el.checked=!!v; fireInput(el); return {selector:s,ok:true}; }
    function setRadio(opts,v){ var t=String(v).trim().toLowerCase(); var c=opts.find(function(o){return o.label.trim().toLowerCase()===t;}); if(!c) return {ok:false,reason:'no radio: '+v}; var el=document.querySelector(c.selector); if(!el) return {selector:c.selector,ok:false,reason:'not found'}; el.checked=true; fireInput(el); return {selector:c.selector,ok:true}; }
    var values=${JSON.stringify(values)};
    var tries=0;
    function run(){
      tries++;
      if(!document.querySelector('#operationnotes')){ if(tries<30) return setTimeout(run,500); window.ReactNativeWebView.postMessage(JSON.stringify({type:'fill',error:'form never appeared'})); return; }
      var results=[];
      Object.keys(values.text).forEach(function(s){results.push(fillText(s,values.text[s]));});
      Object.keys(values.selects).forEach(function(s){results.push(selectByLabel(s,values.selects[s]));});
      Object.keys(values.checkboxes).forEach(function(s){results.push(setCheckbox(s,values.checkboxes[s]));});
      values.radios.forEach(function(r){results.push(setRadio(r.options,r.value));});
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'fill',results:results}));
    }
    run();
  })();
  true;
  `;
}

// ---- shared zero-tap typeahead selector via __ngContext__ ----
function buildTypeaheadScript(opts) {
  // opts: { kind, searchSel, id, searchText }
  return `
  (function() {
    var o = ${JSON.stringify(opts)};

    function report(ok, detail){
      window.ReactNativeWebView.postMessage(JSON.stringify({ type:o.kind, ok:ok, detail:detail||'' }));
    }

    var input = document.querySelector(o.searchSel);
    if(!input || !input.__ngContext__){ report(false, 'no ngContext on ' + o.kind + ' input'); return; }

    function findInstances(){
      var ctx = input.__ngContext__, directive = null, wrapper = null, seen = new Set();
      for(var i=0;i<ctx.length;i++){
        var v = ctx[i];
        if(!v || typeof v!=='object' || seen.has(v)) continue;
        seen.add(v);
        if(typeof v.changeModel==='function' && '_matches' in v) directive = v;
        if('selectedNodeId' in v && typeof v.onTypeaheadSelect==='function') wrapper = v;
      }
      return { directive: directive, wrapper: wrapper };
    }

    var found = findInstances();
    if(!found.directive){ report(false, o.kind + ' typeahead directive not found'); return; }
    var directive = found.directive, wrapper = found.wrapper;

    var proto = Object.getPrototypeOf(input);
    var desc = Object.getOwnPropertyDescriptor(proto, 'value');
    desc.set.call(input, o.searchText);
    input.dispatchEvent(new Event('input', { bubbles: true }));

    var tries = 0;
    function poll(){
      tries++;
      var matches = directive._matches || [];
      var match = matches.find(function(m){ return m && m.item && String(m.item.id) === String(o.id); });
      if(match){
        directive.changeModel(match);
        if(wrapper && typeof wrapper.onTypeaheadSelect === 'function'){ try { wrapper.onTypeaheadSelect(match); } catch(e){} }
        setTimeout(function(){
          var sel = wrapper ? wrapper.selectedNodeId : '(no wrapper)';
          report(true, 'selected; wrapper.selectedNodeId=' + sel);
        }, 300);
        return;
      }
      if(tries < 40) return setTimeout(poll, 200);
      report(false, o.kind + ' matches never populated (count: ' + matches.length + ')');
    }
    poll();
  })();
  true;
  `;
}

// ---- responsibleconsultant: account-specific <select>, matched by name text ----
function buildConsultantScript(name) {
  return `
  (function() {
    function fireInput(el){ el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }
    var name = ${JSON.stringify(name)};

    function report(ok, detail){
      window.ReactNativeWebView.postMessage(JSON.stringify({ type:'consultant', ok:ok, detail:detail||'' }));
    }

    var sel = document.querySelector('#responsibleconsultant');
    if(!sel){ report(false, 'responsibleconsultant not found'); return; }

    var target = name.trim().toLowerCase();
    var matches = Array.from(sel.options).filter(function(o){
      return o.value !== 'UNKNOWN' && o.text.toLowerCase().indexOf(target) !== -1;
    });

    if(matches.length === 1){
      sel.value = matches[0].value;
      fireInput(sel);
      report(true, 'selected: ' + matches[0].text);
    } else if(matches.length === 0){
      report(false, 'no match for "' + name + '" — leave for user');
    } else {
      report(false, matches.length + ' matches for "' + name + '" — ambiguous, leave for user');
    }
  })();
  true;
  `;
}

export default function WebViewTestScreen() {
  const webRef = useRef(null);
  const [report, setReport] = useState("Open the Add Operation form, then use the buttons.");

  function goToForm() {
    setReport("Going to the form…");
    webRef.current.injectJavaScript(`window.location.href = ${JSON.stringify(FORM_URL)}; true;`);
  }
  function fillForm() {
    setReport("Filling easy/medium fields…");
    webRef.current.injectJavaScript(buildFillScript(TEST_VALUES));
  }
  function fillProcedure() {
    setReport("Setting procedure…");
    webRef.current.injectJavaScript(buildTypeaheadScript({
      kind: "procedure",
      searchSel: "#operationsAccordion-Typeahead",
      id: TEST_PROCEDURE.nodeId,
      searchText: TEST_PROCEDURE.searchText,
    }));
  }
  function fillHospital() {
    setReport("Setting hospital…");
    webRef.current.injectJavaScript(buildTypeaheadScript({
      kind: "hospital",
      searchSel: "#hospitalsAccordion-Typeahead",
      id: TEST_HOSPITAL.id,
      searchText: TEST_HOSPITAL.searchText,
    }));
  }
  function fillConsultant() {
    setReport("Setting consultant…");
    webRef.current.injectJavaScript(buildConsultantScript(TEST_CONSULTANT));
  }

  function handleMessage(event) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "fill") {
        if (data.error) setReport("Fill failed: " + data.error);
        else setReport(data.results.map((r) => (r.ok ? "✓ " : "✗ ") + (r.selector || "(radio)") + (r.ok ? "" : " — " + r.reason)).join("\n"));
      } else if (data.type === "procedure") {
        setReport((data.ok ? "✓ Procedure " : "✗ Procedure — ") + data.detail);
      } else if (data.type === "hospital") {
        setReport((data.ok ? "✓ Hospital " : "✗ Hospital — ") + data.detail);
      } else if (data.type === "consultant") {
        setReport((data.ok ? "✓ Consultant " : "✗ Consultant — ") + data.detail);
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
        <View style={{ height: 6 }} />
        <AppButton onPress={fillForm}>Fill form (test)</AppButton>
        <View style={{ height: 6 }} />
        <AppButton onPress={fillProcedure}>Fill procedure (test)</AppButton>
        <View style={{ height: 6 }} />
        <AppButton onPress={fillHospital}>Fill hospital (test)</AppButton>
        <View style={{ height: 6 }} />
        <AppButton onPress={fillConsultant}>Fill consultant (test)</AppButton>
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
  reportPanel: { backgroundColor: "#f3f4f6", padding: 10, borderTopWidth: 1, borderTopColor: "#e5e7eb", maxHeight: 160 },
  reportText: { fontSize: 11, color: "#1a1a1a", fontFamily: "monospace" },
  web: { flex: 1 },
});