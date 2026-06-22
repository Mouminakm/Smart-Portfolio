// profile.js
// Read and write a user's profile document in Firestore.
// Each profile lives at profiles/{uid}, so a user only ever touches their own
// (matching the security rule we set). Screens call these, not Firestore directly.

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase"; // the Firestore database we connected in Stage 2

// Save (create or overwrite) the profile for a given user.
// uid = the user's Firebase ID; profileData = a plain object of fields.
export async function saveProfile(uid, profileData) {
  // doc(...) is the ADDRESS of this user's profile document.
  const ref = doc(db, "profiles", uid);
  // setDoc WRITES the data there. { merge: true } means "update the fields I
  // pass and leave any others untouched" — so saving just the GMC number later
  // won't wipe the specialty. Without merge, it would replace the whole doc.
  await setDoc(ref, profileData, { merge: true });
}

// Load a user's profile. Returns the saved object, or null if they have none yet.
export async function loadProfile(uid) {
  const ref = doc(db, "profiles", uid);
  const snapshot = await getDoc(ref); // read the document
  if (snapshot.exists()) {
    return snapshot.data(); // the saved fields, as a plain object
  }
  return null; // no profile saved yet (e.g. a brand-new account)
}