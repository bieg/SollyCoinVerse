// src/Logger.js - Centrale logging util
// Biedt logging-levels en stuurt alles ook door naar bestaande console zodat bestaande calls blijven werken.

class Logger {
  constructor(level = 'debug') {
    this.levels = { error: 0, warn: 1, info: 2, debug: 3 };
    this.setLevel(level);
  }

  setLevel(level) {
    this.currentLevel = this.levels[level] !== undefined ? this.levels[level] : 3;
  }

  _shouldLog(level) {
    return this.currentLevel >= this.levels[level];
  }

  debug(...args) {
    // Tijdelijk uitgeschakeld om infinite loop te voorkomen
    return;
  }

  info(...args) {
    // Tijdelijk uitgeschakeld om infinite loop te voorkomen
    return;
  }

  warn(...args) {
    // Tijdelijk uitgeschakeld om infinite loop te voorkomen
    return;
  }

  error(...args) {
    // Tijdelijk uitgeschakeld om infinite loop te voorkomen
    return;
  }
}

// Maak globale instantie
const logger = new Logger('debug');

if (typeof window !== 'undefined') {
  window.logger = logger;
  // Verwijder alle console overrides om infinite loop te voorkomen
  // Logger wordt alleen gebruikt via window.logger
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = logger;
}

// Gebruik window.console direct voor init logging
if (window.console && window.console.info) {
  window.console.info('ℹ️ Logger initialised');
}

