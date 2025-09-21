// Server Configuration
// ALTIJD EN ALLEEN POORT 5500 GEBRUIKEN

const SERVER_CONFIG = {
    PORT: 5500,
    HOST: '127.0.0.1',
    URL: 'http://127.0.0.1:5500',
    
    // Server commands
    START_COMMAND: 'python3 -m http.server 5500',
    KILL_COMMAND: 'lsof -ti:5500 | xargs kill -9',
    
    // Validation
    isValidPort: (port) => port === 5500,
    getServerUrl: () => `http://127.0.0.1:5500`
};

// Export voor gebruik in scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SERVER_CONFIG;
}

// Maak globaal beschikbaar
window.SERVER_CONFIG = SERVER_CONFIG;

console.log('🚀 Server config geladen: ALTIJD POORT 5500'); 