// data/specialtySchemas.js
// Maps a user's specialty (exact label from data/specialties.js) to that
// specialty's eLogbook operation schema + procedure list. To add a specialty:
// drop its two JSON files in /schemas and add one entry here.
// All 12 eLogbook surgical specialties are now built.

import cardiothoracicSchema from "../schemas/elogbook_cardiothoracic_operation_log.json";
import cardiothoracicProcedures from "../schemas/elogbook_cardiothoracic_procedures.json";
import generalSurgerySchema from "../schemas/elogbook_general_surgery_operation_log.json";
import generalSurgeryProcedures from "../schemas/elogbook_general_surgery_procedures.json";
import neurosurgerySchema from "../schemas/elogbook_neurosurgery_operation_log.json";
import neurosurgeryProcedures from "../schemas/elogbook_neurosurgery_procedures.json";
import ophthalmologySchema from "../schemas/elogbook_ophthalmology_operation_log.json";
import ophthalmologyProcedures from "../schemas/elogbook_ophthalmology_procedures.json";
import otolaryngologySchema from "../schemas/elogbook_otolaryngology_operation_log.json";
import otolaryngologyProcedures from "../schemas/elogbook_otolaryngology_procedures.json";
import traumaOrthoSchema from "../schemas/elogbook_trauma_and_orthopaedic_surgery_operation_log.json";
import traumaOrthoProcedures from "../schemas/elogbook_trauma_and_orthopaedic_surgery_procedures.json";
import maxfaxSchema from "../schemas/elogbook_oral_and_maxillofacial_surgery_operation_log.json";
import maxfaxProcedures from "../schemas/elogbook_oral_and_maxillofacial_surgery_procedures.json";
import oralSurgerySchema from "../schemas/elogbook_oral_surgery_operation_log.json";
import oralSurgeryProcedures from "../schemas/elogbook_oral_surgery_procedures.json";
import paediatricSurgerySchema from "../schemas/elogbook_paediatric_surgery_operation_log.json";
import paediatricSurgeryProcedures from "../schemas/elogbook_paediatric_surgery_procedures.json";
import plasticSurgerySchema from "../schemas/elogbook_plastic_surgery_operation_log.json";
import plasticSurgeryProcedures from "../schemas/elogbook_plastic_surgery_procedures.json";
import urologySchema from "../schemas/elogbook_urology_operation_log.json";
import urologyProcedures from "../schemas/elogbook_urology_procedures.json";
import vascularSchema from "../schemas/elogbook_vascular_operation_log.json";
import vascularProcedures from "../schemas/elogbook_vascular_procedures.json";

const BY_SPECIALTY = {
  "Neurosurgery": { schema: neurosurgerySchema, procedures: neurosurgeryProcedures },
  "Cardiothoracic Surgery": { schema: cardiothoracicSchema, procedures: cardiothoracicProcedures },
  "General Surgery": { schema: generalSurgerySchema, procedures: generalSurgeryProcedures },
  "Ophthalmology": { schema: ophthalmologySchema, procedures: ophthalmologyProcedures },
  "Otolaryngology": { schema: otolaryngologySchema, procedures: otolaryngologyProcedures },
  "Trauma and Orthopaedic Surgery": { schema: traumaOrthoSchema, procedures: traumaOrthoProcedures },
  "Oral and Maxillofacial surgery": { schema: maxfaxSchema, procedures: maxfaxProcedures },
  "Oral Surgery": { schema: oralSurgerySchema, procedures: oralSurgeryProcedures },
  "Paediatric Surgery": { schema: paediatricSurgerySchema, procedures: paediatricSurgeryProcedures },
  "Plastic Surgery": { schema: plasticSurgerySchema, procedures: plasticSurgeryProcedures },
  "Urology": { schema: urologySchema, procedures: urologyProcedures },
  "Vascular": { schema: vascularSchema, procedures: vascularProcedures },
};

// Returns { schema, procedures } for a specialty, or null if not built yet.
export function getSpecialtyData(specialty) {
  return BY_SPECIALTY[specialty] || null;
}

export function builtSpecialties() {
  return Object.keys(BY_SPECIALTY);
}
