// app/submission.jsx
// Core loop screen — Submission via WebView (spec F8).
// Loads the real eLogbook Add Operation form, builds an injection plan from the
// dictated entry (EntryContext), waits for the Angular form to render, then
// auto-fills every field. The user reviews and submits on eLogbook itself.

import { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import AppButton from "../components/AppButton";
import { useEntry } from "../contexts/EntryContext";
import { buildInjectionPlan } from "../lib/buildInjectionPlan";
import schema from "../schemas/elogbook_neurosurgery_operation_log.json";

const FORM_URL = "https://client.elogbook.org/eLogbook/Operations/OperationMaintain/Add";

// Builds ONE injected script that fills the whole form from the plan. It waits
// for the Angular form to exist, then runs each field type, then reports a
// summary back. (Same proven mechanisms as the test bench, driven by `plan`.)
function buildFullInjectionScript(plan) {
  return `
  (function() {
    function fireInput(el){ el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }
    function fillText(s,v){ var el=document.querySelector(s); if(!el) return false; el.value=v; fireInput(el); return true; }
    function selectByLabel(s,l){ var sel=document.querySelector(s); if(!sel) return false; var t=String(l).trim().toLowerCase(); var m=Array.from(sel.options).find(function(o){return o.text.trim().toLowerCase()===t;}); if(!m) return false; sel.value=m.value; fireInput(sel); return true; }
    function setCheckbox(s,v){ var el=document.querySelector(s); if(!el) return false; el.checked=!!v; fireInput(el); return true; }
    function setRadio(opts,v){ var t=String(v).trim().toLowerCase(); var c=opts.find(function(o){return o.label.trim().toLowerCase()===t;}); if(!c) return false; var el=document.querySelector(c.selector); if(!el) return false; el.checked=true; fireInput(el); return true; }

    // Zero-tap typeahead select via the Angular component (procedure + hospital).
    function selectTypeahead(searchSel, id, searchText, done){
      var input = document.querySelector(searchSel);
      if(!input || !input.__ngContext__){ done(false); return; }
      var ctx = input.__ngContext__, directive = null, wrapper = null, seen = new Set();
      for(var i=0;i<ctx.length;i++){
        var v = ctx[i];
        if(!v || typeof v!=='object' || seen.has(v)) continue;
        seen.add(v);
        if(typeof v.changeModel==='function' && '_matches' in v) directive = v;
        if('selectedNodeId' in v && typeof v.onTypeaheadSelect==='function') wrapper = v;
      }
      if(!directive){ done(false); return; }
      var proto = Object.getPrototypeOf(input);
      var desc = Object.getOwnPropertyDescriptor(proto, 'value');
      desc.set.call(input, searchText);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      var tries = 0;
      (function poll(){
        tries++;
        var matches = directive._matches || [];
        var match = matches.find(function(m){ return m && m.item && String(m.item.id) === String(id); });
        if(match){
          directive.changeModel(match);
          if(wrapper && typeof wrapper.onTypeaheadSelect === 'function'){ try { wrapper.onTypeaheadSelect(match); } catch(e){} }
          done(true); return;
        }
        if(tries < 40) return setTimeout(poll, 200);
        done(false);
      })();
    }

    function selectConsultant(name){
      var sel = document.querySelector('#responsibleconsultant');
      if(!sel) return false;
      var target = String(name).trim().toLowerCase();
      var m = Array.from(sel.options).filter(function(o){ return o.value !== 'UNKNOWN' && o.text.toLowerCase().indexOf(target) !== -1; });
      if(m.length === 1){ sel.value = m[0].value; fireInput(sel); return true; }
      return false;
    }

    var plan = ${JSON.stringify(plan)};

    // Wait for the Angular form, then fill everything.
var tries = 0;
    function run(){
      tries++;
      if(!document.querySelector('#operationnotes')){
        // report progress every few tries so we can see what's happening
        if(tries % 4 === 0){
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type:'waiting',
            tries: tries,
            url: window.location.href,
            fieldCount: document.querySelectorAll('input, select, textarea').length
          }));
        }
        if(tries < 40) return setTimeout(run, 500);
        window.ReactNativeWebView.postMessage(JSON.stringify({ type:'filled', error:'form never appeared' }));
        return;
      }

      var filled = 0, failed = [];
      Object.keys(plan.text).forEach(function(s){ if(fillText(s, plan.text[s])) filled++; else failed.push(s); });
      Object.keys(plan.selects).forEach(function(s){ if(selectByLabel(s, plan.selects[s])) filled++; else failed.push(s); });
      Object.keys(plan.checkboxes).forEach(function(s){ if(setCheckbox(s, plan.checkboxes[s])) filled++; else failed.push(s); });
      plan.radios.forEach(function(r){ if(setRadio(r.options, r.value)) filled++; else failed.push('radio'); });
      if(plan.consultant){ if(selectConsultant(plan.consultant)) filled++; else failed.push('consultant'); }

      // Typeaheads are async; run procedure then hospital, then report.
      function afterProcedure(){
        if(plan.hospital){
          selectTypeahead('#hospitalsAccordion-Typeahead', plan.hospital.id, plan.hospital.searchText, function(ok){
            if(ok) filled++; else failed.push('hospital');
            report();
          });
        } else { report(); }
      }
      function report(){
        window.ReactNativeWebView.postMessage(JSON.stringify({ type:'filled', filled: filled, failed: failed }));
      }

      if(plan.procedure){
        selectTypeahead('#operationsAccordion-Typeahead', plan.procedure.nodeId, plan.procedure.searchText, function(ok){
          if(ok) filled++; else failed.push('procedure');
          afterProcedure();
        });
      } else { afterProcedure(); }
    }
    run();
  })();
  true;
  `;
}

export default function SubmissionScreen() {
  const { fieldValues } = useEntry();
  const webRef = useRef(null);
  const [statusMsg, setStatusMsg] = useState("Opening eLogbook…");
  const [filled, setFilled] = useState(false);

  // Build the plan from the dictated entry.
  const plan = buildInjectionPlan(fieldValues, schema);

  // When the page finishes loading, inject once (the script waits for the form).
  function handleLoadEnd() {
    if (hasInjected.current) return;
    hasInjected.current = true;
    setStatusMsg("Filling your entry…");
    webRef.current.injectJavaScript(buildFullInjectionScript(plan));
  }

  function handleMessage(event) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "waiting") {
        setStatusMsg(`Waiting for form… (fields: ${data.fieldCount}, ${data.url.slice(0, 40)})`);
        return;
      }
      if (data.type === "filled") {
        if (data.error) {
          setStatusMsg("Couldn't fill the form automatically — you can fill it manually below.");
        } else {
          setStatusMsg(`Filled ${data.filled} field(s). Review everything, then Save on eLogbook.`);
          setFilled(true);
        }
      }
    } catch (e) {
      // ignore non-JSON messages
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        {!filled ? <ActivityIndicator size="small" color="#2563eb" style={{ marginRight: 8 }} /> : null}
        <Text style={styles.statusText}>{statusMsg}</Text>
      </View>

      <WebView
        ref={webRef}
        source={{ uri: FORM_URL }}
        style={styles.web}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        injectedJavaScript={buildFullInjectionScript(plan)}
        onMessage={handleMessage}
      />

      <View style={styles.footer}>
        <Text style={styles.footerNote}>
          Check the form on eLogbook and submit there. Smart Portfolio never submits for you.
          Patient ID and age are never auto-filled — add them on the site if required.
        </Text>
        <AppButton href="/home">Done — back to home</AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#eff6ff",
    borderBottomWidth: 1,
    borderBottomColor: "#bfdbfe",
  },
  statusText: { fontSize: 13, color: "#1e40af", flex: 1 },
  web: { flex: 1 },
  footer: { padding: 12, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  footerNote: { fontSize: 11, color: "#888888", lineHeight: 16, marginBottom: 10 },
});