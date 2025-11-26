// ===================================================================================
// ==                           DYNAMISCHE SOLLYCOIN SERVER                        ==
// ==                                                                             ==
// ==      Express.js server met WebSocket support voor real-time gaming        ==
// ==      - Real-time game state synchronisatie                                  ==
// ==      - Multiplayer support                                                  ==
// ==      - Dynamic API endpoints                                                ==
// ==      - Live data streaming                                                  ==
// ===================================================================================

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

class SollyCoinServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: ["http://127.0.0.1:5555", "http://localhost:5555", "http://127.0.0.1:5556", "http://localhost:5556"],
        methods: ["GET", "POST"],
        credentials: true
      }
    });
    
    this.port = 5555;
    this.connectedPlayers = new Map();
    this.gameState = {
      players: new Map(),
      universe: {
        sollys: [],
        planets: [],
        stars: [],
        collisions: []
      },
      globalStats: {
        totalKabooms: 0,
        activePlayers: 0,
        totalPlayTime: 0
      }
    };
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupGameLoop();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "data:", "blob:", "https:", "wss:"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://cdn.socket.io"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "https://r2cdn.perplexity.ai"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "ws://127.0.0.1:5555", "ws://localhost:5555", "wss://127.0.0.1:5555", "wss://localhost:5555", "https://cdn.jsdelivr.net", "https://cdn.socket.io", "https://cdnjs.cloudflare.com"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          upgradeInsecureRequests: []
        }
      }
    }));

    // Rate limiting - UITGESCHAKELD VOOR DEVELOPMENT
    // const limiter = rateLimit({
    //   windowMs: 15 * 60 * 1000, // 15 minutes
    //   max: 10000 // limit each IP to 10000 requests per windowMs (minder strikt voor dev)
    // });
    // this.app.use(limiter);

    // CORS - ALLOW ALLE POORTEN VOOR DEVELOPMENT
    this.app.use(cors({
      origin: ["http://127.0.0.1:5555", "http://localhost:5555", "http://127.0.0.1:5556", "http://localhost:5556"],
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Static files
    this.app.use(express.static(path.join(__dirname)));
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        players: this.connectedPlayers.size,
        uptime: process.uptime()
      });
    });

    // Game state API
    this.app.get('/api/game-state', (req, res) => {
      res.json({
        players: Array.from(this.gameState.players.values()),
        universe: this.gameState.universe,
        globalStats: this.gameState.globalStats
      });
    });

    // Player data API
    this.app.get('/api/player/:playerId', (req, res) => {
      const playerId = req.params.playerId;
      const player = this.gameState.players.get(playerId);
      
      if (player) {
        res.json(player);
      } else {
        res.status(404).json({ error: 'Player not found' });
      }
    });

    // Update player data
    this.app.post('/api/player/:playerId', (req, res) => {
      const playerId = req.params.playerId;
      const playerData = req.body;
      
      // Validate player data
      if (!this.validatePlayerData(playerData)) {
        return res.status(400).json({ error: 'Invalid player data' });
      }
      
      // Update player state
      this.gameState.players.set(playerId, {
        ...playerData,
        lastUpdate: new Date().toISOString(),
        playerId
      });
      
      // Broadcast update to all connected clients
      this.io.emit('playerUpdated', {
        playerId,
        data: playerData
      });
      
      res.json({ success: true, playerId });
    });

    // Universe data API
    this.app.get('/api/universe', (req, res) => {
      res.json(this.gameState.universe);
    });

    // Update universe data
    this.app.post('/api/universe', (req, res) => {
      const universeData = req.body;
      
      // Validate universe data
      if (!this.validateUniverseData(universeData)) {
        return res.status(400).json({ error: 'Invalid universe data' });
      }
      
      // Update universe state
      this.gameState.universe = {
        ...this.gameState.universe,
        ...universeData,
        lastUpdate: new Date().toISOString()
      };
      
      // Broadcast universe update
      this.io.emit('universeUpdated', this.gameState.universe);
      
      res.json({ success: true });
    });

    // Kaboom counter API
    this.app.post('/api/kaboom', (req, res) => {
      const { playerId, position, level } = req.body;
      
      // Increment global kaboom counter
      this.gameState.globalStats.totalKabooms++;
      
      // Add collision to universe
      this.gameState.universe.collisions.push({
        playerId,
        position,
        level,
        timestamp: new Date().toISOString()
      });
      
      // Broadcast kaboom to all players
      this.io.emit('kaboom', {
        playerId,
        position,
        level,
        totalKabooms: this.gameState.globalStats.totalKabooms
      });
      
      res.json({ 
        success: true, 
        totalKabooms: this.gameState.globalStats.totalKabooms 
      });
    });

    // Coin data API
    this.app.get('/api/coins/:coinType', (req, res) => {
      const coinType = req.params.coinType;
      const coinPath = path.join(__dirname, 'coins', `SollyCoin_${coinType}.json`);
      
      if (fs.existsSync(coinPath)) {
        const coinData = JSON.parse(fs.readFileSync(coinPath, 'utf8'));
        res.json(coinData);
      } else {
        res.status(404).json({ error: 'Coin not found' });
      }
    });

    // Serve main HTML file
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'index.html'));
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log(`🔗 Player connected: ${socket.id}`);
      
      // Add player to connected players
      this.connectedPlayers.set(socket.id, {
        socketId: socket.id,
        connectedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      });
      
      // Update global stats
      this.gameState.globalStats.activePlayers = this.connectedPlayers.size;
      
      // Send current game state to new player
      socket.emit('gameState', this.gameState);
      
      // Broadcast player count update
      this.io.emit('playerCountUpdate', this.connectedPlayers.size);
      
      // Handle player movement
      socket.on('playerMove', (data) => {
        this.handlePlayerMove(socket.id, data);
      });
      
      // Handle collision detection
      socket.on('collision', (data) => {
        this.handleCollision(socket.id, data);
      });
      
      // Handle universe updates
      socket.on('universeUpdate', (data) => {
        this.handleUniverseUpdate(socket.id, data);
      });
      
      // Handle chat messages
      socket.on('chatMessage', (data) => {
        this.handleChatMessage(socket.id, data);
      });
      
      // Handle player data updates
      socket.on('playerDataUpdate', (data) => {
        this.handlePlayerDataUpdate(socket.id, data);
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`🔌 Player disconnected: ${socket.id}`);
        this.connectedPlayers.delete(socket.id);
        this.gameState.players.delete(socket.id);
        this.gameState.globalStats.activePlayers = this.connectedPlayers.size;
        
        // Broadcast player count update
        this.io.emit('playerCountUpdate', this.connectedPlayers.size);
      });
    });
  }

  setupGameLoop() {
    // Game loop runs every 5000ms (5 seconden) voor minder console spam
    setInterval(() => {
      this.updateGameState();
    }, 5000);
    
    // Cleanup inactive players every 30 seconds
    setInterval(() => {
      this.cleanupInactivePlayers();
    }, 30000);
  }

  handlePlayerMove(socketId, data) {
    const player = this.gameState.players.get(socketId) || {};
    player.position = data.position;
    player.rotation = data.rotation;
    player.lastUpdate = new Date().toISOString();
    
    this.gameState.players.set(socketId, player);
    
    // Broadcast movement to other players
    socket.broadcast.emit('playerMoved', {
      playerId: socketId,
      position: data.position,
      rotation: data.rotation
    });
  }

  handleCollision(socketId, data) {
    // Increment global kaboom counter
    this.gameState.globalStats.totalKabooms++;
    
    // Add collision to universe
    this.gameState.universe.collisions.push({
      playerId: socketId,
      position: data.position,
      level: data.level,
      timestamp: new Date().toISOString()
    });
    
    // Broadcast collision to all players
    this.io.emit('collision', {
      playerId: socketId,
      position: data.position,
      level: data.level,
      totalKabooms: this.gameState.globalStats.totalKabooms
    });
  }

  handleUniverseUpdate(socketId, data) {
    // Update universe state
    this.gameState.universe = {
      ...this.gameState.universe,
      ...data,
      lastUpdate: new Date().toISOString()
    };
    
    // Broadcast universe update to all players
    this.io.emit('universeUpdated', this.gameState.universe);
  }

  handleChatMessage(socketId, data) {
    const message = {
      playerId: socketId,
      message: data.message,
      timestamp: new Date().toISOString()
    };
    
    // Broadcast chat message to all players
    this.io.emit('chatMessage', message);
  }

  handlePlayerDataUpdate(socketId, data) {
    const player = this.gameState.players.get(socketId) || {};
    const updatedPlayer = {
      ...player,
      ...data,
      lastUpdate: new Date().toISOString(),
      playerId: socketId
    };
    
    this.gameState.players.set(socketId, updatedPlayer);
    
    // Broadcast player update to all players
    this.io.emit('playerUpdated', {
      playerId: socketId,
      data: updatedPlayer
    });
  }

  updateGameState() {
    // Update global stats
    this.gameState.globalStats.activePlayers = this.connectedPlayers.size;
    
    // Broadcast periodic game state updates
    this.io.emit('gameStateUpdate', {
      globalStats: this.gameState.globalStats,
      timestamp: new Date().toISOString()
    });
  }

  cleanupInactivePlayers() {
    const now = new Date();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes
    
    for (const [socketId, player] of this.connectedPlayers) {
      const lastActivity = new Date(player.lastActivity);
      if (now - lastActivity > inactiveThreshold) {
        console.log(`🧹 Cleaning up inactive player: ${socketId}`);
        this.connectedPlayers.delete(socketId);
        this.gameState.players.delete(socketId);
      }
    }
  }

  validatePlayerData(data) {
    return data && typeof data === 'object' && data.position && data.rotation;
  }

  validateUniverseData(data) {
    return data && typeof data === 'object';
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`🚀 SollyCoin Dynamic Server running on http://127.0.0.1:${this.port}`);
      console.log(`🔗 WebSocket server ready for real-time connections`);
      console.log(`📊 Game state management active`);
    });
  }

  stop() {
    this.server.close(() => {
      console.log('🛑 SollyCoin Dynamic Server stopped');
    });
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new SollyCoinServer();
  server.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.stop();
    process.exit(0);
  });
}

module.exports = SollyCoinServer;
