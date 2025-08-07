// src/EventBus.js - Simpele publish/subscribe bus voor de Sollyverse
// Vermindert afhankelijkheid van window-globals door events te gebruiken.

class EventBus {
  constructor() {
    this.events = {};
  }

  /**
   * Registreer een handler.
   * @param {string} event
   * @param {Function} handler
   */
  on(event, handler) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(handler);
  }

  /**
   * Verwijder een handler.
   * @param {string} event
   * @param {Function} handler
   */
  off(event, handler) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(h => h !== handler);
  }

  /**
   * Emit een event naar alle handlers met optionele data.
   * @param {string} event
   * @param {*} data
   */
  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(handler => {
      try {
        handler(data);
      } catch (err) {
        console.error(`❌ EventBus handler error for '${event}':`, err);
      }
    });
  }
}

// Exporteer class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventBus;
}

// Maak één globale instantie zodat alle scripts dezelfde bus delen
if (typeof window !== 'undefined') {
  window.EventBus = EventBus;
  window.eventBus = window.eventBus || new EventBus();
}

console.log('📡 EventBus geladen');

