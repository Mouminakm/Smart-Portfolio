// platforms/elogbook/adapter.js
// The eLogbook adapter: everything that is TRUE OF ELOGBOOK AND NOTHING ELSE.
//
// eLogbook is an Angular single-page app. Its procedure and hospital pickers are
// Angular typeahead components that ignore plain DOM writes — you have to reach
// into the component's internals (__ngContext__) and drive it. That imperative
// driver is exactly why we use an adapter-per-platform rather than one generic
// engine: no data format could express this, and no other platform needs it.
//
// Everything site-agnostic (fill primitives, the settle-fill loop, the end-state
// audit, the diagnostics protocol) comes from platforms/shared/injectionCore.js.

import { getSpecialtyData } from "../../data/specialtySchemas";
import { composeScript } from "../shared/injectionCore";
import { buildPlan, matchOption, norm } from "../shared/planCore";

export const FORM_URL =
  "https://client.elogbook.org/eLogbook/Operations/OperationMaintain/Add";

// The form has rendered when the notes box, the procedure typeahead, and a
// POPULATED specialty dropdown all exist. (Angular renders the <select> before
// it fills its options, so we must check options.length too.)
const FORM_READY_EXPR = `
            document.querySelector('#operationnotes') &&
            document.querySelector('#operationsAccordion-Typeahead') &&
            document.querySelector('#operationspecialty') &&
            document.querySelector('#operationspecialty').options &&
            document.querySelector('#operationspecialty').options.length > 1`;

// We're on the SSO login page, not the form.
const LOGIN_EXPR = `(function(){
              var lh = String(window.location.href).toLowerCase();
              return document.querySelector('input[type="password"]') ||
                     lh.indexOf('login') !== -1 || lh.indexOf('signin') !== -1;
            })()`;

// --- eLogbook-only helpers -------------------------------------------------
// selectTypeahead: drives the Angular typeahead component directly.
// selectConsultant: the consultant <select> is account-specific, so we match
// the stored name against whatever options that user's account actually has.
const HELPERS = `
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

          // Trim the typed query at the first punctuation that breaks eLogbook's
          // server search: "(", ",", apostrophe ("Children's"), and "+". We still
          // match the FULL name among the results, so trimming only widens the
          // result set — it never loosens the match.
          var typeText = String(searchText).split('(')[0].split(',')[0].split("'")[0].split('+')[0].trim();
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
            // If the result list is populated and hasn't changed for several polls
            // without containing our target, the search has returned all it will —
            // give up now rather than waiting the full budget (this is what caused
            // the ~15s hang on a miss).
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
        }`;

// --- eLogbook's special fields ---------------------------------------------
// The three fields the generic engine can't do: procedure (Angular typeahead),
// hospital (Angular typeahead), consultant (late-loading account-specific list).
// Ordered deliberately: procedure -> hospital -> consultant -> settleFill(report).
// The consultant is filled LAST because its options load late.
const DO_SPECIALS = `
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

          function doSpecials(){
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
          }`;

// Build the complete eLogbook injection script for a plan.
export function buildFullInjectionScript(plan) {
  return composeScript({
    plan,
    formReadyExpr: FORM_READY_EXPR,
    loginExpr: LOGIN_EXPR,
    helpers: HELPERS,
    doSpecials: DO_SPECIALS,
    extraKeys: ["procedure", "hospital", "consultant"],
  });
}


// ===========================================================================
// PLAN BUILDING (eLogbook-specific)
// ===========================================================================

// Resolve a procedure NAME (or a dictated abbreviation/alias) to its eLogbook
// node-id. Aliases are curated and collision-checked (one alias -> one
// procedure). Order matters: exact matches (name OR alias) win first, then
// looser "contains" matches, so a precise abbreviation like "ETV" beats an
// accidental substring hit.
function resolveProcedure(rawValue, procedures) {
  const v = norm(rawValue);
  const list = procedures || [];

  const aliasExact = (p) => (p.aliases || []).some((a) => norm(a) === v);
  const aliasLoose = (p) =>
    (p.aliases || []).some((a) => {
      const na = norm(a);
      return na && (v.includes(na) || na.includes(v));
    });

  const hit =
    list.find((p) => norm(p.name) === v) ||        // 1. exact name
    list.find(aliasExact) ||                        // 2. exact alias ("ETV")
    list.find((p) => norm(p.name).includes(v)) ||   // 3. name contains, either way
    list.find((p) => v.includes(norm(p.name))) ||
    list.find(aliasLoose);                          // 4. alias contains (loosest)

  return hit ? { nodeId: String(hit.id), searchText: hit.name } : null;
}

