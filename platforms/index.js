// platforms/index.js
// The platform registry. Every screen asks for an adapter BY ID and gets back a
// module that knows how to talk to that portfolio website. This is the single
// place that knows which platforms exist.
//
// TO ADD A PLATFORM:
//   1. Harvest the form -> a schema JSON in the established shape.
//   2. Create platforms/<id>/adapter.js implementing the contract below.
//   3. Add ONE line to ADAPTERS here.
//   4. Add its entry types to data/entryTypes.js (with route params) and flip it
//      available in data/portfolios.js.
// No screen code changes. No other platform is touched.
//
// THE CONTRACT each adapter implements:
//   id           stable code-name, matches data/portfolios.js
//   displayName  what the user sees ("eLogbook", "ISCP", "Turas")
//   formUrl(ctx) which page to open in the WebView
//   getSchema(ctx) which schema applies — platforms differ in what they key on:
//                eLogbook keys on SPECIALTY, ISCP/Turas on ENTRY TYPE. Keeping
//                this inside the adapter absorbs that difference.
//   buildPlan(fieldValues, schema, ...) -> the fill plan
//   buildScript(plan) -> the JS string injected into the page
//   getProcedureNames(ctx)  OPTIONAL — only platforms with a procedure catalogue
//                (eLogbook has one; ISCP and Turas do not).

import { adapter as elogbookAdapter } from "./elogbook/adapter";
import { adapter as iscpAdapter } from "./iscp/adapter";
import { adapter as turasAdapter } from "./turas/adapter";

const ADAPTERS = {
  elogbook: elogbookAdapter,
  iscp: iscpAdapter,
  turas: turasAdapter,
};

// Look up a platform adapter by id. Falls back to eLogbook if the platform is
// missing or unknown, so an entry with no platform param still behaves exactly
// as it always has.
//
// NOTE: if you ever see the WRONG platform's fields in dictation, this fallback
// is what you're seeing — it means `platformId` arrived undefined, or the id
// isn't in ADAPTERS above.
export function getPlatformAdapter(platformId) {
  return ADAPTERS[platformId] || ADAPTERS.elogbook;
}

export function builtPlatforms() {
  return Object.keys(ADAPTERS);
}