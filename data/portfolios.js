// data/portfolios.js
// UK training portfolio & logbook platforms (spec Section 3).
// `available: true` means the app supports it now; others show "coming soon"
// and can't be selected yet. Flip these to true as each platform is built.

export const UK_PORTFOLIOS = [
  // id = permanent code-name used by our code; never reword it.
  // name = the human label shown to the doctor; safe to reword any time.
  { id: "elogbook",   name: "eLogbook", available: true },
  { id: "iscp",       name: "ISCP", available: true },
  { id: "horus",      name: "Horus (Foundation – England)", available: false },
  { id: "turas",      name: "Turas (Foundation – Scotland & Wales)", available: false },
  { id: "jrcptb",     name: "Physician ePortfolio (JRCPTB)", available: false },
  { id: "llp",        name: "Lifelong Learning Platform (Anaesthetics)", available: false },
  { id: "icm",        name: "ICM ePortfolio", available: false },
  { id: "rcem",       name: "RCEM ePortfolio (Emergency Medicine)", available: false },
  { id: "fourteenfish", name: "RCGP Trainee Portfolio (FourteenFish)", available: false },
  { id: "rcpch",      name: "RCPCH ePortfolio (Paediatrics)", available: false },
  { id: "rcr",        name: "RCR ePortfolio (Radiology / Oncology)", available: false },
  { id: "lept",       name: "LEPT (Pathology)", available: false },
  { id: "rcpsych",    name: "RCPsych Portfolio (Psychiatry)", available: false },
  { id: "rcog",       name: "RCOG Training ePortfolio (O&G)", available: false },
  { id: "rcophth",    name: "RCOphth ePortfolio + Eye Logbook", available: false },
];