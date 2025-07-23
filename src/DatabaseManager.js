// DatabaseManager.js - Persistent database voor Sollyverse zonder local storage
class DatabaseManager {
    constructor() {
        this.dbPath = 'database/';
        this.gameDataFile = 'game_data.json';
        this.kaboomDataFile = 'kaboom_data.json';
        this.userDataFile = 'user_data.json';
        this.isInitialized = false;
        this.gameData = null;
        this.kaboomData = null;
        this.userData = null;
        
        console.log('🗄️ DatabaseManager initializing...');
        this.initialize();
    }

    async initialize() {
        try {
            // Laad bestaande data of maak nieuwe
            await this.loadOrCreateData();
            
            this.isInitialized = true;
            console.log('✅ DatabaseManager initialized successfully');
        } catch (error) {
            console.error('❌ DatabaseManager initialization failed:', error);
            // Fallback naar memory-only mode
            this.createFallbackData();
        }
    }

    async loadOrCreateData() {
        try {
            // Probeer bestaande data te laden uit localStorage als fallback
            this.gameData = await this.loadData(this.gameDataFile);
            this.kaboomData = await this.loadData(this.kaboomDataFile);
            this.userData = await this.loadData(this.userDataFile);
            
            console.log('📊 Database data loaded successfully');
        } catch (error) {
            console.log('🆕 Creating new database data...');
            this.createNewData();
        }
    }

    createNewData() {
        // Maak nieuwe database structuur
        this.gameData = {
            version: '1.0.0',
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            currentLevel: 1,
            totalPlayTime: 0,
            gameSessions: []
        };

        this.kaboomData = {
            version: '1.0.0',
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            totalKabooms: 0,
            kaboomHistory: [],
            levelKabooms: {
                1: 0,
                2: 0
            },
            sessionKabooms: 0,
            currentSession: null
        };

        this.userData = {
            version: '1.0.0',
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            currentShape: 'piramide',
            shapes: ['piramide', 'kubus', 'bol'],
            achievements: [],
            settings: {
                soundEnabled: true,
                musicEnabled: true,
                autoSave: true
            }
        };

        // Sla nieuwe data op
        this.saveAllData();
    }

    createFallbackData() {
        console.log('⚠️ Using fallback memory-only mode');
        this.createNewData();
    }

    async loadData(filename) {
        try {
            // Probeer uit localStorage
            if (typeof localStorage !== 'undefined') {
                const stored = localStorage.getItem(`sollyverse_${filename}`);
                if (stored) {
                    return JSON.parse(stored);
                }
            }
            throw new Error(`No data found for ${filename}`);
        } catch (error) {
            console.error(`❌ Failed to load ${filename}:`, error.message);
            throw error;
        }
    }

