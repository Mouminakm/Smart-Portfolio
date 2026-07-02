// data/privacyNotice.js
// The privacy-notice text, kept as DATA so the screen that shows it stays
// simple and the wording lives in ONE place (easy to update after a legal
// review). app/privacy.jsx reads everything from here.
//
// IMPORTANT: this is a plain-English DRAFT, not legal advice. Have it reviewed
// by someone qualified in UK data-protection law before launch.
//
// TO FINISH: fill in the four [PLACEHOLDER] values just below. They flow into
// the text automatically wherever they're used, so you only edit them once.

export const PRIVACY_VERSION = "1.0";
export const PRIVACY_EFFECTIVE_DATE = "[effective date, e.g. 2 July 2026]";

export const COMPANY_NAME = "OCCIPRAE LTD";
export const COMPANY_NUMBER = "[16819952]";
export const COMPANY_ADDRESS = "[ Cardiff]";
export const CONTACT_EMAIL = "[development@occiprae.com]";

// A one-line note shown in a highlighted box at the top.
export const PRIVACY_DISCLAIMER =
  "This is a plain-English summary of how the app works. It is being finalised and reviewed before launch.";

// The "short version" — shown as a bulleted summary near the top.
export const PRIVACY_SHORT_VERSION = [
  "Smart Portfolio helps you dictate a surgical logbook entry by voice and pre-fills the eLogbook website so you can review and submit it there.",
  "Your voice recording and the text of your entry are never stored on our servers. They pass through two specialist services to do their job, then they are gone.",
  "We do store your account, profile, and subscription status so the app works for you.",
  "The app is built so that no patient-identifiable information is ever collected — and you must never dictate any.",
  "Your profile data is stored in the United Kingdom.",
];

// The main body. Each section is a heading plus one or more paragraphs.
export const PRIVACY_SECTIONS = [
  {
    heading: "Who we are",
    paragraphs: [
      `Smart Portfolio is provided by ${COMPANY_NAME} (company number ${COMPANY_NUMBER}, registered in Cardiff, ${COMPANY_ADDRESS}). For anything in this notice, we are the "data controller" — the organisation responsible for your information.`,
      `You can contact us at ${CONTACT_EMAIL}.`,
    ],
  },
  {
    heading: "Your voice recording (audio)",
    paragraphs: [
      "When you dictate, the app records your voice only so it can be turned into text. The recording is sent to our transcription provider, converted to text, and then discarded. We do not save the audio on our servers, and the app does not keep a copy after the entry is done.",
    ],
  },
  {
    heading: "Your dictated entry",
    paragraphs: [
      "The transcribed text is sent to our AI provider, which returns it organised into the fields the eLogbook form needs. This exists only in the app on your phone during the session — it is held in memory while you review it, and is cleared when you submit on eLogbook, start a new entry, or close the app. We do not store your dictated entries on our servers.",
    ],
  },
  {
    heading: "Your account and profile",
    paragraphs: [
      "To sign you in and tailor the app, we store your name and email (from your Google or Apple sign-in), your specialty, your list of hospitals and consultants, and — only if you choose to provide them — your GMC number and training (NTN) number. We keep these because the app cannot function without knowing who you are and what to fill in.",
    ],
  },
  {
    heading: "Your subscription",
    paragraphs: [
      "We store whether you have an active subscription, handled through our subscriptions provider and the app store. We do not see or store your card details — those are handled by Apple or Google.",
    ],
  },
  {
    heading: "No patient information — ever",
    paragraphs: [
      "Smart Portfolio is designed so that patient-identifiable details (names, hospital numbers, dates of birth, and similar) are never captured, transcribed, parsed, or stored. Any patient identifiers that eLogbook requires are entered by you directly on the eLogbook site, not through this app. You must not include any patient-identifiable information in your dictation.",
    ],
  },
  {
    heading: "Who processes your data on our behalf",
    paragraphs: [
      "We use a small number of trusted services — \u201Csub-processors\u201D — that handle data to make the app work. Each is bound by its own data-protection terms:",
    ],
  },
  {
    heading: "International transfers",
    paragraphs: [
      "Some of these services process data outside the UK (in the United States). Where that happens, transfers are covered by the providers' standard data-protection safeguards (such as Standard Contractual Clauses and the UK addendum). Because your dictation contains no patient information, and your audio and transcript are not retained, the data leaving the UK is minimal and short-lived.",
    ],
  },
  {
    heading: "How long we keep things",
    paragraphs: [
      "Audio and dictated entries: not retained by us at all. Profile and account data: kept while your account is active. When you delete your account, your profile data is deleted (provider back-ups may take a short additional period to clear).",
    ],
  },
  {
    heading: "Your rights",
    paragraphs: [
      `Under UK GDPR you have the right to access the personal data we hold about you, to have it corrected or deleted, to restrict or object to its use, and to receive a copy in a portable form. To exercise any of these, contact us at ${CONTACT_EMAIL}.`,
      "You also have the right to complain to the UK regulator, the Information Commissioner's Office (ICO), at ico.org.uk.",
    ],
  },
  {
    heading: "Security",
    paragraphs: [
      "Data in transit is encrypted. Access to your stored profile is protected by your Google or Apple sign-in. We keep the amount of data we hold to the minimum the app needs.",
    ],
  },
  {
    heading: "Who can use the app",
    paragraphs: [
      "Smart Portfolio is intended for qualified doctors and doctors in training. It is not intended for anyone under 18.",
    ],
  },
  {
    heading: "Changes to this notice",
    paragraphs: [
      "If we change how we handle data, we will update this notice and its version number, and — where the change is significant — ask you to review it again in the app.",
    ],
  },
];

// Shown as cards under "Who processes your data on our behalf".
export const PRIVACY_SUBPROCESSORS = [
  {
    name: "Deepgram",
    does: "Turns your voice into text",
    where: "United States",
    notes:
      "We have opted out of your audio being used to improve their models; it is kept only as long as needed to transcribe.",
  },
  {
    name: "Anthropic (Claude)",
    does: "Structures your text into fields",
    where: "United States",
    notes:
      "Used only to process your entry; not used to train their models; deleted within 30 days.",
  },
  {
    name: "Google Firebase",
    does: "Sign-in and profile storage",
    where: "United Kingdom (London)",
    notes: "Google acts as our data processor; your profile is stored in the UK.",
  },
  {
    name: "RevenueCat",
    does: "Manages subscription status",
    where: "United States",
    notes: "Stores subscription status, not payment card details.",
  },
  {
    name: "Apple / Google",
    does: "App store & payments",
    where: "Varies",
    notes: "Handle your purchase and card details under their own policies.",
  },
];