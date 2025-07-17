// GameManager.js - klassieke globale versie
// Geen import/export, alles via window.GameManager

// SecurityManager moet ook globaal zijn geladen!

class GameManager {
  constructor() {
    this.callbacks = [];
    this.objects = [];
    this.currentUserData = null;
    this.uniqueIdentifier = this.generateUniqueIdentifier();
    this.setupEventListeners();
    this.defaultConfig = null;
    
    // Initialize SecurityManager
    this.securityManager = new SecurityManager();
    
    // Load default config
    this.loadDefaultConfig();
    
    // Setup auto-save
    this.setupAutoSave();
  }

  setupEventListeners() {
    // Event listeners voor pointer events (hover, drag, drop) en collision checks
    // worden hier toegevoegd
  }

  async loadDefaultConfig() {
    return window.errorHandler.safeExecuteAsync(async () => {
      // Direct de default config instellen in plaats van extern bestand laden
      this.defaultConfig = {
        level: 'beginner',
        shape: 'piramide',
        sterren: { totaal: 4000, wit: 4000 },
        planeten: { rood: 1000, groen: 1000 },
        sollys: { geel: 1750, blauw: 1750, pink: 0, rood: 1500 },
        availableLevels: ['beginner', 'intermediate', 'advanced'],
        availableShapes: ['kubus', 'piramide', 'bol']
      };
      console.log('📝 Default config loaded:', this.defaultConfig);
      return this.defaultConfig;
    }, 'loadDefaultConfig', window.errorHandler.getDefaultConfig());
  }

  generateUniqueIdentifier() {
    // Check if we already have an identifier in localStorage
    const savedId = localStorage.getItem('sollyverse_id');
    if (savedId) {
      return savedId;
    }

    // If not, generate a new one
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const newId = `coin_${timestamp}_${random}`;
    
    // Save it
    localStorage.setItem('sollyverse_id', newId);
    
    return newId;
  }

  getUniqueIdentifier() {
    return this.uniqueIdentifier;
  }

  // Coin management methods
  loadCoinData(coinData) {
    console.log('🪙 Loading coin data:', coinData);
    
    // Wacht op default config als die nog niet geladen is
    if (!this.defaultConfig) {
      console.log('⏳ Waiting for default config to load...');
      setTimeout(() => this.loadCoinData(coinData), 100);
      return;
    }
    
    // Create user data from coin - respecteer dynamische data
    this.currentUserData = {
      // ✅ Vaste identifiers (veranderen nooit)
      id: coinData.id || this.uniqueIdentifier,
      uniqueIdentifier: coinData.uniqueIdentifier || this.uniqueIdentifier,
      
      // 🔄 Dynamische data uit coin (kunnen veranderen)
      level: coinData.level || this.defaultConfig.level,
      shape: coinData.shape || this.defaultConfig.shape,
      size: coinData.size || this.getDefaultSizeForLevel(coinData.level || this.defaultConfig.level),
      kaboom: coinData.kaboom || 0,
      sterren: coinData.sterren || this.defaultConfig.sterren,
      planeten: coinData.planeten || this.defaultConfig.planeten,
      sollys: coinData.sollys || this.defaultConfig.sollys,
      
      // 🔄 Timestamps (altijd huidige tijd bij laden)
      createdAt: coinData.createdAt || new Date().toISOString(),
      lastPlayed: new Date().toISOString(), // 🔄 Altijd huidige tijd
      sessionStart: new Date().toISOString(), // 🔄 Altijd huidige tijd
      
      // 🔄 Available options (kunnen veranderen per level)
      availableLevels: coinData.availableLevels || this.defaultConfig.availableLevels,
      availableShapes: coinData.availableShapes || this.defaultConfig.availableShapes
    };

    // Zorg dat alle required velden aanwezig zijn voor security validatie
    // Gebruik coin data als primair, fallback naar defaults alleen als laatste redmiddel
    if (!this.currentUserData.sollys) {
      this.currentUserData.sollys = { geel: 0, blauw: 0, rood: 0, pink: 0 };
    }
    if (!this.currentUserData.planeten) {
      this.currentUserData.planeten = { rood: 0, groen: 0 };
    }
    if (!this.currentUserData.sterren) {
      this.currentUserData.sterren = { totaal: 0, wit: 0 };
    }
    if (!this.currentUserData.level) {
      this.currentUserData.level = 'beginner';
    }
    if (!this.currentUserData.shape) {
      this.currentUserData.shape = 'piramide';
    }
    if (!this.currentUserData.size) {
      this.currentUserData.size = this.getDefaultSizeForLevel(this.currentUserData.level);
    }
    if (typeof this.currentUserData.kaboom !== 'number') {
      this.currentUserData.kaboom = 0;
    }

    console.log('👤 Created user data:', this.currentUserData);
    console.log('🟡 Gele sollys in user data:', this.currentUserData.sollys.geel);

    // Als dit een bestaande coin is, behoud de originele identifier
    if (coinData.uniqueIdentifier) {
      this.uniqueIdentifier = coinData.uniqueIdentifier;
      localStorage.setItem('sollyverse_id', this.uniqueIdentifier);
    }

    // Save progress immediately after loading
    this.saveProgress();

    // Initialize KABOOM counter in UI
    const kaboomCounter = document.getElementById('kaboom-counter');
    const kaboomNumber = document.getElementById('kaboom-number');
    if (kaboomCounter && kaboomNumber) {
      const totalCollisions = this.currentUserData.kaboom || 0;
      kaboomNumber.textContent = totalCollisions;
      kaboomCounter.style.display = 'block'; // Altijd zichtbaar
      console.log('🎯 KABOOM counter geïnitialiseerd:', totalCollisions);
    } else {
      console.error('❌ KABOOM counter elementen niet gevonden!');
    }

    return this.currentUserData;
  }

