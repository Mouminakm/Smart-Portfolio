// data/specialtySchemas.js
// Maps a user's specialty (exact label from data/specialties.js) to that
// specialty's eLogbook operation schema + procedure list. To add a specialty:
// drop its two JSON files in /schemas and add one entry here.

import cardiothoracicSchema from "../schemas/elogbook_cardiothoracic_operation_log.json";
import cardiothoracicProcedures from "../schemas/elogbook_cardiothoracic_procedures.json";
import generalSurgerySchema from "../schemas/elogbook_general_surgery_operation_log.json";
import generalSurgeryProcedures from "../schemas/elogbook_general_surgery_procedures.json";
import neurosurgerySchema from "../schemas/elogbook_neurosurgery_operation_log.json";
import neurosurgeryProcedures from "../schemas/elogbook_neurosurgery_procedures.json";
import ophthalmologySchema from "../schemas/elogbook_ophthalmology_operation_log.json";
import ophthalmologyProcedures from "../schemas/elogbook_ophthalmology_procedures.json";

const BY_SPECIALTY = {
  "Neurosurgery": { schema: neurosurgerySchema, procedures: neurosurgeryProcedures },
  "Cardiothoracic Surgery": { schema: cardiothoracicSchema, procedures: cardiothoracicProcedures },
  "General Surgery": { schema: generalSurgerySchema, procedures: generalSurgeryProcedures },
  "Ophthalmology": { schema: ophthalmologySchema, procedures: ophthalmologyProcedures },
};

// Returns { schema, procedures } for a specialty, or null if not built yet.
export function getSpecialtyData(specialty) {
  return BY_SPECIALTY[specialty] || null;
}

export function builtSpecialties() {
  return Object.keys(BY_SPECIALTY);
}
