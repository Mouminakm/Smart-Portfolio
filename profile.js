// profile.js
// Read and write a user's profile document in Firestore.
// Each profile lives at profiles/{uid}, so a user only ever touches their own
// (matching the security rule we set). Screens call these, not Firestore directly.

import { doc, getDoc, setDoc } from "firebase/firestore";
import { UK_PORTFOLIOS } from "./data/portfolios"; // the platform list (id + name)
import { db } from "./firebase"; // the Firestore database we connected in Stage 2

// Save (create or overwrite) the profile for a given user.
// uid = the user's Firebase ID; profileData = a plain object of fields.
export async function saveProfile(uid, profileData) {
  const ref = doc(db, "profiles", uid);
  // { merge: true } = update the fields I pass, leave the rest untouched.
  await setDoc(ref, profileData, { merge: true });
}

// Turn any stored portfolio value into its stable id.
// Older profiles saved the NAME (e.g. "eLogbook"); newer ones save the id
// (e.g. "elogbook"). This accepts either and always returns the id.
function toPortfolioId(stored) {
  // Already an id we recognise? Keep it.
  const byId = UK_PORTFOLIOS.find((p) => p.id === stored);
  if (byId) return byId.id;
  // Otherwise it's probably an old NAME — look it up and return its id.
  const byName = UK_PORTFOLIOS.find((p) => p.name === stored);
  if (byName) return byName.id;
  // Unknown value (shouldn't happen) — hand it back untouched so nothing is lost.
  return stored;
}

// Load a user's profile. Returns the saved object, or null if they have none yet.
export async function loadProfile(uid) {
  const ref = doc(db, "profiles", uid);
  const snapshot = await getDoc(ref); // read the document
  if (!snapshot.exists()) {
    return null; // no profile saved yet (e.g. a brand-new account)
  }
  const data = snapshot.data(); // the saved fields, as a plain object

  // Bridge old profiles to ids. If a user has no portfolios at all (they
  // predate the picker being required), treat them as eLogbook — the platform
  // every existing user was on. We fix this HERE on read, never in Firestore.
  const rawPortfolios = Array.isArray(data.portfolios) ? data.portfolios : [];
  const portfolios =
    rawPortfolios.length > 0 ? rawPortfolios.map(toPortfolioId) : ["elogbook"];

  return { ...data, portfolios };
}

// The single question every screen asks: "which platform is this entry for?"
// A user may have up to two portfolios; for now we use the first AVAILABLE one
// (the only one that can actually be filled). This is the one place that answer
// lives, so screens never poke at the array themselves.
export function activePlatform(profile) {
  const list = (profile && profile.portfolios) || [];
  // Prefer a portfolio that is actually built/available…
  const firstAvailable = list.find((id) => {
    const p = UK_PORTFOLIOS.find((x) => x.id === id);
    return p && p.available;
  });
  // …otherwise fall back to the first listed, or eLogbook if the list is empty.
  return firstAvailable || list[0] || "elogbook";
}