    async saveData(filename, data) {
        try {
            // Update timestamp
            data.lastUpdated = new Date().toISOString();
            
            // Sla op in localStorage
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(`sollyverse_${filename}`, JSON.stringify(data));
                console.log(`💾 Saved ${filename} to localStorage`);
                return true;
            } else {
                throw new Error('localStorage not available');
            }
        } catch (error) {
            console.error(`❌ Failed to save ${filename}:`, error.message);
            throw error;
        }
    }

    async saveAllData() {
        if (!this.isInitialized) {
            console.warn('⚠️ Database not initialized, skipping save');
            return;
        }

        try {
            await Promise.all([
                this.saveData(this.gameDataFile, this.gameData),
                this.saveData(this.kaboomDataFile, this.kaboomData),
                this.saveData(this.userDataFile, this.userData)
            ]);
            console.log('💾 All database data saved successfully');
        } catch (error) {
            console.error('❌ Failed to save all data:', error);
        }
    }

    // === KABOOM TRACKING ===
    
    recordKaboom(level = 1, position = null, shape = null) {
        if (!this.isInitialized) {
            console.warn('⚠️ Database not initialized, cannot record kaboom');
            return;
        }

        const kaboomRecord = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            level: level,
            position: position,
            shape: shape,
            sessionId: this.getCurrentSessionId()
        };

        // Update kaboom data
        this.kaboomData.totalKabooms++;
        this.kaboomData.kaboomHistory.push(kaboomRecord);
        this.kaboomData.levelKabooms[level] = (this.kaboomData.levelKabooms[level] || 0) + 1;
        this.kaboomData.sessionKabooms++;

        // Update game data
        this.gameData.lastUpdated = new Date().toISOString();

        // Sla data op
        this.saveAllData();

        console.log(`💥 Kaboom recorded! Total: ${this.kaboomData.totalKabooms}, Level ${level}: ${this.kaboomData.levelKabooms[level]}`);
        
        return kaboomRecord;
    }

    getKaboomCount(level = null) {
        if (!this.isInitialized) return 0;
        
        if (level) {
            return this.kaboomData.levelKabooms[level] || 0;
        }
        return this.kaboomData.totalKabooms;
    }

    getSessionKaboomCount() {
        if (!this.isInitialized) return 0;
        return this.kaboomData.sessionKabooms;
    }

    getKaboomHistory(limit = 10) {
        if (!this.isInitialized) return [];
        return this.kaboomData.kaboomHistory.slice(-limit);
    }

    // === GAME SESSION MANAGEMENT ===
    
    startNewSession() {
        if (!this.isInitialized) return;

        const sessionId = this.generateId();
        const session = {
            id: sessionId,
            startTime: new Date().toISOString(),
            level: this.gameData.currentLevel,
            kabooms: 0
        };

        this.gameData.gameSessions.push(session);
        this.kaboomData.currentSession = sessionId;
        this.kaboomData.sessionKabooms = 0;

        this.saveAllData();
        console.log(`🎮 New game session started: ${sessionId}`);
        
        return sessionId;
    }

    endCurrentSession() {
        if (!this.isInitialized || !this.kaboomData.currentSession) return;

        const currentSession = this.gameData.gameSessions.find(
            s => s.id === this.kaboomData.currentSession
        );

        if (currentSession) {
            currentSession.endTime = new Date().toISOString();
            currentSession.kabooms = this.kaboomData.sessionKabooms;
            currentSession.duration = new Date(currentSession.endTime) - new Date(currentSession.startTime);
        }

        this.kaboomData.currentSession = null;
        this.saveAllData();
        console.log('🎮 Game session ended');
    }

    getCurrentSessionId() {
        return this.kaboomData.currentSession;
    }

    // === USER DATA MANAGEMENT ===
    
    updateCurrentShape(shape) {
        if (!this.isInitialized) return;

        this.userData.currentShape = shape;
        this.userData.lastUpdated = new Date().toISOString();
        this.saveData(this.userDataFile, this.userData);
        
        console.log(`🎨 Shape updated to: ${shape}`);
    }

    getCurrentShape() {
        if (!this.isInitialized) return 'piramide';
        return this.userData.currentShape;
    }

    unlockShape(shape) {
        if (!this.isInitialized) return;

        if (!this.userData.shapes.includes(shape)) {
            this.userData.shapes.push(shape);
            this.userData.lastUpdated = new Date().toISOString();
            this.saveData(this.userDataFile, this.userData);
            console.log(`🔓 New shape unlocked: ${shape}`);
        }
    }

    getUnlockedShapes() {
        if (!this.isInitialized) return ['piramide'];
        return [...this.userData.shapes];
    }

    // === ACHIEVEMENTS ===
    
    unlockAchievement(achievementId, title, description) {
        if (!this.isInitialized) return;

        const existing = this.userData.achievements.find(a => a.id === achievementId);
        if (!existing) {
            const achievement = {
                id: achievementId,
                title: title,
                description: description,
                unlockedAt: new Date().toISOString()
            };

            this.userData.achievements.push(achievement);
            this.userData.lastUpdated = new Date().toISOString();
            this.saveData(this.userDataFile, this.userData);
            
            console.log(`🏆 Achievement unlocked: ${title}`);
            return achievement;
        }
        
        return existing;
    }

    getAchievements() {
        if (!this.isInitialized) return [];
        return [...this.userData.achievements];
    }

    // === UTILITY FUNCTIONS ===
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // === DATABASE MAINTENANCE ===
    
    async resetDatabase() {
        console.log('🔄 Resetting database...');
        this.createNewData();
        await this.saveAllData();
        console.log('✅ Database reset complete');
    }

    async exportDatabase() {
        if (!this.isInitialized) return null;
        
        return {
            gameData: this.gameData,
            kaboomData: this.kaboomData,
            userData: this.userData,
            exportedAt: new Date().toISOString()
        };
    }

    async importDatabase(data) {
        try {
            this.gameData = data.gameData;
            this.kaboomData = data.kaboomData;
            this.userData = data.userData;
            
            await this.saveAllData();
            console.log('✅ Database imported successfully');
        } catch (error) {
            console.error('❌ Database import failed:', error);
        }
    }

    // === STATISTICS ===
    
    getStatistics() {
        if (!this.isInitialized) return null;
        
        return {
            totalKabooms: this.kaboomData.totalKabooms,
            levelKabooms: this.kaboomData.levelKabooms,
            totalSessions: this.gameData.gameSessions.length,
            currentShape: this.userData.currentShape,
            unlockedShapes: this.userData.shapes.length,
            achievements: this.userData.achievements.length,
            lastUpdated: this.gameData.lastUpdated
        };
    }
}

// Export voor gebruik in andere modules
window.DatabaseManager = DatabaseManager; 