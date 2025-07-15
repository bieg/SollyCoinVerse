// ===================================================================================
// ==                           CONSTANTS MODULE                                  ==
// ==                                                                             ==
// ==      Centrale configuratie voor het hele project:                          ==
// ==      - Game constants en magic numbers                                      ==
// ==      - Timing en delay waardes                                              ==
// ==      - UI configuratie                                                      ==
// ==      - Performance instellingen                                             ==
// ===================================================================================

// Game Constants
window.GAME_CONSTANTS = {
  // Level configuratie
  MAX_LEVEL: 100,
  REWARD_PER_LEVEL: 100,
  
  // Solly configuratie
  SOLLY_DEFAULT_SIZE: 60,
  SOLLY_DEFAULT_SCALE: 3.4,
  SOLLY_COLLIDER_RADIUS: 600,
  
  // Movement configuratie
  MAX_MOVEMENT_DISTANCE: 5000,
  MOVEMENT_SPEED: 40,
  
  // Collision configuratie
  COLLISION_DISTANCE: 300,
  KABOOM_THRESHOLD: 5,
  
  // Portal configuratie
  PORTAL_ACTIVATION_DELAY: 2000,
  PORTAL_SCALE: 1.0,
  PORTAL_MOVEMENT_RADIUS: 8000,
  PORTAL_MOVEMENT_SPEED: 0.02
};

// Timing Constants
window.TIMING_CONSTANTS = {
  // Auto-save delays
  AUTO_SAVE_DELAY: 1000,
  CONFIG_LOAD_DELAY: 100,
  
  // Animation durations
  CAMERA_ANIMATION_DURATION: 1500,
  EXPLOSION_DURATION: 2000,
  SCREEN_SHAKE_DURATION: 1000,
  PORTAL_ANIMATION_DURATION: 3000,
  
  // UI delays
  MESSAGE_DISPLAY_DURATION: 5000,
  MODAL_FADE_DURATION: 300,
  
  // Game delays
  COLLISION_COOLDOWN: 500,
  LEVEL_TRANSITION_DELAY: 2000
};

// UI Constants
window.UI_CONSTANTS = {
  // Colors
  PRIMARY_COLOR: '#8A2BE2',
  SUCCESS_COLOR: '#4CAF50',
  ERROR_COLOR: '#f44336',
  WARNING_COLOR: '#FF9800',
  INFO_COLOR: '#2196F3',
  
  // Z-index levels
  Z_INDEX: {
    CANVAS: 1000,
    OVERLAY: 100,
    MODAL: 10000,
    ERROR_MESSAGE: 10000,
    CTA_BUTTONS: 10010
  },
  
  // Sizes
  BUTTON_PADDING: '12px 20px',
  MODAL_PADDING: '32px',
  MESSAGE_PADDING: '15px 20px',
  
  // Animations
  TRANSITION_DURATION: '0.3s',
  HOVER_SCALE: 1.05
};

// Performance Constants
window.PERFORMANCE_CONSTANTS = {
  // Object pooling
  MAX_PARTICLES: 50,
  MAX_EXPLOSIONS: 10,
  MAX_MINI_SOLLYS: 100,
  
  // Level of Detail
  LOD_DISTANCE_NEAR: 1000,
  LOD_DISTANCE_MEDIUM: 3000,
  LOD_DISTANCE_FAR: 8000,
  
  // Memory management
  CLEANUP_INTERVAL: 30000, // 30 seconds
  MAX_OBJECTS_IN_SCENE: 1000,
  
  // Rendering
  TARGET_FPS: 60,
  MAX_FRAME_TIME: 16.67 // 60 FPS = 16.67ms per frame
};

// Security Constants
window.SECURITY_CONSTANTS = {
  // Rate limiting
  MAX_ACTIONS_PER_MINUTE: 60,
  COOLDOWN_PERIOD: 60000, // 1 minute
  
  // Anti-cheat
  MAX_VIOLATIONS: 5,
  SUSPICIOUS_SCORE_THRESHOLD: 0.8,
  
  // Data validation
  MAX_DATA_SIZE: 1024 * 1024, // 1MB
  MAX_STRING_LENGTH: 1000,
  
  // Session management
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_SESSIONS_PER_USER: 5
};

// Web3 Constants
window.WEB3_CONSTANTS = {
  // Network IDs
  NETWORKS: {
    ETHEREUM_MAINNET: 1,
    ETHEREUM_SEPOLIA: 11155111,
    POLYGON_MAINNET: 137,
    POLYGON_MUMBAI: 80001,
    LOCALHOST: 1337
  },
  
  // Gas limits
  DEFAULT_GAS_LIMIT: 300000,
  MAX_GAS_LIMIT: 5000000,
  
  // Transaction timeouts
  TRANSACTION_TIMEOUT: 60000, // 1 minute
  CONFIRMATION_TIMEOUT: 300000, // 5 minutes
  
  // Contract addresses (placeholder)
  CONTRACT_ADDRESSES: {
    SOLLY_COIN: '0x...',
    SOLLY_NFT: '0x...',
    GAME_FACTORY: '0x...'
  }
};

