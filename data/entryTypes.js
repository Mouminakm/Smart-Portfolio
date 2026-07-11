// data/entryTypes.js
// Which entry types each PLATFORM offers, keyed by the platform's stable id
// (matching data/portfolios.js). Home looks these up by id, so the keys here
// MUST be ids ("elogbook"), never display names ("eLogbook").
// `available: true` = built and tappable; false = shows "coming soon".
//
// Each route is an OBJECT: { pathname, params }. It must NOT be a plain query
// string ("/dictation?platform=iscp") — expo-router does not reliably parse a
// query string passed to router.push() into useLocalSearchParams, so the
// platform would arrive as undefined and dictation would silently fall back to
// eLogbook. Passing params as an object is the reliable form.

export const ENTRY_TYPES_BY_PORTFOLIO = {
  elogbook: [
    // eLogbook picks its schema by the user's SPECIALTY, so no entryType needed.
    { label: "Operation log", route: { pathname: "/dictation", params: { platform: "elogbook" } }, available: true },
  ],

  iscp: [
    // Harvested from the live ISCP forms. The trainee DRAFTS the assessment
    // (including the rater's ratings and feedback) for the assessor to review,
    // edit and validate with their own password.
    {
      label: "DOPS — Direct Observation of Procedural Skills",
      subtitle: "Surgical WBA",
      route: { pathname: "/dictation", params: { platform: "iscp", entryType: "iscp_dops" } },
      available: true,
    },
    {
      label: "CEX-C — Clinical Evaluation Exercise (Consent)",
      subtitle: "Surgical WBA",
      route: { pathname: "/dictation", params: { platform: "iscp", entryType: "iscp_cexc" } },
      available: true,
    },
    {
      label: "CEX — Clinical Evaluation Exercise",
      subtitle: "Surgical WBA",
      route: { pathname: "/dictation", params: { platform: "iscp", entryType: "iscp_cex" } },
      available: true,
    },
    {
      label: "CBD — Case-Based Discussion",
      subtitle: "Surgical WBA",
      route: { pathname: "/dictation", params: { platform: "iscp", entryType: "iscp_cbd" } },
      available: true,
    },
    // PBA deliberately NOT supported: its form is two-stage (it only renders
    // after a procedure is chosen) and its competency items are per-procedure.
  ],

  turas: [
    // Turas SLE TICKETS: the trainee describes the case and sends the request;
    // the assessor completes the ratings and feedback later. All four SLE types
    // live on one page, each behind its own "ticket this form" checkbox.
    {
      label: "CBD — Case Based Discussion",
      subtitle: "SLE ticket",
      route: { pathname: "/dictation", params: { platform: "turas", entryType: "turas_cbd_ticket" } },
      available: true,
    },
    {
      label: "Mini-CEX",
      subtitle: "SLE ticket",
      route: { pathname: "/dictation", params: { platform: "turas", entryType: "turas_minicex_ticket" } },
      available: true,
    },
    {
      label: "DOPS — Direct Observation of Procedural Skills",
      subtitle: "SLE ticket",
      route: { pathname: "/dictation", params: { platform: "turas", entryType: "turas_dops_ticket" } },
      available: true,
    },
    {
      label: "Developing the Clinical Teacher",
      subtitle: "SLE ticket",
      route: { pathname: "/dictation", params: { platform: "turas", entryType: "turas_clinicalteacher_ticket" } },
      available: true,
    },
  ],
};