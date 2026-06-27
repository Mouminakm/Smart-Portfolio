// app/submission.jsx
// Core loop screen — Submission via WebView (spec F8).
// Loads the real eLogbook Add Operation form, builds an injection plan from the
// dictated entry (EntryContext), waits for the Angular form to render, then
// auto-fills every field. The user reviews and submits on eLogbook itself.

import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import AppButton from "../components/AppButton";
import { useAuth } from "../contexts/AuthContext";
import { useEntry } from "../contexts/EntryContext";
import { getSpecialtyData } from "../data/specialtySchemas";
import { buildInjectionPlan } from "../lib/buildInjectionPlan";
import { loadProfile } from "../profile";

const FORM_URL = "https://client.elogbook.org/eLogbook/Operations/OperationMaintain/Add";

function buildFullInjectionScript(plan) {
  return `
  (function() {
    function fireInput(el){ el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }
   function fillText(s,v){ var el=document.querySelector(s); if(!el) return false; el.value=v; fireInput(el); return true; }
    function selectByLabel(s,l){ var sel=document.querySelector(s); if(!sel) return false; var t=String(l).trim().toLowerCase(); var m=Array.from(sel.options).find(function(o){return o.text.trim().toLowerCase()===t;}); if(!m) return false; sel.value=m.value; fireInput(sel); return true; }
    function setCheckbox(s,v){ var el=document.querySelector(s); if(!el) return false; el.checked=!!v; fireInput(el); return true; }
    function setRadio(opts,v){ var t=String(v).trim().toLowerCase(); var c=opts.find(function(o){return o.label.trim().toLowerCase()===t;}); if(!c) return false; var el=document.querySelector(c.selector); if(!el) return false; el.checked=true; fireInput(el); return true; }

    // Zero-tap typeahead select via the Angular component (procedure + hospital).
    // id        -> exact id match (procedure node-id, or hospital eLogbook id).
    // matchName -> fallback name match (only used when id is null).
 function selectTypeahead(searchSel, id, searchText, matchName, done, readyTries){
      var input = document.querySelector(searchSel);
      // On the slower-loading forms the typeahead's Angular context may not be
      // attached yet. Wait and retry a few times before giving up, rather than
      // bailing instantly (which left the hospital unfilled on cardiothoracic).
      if(!input || !input.__ngContext__){
        readyTries = (readyTries || 0) + 1;
        if(readyTries <= 25){
          return setTimeout(function(){
            selectTypeahead(searchSel, id, searchText, matchName, done, readyTries);
          }, 200);
        }
        done(false); return;
      }
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
        var match = null;
        if (id !== null && id !== undefined) {
          match = matches.find(function(m){ return m && m.item && String(m.item.id) === String(id); });
        } else {
          var core = function(s){
            return String(s).toLowerCase()
              .replace(/^the\s+/, "")
              .replace(/\s*\([^)]*\)\s*$/, "")
              .replace(/\s+/g, " ")
              .trim();
          };
          var full = String(matchName || searchText).toLowerCase().replace(/\s+/g, " ").trim();
          var want = core(matchName || searchText);
          match =
            // 1. exact full-name match (incl. suffix like "(London)") — most precise
            matches.find(function(m){ return m && m.item && String(m.item.name).toLowerCase().replace(/\s+/g," ").trim() === full; }) ||
            // 2. exact core-name match (suffix stripped)
            matches.find(function(m){ return m && m.item && core(m.item.name) === want; }) ||
            // 3. starts-with, either direction
            matches.find(function(m){ return m && m.item && core(m.item.name).indexOf(want) === 0; }) ||
            matches.find(function(m){ return m && m.item && want.indexOf(core(m.item.name)) === 0; });
        }
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

      // Break the dictated name into significant parts (drop titles and short
      // bits), so we can match regardless of order or format. e.g. "Michael
      // Carter" should match an option like "Carter, Michael" or "Mr M Carter".
      var titles = { 'mr':1,'mrs':1,'ms':1,'miss':1,'dr':1,'prof':1,'professor':1,'mister':1 };
      // Split on spaces/commas/dots WITHOUT a regex literal (backslash escapes
      // are fragile inside this stringified injected script). Lowercase, then
      // break on any run of non-letters by replacing them with a single space.
      var cleaned = String(name).toLowerCase();
      var spaced = "";
      for(var ci=0; ci<cleaned.length; ci++){
        var ch = cleaned[ci];
        spaced += (ch >= 'a' && ch <= 'z') ? ch : ' ';
      }
      var parts = spaced.split(' ').filter(function(w){ return w.length > 1 && !titles[w]; });
      if(parts.length === 0) return false;

      // An option matches if it contains EVERY significant name part.
      var candidates = Array.from(sel.options).filter(function(o){
        if(o.value === 'UNKNOWN') return false;
        var t = o.text.toLowerCase();
        return parts.every(function(p){ return t.indexOf(p) !== -1; });
      });

      // Only select on a UNIQUE match — never guess between two consultants.
      if(candidates.length === 1){ sel.value = candidates[0].value; fireInput(sel); return true; }
      return false;
    }

    var plan = ${JSON.stringify(plan)};

    var tries = 0;
    function run(){
      tries++;
      // Wait until the form is genuinely ready: operation notes AND the
      // procedure typeahead AND the specialty select with options present.
      // (The cardiothoracic form loads more slowly; filling too early lets
      // Angular re-render and wipe the values.)
      var formReady =
        document.querySelector('#operationnotes') &&
        document.querySelector('#operationsAccordion-Typeahead') &&
        document.querySelector('#operationspecialty') &&
        document.querySelector('#operationspecialty').options &&
        document.querySelector('#operationspecialty').options.length > 1;
      if(!formReady){
        // Detect a login page: eLogbook's login has a password field and no
        // operation form. If we see that, tell the app it's a login situation.
        var looksLikeLogin =
          document.querySelector('input[type="password"]') ||
          /login|signin|account\\/login/i.test(window.location.href);
        if(looksLikeLogin){
          window.ReactNativeWebView.postMessage(JSON.stringify({ type:'needs_login' }));
          return;
        }
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

      // Fill all the simple (non-typeahead) fields once.
      function fillSimple(){
        filled = 0; failed = [];
        Object.keys(plan.text).forEach(function(s){ if(fillText(s, plan.text[s])) filled++; else failed.push(s); });
        Object.keys(plan.selects).forEach(function(s){ if(selectByLabel(s, plan.selects[s])) filled++; else failed.push(s); });
        Object.keys(plan.checkboxes).forEach(function(s){ if(setCheckbox(s, plan.checkboxes[s])) filled++; else failed.push(s); });
        plan.radios.forEach(function(r){ if(setRadio(r.options, r.value)) filled++; else failed.push('radio'); });
        if(plan.consultant){ if(selectConsultant(plan.consultant)) filled++; else failed.push('consultant'); }
      }

      // Did the fill actually hold? Check a known select still has our value.
      // (The slow cardiothoracic form re-renders and wipes early fills; if so,
      // we wait and try again — auto-replicating a manual "Refill" tap.)
      function fillHeld(){
        var checkSel = Object.keys(plan.selects)[0];
        if(!checkSel) return true; // nothing to verify against
        var el = document.querySelector(checkSel);
        return el && el.value && el.value !== '' && el.selectedIndex > 0;
      }

      var fillTries = 0;
      function fillWithRetry(){
        fillTries++;
        fillSimple();
        // Give Angular a moment, then check if it stuck; retry if not.
        setTimeout(function(){
          if(fillHeld() || fillTries >= 15){
            doTypeaheads();
          } else {
            fillWithRetry(); // form wiped it — try again
          }
        }, 600);
      }

      function doTypeaheads(){
        function afterProcedure(){
          if(plan.hospital){
            // eLogbook gives the SAME hospital different ids per specialty, so
            // matching by stored id can't work across specialties. The NAME is
            // stable, so match by name: pass id=null (uses the name path) and
            // give the full stored name as the match target.
            selectTypeahead('#hospitalsAccordion-Typeahead', null, plan.hospital.search, (plan.hospital.name || plan.hospital.search), function(ok){
              if(ok) filled++; else failed.push('hospital');
              report();
            });
          } else { report(); }
        }
        if(plan.procedure){
          selectTypeahead('#operationsAccordion-Typeahead', plan.procedure.nodeId, plan.procedure.searchText, null, function(ok){
            if(ok) filled++; else failed.push('procedure');
            afterProcedure();
          });
        } else { afterProcedure(); }
      }

      function report(){
        window.ReactNativeWebView.postMessage(JSON.stringify({ type:'filled', filled: filled, failed: failed }));
      }

      fillWithRetry();
    }
    run();
  })();
  true;
  `;
}

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



  // Turn the script's failed-field identifiers (selectors or names) into
  // friendly labels using the schema, for the "couldn't fill" summary.
  function friendlyFailed(failed) {
    if (!failed || !failed.length) return [];
    return failed.map((f) => {
      if (f === "procedure") return "Procedure";
      if (f === "hospital") return "Hospital";
      if (f === "consultant") return "Responsible consultant";
      if (f === "radio") return "A yes/no field";
      // selector like "#cepod" -> find the schema field by selector
      const field = schema ? schema.fields.find((x) => x.selector === f) : null;
      return field ? field.label : f;
    });
  }

  function handleMessage(event) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "waiting") {
        setStatusMsg(`Waiting for form… (fields: ${data.fieldCount}, ${data.url.slice(0, 40)})`);
        return;
      }

      if (data.type === "needs_login") {
        setNeedsLogin(true);
        setStatusMsg("Please log in to eLogbook below, then tap Retry.");
        return;
      }
      
      if (data.type === "filled") {
        if (data.error) {
          setStatusMsg("Couldn't fill the form automatically — you can fill it manually below.");
        } else {
          const labels = friendlyFailed(data.failed);
          setFailedFields(labels);
          if (labels.length) {
            setStatusMsg(`Filled ${data.filled} field(s). Couldn't fill: ${labels.join(", ")} — add these on eLogbook. Then review and Save.`);
          } else {
            setStatusMsg(`Filled ${data.filled} field(s). Review everything, then Save on eLogbook.`);
          }
          setFilled(true);
        }
      }
    } catch (e) {
      // ignore non-JSON messages
    }
  }
  function handleRetry() {
    setNeedsLogin(false);
    setStatusMsg("Filling your entry…");
    if (webRef.current) {
      webRef.current.injectJavaScript(buildFullInjectionScript(plan));
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        {!filled && !needsLogin ? (
          <ActivityIndicator size="small" color="#2563eb" style={{ marginRight: 8 }} />
        ) : null}
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
  retryBtn: { fontSize: 13, color: "#2563eb", fontWeight: "700", paddingHorizontal: 8 },
  web: { flex: 1 },
  footer: { padding: 12, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  footerNote: { fontSize: 11, color: "#888888", lineHeight: 16, marginBottom: 10 },
});