// lib/patientFields.js
// SINGLE SOURCE OF TRUTH for patient-identifier field IDs (spec F11).
//
// These fields must NEVER be:
//   - shown on the dictation checklist,
//   - offered to the AI parser, or
//   - auto-filled into eLogbook.
// The clinician enters them directly on eLogbook if their portfolio needs them.
//
// Matched by EXACT id only — never by substring. (e.g. the clinical field
// "emergencyoutpatienttreatmentepisode" contains the letters "patient" but is
// NOT an identifier and must stay visible.)
//
// To protect a new patient field, add it here ONCE — every place that imports
// this list (the dictation parser list, the dictation checklist filter, and the
// injection planner's NEVER_FILL) picks it up automatically, so the three can
// never drift apart again.
export const PATIENT_IDENTIFIER_FIELDS = [
    "patientid", // patient hospital/ID number
    "AppPatientAgeDateofBirth_ageyears", // patient age (years)
    "AppPatientAgeDateofBirth_agemonths", // patient age (months)
    "AppPatientAgeDateofBirth_agedays", // patient age (days) — paeds neonatal
    "AppPatientAgeDateofBirth_dateofbirth", // patient date of birth
  ];
  
  // Same list as a Set, for fast .has(id) lookups in the injection planner.
  export const PATIENT_IDENTIFIER_SET = new Set(PATIENT_IDENTIFIER_FIELDS);