// snapshot.mjs — TEMPORARY (delete after Phase M is verified).
// Generates the injection script from the CURRENT code for a fixed sample plan,
// so we can diff it against the post-refactor output and prove we relocated
// code without changing behaviour.

import fs from "fs";
import { buildFullInjectionScript } from "./lib/elogbookScript.js";

// A fixed plan that exercises every branch of the script.
const samplePlan = {
  text: { "#dateofoperation": "07-07-2026", "#operationnotes": "Sample notes" },
  selects: { "#operationspecialty": "Neurosurgery", "#cepod": "Elective" },
  checkboxes: { "#supervisiontrainer": true },
  radios: [
    { value: "Yes", options: [{ label: "Yes", selector: "#p_yes" }, { label: "No", selector: "#p_no" }] },
  ],
  procedure: { nodeId: 1234, searchText: "Craniotomy" },
  hospital: { id: 99, name: "Sample Hospital", search: "Sample" },
  consultant: "Mr Sample",
  skipped: [],
};

fs.writeFileSync("snapshot-before.txt", buildFullInjectionScript(samplePlan));
console.log("Wrote snapshot-before.txt");