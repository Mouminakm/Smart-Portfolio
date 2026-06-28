// theme/theme.js
// Central design system for Smart Portfolio — the single source of truth for
// colour, spacing, type and shape. Every component and screen reads from here,
// so the whole app stays visually consistent and we can tune the look in one
// place. (Light mode only for now; a dark palette can be added later by
// swapping `colors` behind a theme context — the keys are named, not raw hex.)

export const colors = {
    // Brand
    navy: "#0B1F33",          // primary navy — headers, primary buttons, titles
    navy2: "#0F2E3D",         // secondary navy — gradients, darker surfaces
    teal: "#14B8A6",          // clinical teal — active states, accents
    tealDeep: "#0F766E",      // deep teal — pressed states
    sky: "#38BDF8",           // sky-blue accent — waveforms, highlights
  
    // Surfaces
    bg: "#F7FAFC",            // app background (pale blue-grey)
    card: "#FFFFFF",          // card background
    border: "#E2E8F0",        // soft border
    muted: "#EEF5F7",         // muted/inset background (pale teal-grey)
  
    // Text
    text: "#111827",          // primary text
    textSecondary: "#64748B", // secondary text
    textMuted: "#94A3B8",     // muted/metadata text
    onNavy: "#FFFFFF",        // text on navy surfaces
  
    // Status
    success: "#16A34A",       // captured / positive
    successBg: "#DCFCE7",     // pale green chip background
    warning: "#F59E0B",       // needs review
    warningBg: "#FEF3C7",     // pale amber chip background
    error: "#DC2626",         // errors
    errorBg: "#FEE2E2",       // pale red background
    recording: "#EF4444",     // recording state
    pendingBg: "#EEF2F7",     // pale grey-blue pending chip
  };
  
  // Spacing scale (multiples of 4) — use these instead of arbitrary numbers so
  // padding and gaps stay consistent everywhere.
  export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  };
  
  // Corner radii.
  export const radius = {
    sm: 8,
    md: 12,
    lg: 18,   // cards
    xl: 22,   // large cards
    pill: 999, // chips, pills, round buttons
  };
  
  // Type scale — sizes + weights for each text role in the brief.
  export const type = {
    screenTitle: { fontSize: 28, fontWeight: "700", color: colors.text },
    sectionHeading: { fontSize: 20, fontWeight: "600", color: colors.text },
    cardTitle: { fontSize: 17, fontWeight: "600", color: colors.text },
    body: { fontSize: 15, fontWeight: "400", color: colors.text },
    helper: { fontSize: 13, fontWeight: "400", color: colors.textSecondary },
    metadata: { fontSize: 12, fontWeight: "400", color: colors.textMuted },
  };
  
  // A soft, premium shadow for cards (kept subtle per the brief — no heavy
  // shadows). Spread across iOS (shadow*) and Android (elevation).
  export const shadow = {
    card: {
      shadowColor: "#0B1F33",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
  };