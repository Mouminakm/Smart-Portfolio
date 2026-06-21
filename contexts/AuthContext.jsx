// contexts/AuthContext.jsx
// Holds the app-wide "is the user signed in?" state and shares it with every
// screen via React Context. For now it's SIMULATED (a true/false flag) so we
// can build the gate in Expo Go; real Firebase will plug in here next.

import { createContext, useContext, useState } from "react";

// 1) Create the context — the shared "channel" screens will read from.
const AuthContext = createContext(null);

// 2) The Provider component holds the real state and broadcasts it to children.
export function AuthProvider({ children }) {
  const [isSignedIn, setIsSignedIn] = useState(false); // start signed out

  // Simulated sign in / sign out. Later these will call Firebase instead.
  function signIn() {
    setIsSignedIn(true);
  }
  function signOut() {
    setIsSignedIn(false);
  }

  // Everything inside "value" becomes available to any screen that asks.
  return (
    <AuthContext.Provider value={{ isSignedIn, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3) A small helper so screens can write useAuth() to read the channel.
export function useAuth() {
  return useContext(AuthContext);
}