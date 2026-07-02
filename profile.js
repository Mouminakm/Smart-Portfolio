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
    const data = snapshot.data(); // the saved fields, as a plain object
    // Default the platform for older profiles that predate the platform picker.
    // We fix it HERE (on read) rather than editing every stored document, so all
    // existing users are treated as eLogbook users without touching Firestore.
    // The ?? operator means "use the left side, unless it's null/undefined,
    // in which case use the right side" — so an already-set platform is kept.
    return { ...data, platform: data.platform ?? "elogbook" };
  }
  return null; // no profile saved yet (e.g. a brand-new account)
}