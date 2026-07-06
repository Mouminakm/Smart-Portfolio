// data/entryTypes.js
// Which entry types each PLATFORM offers, keyed by the platform's stable id
// (matching data/portfolios.js). Home looks these up by id, so the keys here
// MUST be ids ("elogbook"), never display names ("eLogbook").
// `available: true` = built and tappable; false = shows "coming soon".

export const ENTRY_TYPES_BY_PORTFOLIO = {
  elogbook: [
    { label: "Operation log", route: "/dictation", available: true },
  ],
  iscp: [
    { label: "CBD — Case-Based Discussion", available: false },
    { label: "CEX — Clinical Evaluation Exercise", available: false },
    { label: "DOPS — Direct Observation of Procedural Skills", available: false },
    { label: "PBA — Procedure-Based Assessment", available: false },
    { label: "Reflection", available: false },
  ],
  turas: [
    // First Turas entry type. Routes to the same dictation screen; we pass the
    // entryType so dictation/submission know to use the Turas CBD schema.
    {
      label: "Case Based Discussion (CBD)",
      subtitle: "Foundation SLE",
      route: "/dictation?platform=turas&entryType=sle_cbd",
      // Hidden for the eLogbook-focused beta. The Turas pathway is built but not
      // yet tested to the same level; flip back to true to re-enable it.
      available: false,
    },
  ],
};