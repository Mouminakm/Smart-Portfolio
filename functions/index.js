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
const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

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
// --- Parse a transcript into structured fields -----------------------------
// The app sends JSON: { transcript: "...", fields: [{ id, label, ... }] }
// We ask Claude to return ONLY a JSON object of { fieldId: value }.
exports.parse = onRequest(
    { secrets: [anthropicApiKey] }, // this function may read the Anthropic secret
    async (request, response) => {
      try {
        if (request.method !== "POST") {
          response.status(405).json({ error: "Use POST." });
          return;
        }
  
        const { transcript, fields } = request.body || {};
        if (!transcript || !fields) {
          response.status(400).json({ error: "Need a transcript and fields." });
          return;
        }
  
        // Build a compact description of the fields we want filled, so Claude
        // knows exactly which keys to return and what each one means.
        const fieldList = fields
          .map((f) => `- ${f.id} (${f.label})`)
          .join("\n");
  
        // The system prompt sets the rules. The big one: return ONLY JSON.
        const systemPrompt =
          "You extract structured data from a doctor's dictated surgical logbook entry. " +
          "You are given a transcript and a list of field ids. " +
          "Return ONLY a JSON object whose keys are the field ids and whose values are " +
          "the information from the transcript. If a field is not mentioned, use an empty " +
          "string. Do not include any text, explanation, or markdown — only the JSON object.";
  
        const userPrompt =
          `Transcript:\n${transcript}\n\nFields to extract:\n${fieldList}`;
  
        // Call Claude's Messages API. Haiku: fast and cheap, ideal for extraction.
        const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicApiKey.value(),
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
                { role: "user", content: userPrompt },
                { role: "assistant", content: "{" }, // forces the reply to start as JSON
              ],
          }),
        });
  
        const data = await aiResponse.json();
  
        if (!aiResponse.ok) {
          logger.error("Anthropic error", data);
          response.status(502).json({ error: "AI service error.", detail: data });
          return;
        }
  
        // Claude's reply text sits in data.content[0].text. It should be pure
        // JSON; we parse it into a real object before sending it to the app.
        // We pre-filled the assistant turn with "{", so prepend it back, and
      // strip any stray markdown fences just in case.
        let rawText = "{" + (data?.content?.[0]?.text ?? "");
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        let parsedFields;
        try {
          parsedFields = JSON.parse(rawText);
        } catch (e) {
          // If Claude ever wraps the JSON in stray text, surface the raw reply
          // so we can see what happened rather than crashing.
          logger.error("Could not parse Claude reply as JSON", rawText);
          response.status(502).json({ error: "AI did not return valid JSON.", raw: rawText });
          return;
        }
  
        response.json({ fields: parsedFields });
      } catch (error) {
        logger.error("parse failed", error);
        response.status(500).json({ error: "Something went wrong parsing." });
      }
    }
  );