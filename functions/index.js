// functions/index.js
// Your backend. Right now it has one trivial "ping" function to prove the
// pipe works: machine -> Google's servers -> back to the app.

const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");

// Run in London (matches our Firestore region) and cap how many server copies
// can spin up — a simple guard so a bug can never run up a large bill.
setGlobalOptions({ region: "europe-west2", maxInstances: 5 });

// An HTTP function: it gets a web address, and replies when called.
exports.ping = onRequest((request, response) => {
  logger.info("Ping received"); // shows up in the function's logs
  response.json({
    message: "Hello from your Smart Portfolio backend!",
    time: new Date().toISOString(),
  });
});