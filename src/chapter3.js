// @ts-nocheck
/* eslint-env browser */
/* global THREE */
// ===================================================================================
// ==                     CHAPTER 3: CYBER HANGMAN TERMINAL                        ==
// ==                                                                               ==
// ==      Neon Cyberpunk Hacking Game - Galgje maar dan CYBER                     ==
// ==      - Terminal aesthetic met glitch effects                                  ==
// ==      - 4 talen: Nederlands, Engels, Duits, Frans                             ==
// ==      - Firewall breach meter in plaats van galg                              ==
// ==      - Spider-Verse / Arcane inspired visuals                                ==
// ===================================================================================

(function () {
  'use strict';

  // Game state
  let currentWord = '';
  let guessedLetters = [];
  let wrongGuesses = 0;
  let maxWrongGuesses = 8;
  let currentLanguage = 'en';
  let gameOver = false;
  let gameWon = false;

  // Word lists per language
  const WORDS = {
    nl: [
      'BLOCKCHAIN',
      'CRYPTOGRAFIE',
      'ALGORITME',
      'NETWERK',
      'PROTOCOL',
      'FIREWALL',
      'ENCRYPTIE',
      'DATABASE',
      'TERMINAL',
      'QUANTUM',
      'MATRIX',
      'SYSTEEM',
      'HACKER',
      'VIRUS',
      'SERVER',
      'BINARY',
      'PIXEL',
      'CYBER',
      'DIGITAAL',
      'VIRTUEEL',
      'SOLLY',
      'UNIVERSUM',
      'PLANEET',
      'STER',
      'GALAXIE',
    ],
    en: [
      'BLOCKCHAIN',
      'CRYPTOGRAPHY',
      'ALGORITHM',
      'NETWORK',
      'PROTOCOL',
      'FIREWALL',
      'ENCRYPTION',
      'DATABASE',
      'TERMINAL',
      'QUANTUM',
      'MATRIX',
      'SYSTEM',
      'HACKER',
      'VIRUS',
      'SERVER',
      'BINARY',
      'PIXEL',
      'CYBER',
      'DIGITAL',
      'VIRTUAL',
      'SOLLY',
      'UNIVERSE',
      'PLANET',
      'STAR',
      'GALAXY',
    ],
    de: [
      'BLOCKCHAIN',
      'KRYPTOGRAFIE',
      'ALGORITHMUS',
      'NETZWERK',
      'PROTOKOLL',
      'FIREWALL',
      'VERSCHLUESSELUNG',
      'DATENBANK',
      'TERMINAL',
      'QUANTUM',
      'MATRIX',
      'SYSTEM',
      'HACKER',
      'VIRUS',
      'SERVER',
      'BINAER',
      'PIXEL',
      'CYBER',
      'DIGITAL',
      'VIRTUELL',
      'SOLLY',
      'UNIVERSUM',
      'PLANET',
      'STERN',
      'GALAXIE',
    ],
    fr: [
      'BLOCKCHAIN',
      'CRYPTOGRAPHIE',
      'ALGORITHME',
      'RESEAU',
      'PROTOCOLE',
      'PAREFEU',
      'CHIFFREMENT',
      'BASEDEDONNEES',
      'TERMINAL',
      'QUANTIQUE',
      'MATRICE',
      'SYSTEME',
      'PIRATE',
      'VIRUS',
      'SERVEUR',
      'BINAIRE',
      'PIXEL',
      'CYBER',
      'NUMERIQUE',
      'VIRTUEL',
      'SOLLY',
      'UNIVERS',
      'PLANETE',
      'ETOILE',
      'GALAXIE',
    ],
  };

  // Language display names
  const LANG_NAMES = {
    nl: 'Nederlands',
    en: 'English',
    de: 'Deutsch',
    fr: 'Français',
  };

  // ===================================================================================
  // ⭐ INITIALIZATION
  // ===================================================================================

  function initChapter3() {
    console.log('🖥️ Chapter 3: CYBER HANGMAN TERMINAL');

    // Mark chapter 3 as active
    window.level3Active = true;

    // Update chapter in ChapterManager
    if (window.chapterManager) {
      window.chapterManager.setCurrentChapter(3);
    }

    // Clear any previous elements
    clearPreviousChapter();

    // Create the terminal UI
    createTerminalUI();

    // Start new game
    startNewGame();

    console.log('✅ Cyber Hangman initialized');
  }

  // ===================================================================================
  // ⭐ CLEAR PREVIOUS CHAPTER
  // ===================================================================================

  function clearPreviousChapter() {
    // Remove any leftover elements from chapter 2
    const elementsToRemove = [
      'chapter2-ui-panel',
      'shape-choices-holder',
      'isometric-cube-container',
      'consume-styles',
      'scanlines-overlay',
      'consume-text',
      'singularity',
    ];

    elementsToRemove.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });

    // Clear Three.js scene objects (keep lights)
    if (window.scene) {
      const toRemove = [];
      window.scene.traverse((obj) => {
        if (!obj.isCamera && !obj.isLight && !obj.isScene) {
          toRemove.push(obj);
        }
      });
      toRemove.forEach((obj) => {
        if (obj.parent) obj.parent.remove(obj);
      });

      // Set dark background
      window.scene.background = new THREE.Color(0x0a0a0a);
    }
  }

  // ===================================================================================
  // ⭐ TERMINAL UI
  // ===================================================================================

  function createTerminalUI() {
    // Remove old terminal if exists
    const oldTerminal = document.getElementById('cyber-terminal');
    if (oldTerminal) oldTerminal.remove();

    // Inject CSS
    const style = document.createElement('style');
    style.id = 'cyber-terminal-styles';
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=VT323&family=Orbitron:wght@400;700&display=swap');
      
      @keyframes scanline {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100vh); }
      }
      
      @keyframes flicker {
        0%, 100% { opacity: 1; }
        92% { opacity: 1; }
        93% { opacity: 0.8; }
        94% { opacity: 1; }
        97% { opacity: 0.9; }
      }
      
      @keyframes glitchText {
        0%, 100% { text-shadow: -2px 0 #ff00ff, 2px 0 #00ffff; }
        25% { text-shadow: 2px 0 #ff00ff, -2px 0 #00ffff; }
        50% { text-shadow: -2px -2px #ff00ff, 2px 2px #00ffff; }
        75% { text-shadow: 2px -2px #ff00ff, -2px 2px #00ffff; }
      }
      
      @keyframes pulse {
        0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.5); }
        50% { box-shadow: 0 0 40px rgba(0, 255, 255, 0.8), 0 0 60px rgba(255, 0, 255, 0.4); }
      }
      
      @keyframes typewriter {
        from { width: 0; }
        to { width: 100%; }
      }
      
      #cyber-terminal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 580px;
        max-height: 90vh;
        background: linear-gradient(180deg, #0d0d0d 0%, #1a1a2e 100%);
        border: 3px solid #00ffff;
        border-radius: 10px;
        padding: 0;
        font-family: 'VT323', monospace;
        color: #00ffff;
        z-index: 10000;
        box-shadow: 
          0 0 30px rgba(0, 255, 255, 0.3),
          0 0 60px rgba(255, 0, 255, 0.2),
          inset 0 0 100px rgba(0, 0, 0, 0.5);
        animation: pulse 3s infinite, flicker 5s infinite;
        overflow: hidden;
      }
      
      #cyber-terminal::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: repeating-linear-gradient(
          0deg,
          rgba(0, 0, 0, 0.1) 0px,
          rgba(0, 0, 0, 0.1) 1px,
          transparent 1px,
          transparent 2px
        );
        pointer-events: none;
        z-index: 1;
      }
      
      .terminal-header {
        background: linear-gradient(90deg, #ff00ff, #00ffff);
        padding: 8px 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #00ffff;
      }
      
      .terminal-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 14px;
        font-weight: 700;
        color: #000;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      
      .terminal-dots {
        display: flex;
        gap: 6px;
      }
      
      .terminal-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid rgba(0,0,0,0.3);
      }
      
      .terminal-body {
        padding: 15px 20px;
        position: relative;
        z-index: 2;
      }
      
      .status-line {
        color: #00ff88;
        font-size: 15px;
        margin-bottom: 4px;
        letter-spacing: 1px;
        text-shadow: 0 0 8px #00ff88;
        font-weight: normal;
      }
      
      .breach-container {
        margin: 12px 0;
        padding: 10px;
        border: 2px solid #ff00ff;
        border-radius: 5px;
        background: rgba(255, 0, 255, 0.1);
      }
      
      .breach-label {
        font-size: 13px;
        color: #ff00ff;
        margin-bottom: 6px;
      }
      
      .breach-bar {
        height: 18px;
        background: #1a1a1a;
        border-radius: 3px;
        overflow: hidden;
        border: 1px solid #333;
      }
      
      .breach-fill {
        height: 100%;
        background: linear-gradient(90deg, #00ff00, #ffff00, #ff0000);
        transition: width 0.5s ease;
        box-shadow: 0 0 10px currentColor;
      }
      
      .word-display {
        font-size: 36px;
        letter-spacing: 12px;
        text-align: center;
        margin: 15px 0;
        color: #00ffff;
        text-shadow: 0 0 20px #00ffff, 0 0 40px #00ffff;
        font-family: 'Orbitron', sans-serif;
      }
      
      .keyboard-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 5px;
        margin: 12px 0;
      }
      
      .key-btn {
        width: 36px;
        height: 36px;
        border: 2px solid #00ffff;
        background: rgba(0, 255, 255, 0.1);
        color: #00ffff;
        font-family: 'Orbitron', sans-serif;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s ease;
      }
      
      .key-btn:hover:not(:disabled) {
        background: rgba(0, 255, 255, 0.3);
        transform: scale(1.1);
        box-shadow: 0 0 15px #00ffff;
      }
      
      .key-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      .key-btn.correct {
        background: rgba(0, 255, 0, 0.4);
        border-color: #00ff00;
        color: #00ff00;
      }
      
      .key-btn.wrong {
        background: rgba(255, 0, 0, 0.4);
        border-color: #ff0000;
        color: #ff0000;
      }
      
      .lang-selector {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #333;
      }
      
      .lang-btn {
        padding: 6px 12px;
        border: none;
        background: linear-gradient(135deg, #1a1a2e, #2d2d44);
        color: #888;
        font-family: 'Orbitron', sans-serif;
        font-size: 11px;
        font-weight: bold;
        cursor: pointer;
        border-radius: 3px;
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 1px;
        position: relative;
        overflow: hidden;
      }
      
      .lang-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s ease;
      }
      
      .lang-btn:hover::before {
        left: 100%;
      }
      
      .lang-btn:hover {
        color: #00ffff;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
        transform: translateY(-2px);
      }
      
      .lang-btn.active {
        background: linear-gradient(135deg, #00ffff, #ff00ff);
        color: #000;
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.5), 0 0 30px rgba(255, 0, 255, 0.3);
      }
      
      .game-message {
        text-align: center;
        font-size: 22px;
        margin: 12px 0;
        padding: 12px;
        border-radius: 8px;
        animation: glitchText 0.3s infinite;
      }
      
      .game-message.win {
        background: rgba(0, 255, 0, 0.2);
        border: 2px solid #00ff00;
        color: #00ff00;
      }
      
      .game-message.lose {
        background: rgba(255, 0, 0, 0.2);
        border: 2px solid #ff0000;
        color: #ff0000;
      }
      
      .new-game-btn {
        display: block;
        margin: 10px auto;
        padding: 10px 30px;
        background: linear-gradient(90deg, #ff00ff, #00ffff);
        border: none;
        color: #000;
        font-family: 'Orbitron', sans-serif;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        border-radius: 5px;
        transition: all 0.3s ease;
      }
      
      .new-game-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 0 30px rgba(255, 0, 255, 0.5);
      }
      
      .scanline {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 5px;
        background: rgba(0, 255, 255, 0.1);
        animation: scanline 3s linear infinite;
        pointer-events: none;
        z-index: 10;
      }
    `;
    document.head.appendChild(style);

    // Create terminal container
    const terminal = document.createElement('div');
    terminal.id = 'cyber-terminal';
    terminal.innerHTML = `
      <div class="scanline"></div>
      <div class="terminal-header">
        <span class="terminal-title">⚡ FIREWALL BREACH PROTOCOL v3.0</span>
        <div class="terminal-dots">
          <div class="terminal-dot" style="background: #ff5f56;"></div>
          <div class="terminal-dot" style="background: #ffbd2e;"></div>
          <div class="terminal-dot" style="background: #27ca40;"></div>
        </div>
      </div>
      <div class="terminal-body">
        <div class="status-line">> INITIATING DECRYPTION SEQUENCE...</div>
        <div class="status-line">> TARGET WORD DETECTED</div>
        
        <div class="breach-container">
          <div class="breach-label">🔓 FIREWALL INTEGRITY: <span id="breach-percent">100%</span></div>
          <div class="breach-bar">
            <div class="breach-fill" id="breach-fill" style="width: 100%;"></div>
          </div>
        </div>
        
        <div class="word-display" id="word-display">_ _ _ _ _</div>
        
        <div id="game-status"></div>
        
        <div class="keyboard-container" id="keyboard"></div>
        
        <div class="lang-selector">
          <button class="lang-btn" data-lang="nl">🇳🇱 NL</button>
          <button class="lang-btn active" data-lang="en">🇬🇧 EN</button>
          <button class="lang-btn" data-lang="de">🇩🇪 DE</button>
          <button class="lang-btn" data-lang="fr">🇫🇷 FR</button>
        </div>
      </div>
    `;

    document.body.appendChild(terminal);

    // Setup keyboard
    createKeyboard();

    // Setup language buttons
    setupLanguageButtons();
  }

  // ===================================================================================
  // ⭐ KEYBOARD
  // ===================================================================================

  function createKeyboard() {
    const keyboard = document.getElementById('keyboard');
    keyboard.innerHTML = '';

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    letters.forEach((letter) => {
      const btn = document.createElement('button');
      btn.className = 'key-btn';
      btn.textContent = letter;
      btn.dataset.letter = letter;
      btn.addEventListener('click', () => handleGuess(letter));
      keyboard.appendChild(btn);
    });
  }

  // ===================================================================================
  // ⭐ LANGUAGE SELECTION
  // ===================================================================================

  function setupLanguageButtons() {
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        langBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentLanguage = btn.dataset.lang;
        startNewGame();
      });
    });
  }

  // ===================================================================================
  // ⭐ GAME LOGIC
  // ===================================================================================

  function startNewGame() {
    // Reset state
    guessedLetters = [];
    wrongGuesses = 0;
    gameOver = false;
    gameWon = false;

    // Pick random word
    const wordList = WORDS[currentLanguage];
    currentWord = wordList[Math.floor(Math.random() * wordList.length)];

    console.log(`🎮 New game started - Language: ${currentLanguage}`);

    // Reset UI
    updateWordDisplay();
    updateBreachMeter();
    createKeyboard();

    // Clear game status
    const status = document.getElementById('game-status');
    if (status) status.innerHTML = '';
  }

  function handleGuess(letter) {
    if (gameOver || guessedLetters.includes(letter)) return;

    guessedLetters.push(letter);

    const btn = document.querySelector(`.key-btn[data-letter="${letter}"]`);

    if (currentWord.includes(letter)) {
      // Correct guess
      btn.classList.add('correct');
      playGlitchEffect('correct');
    } else {
      // Wrong guess
      btn.classList.add('wrong');
      wrongGuesses++;
      playGlitchEffect('wrong');
    }

    btn.disabled = true;

    updateWordDisplay();
    updateBreachMeter();
    checkGameEnd();
  }

  function updateWordDisplay() {
    const display = document.getElementById('word-display');
    const displayText = currentWord
      .split('')
      .map((letter) => (guessedLetters.includes(letter) ? letter : '_'))
      .join(' ');
    display.textContent = displayText;
  }

  function updateBreachMeter() {
    const fill = document.getElementById('breach-fill');
    const percent = document.getElementById('breach-percent');

    const integrity = Math.max(0, 100 - (wrongGuesses / maxWrongGuesses) * 100);
    fill.style.width = `${integrity}%`;
    percent.textContent = `${Math.round(integrity)}%`;

    // Change color based on integrity
    if (integrity > 60) {
      fill.style.background = 'linear-gradient(90deg, #00ff00, #00ff00)';
    } else if (integrity > 30) {
      fill.style.background = 'linear-gradient(90deg, #ffff00, #ff8800)';
    } else {
      fill.style.background = 'linear-gradient(90deg, #ff0000, #ff0000)';
    }
  }

  function checkGameEnd() {
    const wordGuessed = currentWord.split('').every((letter) => guessedLetters.includes(letter));

    if (wordGuessed) {
      gameWon = true;
      gameOver = true;
      showGameMessage('win');
    } else if (wrongGuesses >= maxWrongGuesses) {
      gameOver = true;
      showGameMessage('lose');
    }
  }

  function showGameMessage(type) {
    const status = document.getElementById('game-status');

    if (type === 'win') {
      status.innerHTML = `
        <div class="game-message win">
          🎉 ACCESS GRANTED 🎉<br>
          <span style="font-size: 18px;">FIREWALL BREACHED SUCCESSFULLY</span>
        </div>
        <button class="new-game-btn" onclick="window.restartCyberHangman()">🔄 HACK AGAIN</button>
      `;
      playGlitchEffect('win');
    } else {
      status.innerHTML = `
        <div class="game-message lose">
          💀 ACCESS DENIED 💀<br>
          <span style="font-size: 18px;">WORD WAS: ${currentWord}</span>
        </div>
        <button class="new-game-btn" onclick="window.restartCyberHangman()">🔄 TRY AGAIN</button>
      `;
      playGlitchEffect('lose');
    }
  }

  // ===================================================================================
  // ⭐ GLITCH EFFECTS
  // ===================================================================================

  function playGlitchEffect(type) {
    const terminal = document.getElementById('cyber-terminal');

    if (type === 'wrong') {
      // Screen shake
      terminal.style.animation = 'none';
      terminal.offsetHeight; // Trigger reflow
      terminal.style.animation = 'pulse 3s infinite, flicker 5s infinite';

      // Red flash
      const flash = document.createElement('div');
      flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(255, 0, 0, 0.3);
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 150);
    } else if (type === 'correct') {
      // Green flash
      const flash = document.createElement('div');
      flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 255, 0, 0.2);
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 150);
    } else if (type === 'win') {
      // Neon celebration
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const flash = document.createElement('div');
          flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: ${i % 2 === 0 ? 'rgba(0, 255, 255, 0.3)' : 'rgba(255, 0, 255, 0.3)'};
            z-index: 9999;
            pointer-events: none;
          `;
          document.body.appendChild(flash);
          setTimeout(() => flash.remove(), 100);
        }, i * 150);
      }
    } else if (type === 'lose') {
      // Glitch out
      terminal.style.filter = 'hue-rotate(180deg)';
      setTimeout(() => {
        terminal.style.filter = 'none';
      }, 500);
    }
  }

  // ===================================================================================
  // ⭐ KEYBOARD INPUT
  // ===================================================================================

  document.addEventListener('keydown', (e) => {
    if (!window.level3Active || gameOver) return;

    const letter = e.key.toUpperCase();
    if (/^[A-Z]$/.test(letter) && !guessedLetters.includes(letter)) {
      handleGuess(letter);
    }
  });

  // ===================================================================================
  // ⭐ GLOBAL FUNCTIONS
  // ===================================================================================

  window.initChapter3 = initChapter3;
  window.restartCyberHangman = startNewGame;
})();
