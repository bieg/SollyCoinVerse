// ===================================================================================
// ==                        CHAPTER MANAGER MODULE                              ==
// ==                                                                             ==
// ==      Bevat alle chapter en level management:                               ==
// ==      - Chapter progression                                                 ==
// ==      - Level unlocking                                                     ==
// ==      - Achievement tracking                                                ==
// ==      - Story progression                                                   ==
// ===================================================================================

class ChapterManager {
  constructor() {
    this.currentChapter = 1;
    this.currentLevel = 1;
    this.unlockedChapters = new Set([1]);
    this.unlockedLevels = new Set([1]);
    this.achievements = new Map();
    this.storyProgress = 0;
    this.DEBUG = window.DEBUG || false;
    
    // Initialize immediately
    this.initialize();
  }

  debugLog(...args) {
    if (this.DEBUG) {
      console.log('[ChapterManager]', ...args);
    }
  }

  // Initialize chapter manager
  initialize() {
    try {
      this.debugLog('📚 Initializing ChapterManager...');
      
      this.loadProgress();
      this.setupChapters();
      this.setupAchievements();
      
      this.debugLog('✅ ChapterManager initialized successfully');
      return true;
    } catch (error) {
      this.debugLog('❌ ChapterManager initialization failed:', error);
      return false;
    }
  }

  // Setup chapter definitions
  setupChapters() {
    this.chapters = {
      1: {
        name: 'Het Begin',
        description: 'Welkom in het SollyCoin universum',
        levels: [1, 2, 3, 4, 5],
        requiredKaboom: 0,
        rewards: {
          sollyCoin: 100,
          experience: 50
        }
      },
      2: {
        name: 'De Ontdekking',
        description: 'Ontdek de mysteries van het universum',
        levels: [6, 7, 8, 9, 10],
        requiredKaboom: 20,
        rewards: {
          sollyCoin: 200,
          experience: 100
        }
      },
      3: {
        name: 'De Uitdaging',
        description: 'Test je vaardigheden',
        levels: [11, 12, 13, 14, 15],
        requiredKaboom: 50,
        rewards: {
          sollyCoin: 300,
          experience: 150
        }
      },
      4: {
        name: 'De Meester',
        description: 'Bewijs dat je een meester bent',
        levels: [16, 17, 18, 19, 20],
        requiredKaboom: 100,
        rewards: {
          sollyCoin: 500,
          experience: 250
        }
      }
    };
  }

  // Setup achievement definitions
  setupAchievements() {
    this.achievementDefinitions = {
      firstKaboom: {
        id: 'firstKaboom',
        name: 'Eerste Kaboom',
        description: 'Behaal je eerste kaboom',
        icon: '💥',
        reward: { sollyCoin: 50 }
      },
      tenKabooms: {
        id: 'tenKabooms',
        name: 'Kaboom Meester',
        description: 'Behaal 10 kabooms',
        icon: '💥💥',
        reward: { sollyCoin: 100 }
      },
      firstChapter: {
        id: 'firstChapter',
        name: 'Hoofdstuk Voltooid',
        description: 'Voltooi je eerste hoofdstuk',
        icon: '📚',
        reward: { sollyCoin: 200 }
      },
      shapeCollector: {
        id: 'shapeCollector',
        name: 'Vormen Verzamelaar',
        description: 'Probeer alle beschikbare vormen',
        icon: '🔷',
        reward: { sollyCoin: 150 }
      },
      speedRunner: {
        id: 'speedRunner',
        name: 'Snelheidsduivel',
        description: 'Voltooi een level in minder dan 30 seconden',
        icon: '⚡',
        reward: { sollyCoin: 75 }
      }
    };
  }

  // Get current chapter
  getCurrentChapter() {
    return this.currentChapter;
  }

  // Get current level
  getCurrentLevel() {
    return this.currentLevel;
  }

  // Get chapter info
  getChapterInfo(chapterNumber) {
    return this.chapters[chapterNumber] || null;
  }

