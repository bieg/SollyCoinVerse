// ===================================================================================
// ==                        CHAPTER & LEVEL PRICES CONFIG                       ==
// ==                                                                             ==
// ==      Centraal configuratiebestand voor alle coin prijzen:                  ==
// ==      - Hoofdstuk unlock prijzen                                            ==
// ==      - Level skip prijzen                                                  ==
// ==      - Makkelijk aanpasbaar zonder code changes                            ==
// ===================================================================================

/**
 * Chapter unlock prices in SollyCoins
 * Key = chapter number, Value = price in SollyCoins
 */
const CHAPTER_UNLOCK_PRICES = {
  1: 1,    // Hoofdstuk 1: 1 SollyCoin
  2: 1,    // Hoofdstuk 2: 1 SollyCoin
  3: 4,    // Hoofdstuk 3: 4 SollyCoins
  4: 6,    // Hoofdstuk 4: 6 SollyCoins
  5: 10,   // Hoofdstuk 5: 10 SollyCoins (future expansion)
  6: 15,   // Hoofdstuk 6: 15 SollyCoins (future expansion)
};

/**
 * Level skip price (same for all chapters)
 * Des te hoger, des te meer je betaalt voor convenience
 */
const LEVEL_SKIP_PRICE = 2; // 2 SollyCoins per level skip

/**
 * Progress boost prices (optional multipliers)
 * Voor toekomstige features zoals snellere progress, extra hints, etc.
 */
const PROGRESS_BOOST_PRICES = {
  hint: 1,           // 1 SollyCoin voor een hint
  doubleSpeed: 5,    // 5 SollyCoins voor 2x snelheid (1 uur)
  skipPuzzle: 3,     // 3 SollyCoins om een puzzel over te slaan
};

/**
 * Check if player can afford chapter unlock
 * @param {number} chapter - Chapter number
 * @param {number} playerBalance - Player's SollyCoin balance
 * @returns {boolean} - True if player can afford
 */
function canAffordChapter(chapter, playerBalance) {
  const price = CHAPTER_UNLOCK_PRICES[chapter];
  if (price === undefined) {
    console.warn(`⚠️ Chapter ${chapter} has no defined price`);
    return false;
  }
  return playerBalance >= price;
}

/**
 * Check if player can afford level skip
 * @param {number} playerBalance - Player's SollyCoin balance
 * @returns {boolean} - True if player can afford
 */
function canAffordLevelSkip(playerBalance) {
  return playerBalance >= LEVEL_SKIP_PRICE;
}

/**
 * Get chapter unlock price
 * @param {number} chapter - Chapter number
 * @returns {number} - Price in SollyCoins
 */
function getChapterPrice(chapter) {
  return CHAPTER_UNLOCK_PRICES[chapter] || 0;
}

/**
 * Get all chapter prices (for UI display)
 * @returns {Object} - All chapter prices
 */
function getAllChapterPrices() {
  return { ...CHAPTER_UNLOCK_PRICES };
}

/**
 * Get level skip price
 * @returns {number} - Price in SollyCoins
 */
function getLevelSkipPrice() {
  return LEVEL_SKIP_PRICE;
}

/**
 * Get progress boost price
 * @param {string} boostType - Type of boost (hint, doubleSpeed, skipPuzzle)
 * @returns {number} - Price in SollyCoins
 */
function getBoostPrice(boostType) {
  return PROGRESS_BOOST_PRICES[boostType] || 0;
}

// Export for module systems (if using modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CHAPTER_UNLOCK_PRICES,
    LEVEL_SKIP_PRICE,
    PROGRESS_BOOST_PRICES,
    canAffordChapter,
    canAffordLevelSkip,
    getChapterPrice,
    getAllChapterPrices,
    getLevelSkipPrice,
    getBoostPrice,
  };
}

// Export for browser (global window object)
if (typeof window !== 'undefined') {
  window.ChapterPrices = {
    CHAPTER_UNLOCK_PRICES,
    LEVEL_SKIP_PRICE,
    PROGRESS_BOOST_PRICES,
    canAffordChapter,
    canAffordLevelSkip,
    getChapterPrice,
    getAllChapterPrices,
    getLevelSkipPrice,
    getBoostPrice,
  };
}

