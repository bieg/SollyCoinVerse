// src/Config.js - Centrale configuratiemodule
// Houd ALTIJD poort 5500 als standaard, maar maak override via omgevingsvariabelen mogelijk.

const DEFAULT_PORT = 5500;
const DEFAULT_HOST = '127.0.0.1';

// Lees uit environment (Node) of uit `window.__ENV` indien die door een bundler / index.html is gezet.
const envPort = (typeof process !== 'undefined' && process.env && process.env.PORT) ? Number(process.env.PORT) : (typeof window !== 'undefined' && window.__ENV && window.__ENV.PORT);
const envHost = (typeof process !== 'undefined' && process.env && process.env.HOST) ? process.env.HOST : (typeof window !== 'undefined' && window.__ENV && window.__ENV.HOST);

const PORT = envPort || DEFAULT_PORT;
const HOST = envHost || DEFAULT_HOST;

const Config = {
  PORT,
  HOST,
  get URL() {
    return `http://${HOST}:${PORT}`;
  },
  START_COMMAND: `python3 -m http.server ${PORT}`,
  KILL_COMMAND: `lsof -ti:${PORT} | xargs kill -9`,
  isValidPort: (port) => port === PORT,
  getServerUrl: () => `http://${HOST}:${PORT}`
};

// CommonJS export (Node scripts)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Config;
}

// Maak globaal beschikbaar voor browser
if (typeof window !== 'undefined') {
  window.Config = Config;
}

console.log(`⚙️ Config geladen → ${Config.URL}`);