  getCurrentUser() {
    return this.currentUserData;
  }

  updateGameValue(category, key, value) {
    if (this.currentUserData && this.currentUserData[category]) {
      this.currentUserData[category][key] = value;
      this.currentUserData.lastPlayed = new Date().toISOString();
      
      // Trigger save after important updates
      setTimeout(() => this.saveProgress(), 1000);
    }
  }

  changeLevel(newLevel) {
    if (this.currentUserData) {
      this.currentUserData.level = newLevel;
      this.currentUserData.lastPlayed = new Date().toISOString();
      
      // Trigger save after level change
      setTimeout(() => this.saveProgress(), 1000);
    }
  }

  changeShape(newShape) {
    if (this.currentUserData) {
      this.currentUserData.shape = newShape;
      this.currentUserData.lastPlayed = new Date().toISOString();
      
      // Trigger save after shape change
      setTimeout(() => this.saveProgress(), 1000);
    }
  }

  // Get current game values
  getPlanetenValue(key) {
    return this.currentUserData?.planeten?.[key] || 0;
  }

  getSollysValue(key) {
    return this.currentUserData?.sollys?.[key] || 0;
  }

  getSterrenValue(key) {
    return this.currentUserData?.sterren?.[key] || 0;
  }

  getCurrentLevel() {
    return this.currentUserData?.level || 'beginner';
  }

  getCurrentShape() {
    return this.currentUserData?.shape || 'piramide';
  }

  // Size management methodes
  getDefaultSizeForLevel(level) {
    switch(level) {
      case 'beginner': return 200; // 200% - Makkelijkste
      case 'level1': return 175;   // 175% - Nog steeds vrij groot
      case 'level2': return 150;   // 150% - Medium grootte
      case 'level3': return 100;   // 100% - Normale grootte, moeilijkst
      case 'master': return 200;   // 200% - Makkelijkste (met extra features)
      default: return 200;         // Fallback naar makkelijkste
    }
  }

  getCurrentSize() {
    return this.currentUserData?.size || this.getDefaultSizeForLevel(this.getCurrentLevel());
  }

  getSizeMultiplier() {
    return (this.getCurrentSize() / 100); // Converteer percentage naar multiplier (200% = 2.0)
  }

  // Kaboom teller methodes
  getKaboomCount() {
    return this.currentUserData?.kaboom || 0;
  }

  incrementKaboomCount() {
    if (this.currentUserData) {
      this.currentUserData.kaboom = (this.currentUserData.kaboom || 0) + 1;
      this.currentUserData.lastPlayed = new Date().toISOString();
      
      // Trigger save after kaboom increment
      setTimeout(() => this.saveProgress(), 1000);
      
      console.log('💥 Kaboom count incremented to:', this.currentUserData.kaboom);
    }
  }

