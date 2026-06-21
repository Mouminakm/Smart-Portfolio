// firebase.js
// Initialises Firebase once for the whole app, using the config values from
// your .env file, and sets up Authentication so other files can use it.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Read the config from the environment (.env). process.env is how code reads
// environment values; the EXPO_PUBLIC_ prefix is what makes them available.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Start up Firebase with that config.
const app = initializeApp(firebaseConfig);

// Get the Authentication service and export it so other files (like our
// AuthContext) can call sign-in / sign-out on it.
export const auth = getAuth(app);