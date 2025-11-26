// ===================================================================================
// ==                           WEBSOCKET CLIENT MANAGER                           ==
// ==                                                                             ==
// ==      Client-side WebSocket manager voor real-time communicatie             ==
// ==      - Real-time game state synchronisatie                                  ==
// ==      - Multiplayer support                                                  ==
// ==      - Live data streaming                                                  ==
// ===================================================================================

/* global io */
/* eslint-env browser, node */

class WebSocketClientManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventListeners = new Map();
    this.gameState = null;
    this.playerId = null;

    this.DEBUG = window.DEBUG || false;
  }

  debugLog(...args) {
    if (this.DEBUG) {
      console.log('[WebSocketClient]', ...args);
    }
  }

  // Initialize WebSocket connection
  async initialize() {
    try {
      this.debugLog('🔗 Initializing WebSocket connection...');

      // ALTIJD poort 5555 (vast gezet volgens workspace regel)
      const serverUrl = `http://127.0.0.1:5555`;

      this.debugLog('📡 Connecting to:', serverUrl, 'from origin:', window.location.origin);

      // Create WebSocket connection met timeout
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: false,
        timeout: 5000, // 5 second timeout
        reconnection: false, // Disable auto-reconnection (we handle it manually)
      });

      // Setup event listeners
      this.setupEventListeners();

      // Connect manually met timeout check
      const connectTimeout = setTimeout(() => {
        if (!this.isConnected) {
          this.debugLog('⏱️ WebSocket connection timeout');
          this.socket.disconnect();
          return false;
        }
      }, 5000);

      this.socket.connect();

      // Clear timeout als connected
      this.socket.on('connect', () => {
        clearTimeout(connectTimeout);
        return true;
      });

      return true;
    } catch (error) {
      this.debugLog('❌ WebSocket initialization failed:', error);
      return false;
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.playerId = this.socket.id;
      this.debugLog('✅ WebSocket connected:', this.playerId);
      this.emit('connected', { playerId: this.playerId });
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.debugLog('🔌 WebSocket disconnected');
      this.emit('disconnected');
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      // VOORKOM CONSOLE SPAM - alleen eerste error loggen
      if (this.reconnectAttempts === 0) {
        this.debugLog('❌ WebSocket connection error:', error.message || error);
      }
      this.emit('connectionError', error);
      // Geen auto-reconnect meer - laat main.js het bepalen
      this.isConnected = false;
    });

    // Game state events
    this.socket.on('gameState', (gameState) => {
      this.gameState = gameState;
      this.debugLog('📊 Game state received:', gameState);
      this.emit('gameStateReceived', gameState);
    });

    this.socket.on('gameStateUpdate', (update) => {
      if (this.gameState) {
        this.gameState.globalStats = update.globalStats;
        this.debugLog('📊 Game state updated:', update);
        this.emit('gameStateUpdated', update);
      }
    });

    // Player events
    this.socket.on('playerMoved', (data) => {
      this.debugLog('👤 Player moved:', data);
      this.emit('playerMoved', data);
    });

    this.socket.on('playerUpdated', (data) => {
      this.debugLog('👤 Player updated:', data);
      this.emit('playerUpdated', data);
    });

    this.socket.on('playerCountUpdate', (count) => {
      this.debugLog('👥 Player count updated:', count);
      this.emit('playerCountUpdate', count);
    });

    // Universe events
    this.socket.on('universeUpdated', (universe) => {
      this.debugLog('🌌 Universe updated:', universe);
      this.emit('universeUpdated', universe);
    });

    // Collision events
    this.socket.on('collision', (data) => {
      this.debugLog('💥 Collision detected:', data);
      this.emit('collision', data);
    });

    this.socket.on('kaboom', (data) => {
      this.debugLog('💥 Kaboom:', data);
      this.emit('kaboom', data);
    });

    // Chat events
    this.socket.on('chatMessage', (message) => {
      this.debugLog('💬 Chat message:', message);
      this.emit('chatMessage', message);
    });
  }

  // Event system
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          this.debugLog('❌ Event callback error:', error);
        }
      });
    }
  }

  // Player movement
  sendPlayerMove(position, rotation) {
    if (this.isConnected && this.socket) {
      this.socket.emit('playerMove', {
        position,
        rotation,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Collision detection
  sendCollision(position, level) {
    if (this.isConnected && this.socket) {
      this.socket.emit('collision', {
        position,
        level,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Universe updates
  sendUniverseUpdate(universeData) {
    if (this.isConnected && this.socket) {
      this.socket.emit('universeUpdate', universeData);
    }
  }

  // Chat messages
  sendChatMessage(message) {
    if (this.isConnected && this.socket) {
      this.socket.emit('chatMessage', {
        message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Player data updates
  sendPlayerDataUpdate(playerData) {
    if (this.isConnected && this.socket) {
      this.socket.emit('playerDataUpdate', playerData);
    }
  }

  // Reconnection handling - VOORKOM SPAM
  handleReconnect() {
    // Stop reconnect attempts na 3 pogingen (voorkom console spam)
    if (this.reconnectAttempts >= 3) {
      this.debugLog('❌ WebSocket reconnection disabled - server not available');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      // Alleen eerste reconnect loggen
      if (this.reconnectAttempts <= 1) {
        this.debugLog(
          `🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
        );
      }

      setTimeout(() => {
        this.initialize();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      this.debugLog('❌ Max reconnection attempts reached - WebSocket disabled');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  // Get current game state
  getGameState() {
    return this.gameState;
  }

  // Get player ID
  getPlayerId() {
    return this.playerId;
  }

  // Check connection status
  isWebSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Cleanup
  cleanup() {
    this.disconnect();
    this.eventListeners.clear();
  }
}

// Make WebSocketClientManager globally available
window.WebSocketClientManager = WebSocketClientManager;

// Export for use in other modules
/* eslint-disable no-undef */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebSocketClientManager;
}
/* eslint-enable no-undef */
