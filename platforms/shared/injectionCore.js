// platforms/shared/injectionCore.js
// The SITE-AGNOSTIC half of the WebView injection script, as reusable string
// fragments. Nothing in here knows anything about eLogbook, Turas or ISCP — it
// only knows how to fill a plan into a form, audit the end state, and report.
//
// Why strings and not functions? The injected script runs INSIDE the web page,
// not in our app, so it has to be shipped as text. Each fragment below is a
// chunk of that text; a platform adapter concatenates the fragments it needs
// with its own platform-specific code (see platforms/elogbook/adapter.js).
//
// RULE (learned the hard way): never use regex literals in these fragments —
// they collapse when the script is stringified and silently break matching.
// Use char-based operations (indexOf/split/slice) instead.

// ---------------------------------------------------------------------------
// Diagnostics protocol. Every platform posts the same message shapes, so the
// app-side handler (submission.jsx) works for all of them without change.
// ---------------------------------------------------------------------------
export const DIAG = `
      var BUILD_TAG = "diag-2026-06-29a";
      function diag(stage, info){
        try {
          var base = { type:'diag', tag: BUILD_TAG, stage: stage };
          if(info){ for(var k in info){ if(info.hasOwnProperty(k)) base[k]=info[k]; } }
          window.ReactNativeWebView.postMessage(JSON.stringify(base));
        } catch(e){}
      }`;

// ---------------------------------------------------------------------------
// Run-once guard. react-native-webview re-injects on more than one load event,
// and a single-page app can trigger a second pass on the SAME document. Two
// passes race each other. Allow only ONE active pass per document; a manual
// Refill still works because the guard clears when a pass finishes.
// ---------------------------------------------------------------------------
export const RUN_ONCE_GUARD = `
        if (window.__SP_FILL_RUNNING__) { diag('skip_duplicate', { url: window.location.href }); return; }
        window.__SP_FILL_RUNNING__ = true;
        function finishGuard(){ try { window.__SP_FILL_RUNNING__ = false; } catch(e){} }`;

// ---------------------------------------------------------------------------
// Fill primitives. Plain DOM writes plus the input/change events that make a
// framework notice the value changed. Works on Angular, jQuery, and plain HTML.
// setRadio takes each option's own SELECTOR (not an id), which is what Turas
// needs — its radios share duplicate ids and must be picked by name+value.
// ---------------------------------------------------------------------------
export const PRIMITIVES = `
        function fireInput(el){ el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }
        function fillText(s,v){ var el=document.querySelector(s); if(!el) return false; el.value=v; fireInput(el); return true; }
        function selectByLabel(s,l){ var sel=document.querySelector(s); if(!sel) return false; var t=String(l).trim().toLowerCase(); var m=Array.from(sel.options).find(function(o){return o.text.trim().toLowerCase()===t;}); if(!m) return false; sel.value=m.value; fireInput(sel); return true; }
        function setCheckbox(s,v){ var el=document.querySelector(s); if(!el) return false; el.checked=!!v; fireInput(el); return true; }
        function setRadio(opts,v){ var t=String(v).trim().toLowerCase(); var c=opts.find(function(o){return o.label.trim().toLowerCase()===t;}); if(!c) return false; var el=document.querySelector(c.selector); if(!el) return false; el.checked=true; fireInput(el); return true; }`;

// ---------------------------------------------------------------------------
// Name normalisation, char-based (see the no-regex rule above). Used by any
// platform that has to match a dictated name against options on the page.
// ---------------------------------------------------------------------------
export const NORMALISERS = `
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
        }`;

// ---------------------------------------------------------------------------
// The plan-driven engine: apply the plan, audit the END STATE of the form, and
// settle (re-apply + re-audit) until every field holds or we hit the cap. This
// is what handles late-loading dropdowns and framework re-renders on ANY site.
// Depends on the primitives above and on `plan` / `diagTA` being in scope.
// ---------------------------------------------------------------------------
export const FILL_ENGINE = `
          var t0 = Date.now();
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
              if(fillHeld() || fillTries >= 3){ doSpecials(); }  // priming only; settleFill does the authoritative fill
              else { fillWithRetry(); }
            }, 600);
          }

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

          function applyAllSimple(){
            Object.keys(plan.text).forEach(function(s){ fillText(s, plan.text[s]); });
            Object.keys(plan.selects).forEach(function(s){ selectByLabel(s, plan.selects[s]); });
            Object.keys(plan.checkboxes).forEach(function(s){ setCheckbox(s, plan.checkboxes[s]); });
            (plan.radios || []).forEach(function(r){ setRadio(r.options, r.value); });
          }
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
          }`;

// ---------------------------------------------------------------------------
// The final report, built from the END STATE of the form (not the early fill
// attempts, which go stale after re-renders). Platform-specific outcomes live
// in diagTA, which the adapter's doSpecials() populates; extraKeys names them
// so they're counted (eLogbook: procedure/hospital/consultant; Turas: none).
// ---------------------------------------------------------------------------
export function reportFragment(extraKeys = []) {
  const extras = extraKeys
    .map(
      (k) =>
        `            if(diagTA.${k} && diagTA.${k}.inPlan){ if(diagTA.${k}.matched) filledCount++; else failedList.push('${k}'); }`
    )
    .join("\n");
  return `
          function report(){
            var audit = auditSimple();
            var failedList = [], filledCount = 0;
            audit.forEach(function(f){ if(f.ok) filledCount++; else failedList.push(f.sel); });
${extras}
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
          }`;
}

// ---------------------------------------------------------------------------
// composeScript — assembles a complete injection script from the shared parts
// plus a platform's own pieces. This is the contract every adapter implements.
//
//   plan          the fill plan (serialised into the script)
//   formReadyExpr JS expression: truthy when this platform's form has rendered
//   loginExpr     JS expression: truthy when we're looking at a login page
//   helpers       platform-specific functions (e.g. eLogbook's typeahead driver)
//   doSpecials    platform-specific field handling; must call settleFill(report)
//   extraKeys     names of platform outcomes in diagTA to count in the report
//   preSteps      code to run once the form is ready, BEFORE filling
//                 (e.g. Turas must .click() open its collapsed section)
// ---------------------------------------------------------------------------
export function composeScript({
  plan,
  formReadyExpr,
  loginExpr,
  helpers = "",
  doSpecials,
  extraKeys = [],
  preSteps = "",
}) {
  return `
    (function() {${DIAG}
      try {
        diag('start', {
          url: window.location.href,
          readyState: document.readyState,
          pageFields: document.querySelectorAll('input, select, textarea').length
        });
${RUN_ONCE_GUARD}
${PRIMITIVES}
${NORMALISERS}
${helpers}

        var plan = ${JSON.stringify(plan)};
        var diagTA = {};

        var tries = 0;
        function run(){
          tries++;
          var formReady = ${formReadyExpr};
          if(!formReady){
            var looksLikeLogin = ${loginExpr};
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
${preSteps}
${FILL_ENGINE}
${doSpecials}
${reportFragment(extraKeys)}

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