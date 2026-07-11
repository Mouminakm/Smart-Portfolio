// platforms/turas/adapter.js
// The Turas adapter (NHS Education for Scotland — Foundation portfolio, used in
// Scotland & Wales).
//
// Turas is ASP.NET MVC — plain server-rendered HTML with jQuery. No Angular
// internals, no clicked-div ratings. So the shared machinery does nearly all of
// it and this adapter is mostly composition.
//
// WHAT WE BUILD: the SLE **ticket**. In Turas the trainee doesn't fill in the
// assessment — they TICKET it: describe the case and send the request to an
// assessor, who completes the ratings and feedback later. So a ticket has no
// rater fields at all, which makes it simpler than ISCP.
//
// THE ONE QUIRK: the ticket page hosts ALL FOUR SLE types at once (CBD, DOPS,
// Mini-CEX, Clinical Teacher), each behind a `SelectedForms_XxxFormTicketed`
// checkbox, each with its own prefixed fields (CbdTitle, DopsTitle...). The
// block only appears once its checkbox is ticked — so we tick it FIRST, as a
// pre-step, then fill. That's exactly what composeScript's `preSteps` hook is
// for (it has been sitting unused since Phase M, waiting for this).
//
// NOT AUTO-FILLED (v1):
//  - The Recipient (assessor) radio list is ACCOUNT-SPECIFIC — real supervisor
//    names with this user's own Turas ids. We can't bake those into a schema, so
//    the user taps their assessor on the form. Captured in dictation for
//    reference only.
//  - Reflections — held back until the guarded-paraphrasing phase.

import { composeScript } from "../shared/injectionCore";
import { buildPlan } from "../shared/planCore";

import cbdSchema from "./schemas/turas_cbd_ticket.json";
import clinicalTeacherSchema from "./schemas/turas_clinicalteacher_ticket.json";
import dopsSchema from "./schemas/turas_dops_ticket.json";
import miniCexSchema from "./schemas/turas_minicex_ticket.json";

// Turas keys its schema by ENTRY TYPE (as ISCP does; eLogbook keys by specialty).
const SCHEMAS = {
  turas_cbd_ticket: cbdSchema,
  turas_dops_ticket: dopsSchema,
  turas_minicex_ticket: miniCexSchema,
  turas_clinicalteacher_ticket: clinicalTeacherSchema,
};

// The page has rendered when the "tick which form you want" checkbox for THIS
// SLE type exists. It's server-rendered in one pass, so if that's there,
// everything is.
function readyProbe(schema) {
  const tick = schema.fields.find((f) => f.id === "ticket_form");
  return tick ? tick.selector : "form";
}

// Turas login lives at a different host/path; detect by URL. (We deliberately do
// NOT reuse eLogbook's "a password input means login page" heuristic — that rule
// is unsafe on forms that legitimately contain password fields.)
const LOGIN_EXPR = `(function(){
              var lh = String(window.location.href).toLowerCase();
              return lh.indexOf('/login') !== -1 ||
                     lh.indexOf('signin') !== -1 ||
                     lh.indexOf('identity') !== -1 ||
                     lh.indexOf('auth') !== -1;
            })()`;

// PRE-STEP: tick the "I want this form" checkbox so its block renders, and give
// the page a moment to show it before the fill loop starts.
const PRE_STEPS = `
          (plan.preClicks || []).forEach(function(sel){
            var el = document.querySelector(sel);
            if(el && !el.checked){ el.checked = true; fireInput(el); }
          });`;

// No custom field drivers needed — hand straight to the shared settle-fill loop.
const DO_SPECIALS = `
          function doSpecials(){ settleFill(report); }`;

export function buildScript(plan) {
  return composeScript({
    plan,
    formReadyExpr: `document.querySelector('${plan.__readyProbe || "form"}')`,
    loginExpr: LOGIN_EXPR,
    helpers: "",
    preSteps: PRE_STEPS,
    doSpecials: DO_SPECIALS,
    extraKeys: [],
  });
}

export function getSchema({ entryType } = {}) {
  return SCHEMAS[entryType] || null;
}

export function buildInjectionPlan(fieldValues, schema) {
  // The "ticket this form" checkbox must be ticked before its block exists, so
  // it goes in preClicks (run as a pre-step) rather than the normal fill pass.
  const values = { ...fieldValues };
  const tick = schema.fields.find((f) => f.id === "ticket_form");
  if (tick) delete values.ticket_form; // handled below, not by the fill loop

  const plan = buildPlan(values, schema, {
    dateSep: "/", // Turas expects dd/mm/yyyy (its inputs use a UK date parser)
  });

  if (tick) plan.preClicks.push(tick.selector);
  plan.__readyProbe = readyProbe(schema);
  return plan;
}

export const adapter = {
  id: "turas",
  displayName: "Turas",
  formUrl: ({ schema }) =>
    (schema && schema.formUrl) || "https://turasportfoliowales.nes.digital/",
  getSchema,
  buildPlan: buildInjectionPlan,
  buildScript,
};