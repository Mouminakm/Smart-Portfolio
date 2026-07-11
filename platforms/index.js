// platforms/index.js
// The platform registry. Every screen asks for an adapter BY ID and gets back a
// module that knows how to talk to that portfolio website. This is the single
// place that knows which platforms exist.
//
// TO ADD A PLATFORM (e.g. Horus, FourteenFish, RCEM):
//   1. Harvest the form -> a schema JSON in the established shape.
//   2. Create platforms/<id>/adapter.js implementing the contract below.
//   3. Add ONE line to ADAPTERS here.
//   4. Add its entry types to data/entryTypes.js with route params
//      (?platform=<id>&entryType=<type>) and flip it available in
//      data/portfolios.js.
// No screen code changes. No other platform is touched.
//
// THE CONTRACT each adapter implements:
//   id           stable code-name, matches data/portfolios.js
//   displayName  what the user sees ("eLogbook", "Turas")
//   formUrl(ctx) which page to open in the WebView
//   getSchema(ctx) which schema applies — NOTE platforms differ in what they
//                key on: eLogbook keys on SPECIALTY, Turas/ISCP on ENTRY TYPE.
//                Keeping this inside the adapter absorbs that difference.
//   buildPlan(fieldValues, schema, ...) -> the fill plan
//   buildScript(plan) -> the JS string injected into the page

import { adapter as elogbookAdapter } from "./elogbook/adapter";

const ADAPTERS = {
  elogbook: elogbookAdapter,
  // turas: turasAdapter,     // Phase T
  // iscp: iscpAdapter,       // Phase I
};

// Look up a platform adapter by id. Defaults to eLogbook — the only platform
// currently available — so an entry with no platform param still works exactly
// as it always has.
export function getPlatformAdapter(platformId) {
  return ADAPTERS[platformId] || ADAPTERS.elogbook;
}

export function builtPlatforms() {
  return Object.keys(ADAPTERS);
}