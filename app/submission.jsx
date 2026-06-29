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
import { loadProfile } from "../profile";
import { colors, spacing } from "../theme/theme";

const FORM_URL = "https://client.elogbook.org/eLogbook/Operations/OperationMaintain/Add";
const BUILD_TAG = "diag-2026-06-29a";

function buildFullInjectionScript(plan) {
  return `
  (function() {
    var BUILD_TAG = "diag-2026-06-29a";
    function diag(stage, info){
      try {
        var base = { type:'diag', tag: BUILD_TAG, stage: stage };
        if(info){ for(var k in info){ if(info.hasOwnProperty(k)) base[k]=info[k]; } }
        window.ReactNativeWebView.postMessage(JSON.stringify(base));
      } catch(e){}
    }
    try {
      diag('start', {
        url: window.location.href,
        readyState: document.readyState,
        pageFields: document.querySelectorAll('input, select, textarea').length
      });

      // Run-once guard: react-native-webview re-injects the script on more than
      // one load event, and the eLogbook SPA can trigger a second pass on the
      // SAME document. Two passes race on the typeaheads — the second re-types
      // into them and can report a false failure or even overwrite a good value
      // with a stale match. Allow only ONE active pass per document. A manual
      // Refill still works because the guard clears when a pass finishes.
      if (window.__SP_FILL_RUNNING__) { diag('skip_duplicate', { url: window.location.href }); return; }
      window.__SP_FILL_RUNNING__ = true;
      function finishGuard(){ try { window.__SP_FILL_RUNNING__ = false; } catch(e){} }

      function fireInput(el){ el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }
      function fillText(s,v){ var el=document.querySelector(s); if(!el) return false; el.value=v; fireInput(el); return true; }
      function selectByLabel(s,l){ var sel=document.querySelector(s); if(!sel) return false; var t=String(l).trim().toLowerCase(); var m=Array.from(sel.options).find(function(o){return o.text.trim().toLowerCase()===t;}); if(!m) return false; sel.value=m.value; fireInput(sel); return true; }
      function setCheckbox(s,v){ var el=document.querySelector(s); if(!el) return false; el.checked=!!v; fireInput(el); return true; }
      function setRadio(opts,v){ var t=String(v).trim().toLowerCase(); var c=opts.find(function(o){return o.label.trim().toLowerCase()===t;}); if(!c) return false; var el=document.querySelector(c.selector); if(!el) return false; el.checked=true; fireInput(el); return true; }

      // Whitespace collapse + name normalisation, char-based (NO regex literals:
      // they collapse inside this stringified script and silently break matching).
      function collapseWs(s){
        var t = String(s).toLowerCase().trim(), out = "", prevSpace = false;
        for (var i=0;i<t.length;i++){ var ch=t[i], isSpace=(ch<=" ");
          if(isSpace){ if(!prevSpace) out+=" "; prevSpace=true; } else { out+=ch; prevSpace=false; } }
        return out.trim();
      }
      function core(s){
        var t = collapseWs(s);
        if (t.indexOf("the ") === 0) t = t.slice(4);
        var paren = t.indexOf("(");
        if (paren !== -1) t = t.slice(0, paren).trim();
        return t;
      }

      // Zero-tap typeahead select via the Angular component (procedure + hospital).
      // Calls done(ok, info) — info carries diagnostics for the report.
      function selectTypeahead(searchSel, id, searchText, matchName, done, readyTries){
        var input = document.querySelector(searchSel);
        if(!input || !input.__ngContext__){
          readyTries = (readyTries || 0) + 1;
          if(readyTries <= 25){
            return setTimeout(function(){ selectTypeahead(searchSel, id, searchText, matchName, done, readyTries); }, 200);
          }
          done(false, { ready:false, reason:'typeahead never attached', selector:searchSel }); return;
        }
        var ctx = input.__ngContext__, directive = null, wrapper = null, seen = new Set();
        for(var i=0;i<ctx.length;i++){
          var v = ctx[i];
          if(!v || typeof v!=='object' || seen.has(v)) continue;
          seen.add(v);
          if(typeof v.changeModel==='function' && '_matches' in v) directive = v;
          if('selectedNodeId' in v && typeof v.onTypeaheadSelect==='function') wrapper = v;
        }
        if(!directive){ done(false, { ready:true, reason:'no Angular directive found', selector:searchSel }); return; }

        // Trim the search at the first punctuation that breaks eLogbook's server
        // search: "(", ",", and apostrophe (e.g. "Children's"). We still match the
        // FULL name among whatever results return, so trimming the typed query
        // only widens the result set — it never loosens the match.
        var typeText = String(searchText).split('(')[0].split(',')[0].split("'")[0].trim();
        if(!typeText) typeText = String(searchText).split('(')[0].trim();
        if(!typeText) typeText = searchText;
        var proto = Object.getPrototypeOf(input);
        var desc = Object.getOwnPropertyDescriptor(proto, 'value');
        if (desc && desc.set) desc.set.call(input, typeText); else input.value = typeText;
        input.dispatchEvent(new Event('input', { bubbles: true }));

        var tries = 0, stable = 0, lastLen = -1;
        (function poll(){
          tries++;
          var matches = directive._matches || [];
          // Track whether the result list has settled. If it's populated and
          // hasn't changed for several polls without containing our target, the
          // search has returned all it will — give up now rather than waiting the
          // full budget (this is what caused the ~15s hang on a miss).
          if(matches.length === lastLen) stable++; else { stable = 0; lastLen = matches.length; }
          var match = null;
          if (id !== null && id !== undefined) {
            match = matches.find(function(m){ return m && m.item && String(m.item.id) === String(id); });
          } else {
            var want = core(matchName || searchText);
            var full = collapseWs(matchName || searchText);
            match =
              matches.find(function(m){ return m && m.item && collapseWs(m.item.name) === full; }) ||
              matches.find(function(m){ return m && m.item && core(m.item.name) === want; }) ||
              matches.find(function(m){ return m && m.item && core(m.item.name).indexOf(want) === 0; }) ||
              matches.find(function(m){ return m && m.item && want.indexOf(core(m.item.name)) === 0; });
          }
          if(match){
            directive.changeModel(match);
            if(wrapper && typeof wrapper.onTypeaheadSelect === 'function'){ try { wrapper.onTypeaheadSelect(match); } catch(e){} }
            done(true, { ready:true, matched:true, matchCount:matches.length, polls:tries, typed:typeText }); return;
          }
          var settled = (matches.length > 0 && stable >= 6); // list unchanged ~1.2s
          if(tries < 40 && !settled) return setTimeout(poll, 200);
          // Give up: report what we TYPED and what was on offer, so "search never
          // filtered" is distinguishable from "filtered, but name didn't match".
          done(false, {
            ready:true, matched:false, matchCount:matches.length, polls:tries, typed:typeText,
            wanted: (matchName || searchText),
            sample: matches.slice(0,8).map(function(m){ return m && m.item ? m.item.name : null; })
          });
        })();
      }

      function selectConsultant(name){
        var sel = document.querySelector('#responsibleconsultant');
        if(!sel) return false;
        var titles = { 'mr':1,'mrs':1,'ms':1,'miss':1,'dr':1,'prof':1,'professor':1,'mister':1 };
        var cleaned = String(name).toLowerCase(), spaced = "";
        for(var ci=0; ci<cleaned.length; ci++){ var ch=cleaned[ci]; spaced += (ch>='a'&&ch<='z') ? ch : ' '; }
        var parts = spaced.split(' ').filter(function(w){ return w.length>1 && !titles[w]; });
        if(parts.length===0) return false;
        var candidates = Array.from(sel.options).filter(function(o){
          if(o.value==='UNKNOWN') return false;
          var t=o.text.toLowerCase();
          return parts.every(function(p){ return t.indexOf(p)!==-1; });
        });
        if(candidates.length===1){ sel.value=candidates[0].value; fireInput(sel); return true; }
        return false;
      }

      var plan = ${JSON.stringify(plan)};
      var diagTA = {};   // typeahead/consultant outcomes for the final report

      var tries = 0;
      function run(){
        tries++;
        var formReady =
          document.querySelector('#operationnotes') &&
          document.querySelector('#operationsAccordion-Typeahead') &&
          document.querySelector('#operationspecialty') &&
          document.querySelector('#operationspecialty').options &&
          document.querySelector('#operationspecialty').options.length > 1;
        if(!formReady){
          var lh = String(window.location.href).toLowerCase();
          var looksLikeLogin =
            document.querySelector('input[type="password"]') ||
            lh.indexOf('login') !== -1 || lh.indexOf('signin') !== -1;
          if(looksLikeLogin){ diag('needs_login', { url: window.location.href }); finishGuard(); return; }
          if(tries % 4 === 0){
            diag('waiting', { tries:tries, url:window.location.href, pageFields: document.querySelectorAll('input, select, textarea').length });
          }
          if(tries < 40) return setTimeout(run, 500);
          diag('form_never_appeared', { tries:tries, pageFields: document.querySelectorAll('input, select, textarea').length });
          window.ReactNativeWebView.postMessage(JSON.stringify({ type:'filled', error:'form never appeared' }));
          finishGuard(); return;
        }
        diag('form_ready', { tries:tries, pageFields: document.querySelectorAll('input, select, textarea').length });

        var t0 = Date.now();   // start timing once the form is actually ready
        var filled = 0, failed = [];
        function fillSimple(){
          filled = 0; failed = [];
          Object.keys(plan.text).forEach(function(s){ if(fillText(s, plan.text[s])) filled++; else failed.push(s); });
          Object.keys(plan.selects).forEach(function(s){ if(selectByLabel(s, plan.selects[s])) filled++; else failed.push(s); });
          Object.keys(plan.checkboxes).forEach(function(s){ if(setCheckbox(s, plan.checkboxes[s])) filled++; else failed.push(s); });
          plan.radios.forEach(function(r){ if(setRadio(r.options, r.value)) filled++; else failed.push('radio'); });
        }
        function fillHeld(){
          var checkSel = Object.keys(plan.selects)[0];
          if(!checkSel) return true;
          var el = document.querySelector(checkSel);
          return el && el.value && el.value !== '' && el.selectedIndex > 0;
        }
        var fillTries = 0;
        function fillWithRetry(){
          fillTries++;
          fillSimple();
          setTimeout(function(){
            if(fillHeld() || fillTries >= 3){ doTypeaheads(); }  // priming only; settleFill does the authoritative fill
            else { fillWithRetry(); }
          }, 600);
        }

        // Audit the END STATE of every planned simple field, so the report shows
        // exactly which field failed and WHY (missing selector vs value not in
        // the dropdown options). This is what makes new specialties debuggable.
        function auditSimple(){
          var out = [];
          Object.keys(plan.text).forEach(function(s){
            var el = document.querySelector(s);
            out.push({ sel:s, kind:'text', ok: !!(el && el.value && el.value.length>0),
              reason: !el ? 'no_element' : ((el.value && el.value.length>0) ? 'ok' : 'empty') });
          });
          Object.keys(plan.selects).forEach(function(s){
            var el = document.querySelector(s);
            var want = String(plan.selects[s]).trim().toLowerCase();
            var cur = (el && el.selectedIndex>=0 && el.options[el.selectedIndex]) ? el.options[el.selectedIndex].text.trim().toLowerCase() : null;
            var ok = !!(el && cur===want);
            var entry = { sel:s, kind:'select', ok:ok, reason: !el ? 'no_element' : (ok ? 'ok' : 'no_matching_option'), want: plan.selects[s] };
            if(el && !ok){ entry.options = Array.from(el.options).map(function(o){return o.text;}).slice(0,15); }
            out.push(entry);
          });
          Object.keys(plan.checkboxes).forEach(function(s){
            var el = document.querySelector(s);
            out.push({ sel:s, kind:'checkbox', ok: !!el, reason: !el ? 'no_element' : 'ok' });
          });
          (plan.radios || []).forEach(function(r){
            var t = String(r.value).trim().toLowerCase();
            var opt = r.options.find(function(o){ return o.label.trim().toLowerCase()===t; });
            var el = opt ? document.querySelector(opt.selector) : null;
            out.push({ sel:'radio', kind:'radio',
              ok: !!(el && el.checked),
              reason: !opt ? 'no_matching_option' : (!el ? 'no_element' : (el.checked ? 'ok' : 'not_checked')) });
          });
          return out;
        }

        function fillConsultant(done){
          if(!plan.consultant){ diagTA.consultant = { inPlan:false }; done(); return; }
          var waitTries = 0;
          (function waitForOptions(){
            var sel = document.querySelector('#responsibleconsultant');
            var realOptions = sel ? Array.from(sel.options).filter(function(o){ return o.value && o.value!=='UNKNOWN'; }).length : 0;
            if(realOptions > 0){
              var ok = selectConsultant(plan.consultant);
              diagTA.consultant = { inPlan:true, options:realOptions, matched:ok, wanted: plan.consultant };
              if(ok) filled++; else failed.push('consultant');
              done(); return;
            }
            waitTries++;
            if(waitTries <= 30) return setTimeout(waitForOptions, 200);
            diagTA.consultant = { inPlan:true, options:0, matched:false, reason:'options never loaded' };
            failed.push('consultant');
            done();
          })();
        }

        // Once the typeaheads + consultant are done, the form has settled and the
        // late-loading dropdowns have their options. Re-apply the simple fills one
        // more time to catch any that were set before their options existed, or
        // wiped by an Angular re-render. THIS is what fixes the General Surgery
        // late dropdowns (Laparoscopy, Time of Day, Complications) and any wiped
        // core selects — without slowing the happy path, since it's one pass.
        function applyAllSimple(){
          Object.keys(plan.text).forEach(function(s){ fillText(s, plan.text[s]); });
          Object.keys(plan.selects).forEach(function(s){ selectByLabel(s, plan.selects[s]); });
          Object.keys(plan.checkboxes).forEach(function(s){ setCheckbox(s, plan.checkboxes[s]); });
          (plan.radios || []).forEach(function(r){ setRadio(r.options, r.value); });
        }
        // Re-apply the simple fills and re-check the END STATE, repeating until
        // every simple field holds (late dropdowns loaded, re-renders stopped) or
        // we hit the cap. Crucially it STOPS as soon as the form is clean — so a
        // fast form finishes at once and only a stubborn form spends extra cycles.
        // Replaces the old fixed loop that always ran its full budget (~15s).
        function settleFill(done){
          var settleTries = 0;
          (function loop(){
            settleTries++;
            applyAllSimple();
            setTimeout(function(){
              var bad = auditSimple().filter(function(f){ return !f.ok; });
              if(bad.length === 0 || settleTries >= 15){ done(); return; }
              loop();
            }, 400);
          })();
        }

        function doTypeaheads(){
          function finish(){ fillConsultant(function(){ settleFill(report); }); }
          function afterProcedure(){
            if(plan.hospital){
              selectTypeahead('#hospitalsAccordion-Typeahead', null, plan.hospital.search, (plan.hospital.name || plan.hospital.search), function(ok, info){
                diagTA.hospital = info || {}; diagTA.hospital.inPlan = true;
                finish();
              });
            } else { diagTA.hospital = { inPlan:false }; finish(); }
          }
          if(plan.procedure){
            selectTypeahead('#operationsAccordion-Typeahead', plan.procedure.nodeId, plan.procedure.searchText, null, function(ok, info){
              diagTA.procedure = info || {}; diagTA.procedure.inPlan = true;
              afterProcedure();
            });
          } else { diagTA.procedure = { inPlan:false }; afterProcedure(); }
        }

        // Build the report from the END STATE of the form (what is actually
        // selected now), not from the early fill attempts, which go stale after
        // re-renders and the final re-fill.
        function report(){
          var audit = auditSimple();
          var failedList = [], filledCount = 0;
          audit.forEach(function(f){ if(f.ok) filledCount++; else failedList.push(f.sel); });
          if(diagTA.procedure && diagTA.procedure.inPlan){ if(diagTA.procedure.matched) filledCount++; else failedList.push('procedure'); }
          if(diagTA.hospital && diagTA.hospital.inPlan){ if(diagTA.hospital.matched) filledCount++; else failedList.push('hospital'); }
          if(diagTA.consultant && diagTA.consultant.inPlan){ if(diagTA.consultant.matched) filledCount++; else failedList.push('consultant'); }
          diag('report', {
            filled: filledCount,
            failed: failedList,
            elapsedMs: (Date.now() - t0),
            fillPasses: fillTries,
            pageFields: document.querySelectorAll('input, select, textarea').length,
            fields: audit,
            typeaheads: diagTA
          });
          window.ReactNativeWebView.postMessage(JSON.stringify({ type:'filled', filled: filledCount, failed: failedList }));
          finishGuard();
        }

        fillWithRetry();
      }
      run();
    } catch (err) {
      try { window.__SP_FILL_RUNNING__ = false; } catch(e){}
      diag('script_error', { message: (err && err.message) ? err.message : String(err), stack: (err && err.stack) ? err.stack : '' });
    }
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
    console.log(
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
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "diag") {
        if (data.stage === "report") {
          printReport(data);
          const labels = friendlyFailed(data.failed);
          setFailedFields(labels);
          setStatusMsg(
            labels.length
              ? `Filled ${data.filled} field(s). Couldn't fill: ${labels.join(", ")} — add these on eLogbook, then Save.`
              : `Filled ${data.filled} field(s). Review everything, then Save on eLogbook.`
          );
          setFilled(true);
        } else if (data.stage === "needs_login") {
          setNeedsLogin(true);
          setStatusMsg("Please log in to eLogbook below, then tap Refill.");
          console.log(`[DIAG ${data.tag}] needs_login`, data.url);
        } else if (data.stage === "start") {
          console.log(`[DIAG ${data.tag}] script started — ${data.pageFields} fields, ${data.readyState}, ${data.url}`);
        } else if (data.stage === "waiting") {
          setStatusMsg(`Waiting for form… (${data.pageFields} fields)`);
          console.log(`[DIAG ${data.tag}] waiting (try ${data.tries}) — ${data.pageFields} fields — ${data.url}`);
        } else if (data.stage === "form_ready") {
          setStatusMsg("Form ready — filling…");
          console.log(`[DIAG ${data.tag}] form ready after ${data.tries} tries — ${data.pageFields} fields`);
        } else if (data.stage === "form_never_appeared") {
          console.log(`[DIAG ${data.tag}] FORM NEVER APPEARED after ${data.tries} tries — ${data.pageFields} fields on page`);
        } else if (data.stage === "script_error") {
          setStatusMsg(`Script error: ${data.message}`);
          console.log(`[DIAG ${data.tag}] SCRIPT ERROR: ${data.message}\n${data.stack}`);
        } else {
          console.log(`[DIAG ${data.tag}] ${data.stage}`, JSON.stringify(data));
        }
        return;
      }

      // Back-compat: the plain "filled" message still drives the locked state.
      if (data.type === "filled" && data.error) {
        setStatusMsg("Couldn't fill the form automatically — you can fill it manually below.");
      }
    } catch (e) {
      // ignore non-JSON messages
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