// Debug Constants
window.DEBUG_CONSTANTS = {
  // Debug modes
  DEBUG_MODE: window.DEBUG || false,
  VERBOSE_LOGGING: false,
  SHOW_FPS: false,
  SHOW_BOUNDING_BOXES: false,
  
  // Debug colors
  DEBUG_COLORS: {
    COLLIDER: 0xFF0000,
    BOUNDING_BOX: 0x00FF00,
    RAYCAST: 0x0000FF,
    PATH: 0xFFFF00
  }
};

// Asset Constants
window.ASSET_CONSTANTS = {
  // File types
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SUPPORTED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
  
  // File sizes
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_AUDIO_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  
  // Asset paths
  ASSET_PATHS: {
    IMAGES: '/assets/images/',
    AUDIO: '/assets/audio/',
    MODELS: '/assets/models/',
    TEXTURES: '/assets/textures/'
  }
};

// Error Constants
window.ERROR_CONSTANTS = {
  // Error types
  ERROR_TYPES: {
    CONFIG_LOADING: 'CONFIG_LOADING',
    PROGRESS_SAVING: 'PROGRESS_SAVING',
    PROGRESS_LOADING: 'PROGRESS_LOADING',
    SECURITY_VALIDATION: 'SECURITY_VALIDATION',
    WEB3_CONNECTION: 'WEB3_CONNECTION',
    CONTRACT_INTERACTION: 'CONTRACT_INTERACTION',
    NETWORK_ERROR: 'NETWORK_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    PERMISSION_ERROR: 'PERMISSION_ERROR'
  },
  
  // Error messages
  ERROR_MESSAGES: {
    CONFIG_LOADING: 'Fout bij het laden van configuratie',
    PROGRESS_SAVING: 'Fout bij het opslaan van voortgang',
    PROGRESS_LOADING: 'Fout bij het laden van voortgang',
    SECURITY_VALIDATION: 'Security validatie gefaald',
    WEB3_CONNECTION: 'Web3 verbinding mislukt',
    CONTRACT_INTERACTION: 'Smart contract interactie mislukt',
    NETWORK_ERROR: 'Netwerk fout opgetreden',
    VALIDATION_ERROR: 'Data validatie gefaald',
    PERMISSION_ERROR: 'Geen toestemming voor deze actie'
  },
  
  // Error codes
  ERROR_CODES: {
    INVALID_DATA: 1001,
    NETWORK_TIMEOUT: 1002,
    PERMISSION_DENIED: 1003,
    RESOURCE_NOT_FOUND: 1004,
    VALIDATION_FAILED: 1005,
    SECURITY_VIOLATION: 1006
  }
};

// Storage Keys
window.STORAGE_KEYS = {
  // Local storage keys
  USER_PROGRESS: 'sollycoin_user_progress',
  GAME_CONFIG: 'sollycoin_game_config',
  USER_PREFERENCES: 'sollycoin_user_preferences',
  SESSION_DATA: 'sollycoin_session_data',
  
  // Session storage keys
  TEMP_DATA: 'sollycoin_temp_data',
  DEBUG_DATA: 'sollycoin_debug_data'
};

// API Constants
window.API_CONSTANTS = {
  // Base URLs
  BASE_URL: 'https://api.sollyverse.com',
  IPFS_GATEWAY: 'https://ipfs.io/ipfs/',
  
  // Endpoints
  ENDPOINTS: {
    USER_PROFILE: '/api/user/profile',
    GAME_STATE: '/api/game/state',
    LEADERBOARD: '/api/leaderboard',
    ACHIEVEMENTS: '/api/achievements'
  },
  
  // Request timeouts
  REQUEST_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  
  // Rate limiting
  REQUESTS_PER_MINUTE: 60,
  BURST_LIMIT: 10
};

// Export voor gebruik in andere modules (browser compatibel)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GAME_CONSTANTS: window.GAME_CONSTANTS,
    TIMING_CONSTANTS: window.TIMING_CONSTANTS,
    UI_CONSTANTS: window.UI_CONSTANTS,
    PERFORMANCE_CONSTANTS: window.PERFORMANCE_CONSTANTS,
    SECURITY_CONSTANTS: window.SECURITY_CONSTANTS,
    WEB3_CONSTANTS: window.WEB3_CONSTANTS,
    DEBUG_CONSTANTS: window.DEBUG_CONSTANTS,
    ASSET_CONSTANTS: window.ASSET_CONSTANTS,
    ERROR_CONSTANTS: window.ERROR_CONSTANTS,
    STORAGE_KEYS: window.STORAGE_KEYS,
    API_CONSTANTS: window.API_CONSTANTS
  };
} 