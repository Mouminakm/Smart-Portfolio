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

import cbdSchema from "./schemas/iscp_cbd.json";
import cexSchema from "./schemas/iscp_cex.json";
import cexcSchema from "./schemas/iscp_cexc.json";
import dopsSchema from "./schemas/iscp_dops.json";

// ISCP keys its schema by ENTRY TYPE (eLogbook keys by specialty). The adapter
// absorbing that difference is exactly what keeps the screens platform-agnostic.
const SCHEMAS = {
  iscp_cexc: cexcSchema,
  iscp_dops: dopsSchema,
  iscp_cex: cexSchema,
  iscp_cbd: cbdSchema,
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
// ...AND by its ERROR PAGE. This one was found by a real tester: if you open an
// assessment form COLD (no ISCP session), ISCP does NOT redirect you to a login
// URL — it serves a "We're sorry... There's been a problem displaying this page"
// error AT THE FORM'S OWN URL. So a URL-only check sees nothing wrong, the form
// never appears, and the user is left watching a spinner over an error page with
// nowhere to sign in. We detect that page and report it as "needs login", which
// lets submission.jsx send them to ISCP to log in and bring them back.
const LOGIN_EXPR = `(function(){
              var lh = String(window.location.href).toLowerCase();
              if (lh.indexOf('/login') !== -1 ||
                  lh.indexOf('signin') !== -1 ||
                  lh.indexOf('account/login') !== -1) return true;
              // Match ISCP's error page by its body text. NO regex literals —
              // they collapse when this script is stringified.
              var body = document.body ? String(document.body.innerText || "").toLowerCase() : "";
              if (body.indexOf("problem displaying this page") !== -1) return true;
              return false;
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

// Where to send someone who needs to sign in. An assessment form opened cold
// gives ISCP's error page, not a login box — so the user has nothing to log in
// to. ISCP's home page DOES lead into the sign-in flow.
export const LOGIN_URL = "https://www.iscp.ac.uk/";

export const adapter = {
  id: "iscp",
  loginUrl: () => LOGIN_URL,
  displayName: "ISCP",
  formUrl: ({ schema }) => (schema && schema.formUrl) || "https://www.iscp.ac.uk/",
  getSchema,
  buildPlan: buildInjectionPlan,
  buildScript,
};