  setKaboomCount(count) {
    if (this.currentUserData) {
      this.currentUserData.kaboom = count;
      this.currentUserData.lastPlayed = new Date().toISOString();
      
      // Trigger save after kaboom count change
      setTimeout(() => this.saveProgress(), 1000);
      
      console.log('💥 Kaboom count set to:', this.currentUserData.kaboom);
    }
  }

  addCallback(callback) {
    this.callbacks.push(callback);
  }

  removeCallback(callback) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  animate() {
    // Voer alle callbacks uit
    this.callbacks.forEach(callback => callback());
  }

  cleanup() {
    // Cleanup resources
    this.callbacks = [];
    this.objects = [];
    
    // Maak een laatste save voordat we opruimen
    this.saveProgress();
  }

  setupAutoSave() {
    // Auto-save when leaving page
    window.addEventListener('beforeunload', () => {
      this.saveProgress();
    });

    // Auto-save when switching tabs
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveProgress();
      }
    });

    // Auto-save every 30 seconds - maak globaal voor verwijdering
    this.autoSaveInterval = setInterval(() => {
      this.saveProgress();
    }, 30000);
  }

  saveProgress() {
    if (!this.currentUserData) {
      console.warn('⚠️ No user data to save');
      return false;
    }

    return window.errorHandler.safeExecute(() => {
      // 🔄 Update dynamische data voordat we opslaan
      this.currentUserData.lastPlayed = new Date().toISOString();
      
      // 🔄 Update game state als die beschikbaar is
      if (this.gameState) {
        this.currentUserData.sterren = this.gameState.sterren || this.currentUserData.sterren;
        this.currentUserData.planeten = this.gameState.planeten || this.currentUserData.planeten;
        this.currentUserData.sollys = this.gameState.sollys || this.currentUserData.sollys;
        this.currentUserData.kaboom = this.gameState.kaboom || this.currentUserData.kaboom;
        
        // 🔄 Update level, shape en size als die veranderd zijn
        if (this.gameState.level && this.gameState.level !== this.currentUserData.level) {
          this.currentUserData.level = this.gameState.level;
          console.log('🔄 Level updated to:', this.currentUserData.level);
        }
        if (this.gameState.shape && this.gameState.shape !== this.currentUserData.shape) {
          this.currentUserData.shape = this.gameState.shape;
          console.log('🔄 Shape updated to:', this.currentUserData.shape);
        }
        if (this.gameState.size && this.gameState.size !== this.currentUserData.size) {
          this.currentUserData.size = this.gameState.size;
          console.log('🔄 Size updated to:', this.currentUserData.size);
        }
      }
      
      // Use SecurityManager for secure saving
      const success = this.securityManager.saveSecureData(this.currentUserData);
      if (success) {
        console.log('💾 Progress saved securely');
        return true;
      } else {
        console.warn('⚠️ Security validation failed, saving blocked');
        return false;
      }
    }, 'saveProgress', false);
  }

  loadProgress() {
    return window.errorHandler.safeExecute(() => {
      // Use SecurityManager for secure loading
      const data = this.securityManager.loadSecureData();
      if (data) {
        this.loadCoinData(data);
        console.log('📂 Progress loaded securely');
        return true;
      } else {
        console.log('📂 No secure progress found, using default');
        return false;
      }
    }, 'loadProgress', false);
  }

  // Initialize method for module compatibility
  async initialize() {
    console.log("🎮 GameManager initialized");
    return Promise.resolve();
  }

  // Start method for module compatibility
  async start() {
    console.log("🎮 GameManager started");
    return Promise.resolve();
  }

  // Stop method for module compatibility
  async stop() {
    console.log("🎮 GameManager stopped");
    return Promise.resolve();
  }

  // Get current game state
  getCurrentGameState() {
    return this.currentUserData || {};
  }

  // Load SollyCoin data
  async loadSollyCoinData(data) {
    return this.loadCoinData(data);
  }

  // Export SollyCoin data
  exportSollyCoinData() {
    return this.currentUserData || {};
  }
} 

window.GameManager = GameManager; 