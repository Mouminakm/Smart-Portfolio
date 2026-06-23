// contexts/EntryContext.jsx
// Holds the entry currently being created, so Dictation, Review and Submission
// all work on the SAME data. Same pattern as AuthContext, but for one in-progress
// logbook entry rather than the signed-in user.

import { createContext, useContext, useState } from "react";

const EntryContext = createContext(null);

export function EntryProvider({ children }) {
  const [transcript, setTranscript] = useState("");   // the raw dictation text
  const [fieldValues, setFieldValues] = useState({}); // id -> value (editable)
  const [confirmed, setConfirmed] = useState({});     // id -> true/false (ticked)

  // Clear everything to start a fresh entry.
  function resetEntry() {
    setTranscript("");
    setFieldValues({});
    setConfirmed({});
  }

  const value = {
    transcript, setTranscript,
    fieldValues, setFieldValues,
    confirmed, setConfirmed,
    resetEntry,
  };

  return <EntryContext.Provider value={value}>{children}</EntryContext.Provider>;
}

// The hook screens use to read/update the current entry.
export function useEntry() {
  return useContext(EntryContext);
}