  // Get level info
  getLevelInfo(levelNumber) {
    // Level info would be defined here
    return {
      id: levelNumber,
      name: `Level ${levelNumber}`,
      description: `Level ${levelNumber} uitdaging`,
      requiredKaboom: levelNumber * 5,
      rewards: {
        sollyCoin: levelNumber * 10,
        experience: levelNumber * 5
      }
    };
  }

  // Check if chapter is unlocked
  isChapterUnlocked(chapterNumber) {
    return this.unlockedChapters.has(chapterNumber);
  }

  // Check if level is unlocked
  isLevelUnlocked(levelNumber) {
    return this.unlockedLevels.has(levelNumber);
  }

  // Unlock chapter
  unlockChapter(chapterNumber) {
    if (!this.unlockedChapters.has(chapterNumber)) {
      this.unlockedChapters.add(chapterNumber);
      this.debugLog(`🔓 Chapter ${chapterNumber} unlocked`);
      
      // Trigger event
      this.triggerEvent('chapterUnlocked', {
        chapter: chapterNumber,
        info: this.getChapterInfo(chapterNumber)
      });
      
      this.saveProgress();
    }
  }

  // Unlock level
  unlockLevel(levelNumber) {
    if (!this.unlockedLevels.has(levelNumber)) {
      this.unlockedLevels.add(levelNumber);
      this.debugLog(`🔓 Level ${levelNumber} unlocked`);
      
      // Trigger event
      this.triggerEvent('levelUnlocked', {
        level: levelNumber,
        info: this.getLevelInfo(levelNumber)
      });
      
      this.saveProgress();
    }
  }

  // Complete level
  completeLevel(levelNumber, score = 0) {
    this.debugLog(`✅ Level ${levelNumber} completed with score ${score}`);
    
    // Unlock next level
    const nextLevel = levelNumber + 1;
    this.unlockLevel(nextLevel);
    
    // Check for chapter completion
    this.checkChapterCompletion();
    
    // Trigger event
    this.triggerEvent('levelCompleted', {
      level: levelNumber,
      score: score,
      nextLevel: nextLevel
    });
    
    this.saveProgress();
  }

  // Check chapter completion
  checkChapterCompletion() {
    if (!this.chapters) {
      this.debugLog('⚠️ Chapters not initialized yet, skipping completion check');
      return;
    }
    
    Object.keys(this.chapters).forEach(chapterNumber => {
      const chapter = this.chapters[chapterNumber];
      const allLevelsUnlocked = chapter.levels.every(level => 
        this.unlockedLevels.has(level)
      );
      
      if (allLevelsUnlocked && !this.unlockedChapters.has(parseInt(chapterNumber))) {
        this.unlockChapter(parseInt(chapterNumber));
      }
    });
  }

  // Award achievement
  awardAchievement(achievementId) {
    if (this.achievements.has(achievementId)) {
      return; // Already awarded
    }
    
    const achievement = this.achievementDefinitions[achievementId];
    if (!achievement) {
      this.debugLog(`❌ Achievement ${achievementId} not found`);
      return;
    }
    
    this.achievements.set(achievementId, {
      ...achievement,
      awardedAt: Date.now()
    });
    
    this.debugLog(`🏆 Achievement awarded: ${achievement.name}`);
    
    // Trigger event
    this.triggerEvent('achievementAwarded', {
      achievement: achievement,
      reward: achievement.reward
    });
    
    this.saveProgress();
  }

  // Check for achievements
  checkAchievements(gameState) {
    // First kaboom
    if (gameState.kaboomCount >= 1 && !this.achievements.has('firstKaboom')) {
      this.awardAchievement('firstKaboom');
    }
    
    // Ten kabooms
    if (gameState.kaboomCount >= 10 && !this.achievements.has('tenKabooms')) {
      this.awardAchievement('tenKabooms');
    }
    
    // First chapter
    if (this.unlockedChapters.size >= 2 && !this.achievements.has('firstChapter')) {
      this.awardAchievement('firstChapter');
    }
    
    // Shape collector (if shapes are tracked)
    if (gameState.shapesTried && gameState.shapesTried.length >= 4 && !this.achievements.has('shapeCollector')) {
      this.awardAchievement('shapeCollector');
    }
  }

