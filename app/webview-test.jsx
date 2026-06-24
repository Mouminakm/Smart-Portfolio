// app/webview-test.jsx
// Phase 7 injection test bench.
//   - Fill form (test): easy (text/select) + medium (checkbox/radio)
//   - Fill procedure (test): Option B injects the FULL PROCEDURE NAME into the
//     typeahead box (+ node-id into hidden), verifies the box shows the name;
//     if it didn't truly take, falls back to Option A (click the node-id button).

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

// ---- procedure: ZERO-TAP via the real Angular components. Find the
// ngx-bootstrap TypeaheadDirective in __ngContext__, type the query, wait for
// its _matches to populate, then call changeModel(match) — the component's OWN
// selection path. Belt-and-braces: also call eLogbook's wrapper.onTypeaheadSelect. ----
function buildProcedureScript(proc) {
    return `
    (function() {
      var proc = ${JSON.stringify(proc)};
      var searchSel = '#operationsAccordion-Typeahead';
  
      function report(ok, detail){
        window.ReactNativeWebView.postMessage(JSON.stringify({ type:'procedure', path:'ngContext', ok:ok, detail:detail||'' }));
      }
  
      var input = document.querySelector(searchSel);
      if(!input || !input.__ngContext__){ report(false, 'no ngContext on typeahead input'); return; }
  
      // Find the directive (has changeModel + _matches) and eLogbook's wrapper
      // (has selectedNodeId + onTypeaheadSelect) by fingerprint, not index.
      function findInstances(){
        var ctx = input.__ngContext__;
        var directive = null, wrapper = null, seen = new Set();
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
      if(!found.directive){ report(false, 'typeahead directive not found in context'); return; }
      var directive = found.directive;
      var wrapper = found.wrapper;
  
      // Set the input value through the native setter and fire input, so the
      // directive runs its own search and populates _matches.
      var proto = Object.getPrototypeOf(input);
      var desc = Object.getOwnPropertyDescriptor(proto, 'value');
      desc.set.call(input, proc.searchText);
      input.dispatchEvent(new Event('input', { bubbles: true }));
  
      // Wait for _matches to contain our procedure, then select it for real.
      var tries = 0;
      function poll(){
        tries++;
        var matches = directive._matches || [];
        // find the match whose item.id equals our node-id (most precise)
        var match = matches.find(function(m){ return m && m.item && String(m.item.id) === String(proc.nodeId); });
        if(match){
          directive.changeModel(match);              // the component's REAL selection
          if(wrapper && typeof wrapper.onTypeaheadSelect === 'function'){
            try { wrapper.onTypeaheadSelect(match); } catch(e){}   // belt-and-braces
          }
          setTimeout(function(){
            var sel = wrapper ? wrapper.selectedNodeId : '(no wrapper)';
            var hidden = document.querySelector('#operationsAccordion-SelectedValue');
            report(true, 'selected via changeModel; wrapper.selectedNodeId=' + sel + '; hidden="' + (hidden?hidden.value:'') + '"');
          }, 300);
          return;
        }
        if(tries < 40) return setTimeout(poll, 200); // ~8s
        report(false, 'matches never populated (count: ' + matches.length + ')');
      }
      poll();
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
    webRef.current.injectJavaScript(buildProcedureScript(TEST_PROCEDURE));
  }

  function handleMessage(event) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "fill") {
        if (data.error) setReport("Fill failed: " + data.error);
        else setReport(data.results.map((r) => (r.ok ? "✓ " : "✗ ") + (r.selector || "(radio)") + (r.ok ? "" : " — " + r.reason)).join("\n"));
      } else if (data.type === "procedure") {
        setReport((data.ok ? "✓ Procedure set via Option " : "✗ Procedure via Option ") + data.path + "\n" + data.detail);
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