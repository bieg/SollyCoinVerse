// ===================================================================================
// ==                                                                             ==
// ==                           SOLLYVERSE SECURITY MANAGER                       ==
// ==                                                                             ==
// ==      Bevat alle security features:                                         ==
// ==      - Anti-cheat detection                                                ==
// ==      - Rate limiting                                                       ==
// ==      - Data validation                                                     ==
// ==      - Behavioral analysis                                                 ==
// ==      - Encryption & integrity checks                                       ==
// ===================================================================================

class SecurityManager {
  constructor() {
    this.antiCheat = new AntiCheat();
    this.rateLimiter = new RateLimiter();
    this.behaviorAnalyzer = new BehaviorAnalyzer();
    this.secureStorage = new SecureStorage();
    this.dataValidator = new DataValidator();
    
    this.isEnabled = true;
    this.suspiciousActions = [];
    this.lastValidState = null;
    
    console.log('🔒 SecurityManager initialized');
  }

  // Hoofdfunctie voor alle security checks
  async validateAction(action, data = null) {
    if (!this.isEnabled) return { valid: true, reason: 'Security disabled' };

    try {
      // 1. Rate limiting check
      if (!this.rateLimiter.canPerformAction(action)) {
        return { 
          valid: false, 
          reason: 'Rate limit exceeded',
          cooldown: this.rateLimiter.getRemainingCooldown(action)
        };
      }

      // 2. Data validation
      if (data && !this.dataValidator.validateData(action, data)) {
        return { 
          valid: false, 
          reason: 'Invalid data detected' 
        };
      }

      // 3. Anti-cheat check
      if (!this.antiCheat.validateGameState()) {
        return { 
          valid: false, 
          reason: 'Anti-cheat violation detected' 
        };
      }

      // 4. Behavioral analysis
      this.behaviorAnalyzer.analyzePlayerBehavior(action);

      // 5. Record action
      this.rateLimiter.recordAction(action);

      return { valid: true, reason: 'Action validated' };

    } catch (error) {
      console.error('🔒 Security validation error:', error);
      return { valid: false, reason: 'Security system error' };
    }
  }

  // Save data met security checks
  saveSecureData(data) {
    if (!this.isEnabled) {
      localStorage.setItem('sollyverse_data', JSON.stringify(data));
      return true;
    }

    try {
      // Validate data before saving
      if (!this.dataValidator.validateUserData(data)) {
        console.warn('🔒 Invalid data detected, saving blocked');
        return false;
      }

      // Save with encryption
      this.secureStorage.saveSecureData(data);
      this.lastValidState = JSON.parse(JSON.stringify(data));
      
      return true;
    } catch (error) {
      console.error('🔒 Error saving secure data:', error);
      return false;
    }
  }

