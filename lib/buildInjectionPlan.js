// lib/buildInjectionPlan.js
// Pure translator: turns the app's entry (fieldValues, keyed by schema field id)
// into a structured injection plan the WebView scripts can consume.
// Walks the SCHEMA (not hard-coded names), branches on each field's inputType,
// fuzzy-matches loose AI values to the schema's exact options, resolves the
// procedure name to its node-id, and SKIPS empties + patient-id + app-only fields.

import procedureData from "../schemas/elogbook_neurosurgery_procedures.json";

// Fields we must never auto-fill (spec F11: patient identifiers) or that aren't
// real platform fields.
const NEVER_FILL = new Set([
  "AppPatientAgeDateofBirth_ageyears", // patient age — identifier, never auto-fill
]);

// --- small helpers -------------------------------------------------------

function isEmpty(v) {
  return v === undefined || v === null || String(v).trim() === "";
}

function norm(s) {
  return String(s).trim().toLowerCase();
}

// Match a loose value (e.g. "Elective", "ASA 2") to one of the schema's
// {value,label} options. Tries, in order: exact label, label starts-with,
// label contains, and a bare number in the value matching the option's value.
function matchOption(rawValue, options) {
  const v = norm(rawValue);

  // 1. exact label match
  let hit = options.find((o) => norm(o.label) === v);
  if (hit) return hit;

  // 2. label starts with the value (e.g. "Elective" -> "Elective: Surgery...")
  hit = options.find((o) => norm(o.label).startsWith(v));
  if (hit) return hit;

  // 3. value text contained in the label (e.g. "performed" in "Performed")
  hit = options.find((o) => norm(o.label).includes(v));
  if (hit) return hit;

  // 4. a number in the raw value matching the option's value
  //    (e.g. "ASA 2" -> option value "2")
  const num = (String(rawValue).match(/\d+/) || [])[0];
  if (num) {
    hit = options.find((o) => String(o.value) === num);
    if (hit) return hit;
  }

  return null; // no confident match -> leave for the user
}

// Resolve a procedure NAME to its eLogbook node-id from the procedures file.
function resolveProcedure(rawValue) {
  const v = norm(rawValue);
  const list = procedureData.procedures || [];

  // exact name, then contains either direction (tolerant of minor differences)
  let hit =
    list.find((p) => norm(p.name) === v) ||
    list.find((p) => norm(p.name).includes(v)) ||
    list.find((p) => v.includes(norm(p.name)));

  return hit ? { nodeId: String(hit.id), searchText: hit.name } : null;
}

// Match a dictated hospital name against the user's stored hospitals.
// The stored list is tiny (1-3), so we can match generously without the
// collision risk of the national list. Tries the `search`/`short`/`name`
// fields, exact then contains, both directions.
function matchStoredHospital(dictated, userHospitals) {
  if (!userHospitals || !userHospitals.length) return null;
  const d = String(dictated).trim().toLowerCase().replace(/^the\s+/, "");
  if (!d) return null;

  // Build a comparable key for each stored hospital.
  const key = (h) =>
    String(h.short || h.display || h.name || "")
      .toLowerCase()
      .replace(/^the\s+/, "")
      .replace(/\s*\([^)]*\)\s*$/, "")
      .trim();

  // If only ONE hospital is stored, and the user said *something* hospital-like,
  // it's almost certainly that one — but still require a loose word overlap so
  // we don't fill the wrong site if they clearly named a different place.
  // 1. exact
  let hit = userHospitals.find((h) => key(h) === d);
  if (hit) return hit;
  // 2. stored name contains the dictated, or vice versa
  hit = userHospitals.find((h) => key(h).includes(d) || d.includes(key(h)));
  if (hit) return hit;
  // 3. share a distinctive word (length > 3) — e.g. "royal london" vs stored
  const words = d.split(/\s+/).filter((w) => w.length > 3);
  hit = userHospitals.find((h) => {
    const k = key(h);
    return words.some((w) => k.includes(w));
  });
  if (hit) return hit;

  return null;
}

