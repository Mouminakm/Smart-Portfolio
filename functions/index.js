// functions/index.js
// Backend for Smart Portfolio.
//   ping       — trivial health check (proves the pipe works)
//   transcribe — receives a recorded clip, returns the text via Deepgram
//                Nova-3 Medical. The Deepgram key is read from a secret here
//                on the server and never reaches the app.

const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

// Run in London; cap server copies as a simple cost guard.
setGlobalOptions({ region: "europe-west2", maxInstances: 5 });

// A handle to the secret we stored. Its VALUE is only readable at runtime,
// inside a function that declares it needs it (see transcribe below).
const deepgramApiKey = defineSecret("DEEPGRAM_API_KEY");

// --- Health check ----------------------------------------------------------
exports.ping = onRequest((request, response) => {
  logger.info("Ping received");
  response.json({
    message: "Hello from your Smart Portfolio backend!",
    time: new Date().toISOString(),
  });
});

// --- Transcribe an audio clip ----------------------------------------------
// The app sends JSON: { audioBase64: "...", mimeType: "audio/m4a" }
// We return: { transcript: "..." }
exports.transcribe = onRequest(
  { secrets: [deepgramApiKey] }, // declare we need the secret, so it's available
  async (request, response) => {
    try {
      if (request.method !== "POST") {
        response.status(405).json({ error: "Use POST." });
        return;
      }

      const { audioBase64, mimeType } = request.body || {};
      if (!audioBase64) {
        response.status(400).json({ error: "No audio provided." });
        return;
      }

      // The app sends audio as base64 TEXT; Deepgram needs raw BYTES.
      // Buffer.from(text, "base64") converts text back into bytes.
      const audioBytes = Buffer.from(audioBase64, "base64");

      // Call Deepgram's pre-recorded endpoint. (Node 24 has fetch built in.)
      const dgResponse = await fetch(
        "https://api.deepgram.com/v1/listen?model=nova-3-medical&smart_format=true",
        {
          method: "POST",
          headers: {
            Authorization: "Token " + deepgramApiKey.value(),
            "Content-Type": mimeType || "audio/m4a",
          },
          body: audioBytes,
        }
      );

      const data = await dgResponse.json();

      if (!dgResponse.ok) {
        logger.error("Deepgram error", data);
        response.status(502).json({ error: "Transcription service error.", detail: data });
        return;
      }

      // Pull the transcript out of Deepgram's response. The ?. ("optional
      // chaining") safely reads deep into the object without crashing if a
      // level is missing; ?? ("nullish coalescing") falls back to "" if so.
      const transcript =
        data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";

      response.json({ transcript });
    } catch (error) {
      logger.error("transcribe failed", error);
      response.status(500).json({ error: "Something went wrong transcribing." });
    }
  }
);