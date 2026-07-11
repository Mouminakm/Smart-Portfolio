// platforms/shared/planCore.js
// The SITE-AGNOSTIC half of the plan builder. Turns the app's entry
// (fieldValues, keyed by schema field id) into a structured injection plan that
// the shared injectionCore knows how to apply to ANY form.
//
// It walks the schema, branches on each field's inputType, fuzzy-matches loose
// AI values to the schema's exact options, and skips empties, patient
// identifiers (spec F11) and app-only fields.
//
// Anything a platform handles specially (eLogbook's Angular typeaheads, its
// account-specific consultant list, Turas's multi-checkbox groups) is delegated
// to the adapter via the `specialCase` hook — see buildPlan below.

import { PATIENT_IDENTIFIER_SET } from "../../lib/patientFields";

// --- shared helpers (exported so adapters can reuse them) ------------------

export function isEmpty(v) {
  return v === undefined || v === null || String(v).trim() === "";
}

// Normalise for comparison: lowercase, trim, and fold common UK/US spelling
// differences so "hematoma" matches "haematoma", "tumor" matches "tumour", etc.
// Applied to BOTH the dictated text and the schema names, so both sides land on
// the same spelling before we compare.
export function norm(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/haem/g, "hem")      // haematoma -> hematoma
    .replace(/oe/g, "e")          // oesophageal, coeliac, -coele -> -cele
    .replace(/tumour/g, "tumor")  // tumour -> tumor
    .replace(/ae/g, "e")          // anaesthetic, paediatric -> anesthetic...
    .replace(/\bcsf\b/g, "csf");  // keep CSF stable (no-op, documents intent)
}

// Match a loose value (e.g. "Elective", "ASA 2") to one of the schema's
// {value,label} options. Tries, in order: exact label, label starts-with,
// label contains, and a bare number in the value matching the option's value.
export function matchOption(rawValue, options) {
  const v = norm(rawValue);

  let hit = options.find((o) => norm(o.label) === v);            // 1. exact label
  if (hit) return hit;

  hit = options.find((o) => norm(o.label).startsWith(v));        // 2. starts with
  if (hit) return hit;

  hit = options.find((o) => norm(o.label).includes(v));          // 3. contains
  if (hit) return hit;

  const num = (String(rawValue).match(/\d+/) || [])[0];          // 4. "ASA 2" -> "2"
  if (num) {
    hit = options.find((o) => String(o.value) === num);
    if (hit) return hit;
  }

  return null; // no confident match -> leave for the user
}

// Interpret a loose boolean ("Yes"/"true"/"No"/etc.).
export function asBool(rawValue) {
  const v = norm(rawValue);
  if (["yes", "true", "y", "1"].includes(v)) return true;
  if (["no", "false", "n", "0"].includes(v)) return false;
  return null; // unknown -> don't set
}

// Normalise a date to a platform's UK format. The PARSING is shared; only the
// separator differs (eLogbook wants dd-mm-yyyy, Turas wants dd/mm/yyyy), so the
// adapter passes it in.
//
// The upstream parser always hands us UK order (day first), so the first number
// is the day and the second the month — no format-guessing. (Older code assumed
// US mm/dd here and silently swapped every date on or before the 12th, e.g.
// 05-03 -> 03-05. That was the date-corruption bug.)
export function normaliseDate(raw, sep = "-") {
  const s = String(raw).trim();
  const parts = s.split(/[/\-.]/).map((p) => p.trim());

  if (parts.length === 3) {
    const [a, b, c] = parts;

    // yyyy-mm-dd (4-digit year first) -> dd<sep>mm<sep>yyyy
    if (a.length === 4) {
      return `${c.padStart(2, "0")}${sep}${b.padStart(2, "0")}${sep}${a}`;
    }

    // Year last, UK order: a = day, b = month.
    return `${a.padStart(2, "0")}${sep}${b.padStart(2, "0")}${sep}${c}`;
  }

  return s; // couldn't parse — leave as-is for the user to correct
}

