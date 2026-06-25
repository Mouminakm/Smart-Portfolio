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
  
        // Build a description of each field. For fields with a fixed option
        // list, show Claude the EXACT allowed labels and require it to return
        // one of them verbatim (or empty) — so we get "Mild Systemic Disease",
        // not "ASA 2". For radio/checkbox booleans, constrain to Yes/No.
        const fieldList = fields
          .map((f) => {
            // enum/select with options -> list the exact labels
            if (f.options && f.options.length) {
              // Show "value=label" so Claude can map spoken grades/codes
              // (e.g. "ASA 2") to the right label ("Mild Systemic Disease").
              const opts = f.options.map((o) => `${o.value}="${o.label}"`).join(", ");
              return `- ${f.id} (${f.label}): choose EXACTLY one label from [${opts}]. ` +
                     `If the dictation gives a number/code (e.g. "ASA 2"), match it to that value. ` +
                     `Return the LABEL text only, or "" if not mentioned.`;
            }
            // radio with options (e.g. Yes/No, or Unknown/No/Yes)
            if (f.inputType === "radio" && f.options && f.options.length) {
              const labels = f.options.map((o) => `"${o.label}"`).join(", ");
              return `- ${f.id} (${f.label}): choose EXACTLY one of [${labels}] or "".`;
            }
            // checkbox boolean
            if (f.inputType === "checkbox") {
              return `- ${f.id} (${f.label}): "Yes" or "No" or "".`;
            }
            // dates: ask for UK numeric format explicitly
            if (f.inputType === "date") {
              return `- ${f.id} (${f.label}): a date in dd-mm-yyyy format (e.g. "25-06-2026"), or "" if not mentioned. Convert spoken dates like "the 25th of June 2026" to this format.`;
            }
            // free text / number / autocomplete
            return `- ${f.id} (${f.label}): free text, or "" if not mentioned.`;
          })
          .join("\n");
  
        // The system prompt sets the rules. The big one: return ONLY JSON.
        const systemPrompt =
          "You extract structured data from a doctor's dictated surgical logbook entry. " +
          "You are given a transcript and a list of fields with their allowed values. " +
          "Return ONLY a JSON object whose keys are the field ids and whose values come " +
          "from the transcript. " +
          "CRITICAL RULES: " +
          "(1) For any field that lists allowed values in [square brackets], you MUST return " +
          "one of those values copied EXACTLY (character for character), or an empty string. " +
          "Never invent a value that is not in the list. " +
          "(2) If the transcript does not clearly indicate a field, return an empty string for it — " +
          "do not guess. " +
          "(3) For names (e.g. consultant), return the full name as spoken, not an abbreviation. " +
          "(4) Output ONLY the JSON object — no text, explanation, or markdown.";
  
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