  // Get progress percentage
  getProgressPercentage() {
    const totalLevels = Object.values(this.chapters).reduce((sum, chapter) => 
      sum + chapter.levels.length, 0
    );
    const completedLevels = this.unlockedLevels.size;
    
    return Math.round((completedLevels / totalLevels) * 100);
  }

  // Get unlocked achievements
  getUnlockedAchievements() {
    return Array.from(this.achievements.values());
  }

  // Get all achievements
  getAllAchievements() {
    return Object.values(this.achievementDefinitions);
  }

  // Get achievement progress
  getAchievementProgress() {
    const total = Object.keys(this.achievementDefinitions).length;
    const unlocked = this.achievements.size;
    
    return {
      unlocked: unlocked,
      total: total,
      percentage: Math.round((unlocked / total) * 100)
    };
  }

  // Update story progress
  updateStoryProgress(progress) {
    this.storyProgress = Math.max(this.storyProgress, progress);
    this.debugLog(`📖 Story progress updated: ${progress}`);
    
    this.saveProgress();
  }

  // Get story progress
  getStoryProgress() {
    return this.storyProgress;
  }

  // Event system
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event, callback) {
    if (this.eventListeners[event]) {
      const index = this.eventListeners[event].indexOf(callback);
      if (index > -1) {
        this.eventListeners[event].splice(index, 1);
      }
    }
  }

  triggerEvent(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.debugLog('❌ Event callback error:', error);
        }
      });
    }
  }

  // Save progress to localStorage
  saveProgress() {
    try {
      const progress = {
        currentChapter: this.currentChapter,
        currentLevel: this.currentLevel,
        unlockedChapters: Array.from(this.unlockedChapters),
        unlockedLevels: Array.from(this.unlockedLevels),
        achievements: Array.from(this.achievements.entries()),
        storyProgress: this.storyProgress,
        timestamp: Date.now()
      };
      
      localStorage.setItem('sollycoin_chapter_progress', JSON.stringify(progress));
      this.debugLog('💾 Chapter progress saved');
    } catch (error) {
      this.debugLog('❌ Failed to save chapter progress:', error);
    }
  }

  // Load progress from localStorage
  loadProgress() {
    try {
      const saved = localStorage.getItem('sollycoin_chapter_progress');
      if (!saved) {
        this.debugLog('📂 No saved chapter progress found');
        return false;
      }
      
      const progress = JSON.parse(saved);
      
      this.currentChapter = progress.currentChapter || 1;
      this.currentLevel = progress.currentLevel || 1;
      this.unlockedChapters = new Set(progress.unlockedChapters || [1]);
      this.unlockedLevels = new Set(progress.unlockedLevels || [1]);
      this.achievements = new Map(progress.achievements || []);
      this.storyProgress = progress.storyProgress || 0;
      
      this.debugLog('📂 Chapter progress loaded');
      return true;
    } catch (error) {
      this.debugLog('❌ Failed to load chapter progress:', error);
      return false;
    }
  }

  // Reset progress
  resetProgress() {
    this.debugLog('🔄 Resetting chapter progress...');
    
    this.currentChapter = 1;
    this.currentLevel = 1;
    this.unlockedChapters = new Set([1]);
    this.unlockedLevels = new Set([1]);
    this.achievements.clear();
    this.storyProgress = 0;
    
    localStorage.removeItem('sollycoin_chapter_progress');
    
    this.debugLog('✅ Chapter progress reset');
  }

  // Get status
  getStatus() {
    return {
      currentChapter: this.currentChapter,
      currentLevel: this.currentLevel,
      unlockedChapters: Array.from(this.unlockedChapters),
      unlockedLevels: Array.from(this.unlockedLevels),
      achievements: this.getAchievementProgress(),
      storyProgress: this.storyProgress,
      totalProgress: this.getProgressPercentage()
    };
  }

  // Cleanup
  cleanup() {
    this.debugLog('🧹 Cleaning up ChapterManager...');
    this.eventListeners = {};
  }
}

// Maak ChapterManager globaal beschikbaar
window.ChapterManager = ChapterManager;

// Export voor gebruik in andere modules
/* eslint-disable no-undef */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChapterManager;
}
/* eslint-enable no-undef */ 