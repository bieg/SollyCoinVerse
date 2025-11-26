// SollyCoin Server Configuration
// Dit bestand bevat alle server-specifieke configuratie

const SERVER_CONFIG = {
  // Server settings
  PORT: 5555,
  HOST: '127.0.0.1',
  
  // CORS settings
  CORS: {
    origin: ['http://127.0.0.1:5555', 'http://localhost:5555'],
    credentials: true
  },
  
  // Security settings
  SECURITY: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.pinata.cloud", "https://ipfs.io"]
        }
      }
    }
  },
  
  // Game settings
  GAME: {
    maxPlayers: 100,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    autoSaveInterval: 30 * 1000 // 30 seconds
  },
  
  // Blockchain settings
  BLOCKCHAIN: {
    defaultNetwork: 'localhost',
    networks: {
      localhost: {
        url: 'http://127.0.0.1:8545',
        chainId: 1337
      },
      sepolia: {
        url: process.env.SEPOLIA_URL || '',
        chainId: 11155111
      },
      mumbai: {
        url: process.env.MUMBAI_URL || '',
        chainId: 80001
      }
    }
  }
};

// Export voor gebruik in andere modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SERVER_CONFIG;
} else {
  window.SERVER_CONFIG = SERVER_CONFIG;
}
