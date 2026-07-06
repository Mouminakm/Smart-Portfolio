// contexts/AuthContext.jsx
// Real Firebase auth + onboarding-completion tracking.
// Exposes: isSignedIn, hasCompletedOnboarding, isLoading, user,
//          signUp / signIn / signOut / completeOnboarding.

import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { deleteProfile, loadProfile, saveProfile } from "../profile";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // true while we check things

  useEffect(() => {
    // Runs on launch and whenever sign-in state changes.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      setUser(firebaseUser);

      if (firebaseUser) {
        // Read their profile to see if they've finished setup.
        try {
          const profile = await loadProfile(firebaseUser.uid);
          setHasCompletedOnboarding(!!(profile && profile.onboardingComplete));
        } catch (e) {
          setHasCompletedOnboarding(false);
        }
      } else {
        setHasCompletedOnboarding(false);
      }

      setIsLoading(false); // done checking — safe to route
    });
    return unsubscribe;
  }, []);

  async function signUp(email, password) {
    await createUserWithEmailAndPassword(auth, email, password);
    // The listener above fires next and finds no profile -> routes to setup.
  }

  async function signIn(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
    // The listener fires and routes based on their saved onboarding flag.
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  // Permanently delete the account. We first re-confirm identity with the
  // password (Firebase requires a recent login for deletion), then delete the
  // Firestore profile while still authenticated, then delete the auth account.
  // The onAuthStateChanged listener above then fires with no user and routes
  // back to the welcome screen automatically.
  async function deleteAccount(password) {
    if (!user || !user.email) return;
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential); // throws if password wrong
    await deleteProfile(user.uid); // remove their data first
    await deleteUser(user); // then the account itself
  }

  // Called when the user taps "Finish setup" — saves the flag, enters the app.
  async function completeOnboarding() {
    if (user) {
      await saveProfile(user.uid, { onboardingComplete: true });
    }
    setHasCompletedOnboarding(true);
  }

  const value = {
    isSignedIn: !!user,
    hasCompletedOnboarding,
    isLoading,
    user,
    signUp,
    signIn,
    signOut,
    completeOnboarding,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}