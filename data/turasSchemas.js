// data/turasSchemas.js
// Turas Portfolio (Foundation — Scotland & Wales) schemas, built from a live
// form capture of /Tickets/SupervisedLearningEventTickets/Create (July 2026).
//
// Turas is a server-rendered ASP.NET MVC site (jQuery + Bootstrap), NOT Angular.
// Plain value-setting + change events work; no __ngContext__ needed.
//
// TURAS RULES (differ from eLogbook — keep these in mind):
// 1. NEVER select radios by #id — Turas radios share duplicate ids. Always use
//    input[name="..."][value="..."] selectors, as written below.
// 2. The CBD section is inside a Bootstrap collapse panel, opened by CLICKING
//    the section checkbox (#SelectedForms_CbdFormTicketed). Set-checked alone
//    does not expand the panel — the injection script must call .click().
// 3. Dates are UK format dd/mm/yyyy (the form uses a "ukdateparser").

export const TURAS_SCHEMAS = {
    // Supervised Learning Event ticket — Case Based Discussion.
    // Same page also hosts DOPS / Mini-CEX / Clinical Teacher sections; those
    // get their own schemas later, reusing this shape with different prefixes.
    sle_cbd: {
      platform: "turas",
      entryType: "sle_cbd",
      label: "Case Based Discussion (CBD)",
      formUrl:
        "https://turasportfoliowales.nes.digital/Tickets/SupervisedLearningEventTickets/Create?formType=Cbd",
      // Checkbox that expands the CBD section — must be clicked before filling.
      sectionToggleSelector: "#SelectedForms_CbdFormTicketed",
      fields: [
        {
          id: "cbd_date",
          label: "Date of CBD",
          type: "date",
          required: true,
          selector: "#CbdProcedureDate",
          inputType: "text", // bootstrap-datepicker on a text input, dd/mm/yyyy
          extractionHints: ["date", "on the", "yesterday", "today"],
        },
        {
          id: "cbd_title",
          label: "Title of Case Based Discussion",
          type: "text",
          required: true,
          maxLength: 50,
          selector: "#CbdTitle",
          inputType: "text",
          extractionHints: ["title", "case of", "about"],
        },
        {
          id: "cbd_history",
          label: "Brief anonymous history / context",
          type: "longtext",
          required: true,
          maxLength: 1000,
          selector: "#CbdHistory",
          inputType: "textarea",
          extractionHints: ["history", "presented with", "background", "context"],
        },
        {
          id: "cbd_clinical_setting",
          label: "Clinical Setting",
          type: "radioGroup",
          required: true,
          // Selected by name+value — never by id (Turas rule 1).
          options: [
            { label: "Acute (eg ED, theatre, admissions)", selector: 'input[name="CbdClinicalSettingId"][value="1321"]' },
            { label: "Non-acute (eg OPD, ward)",            selector: 'input[name="CbdClinicalSettingId"][value="1322"]' },
            { label: "Community (eg GP surgery, home visits)", selector: 'input[name="CbdClinicalSettingId"][value="1323"]' },
            { label: "Other",                               selector: 'input[name="CbdClinicalSettingId"][value="1306"]' },
          ],
          extractionHints: ["setting", "ED", "ward", "clinic", "theatre", "GP"],
        },
        {
          id: "cbd_clinical_setting_other",
          label: "Other Clinical Setting",
          type: "text",
          required: false, // required only when setting = Other (conditional)
          maxLength: 250,
          selector: "#CbdClinicalSettingOther",
          inputType: "text",
          dependsOn: { field: "cbd_clinical_setting", value: "Other" },
        },
        {
          id: "cbd_setting_detail",
          label: "More detail of clinical setting (optional)",
          type: "longtext",
          required: false,
          maxLength: 1000,
          selector: "#CbdClinicalSettingDetail",
          inputType: "textarea",
        },
        {
          id: "cbd_simulated",
          label: "Was this in a simulated setting?",
          type: "radioGroup",
          required: true,
          options: [
            { label: "Yes", selector: 'input[name="CbdSimulatedSetting"][value="True"]' },
            { label: "No",  selector: 'input[name="CbdSimulatedSetting"][value="False"]' },
          ],
          extractionHints: ["simulated", "simulation", "real patient"],
        },
        {
          id: "cbd_telephone_video",
          label: "Telephone / video consultation?",
          type: "radioGroup",
          required: true,
          options: [
            { label: "Yes", selector: 'input[name="CbdTelephoneVideoConsultation"][value="True"]' },
            { label: "No",  selector: 'input[name="CbdTelephoneVideoConsultation"][value="False"]' },
          ],
          extractionHints: ["telephone", "video", "remote", "face to face"],
        },
        {
          id: "cbd_clinical_problems",
          label: "Clinical Problem Category (tick all that apply)",
          type: "multicheck", // NEW TYPE: several checkboxes may be ticked
          required: true,     // at least one
          options: [
            { label: "Clinical Assessment",     selector: "#CbdSelectedClinicalProblemIds94" },
            { label: "Clinical Prioritisation", selector: "#CbdSelectedClinicalProblemIds95" },
            { label: "Holistic Planning",       selector: "#CbdSelectedClinicalProblemIds96" },
            { label: "Communication and Care",  selector: "#CbdSelectedClinicalProblemIds97" },
            { label: "Continuity of Care",      selector: "#CbdSelectedClinicalProblemIds98" },
            { label: "Other",                   selector: "#CbdSelectedClinicalProblemIds99" },
          ],
          extractionHints: ["assessment", "prioritisation", "planning", "communication", "continuity"],
        },
        {
          id: "cbd_clinical_problem_other",
          label: "Other Category",
          type: "text",
          required: false, // conditional on "Other" being ticked
          maxLength: 250,
          selector: "#CbdClinicalProblemOther",
          inputType: "text",
          dependsOn: { field: "cbd_clinical_problems", value: "Other" },
        },
        {
          id: "cbd_reflection",
          label: "Reflection",
          type: "longtext",
          required: true,
          maxLength: 4000,
          selector: "#CbdReflection",
          inputType: "textarea",
          isReflection: true, // Phase 6 guarded paraphrasing applies here
        },
      ],
    },
  };
  
  // Same lookup pattern as getSpecialtyData() so calling code feels familiar.
  export function getTurasSchema(entryType) {
    return TURAS_SCHEMAS[entryType] || null;
  }