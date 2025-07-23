// server/database-handler.js - Server-side database handler
const fs = require('fs');
const path = require('path');

class DatabaseHandler {
    constructor() {
        this.dbPath = path.join(__dirname, '../database');
        this.ensureDatabaseDirectory();
    }

    ensureDatabaseDirectory() {
        if (!fs.existsSync(this.dbPath)) {
            fs.mkdirSync(this.dbPath, { recursive: true });
            console.log('📁 Database directory created');
        }
    }

    getFilePath(filename) {
        return path.join(this.dbPath, filename);
    }

    async loadData(filename) {
        const filePath = this.getFilePath(filename);
        
        try {
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                return JSON.parse(data);
            } else {
                throw new Error(`File ${filename} not found`);
            }
        } catch (error) {
            console.error(`❌ Failed to load ${filename}:`, error.message);
            throw error;
        }
    }

    async saveData(filename, data) {
        const filePath = this.getFilePath(filename);
        
        try {
            // Update timestamp
            data.lastUpdated = new Date().toISOString();
            
            // Sla data op
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`💾 Saved ${filename} successfully`);
            
            return true;
        } catch (error) {
            console.error(`❌ Failed to save ${filename}:`, error.message);
            throw error;
        }
    }

    async createBackup() {
        const backupPath = path.join(this.dbPath, 'backup');
        if (!fs.existsSync(backupPath)) {
            fs.mkdirSync(backupPath, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(backupPath, `backup-${timestamp}`);
        fs.mkdirSync(backupDir, { recursive: true });

        const files = ['game_data.json', 'kaboom_data.json', 'user_data.json'];
        
        for (const file of files) {
            const sourcePath = this.getFilePath(file);
            const backupPath = path.join(backupDir, file);
            
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, backupPath);
            }
        }

        console.log(`💾 Database backup created: ${backupDir}`);
        return backupDir;
    }

    async resetDatabase() {
        const files = ['game_data.json', 'kaboom_data.json', 'user_data.json'];
        
        for (const file of files) {
            const filePath = this.getFilePath(file);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        console.log('🔄 Database reset complete');
    }

    getDatabaseStats() {
        const files = ['game_data.json', 'kaboom_data.json', 'user_data.json'];
        const stats = {};

        for (const file of files) {
            const filePath = this.getFilePath(file);
            if (fs.existsSync(filePath)) {
                const stat = fs.statSync(filePath);
                stats[file] = {
                    size: stat.size,
                    modified: stat.mtime,
                    exists: true
                };
            } else {
                stats[file] = { exists: false };
            }
        }

        return stats;
    }
}

module.exports = DatabaseHandler; 