// --- the generic plan builder ---------------------------------------------
//
// options:
//   dateSep      separator for date output ("-" for eLogbook, "/" for Turas)
//   specialCase  (field, raw, plan, ctx) => true if the ADAPTER handled this
//                field itself. Return true to stop the generic switch touching
//                it. This is how platform-only fields (eLogbook's typeaheads,
//                its consultant/specialty selects) stay out of the shared code.
//   ctx          anything the adapter's specialCase needs (profile, specialty…)
//
export function buildPlan(fieldValues, schema, options = {}) {
  const { dateSep = "-", specialCase = null, ctx = {} } = options;

  const plan = {
    text: {},        // selector -> string
    selects: {},     // selector -> exact option LABEL
    checkboxes: {},  // selector -> true/false
    radios: [],      // { value: chosenLabel, options: [{label, selector}] }
    multichecks: [], // { selectors: [...] }  (Turas: tick several boxes)
    clicks: [],      // [selector]  elements to .click() (ISCP rating divs)
    procedure: null, // platform-specific (eLogbook)
    hospital: null,  // platform-specific (eLogbook)
    consultant: null,// platform-specific (eLogbook)
    preClicks: [],   // selectors to .click() before filling (Turas section toggle)
    skipped: [],     // { id, reason } — transparency
  };

  // Which competencies were rated individually, and any blanket rating. The
  // blanket can only be applied once every individual rating is known, so it's
  // resolved in a second pass after this loop.
  const ratedIds = new Set();
  let blanket = null;

  schema.fields.forEach((f) => {
    const raw = fieldValues[f.id];

    // Never auto-fill patient identifiers (spec F11).
    if (PATIENT_IDENTIFIER_SET.has(f.id)) {
      plan.skipped.push({ id: f.id, reason: "never auto-fill (identifier)" });
      return;
    }
    if (f.appOnly || f.submitsToPlatform === false) {
      plan.skipped.push({ id: f.id, reason: "app-only field" });
      return;
    }

    // Give the platform first refusal — it may want this field even when nothing
    // was dictated for it (e.g. eLogbook fills Specialty from the PROFILE).
    if (specialCase && specialCase(f, raw, plan, ctx)) return;

    if (isEmpty(raw)) {
      plan.skipped.push({ id: f.id, reason: "empty" });
      return;
    }

    switch (f.inputType) {
      case "number":
      case "textarea":
      case "text": {
        plan.text[f.selector] = String(raw);
        break;
      }
      case "date": {
        plan.text[f.selector] = normaliseDate(raw, dateSep);
        break;
      }
      case "select": {
        if (f.options) {
          const opt = matchOption(raw, f.options);
          if (opt) plan.selects[f.selector] = opt.label;
          else plan.skipped.push({ id: f.id, reason: "no option match for '" + raw + "'" });
        }
        break;
      }
      case "checkbox": {
        const b = asBool(raw);
        if (b === null) plan.skipped.push({ id: f.id, reason: "unclear boolean '" + raw + "'" });
        else plan.checkboxes[f.selector] = b;
        break;
      }
      case "radio":
      case "radioGroup": {
        // Map the raw value to one of the radio's option labels.
        // For Yes/No radios, accept loose booleans too.
        let chosenLabel = null;
        const exact = f.options.find((o) => norm(o.label) === norm(raw));
        if (exact) chosenLabel = exact.label;
        else {
          const b = asBool(raw);
          if (b !== null) {
            const lbl = b ? "yes" : "no";
            const m = f.options.find((o) => norm(o.label) === lbl);
            if (m) chosenLabel = m.label;
          }
        }
        if (chosenLabel) plan.radios.push({ value: chosenLabel, options: f.options });
        else plan.skipped.push({ id: f.id, reason: "no radio option for '" + raw + "'" });
        break;
      }
      case "ratingGrid": {
        // ISCP competency ratings. These are NOT form controls — they're
        // <div class="rating" data-rating-id data-score-id> elements that you
        // CLICK, and the page's own JS records the choice. So we record a click
        // selector rather than a value.
        //
        // Accept the letter (N/D/S/O) or the full label ("Satisfactory").
        const opt =
          f.options.find((o) => o.short && norm(o.short) === norm(raw)) ||
          matchOption(raw, f.options);
        if (opt && f.ratingId) {
          plan.clicks.push(
            'div.rating[data-rating-id="' + f.ratingId + '"][data-score-id="' + opt.value + '"]'
          );
          ratedIds.add(String(f.ratingId)); // so the blanket below skips it
        } else {
          plan.skipped.push({ id: f.id, reason: "no rating matched '" + raw + "'" });
        }
        break;
      }
      case "ratingDefault": {
        // A BLANKET rating the assessor gave ("satisfactory for everything
        // else"). It's a real stated judgement, so it fills every competency
        // that wasn't rated individually — but it can only be resolved once we
        // know which those are, so we defer it to the second pass below.
        const opt =
          f.options.find((o) => o.short && norm(o.short) === norm(raw)) ||
          matchOption(raw, f.options);
        if (opt) blanket = { field: f, scoreId: opt.value };
        else plan.skipped.push({ id: f.id, reason: "no rating matched '" + raw + "'" });
        break;
      }
      case "multicheck": {
        // Several checkboxes from one dictated value (Turas clinical problems).
        // Accept a list or a comma-separated string; tick every option matched.
        const wanted = Array.isArray(raw) ? raw : String(raw).split(",");
        const hits = [];
        wanted.forEach((w) => {
          if (isEmpty(w)) return;
          const opt = matchOption(w, f.options);
          if (opt && opt.selector && !hits.includes(opt.selector)) hits.push(opt.selector);
        });
        if (hits.length) hits.forEach((s) => { plan.checkboxes[s] = true; });
        else plan.skipped.push({ id: f.id, reason: "no options matched '" + raw + "'" });
        break;
      }
      default: {
        plan.skipped.push({ id: f.id, reason: "unhandled inputType: " + f.inputType });
      }
    }
  });


  // Second pass: apply the blanket rating to every competency the assessor did
  // not single out. A blanket statement ("satisfactory for everything else") IS
  // a stated judgement, so it fills — but an individual rating always wins.
  // Items covered by NEITHER stay unset: an unstated rating is left blank,
  // never guessed.
  if (blanket) {
    schema.fields
      .filter((f) => f.inputType === "ratingGrid" && f.ratingId)
      .forEach((f) => {
        if (ratedIds.has(String(f.ratingId))) return; // rated individually — wins
        plan.clicks.push(
          'div.rating[data-rating-id="' + f.ratingId + '"][data-score-id="' + blanket.scoreId + '"]'
        );
      });
  }

  return plan;
}