  // Load data met integrity checks
  loadSecureData() {
    if (!this.isEnabled) {
      const data = localStorage.getItem('sollyverse_data');
      return data ? JSON.parse(data) : null;
    }

    try {
      const data = this.secureStorage.loadSecureData();
      
      if (!data) {
        console.warn('🔒 No secure data found or integrity check failed');
        return null;
      }

      // Validate loaded data
      if (!this.dataValidator.validateUserData(data)) {
        console.warn('🔒 Loaded data validation failed');
        return null;
      }

      this.lastValidState = JSON.parse(JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('🔒 Error loading secure data:', error);
      return null;
    }
  }

  // Get security status
  getSecurityStatus() {
    return {
      enabled: this.isEnabled,
      suspiciousActions: this.suspiciousActions.length,
      lastValidState: this.lastValidState !== null,
      antiCheatStatus: this.antiCheat.getStatus(),
      rateLimiterStatus: this.rateLimiter.getStatus(),
      behaviorAnalyzerStatus: this.behaviorAnalyzer.getStatus()
    };
  }

  // Enable/disable security (voor debugging)
  setSecurityEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`🔒 Security ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Cleanup
  cleanup() {
    this.antiCheat.cleanup();
    this.rateLimiter.cleanup();
    this.behaviorAnalyzer.cleanup();
    this.secureStorage.cleanup();
  }
}

// ===================================================================================
// ==                              ANTI-CHEAT SYSTEM                              ==
// ===================================================================================

class AntiCheat {
  constructor() {
    this.checksums = new Map();
    this.lastValidState = null;
    this.suspiciousActions = [];
    this.violationCount = 0;
    this.maxViolations = 5;
  }

  validateGameState() {
    try {
      // Check voor onmogelijke waardes
      if (this.detectImpossibleValues()) {
        this.flagViolation('Impossible values detected');
        return false;
      }

      // Check voor te snelle progressie
      if (this.detectSpeedHack()) {
        this.flagViolation('Speed hack detected');
        return false;
      }

      // Check voor data manipulation
      if (this.detectDataManipulation()) {
        this.flagViolation('Data manipulation detected');
        return false;
      }

      return true;
    } catch (error) {
      console.error('🔒 Anti-cheat validation error:', error);
      return false;
    }
  }

  detectImpossibleValues() {
    const userData = gameManager?.getCurrentUser();
    if (!userData) return false;

    // Check solly counts
    const maxSollys = 10000;
    if (userData.sollys.geel > maxSollys || 
        userData.sollys.blauw > maxSollys || 
        userData.sollys.rood > maxSollys) {
      return true;
    }

    // Check voor negatieve waardes
    if (userData.sollys.geel < 0 || 
        userData.sollys.blauw < 0 || 
        userData.sollys.rood < 0) {
      return true;
    }

    return false;
  }

  detectSpeedHack() {
    const now = Date.now();
    const lastAction = this.lastActionTime || 0;
    const minTimeBetweenActions = 500; // 0.5 seconde minimum

    if (now - lastAction < minTimeBetweenActions) {
      return true;
    }

    this.lastActionTime = now;
    return false;
  }

  detectDataManipulation() {
    const currentData = gameManager?.getCurrentUser();
    if (!currentData || !this.lastValidState) return false;

    // Check voor onverwachte veranderingen
    const changes = this.calculateDataChanges(this.lastValidState, currentData);
    
    // Te grote veranderingen in korte tijd
    if (changes.sollys.geel > 1000 || 
        changes.sollys.blauw > 1000 || 
        changes.sollys.rood > 1000) {
      return true;
    }

    return false;
  }

  calculateDataChanges(oldData, newData) {
    return {
      sollys: {
        geel: Math.abs(newData.sollys.geel - oldData.sollys.geel),
        blauw: Math.abs(newData.sollys.blauw - oldData.sollys.blauw),
        rood: Math.abs(newData.sollys.rood - oldData.sollys.rood)
      }
    };
  }

  flagViolation(reason) {
    this.violationCount++;
    this.suspiciousActions.push({
      timestamp: Date.now(),
      reason: reason,
      violationCount: this.violationCount
    });

    console.warn(`🔒 Anti-cheat violation: ${reason} (${this.violationCount}/${this.maxViolations})`);

    if (this.violationCount >= this.maxViolations) {
      this.handleMaxViolations();
    }
  }

  handleMaxViolations() {
    console.error('🔒 Maximum violations reached! Resetting game state...');
    // Reset naar laatste geldige staat
    if (this.lastValidState) {
      gameManager.loadCoinData(this.lastValidState);
    }
    this.violationCount = 0;
  }

  getStatus() {
    return {
      violationCount: this.violationCount,
      maxViolations: this.maxViolations,
      suspiciousActions: this.suspiciousActions.length
    };
  }

  cleanup() {
    this.checksums.clear();
    this.suspiciousActions = [];
  }
}

// ===================================================================================
// ==                              RATE LIMITER                                   ==
// ===================================================================================

class RateLimiter {
  constructor() {
    this.actionHistory = new Map();
    this.cooldowns = {
      collision: 2000,        // 2 sec tussen collisions
      shapeChange: 5000,      // 5 sec tussen shape changes
      levelUp: 30000,         // 30 sec tussen level ups
      save: 1000,             // 1 sec tussen saves
      load: 2000,             // 2 sec tussen loads
      importCoin: 5000,       // 5 sec tussen imports
      default: 500            // 0.5 sec voor andere acties
    };
  }

  canPerformAction(action) {
    const lastAction = this.actionHistory.get(action);
    const cooldown = this.cooldowns[action] || this.cooldowns.default;
    
    if (!lastAction) return true;
    
    const timeSinceLastAction = Date.now() - lastAction;
    return timeSinceLastAction >= cooldown;
  }

  getRemainingCooldown(action) {
    const lastAction = this.actionHistory.get(action);
    const cooldown = this.cooldowns[action] || this.cooldowns.default;
    
    if (!lastAction) return 0;
    
    const timeSinceLastAction = Date.now() - lastAction;
    return Math.max(0, cooldown - timeSinceLastAction);
  }

  recordAction(action) {
    this.actionHistory.set(action, Date.now());
    
    // Cleanup oude acties (ouder dan 1 uur)
    const oneHourAgo = Date.now() - 3600000;
    for (const [key, timestamp] of this.actionHistory.entries()) {
      if (timestamp < oneHourAgo) {
        this.actionHistory.delete(key);
      }
    }
  }

  getStatus() {
    const activeCooldowns = {};
    for (const [action, timestamp] of this.actionHistory.entries()) {
      const remaining = this.getRemainingCooldown(action);
      if (remaining > 0) {
        activeCooldowns[action] = remaining;
      }
    }
    
    return {
      activeCooldowns: activeCooldowns,
      totalActions: this.actionHistory.size
    };
  }

  cleanup() {
    this.actionHistory.clear();
  }
}

// ===================================================================================
// ==                           BEHAVIOR ANALYZER                                 ==
// ===================================================================================

class BehaviorAnalyzer {
  constructor() {
    this.patterns = [];
    this.suspiciousThreshold = 5;
    this.maxPatterns = 50;
  }

  analyzePlayerBehavior(action) {
    try {
      const pattern = {
        action: action,
        timestamp: Date.now(),
        sessionTime: this.getSessionTime()
      };

      this.patterns.push(pattern);
      
      // Beperk aantal patterns
      if (this.patterns.length > this.maxPatterns) {
        this.patterns.shift();
      }

      const suspiciousScore = this.calculateSuspiciousScore();
      
      if (suspiciousScore > this.suspiciousThreshold) {
        this.flagSuspiciousBehavior(suspiciousScore);
      }
    } catch (error) {
      console.error('🔒 Behavior analysis error:', error);
    }
  }

  calculateSuspiciousScore() {
    if (this.patterns.length < 5) return 0;
    
    let score = 0;
    const recentPatterns = this.patterns.slice(-10);

    // Te veel acties in korte tijd
    const avgTimeBetweenActions = this.calculateAverageTime(recentPatterns);
    if (avgTimeBetweenActions < 500) score += 3;

    // Te perfecte timing (bot-achtig)
    if (this.detectPerfectTiming(recentPatterns)) score += 2;

    // Onnatuurlijke actiepatronen
    if (this.detectUnnaturalPatterns(recentPatterns)) score += 2;

    return score;
  }

  calculateAverageTime(patterns) {
    if (patterns.length < 2) return 0;
    
    let totalTime = 0;
    for (let i = 1; i < patterns.length; i++) {
      totalTime += patterns[i].timestamp - patterns[i-1].timestamp;
    }
    
    return totalTime / (patterns.length - 1);
  }

  detectPerfectTiming(patterns) {
    if (patterns.length < 3) return false;
    
    const times = [];
    for (let i = 1; i < patterns.length; i++) {
      times.push(patterns[i].timestamp - patterns[i-1].timestamp);
    }
    
    // Check voor te consistente timing (minder dan 50ms variatie)
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length;
    
    return variance < 2500; // 50ms²
  }

  detectUnnaturalPatterns(patterns) {
    // Check voor repetitieve acties
    const actionCounts = {};
    patterns.forEach(p => {
      actionCounts[p.action] = (actionCounts[p.action] || 0) + 1;
    });
    
    // Als één actie meer dan 70% van alle acties is
    const totalActions = patterns.length;
    for (const [action, count] of Object.entries(actionCounts)) {
      if (count / totalActions > 0.7) {
        return true;
      }
    }
    
    return false;
  }

  flagSuspiciousBehavior(score) {
    console.warn(`🔒 Suspicious behavior detected (score: ${score})`);
    // Hier kunnen we later meer acties toevoegen
  }

  getSessionTime() {
    return Date.now() - (window.sessionStartTime || Date.now());
  }

  getStatus() {
    return {
      patternsCount: this.patterns.length,
      suspiciousThreshold: this.suspiciousThreshold,
      recentScore: this.calculateSuspiciousScore()
    };
  }

  cleanup() {
    this.patterns = [];
  }
}

// ===================================================================================
// ==                           SECURE STORAGE                                    ==
// ===================================================================================

class SecureStorage {
  constructor() {
    this.encryptionKey = this.generateKey();
  }

  generateKey() {
    // Simpele key generation (in productie zou dit veel sterker zijn)
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 15);
    return btoa(timestamp + random).substring(0, 32);
  }

  saveSecureData(data) {
    try {
      const dataString = JSON.stringify(data);
      const encrypted = this.encrypt(dataString);
      const checksum = this.generateChecksum(data);
      
      localStorage.setItem('sollyverse_encrypted', encrypted);
      localStorage.setItem('sollyverse_checksum', checksum);
      localStorage.setItem('sollyverse_timestamp', Date.now().toString());
      
      return true;
    } catch (error) {
      console.error('🔒 Error saving secure data:', error);
      return false;
    }
  }

  loadSecureData() {
    try {
      const encrypted = localStorage.getItem('sollyverse_encrypted');
      const storedChecksum = localStorage.getItem('sollyverse_checksum');
      const timestamp = localStorage.getItem('sollyverse_timestamp');
      
      if (!encrypted || !storedChecksum || !timestamp) {
        return null;
      }
      
      // Check timestamp (data ouder dan 24 uur is verdacht)
      const dataAge = Date.now() - parseInt(timestamp);
      if (dataAge > 86400000) { // 24 uur
        console.warn('🔒 Data is too old, possible manipulation');
        return null;
      }
      
      const decrypted = this.decrypt(encrypted);
      const data = JSON.parse(decrypted);
      const currentChecksum = this.generateChecksum(data);
      
      if (storedChecksum !== currentChecksum) {
        console.warn('🔒 Data integrity check failed!');
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('🔒 Error loading secure data:', error);
      return null;
    }
  }

  encrypt(text) {
    // Simpele encryptie (in productie zou dit AES zijn)
    return btoa(text + this.encryptionKey);
  }

  decrypt(encrypted) {
    // Simpele decryptie
    const decoded = atob(encrypted);
    return decoded.slice(0, -this.encryptionKey.length);
  }

  generateChecksum(data) {
    // Simpele checksum (in productie zou dit SHA-256 zijn)
    const dataString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  cleanup() {
    // Cleanup is optioneel voor storage
  }
}

// ===================================================================================
// ==                           DATA VALIDATOR                                    ==
// ===================================================================================

class DataValidator {
  constructor() {
    this.rules = {
      sollys: {
        geel: { min: 0, max: 10000, type: 'number' },
        blauw: { min: 0, max: 10000, type: 'number' },
        rood: { min: 0, max: 10000, type: 'number' },
        pink: { min: 0, max: 10000, type: 'number' }
      },
      planeten: {
        rood: { min: 0, max: 5000, type: 'number' },
        groen: { min: 0, max: 5000, type: 'number' }
      },
      sterren: {
        totaal: { min: 0, max: 20000, type: 'number' },
        wit: { min: 0, max: 20000, type: 'number' }
      },
      level: { allowed: ['beginner', 'level1', 'level2', 'level3', 'master'], type: 'string' },
      shape: { allowed: ['piramide', 'vierkant', 'zandloper', 'ruit'], type: 'string' },
      size: { min: 80, max: 200, type: 'number' }, // Dynamisch per level
      kaboom: { min: 0, max: 999999, type: 'number' }
    };
  }

  validateData(action, data) {
    try {
      switch (action) {
        case 'updateSollys':
          return this.validateSollysData(data);
        case 'updatePlaneten':
          return this.validatePlanetenData(data);
        case 'updateSterren':
          return this.validateSterrenData(data);
        case 'changeLevel':
          return this.validateLevel(data);
        case 'changeShape':
          return this.validateShape(data);
        case 'importCoin':
          return this.validateUserData(data);
        default:
          return true;
      }
    } catch (error) {
      console.error('🔒 Data validation error:', error);
      return false;
    }
  }

  validateUserData(userData) {
    if (!userData || typeof userData !== 'object') {
      return false;
    }

    // Check required fields
    const requiredFields = ['level', 'shape', 'size', 'kaboom', 'sollys', 'planeten', 'sterren'];
    for (const field of requiredFields) {
      if (!userData.hasOwnProperty(field)) {
        return false;
      }
    }

    // Validate each category
    return this.validateSollysData(userData.sollys) &&
           this.validatePlanetenData(userData.planeten) &&
           this.validateSterrenData(userData.sterren) &&
           this.validateLevel(userData.level) &&
           this.validateShape(userData.shape) &&
           this.validateSize(userData.size) &&
           this.validateKaboom(userData.kaboom);
  }

  validateSollysData(sollys) {
    if (!sollys || typeof sollys !== 'object') return false;
    
    for (const [key, rule] of Object.entries(this.rules.sollys)) {
      if (!sollys.hasOwnProperty(key)) return false;
      if (typeof sollys[key] !== rule.type) return false;
      if (sollys[key] < rule.min || sollys[key] > rule.max) return false;
    }
    
    return true;
  }

  validatePlanetenData(planeten) {
    if (!planeten || typeof planeten !== 'object') return false;
    
    for (const [key, rule] of Object.entries(this.rules.planeten)) {
      if (!planeten.hasOwnProperty(key)) return false;
      if (typeof planeten[key] !== rule.type) return false;
      if (planeten[key] < rule.min || planeten[key] > rule.max) return false;
    }
    
    return true;
  }

  validateSterrenData(sterren) {
    if (!sterren || typeof sterren !== 'object') return false;
    
    for (const [key, rule] of Object.entries(this.rules.sterren)) {
      if (!sterren.hasOwnProperty(key)) return false;
      if (typeof sterren[key] !== rule.type) return false;
      if (sterren[key] < rule.min || sterren[key] > rule.max) return false;
    }
    
    return true;
  }

  validateLevel(level) {
    return this.rules.level.allowed.includes(level);
  }

  validateShape(shape) {
    return this.rules.shape.allowed.includes(shape);
  }

  validateSize(size) {
    // Size is dynamisch per level - kan variëren van 80 (level3) tot 200 (master)
    return typeof size === 'number' && size >= 80 && size <= 200;
  }

  validateKaboom(kaboom) {
    return typeof kaboom === 'number' && kaboom >= 0;
  }
}

// Export voor gebruik in andere modules
window.SecurityManager = SecurityManager; 