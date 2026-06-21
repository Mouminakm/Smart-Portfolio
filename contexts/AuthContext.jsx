// contexts/AuthContext.jsx
// Real authentication via Firebase. Exposes isSignedIn plus signUp / signIn /
// signOut, and listens to Firebase so isSignedIn stays accurate — including
// restoring a previous session when the app restarts.

import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase"; // the auth service we set up in Stage 2

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user holds Firebase's user object when signed in, or null when not.
  const [user, setUser] = useState(null);
  // isLoading is true until Firebase has told us the initial state (so we
  // don't flash the wrong screen on launch while it checks for a session).
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to Firebase auth changes ONCE when the app starts.
  useEffect(() => {
    // onAuthStateChanged calls our function now and on every future change.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser); // a user object, or null
      setIsLoading(false); // we now know the real state
    });
    // Cleanup: stop listening if this component is ever removed.
    return unsubscribe;
  }, []); // [] = run this setup only once

  // Create a new account. async because it waits on Firebase; throws on
  // failure (e.g. email already in use), which the screen will catch.
  async function signUp(email, password) {
    await createUserWithEmailAndPassword(auth, email, password);
  }

  // Sign an existing user in.
  async function signIn(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  // Sign out.
  async function signOut() {
    await firebaseSignOut(auth);
  }

  // isSignedIn is simply "do we have a user?". The "!!" turns the user object
  // (or null) into a clean true/false.
  const value = {
    isSignedIn: !!user,
    isLoading,
    user,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}