// metro.config.js
// Metro is the bundler that packages our JavaScript into the app. We wrap the
// default Expo config with Sentry's version so that, at build time, Sentry can
// generate source maps — the files that make crash reports show readable file
// names and line numbers instead of compressed gibberish.
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

module.exports = config;