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
    if (this._shouldLog('debug')) {
      // Gebruik window.console om infinite loop te voorkomen
      if (window.console && window.console.debug) {
        window.console.debug('🐛', ...args);
      }
    }
  }

  info(...args) {
    if (this._shouldLog('info')) {
      // Gebruik window.console om infinite loop te voorkomen
      if (window.console && window.console.info) {
        window.console.info('ℹ️', ...args);
      }
    }
  }

  warn(...args) {
    if (this._shouldLog('warn')) {
      // Gebruik window.console om infinite loop te voorkomen
      if (window.console && window.console.warn) {
        window.console.warn('⚠️', ...args);
      }
    }
  }

  error(...args) {
    if (this._shouldLog('error')) {
      // Gebruik window.console om infinite loop te voorkomen
      if (window.console && window.console.error) {
        window.console.error('❌', ...args);
      }
    }
  }
}

// Maak globale instantie
const logger = new Logger('debug');

if (typeof window !== 'undefined') {
  window.logger = logger;
  // Houd compatibiliteit met bestaande console.log door door te verwijzen
  window.log = (...args) => logger.debug(...args);
  // Verwijder de console override om infinite loop te voorkomen
  // Logger wordt alleen gebruikt via window.logger
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = logger;
}

logger.info('Logger initialised');

