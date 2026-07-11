// platforms/iscp/adapter.js
// The ISCP adapter (Intercollegiate Surgical Curriculum Programme).
//
// ISCP is ASP.NET WebForms — server-rendered, jQuery-era. Unlike eLogbook it has
// NO Angular internals, so the shared fill primitives (plain DOM writes + input/
// change events) work directly. That means this adapter is almost entirely
// composition: no custom drivers, no framework archaeology.
//
// WHAT WE DELIBERATELY DO NOT FILL (v1):
//  1. RATER-OWNED fields — the summary rating, strengths / development needs /
//     recommended actions / general feedback, the per-competency comments, and
//     the rater's password validation. A CEX-C or DOPS is a TWO-PERSON form: the
//     assessor's judgement is theirs, and auto-filling it would be wrong. Those
//     fields are simply absent from our schemas.
//  2. ISCP's PICKER widgets (assessor, hospital, procedure) — custom AJAX
//     components (ISCP.Pickers.*.js) with a visible search box plus hidden
//     SelectedItemValues/Names that the page sets itself. Typing into the search
//     box alone does NOT select an item, so filling it would look right and
//     silently submit nothing. We capture these in dictation for the user's
//     reference and let them tap the picker on-site (a couple of taps). Driving
//     the pickers properly is adapter phase 2, once we can watch one live.
//  3. REFLECTIONS — held back until the guarded-paraphrasing phase exists.
//
// Everything else on the form auto-fills.

import { composeScript } from "../shared/injectionCore";
import { buildPlan } from "../shared/planCore";

import cexcSchema from "./schemas/iscp_cexc.json";
import dopsSchema from "./schemas/iscp_dops.json";

// ISCP keys its schema by ENTRY TYPE (eLogbook keys by specialty). The adapter
// absorbing that difference is exactly what keeps the screens platform-agnostic.
const SCHEMAS = {
  iscp_cexc: cexcSchema,
  iscp_dops: dopsSchema,
  // iscp_cbd, iscp_cex: added as each form is harvested
  // iscp_pba: last — PBA is two-stage (the form only renders after a procedure
  //           is chosen) and its competency items are per-procedure.
};

// The form has rendered when the assessment-date field exists. It's present on
// every ISCP assessment, it's inside the main form body (so it can't be matched
// by the page chrome), and ASP.NET renders the whole page server-side in one go
// — so if this exists, everything else does too.
function readyProbe(schema) {
  const dateField = schema.fields.find((f) => f.inputType === "date");
  return dateField ? dateField.selector : "form";
}

// CAREFUL: we must NOT reuse eLogbook's login heuristic here. eLogbook says
// "a password input means this is a login page" — but a live ISCP assessment
// form legitimately CONTAINS password inputs (the rater's validation box). That
// rule would make ISCP think it was permanently on a login page and never fill.
// So ISCP detects login by URL only.
const LOGIN_EXPR = `(function(){
              var lh = String(window.location.href).toLowerCase();
              return lh.indexOf('/login') !== -1 ||
                     lh.indexOf('signin') !== -1 ||
                     lh.indexOf('account/login') !== -1;
            })()`;

// ISCP has no special fields to drive in v1 (the pickers are skipped), so
// doSpecials just hands straight over to the shared settle-fill loop.
// ISCP ratings can't be filled — they must be CLICKED, so the page's own
// JavaScript writes them into its hidden ratingsSelectedValues field. We click
// them once before the settle loop (clicking is idempotent — clicking the same
// rating again just re-selects it).
const DO_SPECIALS = `
          function clickRatings(){
            var done = 0;
            (plan.clicks || []).forEach(function(sel){
              var el = document.querySelector(sel);
              if(el){ el.click(); done++; }
            });
            diagTA.ratings = { inPlan: (plan.clicks || []).length > 0,
                               wanted: (plan.clicks || []).length, matched: done,
                               ready: true };
            return done;
          }
          function doSpecials(){
            clickRatings();
            settleFill(report);
          }`;

// buildScript receives ONLY the plan (that's the shared contract submission.jsx
// uses), so buildInjectionPlan below stashes the readiness probe on the plan.
export function buildScript(plan) {
  return composeScript({
    plan,
    formReadyExpr: `document.querySelector('${plan.__readyProbe || "form"}')`,
    loginExpr: LOGIN_EXPR,
    helpers: "",
    doSpecials: DO_SPECIALS,
    extraKeys: ["ratings"], // report how many rating clicks landed
  });
}

export function getSchema({ entryType } = {}) {
  return SCHEMAS[entryType] || null;
}

export function buildInjectionPlan(fieldValues, schema) {
  const plan = buildPlan(fieldValues, schema, {
    dateSep: "/", // ISCP's jQuery datepicker expects dd/mm/yyyy
  });
  // Carry the readiness probe with the plan so buildScript(plan) can use it.
  plan.__readyProbe = readyProbe(schema);
  return plan;
}

export const adapter = {
  id: "iscp",
  displayName: "ISCP",
  formUrl: ({ schema }) => (schema && schema.formUrl) || "https://www.iscp.ac.uk/",
  getSchema,
  buildPlan: buildInjectionPlan,
  buildScript,
};