// Interpret a loose boolean ("Yes"/"true"/"No"/""/etc.).
function asBool(rawValue) {
  const v = norm(rawValue);
  if (["yes", "true", "y", "1"].includes(v)) return true;
  if (["no", "false", "n", "0"].includes(v)) return false;
  return null; // unknown -> don't set
}

// Normalise a date string to eLogbook's UK format dd-mm-yyyy.
// Handles common inputs: mm/dd/yyyy, dd/mm/yyyy, yyyy-mm-dd, etc.
// If we can't confidently parse it, return the original (user can fix on review).
function normaliseDate(raw) {
  const s = String(raw).trim();
  const parts = s.split(/[\/\-.]/).map((p) => p.trim());

  if (parts.length === 3) {
    let [a, b, c] = parts;

    // yyyy-mm-dd (4-digit year first) -> dd-mm-yyyy
    if (a.length === 4) {
      return `${c.padStart(2, "0")}-${b.padStart(2, "0")}-${a}`;
    }

    // Otherwise a/b/c with year last.
    let day, month;
    const year = c;
    if (parseInt(a, 10) > 12) {
      // first number can't be a month -> it's the day (already dd/mm)
      day = a; month = b;
    } else {
      // assume the AI gave US mm/dd -> swap to dd/mm
      month = a; day = b;
    }
    return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
  }

  return s; // couldn't parse — leave as-is for the user to correct
}

// --- the translator ------------------------------------------------------

export function buildInjectionPlan(fieldValues, schema, userHospitals = [], userSpecialty = "") {
  const plan = {
    text: {},        // selector -> string
    selects: {},     // selector -> exact option LABEL (selectByLabel matches label)
    checkboxes: {},  // selector -> true/false
    radios: [],      // { value: chosenLabel, options: [{label, selector}] }
    procedure: null, // { nodeId, searchText }
    hospital: null,  // { searchText, fullName, matchByName }  (resolved live)
    consultant: null,// stored name string
    skipped: [],     // { id, reason }  — transparency
  };

  schema.fields.forEach((f) => {
    const raw = fieldValues[f.id];

    // Skip: patient-id fields, app-only fields, and anything empty.
    if (NEVER_FILL.has(f.id)) { plan.skipped.push({ id: f.id, reason: "never auto-fill (identifier)" }); return; }
    if (f.appOnly || f.submitsToPlatform === false) { plan.skipped.push({ id: f.id, reason: "app-only field" }); return; }
    // operationspecialty is filled from the profile, not dictation, so it's
    // allowed through even when nothing was dictated for it.
    if (isEmpty(raw) && f.id !== "operationspecialty") {
      plan.skipped.push({ id: f.id, reason: "empty" });
      return;
    }

    switch (f.inputType) {
      case "number":
      case "textarea": {
        plan.text[f.selector] = String(raw);
        break;
      }
      case "date": {
        plan.text[f.selector] = normaliseDate(raw);
        break;
      }
      case "select": {
        if (f.id === "responsibleconsultant") {
          // account-specific: handled by name-match at injection time
          plan.consultant = String(raw);
        } else if (f.id === "operationspecialty") {
          // specialty comes from the PROFILE, not dictation — match the stored
          // specialty against eLogbook's options (they share exact labels).
          const opt = userSpecialty ? matchOption(userSpecialty, f.options) : null;
          if (opt) plan.selects[f.selector] = opt.label;
          else plan.skipped.push({ id: f.id, reason: "profile specialty '" + userSpecialty + "' not in eLogbook options" });
        } else if (f.options) {
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
      case "radio": {
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
      case "autocomplete": {
        if (f.id === "procedure") {
          const p = resolveProcedure(raw);
          if (p) plan.procedure = p;
          else plan.skipped.push({ id: f.id, reason: "procedure not found: '" + raw + "'" });
        } else if (f.id === "hospitalsAccordion") {
          // Match the dictated hospital name against the user's OWN stored
          // hospitals (a tiny, known-good list) — reliable, unlike matching the
          // national list. Each stored hospital carries its exact eLogbook id.
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
        }
        break;
      }
      default: {
        plan.skipped.push({ id: f.id, reason: "unhandled inputType: " + f.inputType });
      }
    }
  });

  return plan;
}