// Match a dictated hospital against the user's STORED hospitals. That list is
// tiny (1-3), so we can match generously without the collision risk of matching
// the national list. Each stored hospital carries its exact eLogbook id.
function matchStoredHospital(dictated, userHospitals) {
  if (!userHospitals || !userHospitals.length) return null;
  const d = String(dictated).trim().toLowerCase().replace(/^the\s+/, "");
  if (!d) return null;

  const key = (h) =>
    String(h.short || h.display || h.name || "")
      .toLowerCase()
      .replace(/^the\s+/, "")
      .replace(/\s*\([^)]*\)\s*$/, "")
      .trim();

  let hit = userHospitals.find((h) => key(h) === d);                          // exact
  if (hit) return hit;
  hit = userHospitals.find((h) => key(h).includes(d) || d.includes(key(h)));  // contains
  if (hit) return hit;
  const words = d.split(/\s+/).filter((w) => w.length > 3);                   // shared word
  hit = userHospitals.find((h) => {
    const k = key(h);
    return words.some((w) => k.includes(w));
  });
  return hit || null;
}

// The specialCase hook: planCore calls this for EVERY field, before its own
// switch. Return true if we've handled the field ourselves.
function elogbookSpecialCase(f, raw, plan, ctx) {
  const { userHospitals = [], userSpecialty = "" } = ctx;
  const isEmptyVal = raw === undefined || raw === null || String(raw).trim() === "";

  // Specialty comes from the PROFILE, not dictation — so handle it even when
  // nothing was dictated. eLogbook's option labels match our stored labels.
  if (f.id === "operationspecialty") {
    const opt = userSpecialty ? matchOption(userSpecialty, f.options) : null;
    if (opt) plan.selects[f.selector] = opt.label;
    else plan.skipped.push({ id: f.id, reason: "profile specialty '" + userSpecialty + "' not in eLogbook options" });
    return true;
  }

  // The remaining specials only apply when something was actually dictated.
  if (isEmptyVal) return false; // let planCore record it as "empty"

  // Account-specific consultant list — matched by name at injection time.
  if (f.id === "responsibleconsultant") {
    plan.consultant = String(raw);
    return true;
  }

  // Angular typeahead: procedure name/alias -> node-id.
  if (f.id === "procedure") {
    const specData = getSpecialtyData(userSpecialty);
    const procList = specData && specData.procedures ? specData.procedures.procedures : [];
    const p = resolveProcedure(raw, procList);
    if (p) plan.procedure = p;
    else plan.skipped.push({ id: f.id, reason: "procedure not found: '" + raw + "'" });
    return true;
  }

  // Angular typeahead: hospital, matched against the user's stored list.
  if (f.id === "hospitalsAccordion") {
    const dictated = norm(raw).replace(/^the\s+/, "");
    const hit = matchStoredHospital(dictated, userHospitals);
    if (hit) {
      plan.hospital = {
        id: hit.id,
        name: hit.name,
        search: hit.short || hit.display || (hit.name || "").replace(/\s*\([^)]*\)\s*$/, "").trim(),
      };
    } else {
      plan.skipped.push({
        id: f.id,
        reason: "no stored hospital matched '" + raw + "' — pick on site or add it in profile",
      });
    }
    return true;
  }

  return false; // not special — let the generic engine handle it
}

// Build the eLogbook injection plan. Same signature as the old
// buildInjectionPlan(), so submission.jsx barely changes.
export function buildInjectionPlan(fieldValues, schema, userHospitals = [], userSpecialty = "") {
  return buildPlan(fieldValues, schema, {
    dateSep: "-", // eLogbook wants dd-mm-yyyy
    specialCase: elogbookSpecialCase,
    ctx: { userHospitals, userSpecialty },
  });
}

// eLogbook picks its schema by the user's SPECIALTY (Turas/ISCP will pick by
// entryType instead). Keeping this inside the adapter is what stops the screens
// having to know how each platform is keyed.
export function getSchema({ specialty } = {}) {
  const data = getSpecialtyData(specialty);
  return data ? data.schema : null;
}

// eLogbook has a per-specialty PROCEDURE CATALOGUE (hundreds of named
// operations plus curated spoken aliases). Dictation passes these to Claude so
// a spoken "lap chole" or "ETV" matches the real entry. Platforms without a
// catalogue (ISCP, Turas) simply don't implement this.
export function getProcedureNames({ specialty } = {}) {
  const data = getSpecialtyData(specialty);
  const list = data && data.procedures ? data.procedures.procedures : [];
  return (list || []).map((p) => p.name);
}

// The adapter object — the contract every platform implements.
export const adapter = {
  id: "elogbook",
  displayName: "eLogbook",
  formUrl: () => FORM_URL,
  getSchema,
  getProcedureNames,
  buildScript: buildFullInjectionScript,
  buildPlan: buildInjectionPlan,
};