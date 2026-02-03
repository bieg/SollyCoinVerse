// @ts-nocheck
/* eslint-env browser */
/* global THREE, TWEEN */
// ===================================================================================
// ==                     CHAPTER 4: DE MEESTER - MARBLE LABYRINTH                  ==
// ==                                                                                 ==
// ==      Tilt-maze puzzelgame - Kantel het bord om de knikker te navigeren         ==
// ==      - Physics-based marble movement                                            ==
// ==      - Muren, gaten (black holes), en finish portal                            ==
// ==      - Keyboard/Mouse/Touch controls voor board tilting                        ==
// ==      - Neon cyber aesthetic (consistent met Chapter 3)                          ==
// ===================================================================================

(function () {
  'use strict';

  window.initChapter4 = initChapter4;

  // ============================================================
  // 🔧 CONFIGURATIE
  // ============================================================
  const CONFIG = {
    boardSize: 500,
    boardPadding: 40,
    marbleRadius: 12,
    maxTilt: 15, // Maximum tilt angle in degrees
    tiltSpeed: 0.5,
    gravity: 0.3,
    friction: 0.98,
    bounceEnergy: 0.6,
    holeRadius: 18,
    wallThickness: 8,
    finishRadius: 25,
  };

  // Game state
  let gameActive = false;
  let gameWon = false;
  let gameLost = false;
  let currentLevel = 1;
  let attempts = 0;

  // Physics state
  let marbleX = 0;
  let marbleY = 0;
  let marbleVX = 0;
  let marbleVY = 0;
  let boardTiltX = 0; // Forward/backward tilt
  let boardTiltY = 0; // Left/right tilt

  // DOM elements
  let container = null;
  let board = null;
  let marble = null;
  let uiPanel = null;

  // Level definitions
  const LEVELS = [
    {
      // Level 1 - Easy introduction
      name: 'De Eerste Stap',
      startX: 50,
      startY: 50,
      finishX: 450,
      finishY: 450,
      walls: [
        { x: 150, y: 0, w: CONFIG.wallThickness, h: 200 },
        { x: 250, y: 150, w: CONFIG.wallThickness, h: 250 },
        { x: 350, y: 100, w: CONFIG.wallThickness, h: 200 },
      ],
      holes: [
        { x: 200, y: 300 },
        { x: 300, y: 200 },
      ],
    },
    {
      // Level 2 - More complex
      name: 'Het Doolhof',
      startX: 50,
      startY: 250,
      finishX: 450,
      finishY: 250,
      walls: [
        { x: 100, y: 0, w: CONFIG.wallThickness, h: 180 },
        { x: 100, y: 220, w: CONFIG.wallThickness, h: 280 },
        { x: 200, y: 100, w: CONFIG.wallThickness, h: 300 },
        { x: 300, y: 0, w: CONFIG.wallThickness, h: 250 },
        { x: 300, y: 300, w: CONFIG.wallThickness, h: 200 },
        { x: 400, y: 150, w: CONFIG.wallThickness, h: 200 },
      ],
      holes: [
        { x: 150, y: 350 },
        { x: 250, y: 150 },
        { x: 350, y: 400 },
        { x: 350, y: 100 },
      ],
    },
    {
      // Level 3 - Master level
      name: 'De Meester',
      startX: 50,
      startY: 50,
      finishX: 450,
      finishY: 450,
      walls: [
        // Outer maze
        { x: 80, y: 80, w: 340, h: CONFIG.wallThickness },
        { x: 80, y: 80, w: CONFIG.wallThickness, h: 340 },
        { x: 80, y: 420, w: 260, h: CONFIG.wallThickness },
        { x: 420, y: 160, w: CONFIG.wallThickness, h: 260 },
        // Inner obstacles
        { x: 160, y: 160, w: CONFIG.wallThickness, h: 180 },
        { x: 240, y: 80, w: CONFIG.wallThickness, h: 180 },
        { x: 320, y: 200, w: CONFIG.wallThickness, h: 180 },
        { x: 160, y: 340, w: 180, h: CONFIG.wallThickness },
        { x: 240, y: 260, w: 100, h: CONFIG.wallThickness },
      ],
      holes: [
        { x: 120, y: 200 },
        { x: 200, y: 120 },
        { x: 280, y: 320 },
        { x: 360, y: 280 },
        { x: 200, y: 400 },
        { x: 380, y: 120 },
      ],
    },
  ];

  // ============================================================
  // ⭐ INITIALIZATION
  // ============================================================
  function initChapter4() {
    console.log('🎮 Chapter 4 gestart - De Meester: Marble Labyrinth');

    // Reset state
    gameActive = false;
    gameWon = false;
    gameLost = false;
    attempts = 0;

    // Update chapter state in ChapterManager
    if (window.chapterManager) {
      window.chapterManager.setCurrentChapter(4);
      console.log('📚 Chapter 4 active in ChapterManager');
    }

    // Cleanup previous chapters
    cleanupPreviousChapters();

    // Build UI
    createUI();
    createBoard();
    setupControls();

    // Start level 1
    loadLevel(1);

    console.log('✅ Chapter 4 volledig geïnitialiseerd');
  }

  function cleanupPreviousChapters() {
    console.log('🛑 Chapter 4: Disabling all other levels...');

    // Disable all other levels via cleanup
    const levels = ['chapter2', 'chapter3', 'chapter5', 'redTakeover', 'gameEnding', 'gameIntro'];
    levels.forEach((level) => {
      if (window[level] && window[level].isActive) {
        if (typeof window[level].cleanup === 'function') {
          window[level].cleanup();
        }
        window[level].isActive = false;
        console.log(`  ↳ ${level} disabled`);
      }
    });

    // Reset flags
    window.level2Active = false;
    window.level3Active = false;

    // Remove chapter 2 UI
    const ch2UI = document.getElementById('chapter2-ui-panel');
    if (ch2UI) ch2UI.remove();
    const ch2Cube = document.getElementById('isometric-cube-container');
    if (ch2Cube) ch2Cube.remove();
    const ch2Shapes = document.getElementById('shape-choices-holder');
    if (ch2Shapes) ch2Shapes.remove();

    // Remove chapter 3 UI
    const ch3ElementIds = [
      'chapter3-terminal',
      'cyber-terminal',
      'cyber-terminal-styles',
      'hangman-container',
      'firewall-container',
    ];
    ch3ElementIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });

    // Ook alle elementen met cyber-terminal class verwijderen
    document.querySelectorAll('[id*="cyber"], [id*="terminal"], [id*="hangman"]').forEach((el) => {
      el.remove();
    });

    // Hide other level UIs
    const selectors = [
      '#chapter5-overlay',
      '#red-takeover-ui',
      '#game-ending-overlay',
      '#game-intro-screen',
    ];
    document.querySelectorAll(selectors.join(', ')).forEach((el) => {
      el.style.display = 'none';
    });

    // Remove chapter 1 elements
    const cta = document.getElementById('cta-buttons');
    if (cta) cta.remove();
    const walletBtn = document.getElementById('wallet-hub-btn');
    if (walletBtn) walletBtn.remove();
    const kaboomEl = document.getElementById('kaboom-counter');
    if (kaboomEl) kaboomEl.style.display = 'none';

    // Remove any previous chapter 4 elements
    const oldContainer = document.getElementById('chapter4-container');
    if (oldContainer) oldContainer.remove();
    const oldUI = document.getElementById('chapter4-ui-panel');
    if (oldUI) oldUI.remove();

    // Disable orbit controls
    if (window.controls) {
      window.controls.enabled = false;
    }

    // Set flag
    window.level4Active = true;
    window.level2Active = false;
  }

  // ============================================================
  // 🎨 UI CREATION
  // ============================================================
  function createUI() {
    uiPanel = document.createElement('div');
    uiPanel.id = 'chapter4-ui-panel';
    uiPanel.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      padding: 20px;
      background: linear-gradient(135deg, #00ff88, #00aa55);
      color: #000;
      border-radius: 15px;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
      display: flex;
      flex-direction: column;
      gap: 15px;
      border: 3px solid #00ff88;
      width: 200px;
      text-shadow: 0 0 5px rgba(0, 255, 136, 0.5);
    `;

    const levelIndicator = document.createElement('div');
    levelIndicator.id = 'level-indicator';
    levelIndicator.style.cssText = `font-size: 18px; padding-bottom: 10px;`;
    levelIndicator.innerHTML = '🏆 CHAPTER 4:<br><span style="font-size: 14px;">De Meester</span>';

    const sublevelIndicator = document.createElement('div');
    sublevelIndicator.id = 'sublevel-indicator';
    sublevelIndicator.style.cssText = `font-size: 14px; padding-bottom: 10px;`;
    sublevelIndicator.innerHTML = '<strong>Level:</strong> 1/3';

    const instructions = document.createElement('div');
    instructions.style.cssText = `font-size: 12px; line-height: 1.4; padding-bottom: 10px;`;
    instructions.innerHTML = `
      <strong>Controls:</strong><br>
      🖱️ Muis: Beweeg om te kantelen<br>
      ⌨️ Pijltjes: WASD/Arrows<br>
      📱 Touch: Sleep om te kantelen
    `;

    const attemptsCounter = document.createElement('div');
    attemptsCounter.id = 'attempts-counter';
    attemptsCounter.style.cssText = `font-size: 14px;`;
    attemptsCounter.innerHTML = '<strong>Pogingen:</strong> 0';

    const statusText = document.createElement('div');
    statusText.id = 'game-status';
    statusText.style.cssText = `
      font-size: 14px;
      padding: 10px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      text-align: center;
    `;
    statusText.innerHTML = '🎮 Navigeer naar de portal!';

    const restartBtn = document.createElement('button');
    restartBtn.id = 'restart-btn';
    restartBtn.textContent = '🔄 Herstart Level';
    restartBtn.style.cssText = `
      padding: 10px;
      background: #000;
      color: #00ff88;
      border: 2px solid #00ff88;
      border-radius: 8px;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      transition: all 0.2s;
    `;
    restartBtn.addEventListener('click', () => loadLevel(currentLevel));
    restartBtn.addEventListener('mouseenter', () => {
      restartBtn.style.background = '#00ff88';
      restartBtn.style.color = '#000';
    });
    restartBtn.addEventListener('mouseleave', () => {
      restartBtn.style.background = '#000';
      restartBtn.style.color = '#00ff88';
    });

    uiPanel.appendChild(levelIndicator);
    uiPanel.appendChild(sublevelIndicator);
    uiPanel.appendChild(instructions);
    uiPanel.appendChild(attemptsCounter);
    uiPanel.appendChild(statusText);
    uiPanel.appendChild(restartBtn);
    document.body.appendChild(uiPanel);
  }

  // ============================================================
  // 🎯 GAME BOARD CREATION
  // ============================================================
  function createBoard() {
    container = document.createElement('div');
    container.id = 'chapter4-container';
    container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      perspective: 1000px;
      z-index: 9000;
    `;

    board = document.createElement('div');
    board.id = 'marble-board';
    board.style.cssText = `
      width: ${CONFIG.boardSize}px;
      height: ${CONFIG.boardSize}px;
      background: linear-gradient(145deg, #1a1a2e, #16213e);
      border: 4px solid #00ff88;
      border-radius: 10px;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 0.1s ease-out;
      box-shadow:
        0 0 50px rgba(0, 255, 136, 0.3),
        inset 0 0 100px rgba(0, 255, 136, 0.1);
    `;

    // Add grid lines for visual depth
    const gridOverlay = document.createElement('div');
    gridOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image:
        linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 136, 0.1) 1px, transparent 1px);
      background-size: 50px 50px;
      pointer-events: none;
      border-radius: 6px;
    `;
    board.appendChild(gridOverlay);

    container.appendChild(board);
    document.body.appendChild(container);
  }

  function loadLevel(levelNum) {
    currentLevel = levelNum;
    const level = LEVELS[levelNum - 1];

    if (!level) {
      showVictoryScreen();
      return;
    }

    // Reset physics
    marbleX = level.startX;
    marbleY = level.startY;
    marbleVX = 0;
    marbleVY = 0;
    boardTiltX = 0;
    boardTiltY = 0;

    // Reset game state
    gameWon = false;
    gameLost = false;
    gameActive = true;
    attempts++;

    // Clear board
    const existingElements = board.querySelectorAll('.wall, .hole, .finish, .marble');
    existingElements.forEach((el) => el.remove());

    // Update UI
    updateUI();

    // Create level elements
    createWalls(level.walls);
    createHoles(level.holes);
    createFinish(level.finishX, level.finishY);
    createMarble(level.startX, level.startY);

    // Start game loop
    requestAnimationFrame(gameLoop);

    console.log(`🎮 Level ${levelNum} geladen: ${level.name}`);
  }

  function createWalls(walls) {
    walls.forEach((wall, index) => {
      const wallEl = document.createElement('div');
      wallEl.className = 'wall';
      wallEl.style.cssText = `
        position: absolute;
        left: ${wall.x}px;
        top: ${wall.y}px;
        width: ${wall.w}px;
        height: ${wall.h}px;
        background: linear-gradient(135deg, #00ff88, #00aa55);
        border-radius: 2px;
        box-shadow:
          0 0 10px rgba(0, 255, 136, 0.5),
          inset 0 0 5px rgba(255, 255, 255, 0.3);
      `;
      wallEl.dataset.x = wall.x;
      wallEl.dataset.y = wall.y;
      wallEl.dataset.w = wall.w;
      wallEl.dataset.h = wall.h;
      board.appendChild(wallEl);
    });
  }

  function createHoles(holes) {
    holes.forEach((hole, index) => {
      const holeEl = document.createElement('div');
      holeEl.className = 'hole';
      holeEl.style.cssText = `
        position: absolute;
        left: ${hole.x - CONFIG.holeRadius}px;
        top: ${hole.y - CONFIG.holeRadius}px;
        width: ${CONFIG.holeRadius * 2}px;
        height: ${CONFIG.holeRadius * 2}px;
        background: radial-gradient(circle, #000 0%, #1a0033 50%, #330066 100%);
        border-radius: 50%;
        box-shadow:
          inset 0 0 20px #000,
          0 0 15px rgba(102, 0, 255, 0.5);
        animation: holePulse 2s ease-in-out infinite;
      `;
      holeEl.dataset.x = hole.x;
      holeEl.dataset.y = hole.y;
      board.appendChild(holeEl);
    });

    // Add hole animation keyframes if not exists
    if (!document.getElementById('chapter4-animations')) {
      const style = document.createElement('style');
      style.id = 'chapter4-animations';
      style.textContent = `
        @keyframes holePulse {
          0%, 100% { box-shadow: inset 0 0 20px #000, 0 0 15px rgba(102, 0, 255, 0.5); }
          50% { box-shadow: inset 0 0 30px #000, 0 0 25px rgba(102, 0, 255, 0.8); }
        }
        @keyframes finishGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5), inset 0 0 10px rgba(255, 215, 0, 0.3); }
          50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.8), inset 0 0 20px rgba(255, 215, 0, 0.5); }
        }
        @keyframes marbleShine {
          0% { background-position: -50px -50px; }
          100% { background-position: 50px 50px; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  function createFinish(x, y) {
    const finishEl = document.createElement('div');
    finishEl.className = 'finish';
    finishEl.style.cssText = `
      position: absolute;
      left: ${x - CONFIG.finishRadius}px;
      top: ${y - CONFIG.finishRadius}px;
      width: ${CONFIG.finishRadius * 2}px;
      height: ${CONFIG.finishRadius * 2}px;
      background: radial-gradient(circle, #ffd700 0%, #ff8c00 50%, #ff4500 100%);
      border-radius: 50%;
      animation: finishGlow 1.5s ease-in-out infinite;
    `;
    finishEl.dataset.x = x;
    finishEl.dataset.y = y;

    // Add portal icon
    const icon = document.createElement('div');
    icon.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 20px;
    `;
    icon.textContent = '🌀';
    finishEl.appendChild(icon);

    board.appendChild(finishEl);
  }

  function createMarble(x, y) {
    marble = document.createElement('div');
    marble.className = 'marble';
    marble.style.cssText = `
      position: absolute;
      left: ${x - CONFIG.marbleRadius}px;
      top: ${y - CONFIG.marbleRadius}px;
      width: ${CONFIG.marbleRadius * 2}px;
      height: ${CONFIG.marbleRadius * 2}px;
      background: radial-gradient(circle at 30% 30%, #ffffff, #00ff88 40%, #00aa55 70%, #005533);
      border-radius: 50%;
      box-shadow:
        2px 2px 5px rgba(0, 0, 0, 0.5),
        inset -2px -2px 5px rgba(0, 0, 0, 0.3),
        0 0 15px rgba(0, 255, 136, 0.5);
      z-index: 100;
      transition: box-shadow 0.2s;
    `;
    board.appendChild(marble);
  }

  // ============================================================
  // 🎮 CONTROLS
  // ============================================================
  function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Mouse controls
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Touch controls
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
  }

  const keysPressed = {};

  function handleKeyDown(e) {
    if (!gameActive) return;

    keysPressed[e.key] = true;

    // WASD and Arrow keys
    if (['w', 'W', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
    }
    if (['s', 'S', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
    }
    if (['a', 'A', 'ArrowLeft'].includes(e.key)) {
      e.preventDefault();
    }
    if (['d', 'D', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }

    // R to restart
    if (e.key === 'r' || e.key === 'R') {
      loadLevel(currentLevel);
    }
  }

  function handleKeyUp(e) {
    keysPressed[e.key] = false;
  }

  function handleMouseMove(e) {
    if (!gameActive) return;

    const rect = board.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate tilt based on mouse position relative to center
    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);

    boardTiltY = deltaX * CONFIG.maxTilt;
    boardTiltX = deltaY * CONFIG.maxTilt;
  }

  function handleMouseLeave() {
    // Gradually return to neutral
    boardTiltX *= 0.9;
    boardTiltY *= 0.9;
  }

  function handleTouchMove(e) {
    if (!gameActive) return;
    e.preventDefault();

    const touch = e.touches[0];
    const rect = board.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (touch.clientX - centerX) / (rect.width / 2);
    const deltaY = (touch.clientY - centerY) / (rect.height / 2);

    boardTiltY = deltaX * CONFIG.maxTilt;
    boardTiltX = deltaY * CONFIG.maxTilt;
  }

  function handleTouchEnd() {
    boardTiltX *= 0.5;
    boardTiltY *= 0.5;
  }

  // ============================================================
  // 🔄 GAME LOOP
  // ============================================================
  function gameLoop() {
    if (!gameActive) return;

    updateKeyboardTilt();
    updatePhysics();
    checkCollisions();
    render();

    requestAnimationFrame(gameLoop);
  }

  function updateKeyboardTilt() {
    const tiltAmount = CONFIG.tiltSpeed;

    if (keysPressed['w'] || keysPressed['W'] || keysPressed['ArrowUp']) {
      boardTiltX = Math.max(boardTiltX - tiltAmount, -CONFIG.maxTilt);
    }
    if (keysPressed['s'] || keysPressed['S'] || keysPressed['ArrowDown']) {
      boardTiltX = Math.min(boardTiltX + tiltAmount, CONFIG.maxTilt);
    }
    if (keysPressed['a'] || keysPressed['A'] || keysPressed['ArrowLeft']) {
      boardTiltY = Math.max(boardTiltY - tiltAmount, -CONFIG.maxTilt);
    }
    if (keysPressed['d'] || keysPressed['D'] || keysPressed['ArrowRight']) {
      boardTiltY = Math.min(boardTiltY + tiltAmount, CONFIG.maxTilt);
    }

    // Natural decay when no keys pressed
    if (
      !keysPressed['w'] &&
      !keysPressed['W'] &&
      !keysPressed['ArrowUp'] &&
      !keysPressed['s'] &&
      !keysPressed['S'] &&
      !keysPressed['ArrowDown']
    ) {
      boardTiltX *= 0.95;
    }
    if (
      !keysPressed['a'] &&
      !keysPressed['A'] &&
      !keysPressed['ArrowLeft'] &&
      !keysPressed['d'] &&
      !keysPressed['D'] &&
      !keysPressed['ArrowRight']
    ) {
      boardTiltY *= 0.95;
    }
  }

  function updatePhysics() {
    // Convert tilt to acceleration (gravity component)
    const gravityX = Math.sin((boardTiltY * Math.PI) / 180) * CONFIG.gravity;
    const gravityY = Math.sin((boardTiltX * Math.PI) / 180) * CONFIG.gravity;

    // Apply gravity to velocity
    marbleVX += gravityX;
    marbleVY += gravityY;

    // Apply friction
    marbleVX *= CONFIG.friction;
    marbleVY *= CONFIG.friction;

    // Update position
    marbleX += marbleVX;
    marbleY += marbleVY;

    // Boundary collision
    const minX = CONFIG.marbleRadius + CONFIG.boardPadding;
    const maxX = CONFIG.boardSize - CONFIG.marbleRadius - CONFIG.boardPadding;
    const minY = CONFIG.marbleRadius + CONFIG.boardPadding;
    const maxY = CONFIG.boardSize - CONFIG.marbleRadius - CONFIG.boardPadding;

    if (marbleX < minX) {
      marbleX = minX;
      marbleVX = -marbleVX * CONFIG.bounceEnergy;
    }
    if (marbleX > maxX) {
      marbleX = maxX;
      marbleVX = -marbleVX * CONFIG.bounceEnergy;
    }
    if (marbleY < minY) {
      marbleY = minY;
      marbleVY = -marbleVY * CONFIG.bounceEnergy;
    }
    if (marbleY > maxY) {
      marbleY = maxY;
      marbleVY = -marbleVY * CONFIG.bounceEnergy;
    }
  }

  function checkCollisions() {
    // Check wall collisions
    const walls = board.querySelectorAll('.wall');
    walls.forEach((wall) => {
      const wx = parseFloat(wall.dataset.x);
      const wy = parseFloat(wall.dataset.y);
      const ww = parseFloat(wall.dataset.w);
      const wh = parseFloat(wall.dataset.h);

      // Simple AABB collision with circle
      const closestX = Math.max(wx, Math.min(marbleX, wx + ww));
      const closestY = Math.max(wy, Math.min(marbleY, wy + wh));
      const distX = marbleX - closestX;
      const distY = marbleY - closestY;
      const dist = Math.sqrt(distX * distX + distY * distY);

      if (dist < CONFIG.marbleRadius) {
        // Push marble out
        const overlap = CONFIG.marbleRadius - dist;
        const nx = distX / dist || 0;
        const ny = distY / dist || 0;
        marbleX += nx * overlap;
        marbleY += ny * overlap;

        // Reflect velocity
        const dot = marbleVX * nx + marbleVY * ny;
        marbleVX = (marbleVX - 2 * dot * nx) * CONFIG.bounceEnergy;
        marbleVY = (marbleVY - 2 * dot * ny) * CONFIG.bounceEnergy;
      }
    });

    // Check hole collisions
    const holes = board.querySelectorAll('.hole');
    holes.forEach((hole) => {
      const hx = parseFloat(hole.dataset.x);
      const hy = parseFloat(hole.dataset.y);
      const dist = Math.sqrt((marbleX - hx) ** 2 + (marbleY - hy) ** 2);

      if (dist < CONFIG.holeRadius - 5) {
        // Fall into hole!
        gameOver(false);
      }
    });

    // Check finish collision
    const finish = board.querySelector('.finish');
    if (finish) {
      const fx = parseFloat(finish.dataset.x);
      const fy = parseFloat(finish.dataset.y);
      const dist = Math.sqrt((marbleX - fx) ** 2 + (marbleY - fy) ** 2);

      if (dist < CONFIG.finishRadius - 5) {
        // Level complete!
        gameOver(true);
      }
    }
  }

  function render() {
    // Update board tilt
    board.style.transform = `rotateX(${-boardTiltX}deg) rotateY(${boardTiltY}deg)`;

    // Update marble position
    if (marble) {
      marble.style.left = `${marbleX - CONFIG.marbleRadius}px`;
      marble.style.top = `${marbleY - CONFIG.marbleRadius}px`;
    }
  }

  // ============================================================
  // 🏁 GAME END
  // ============================================================
  function gameOver(won) {
    gameActive = false;

    if (won) {
      gameWon = true;
      console.log(`✅ Level ${currentLevel} voltooid!`);

      // Show success message
      showMessage('🎉 Level Complete!', '#00ff88');

      // Next level after delay
      setTimeout(() => {
        if (currentLevel < LEVELS.length) {
          loadLevel(currentLevel + 1);
        } else {
          showVictoryScreen();
        }
      }, 2000);
    } else {
      gameLost = true;
      console.log('💀 In een black hole gevallen!');

      // Show fail message
      showMessage('💀 Black Hole!', '#ff0066');

      // Animate marble falling
      if (marble) {
        marble.style.transition = 'all 0.5s ease-in';
        marble.style.transform = 'scale(0)';
        marble.style.opacity = '0';
      }

      // Restart after delay
      setTimeout(() => {
        loadLevel(currentLevel);
      }, 1500);
    }

    updateUI();
  }

  function showMessage(text, color) {
    const msg = document.createElement('div');
    msg.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 36px;
      font-weight: bold;
      color: ${color};
      text-shadow: 0 0 20px ${color};
      font-family: 'Courier New', monospace;
      z-index: 200;
      animation: messagePopup 0.5s ease-out;
    `;
    msg.textContent = text;
    board.appendChild(msg);

    // Add animation if not exists
    if (!document.getElementById('chapter4-message-anim')) {
      const style = document.createElement('style');
      style.id = 'chapter4-message-anim';
      style.textContent = `
        @keyframes messagePopup {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.2); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => msg.remove(), 1500);
  }

  function showVictoryScreen() {
    gameActive = false;

    const victoryOverlay = document.createElement('div');
    victoryOverlay.id = 'chapter4-victory';
    victoryOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: radial-gradient(circle, rgba(0, 255, 136, 0.2) 0%, rgba(0, 0, 0, 0.9) 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 20000;
      font-family: 'Courier New', monospace;
    `;

    const title = document.createElement('h1');
    title.style.cssText = `
      font-size: 48px;
      color: #00ff88;
      text-shadow: 0 0 30px #00ff88;
      margin-bottom: 20px;
    `;
    title.textContent = '🏆 DE MEESTER!';

    const subtitle = document.createElement('p');
    subtitle.style.cssText = `
      font-size: 24px;
      color: #fff;
      margin-bottom: 30px;
    `;
    subtitle.textContent = `Je hebt alle levels voltooid in ${attempts} pogingen!`;

    const rewardInfo = document.createElement('p');
    rewardInfo.style.cssText = `
      font-size: 18px;
      color: #ffd700;
      margin-bottom: 30px;
    `;
    rewardInfo.textContent = '🪙 +500 SollyCoin | ⭐ +250 XP';

    const continueBtn = document.createElement('button');
    continueBtn.textContent = '🚀 Terug naar Sollyverse';
    continueBtn.style.cssText = `
      padding: 15px 30px;
      font-size: 18px;
      background: #00ff88;
      color: #000;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      transition: all 0.3s;
    `;
    continueBtn.addEventListener('click', () => {
      victoryOverlay.remove();
      // Could trigger return to main menu or next chapter
      if (window.chapterManager) {
        window.chapterManager.completeLevel(20); // Chapter 4 final level
      }
    });
    continueBtn.addEventListener('mouseenter', () => {
      continueBtn.style.transform = 'scale(1.1)';
      continueBtn.style.boxShadow = '0 0 30px #00ff88';
    });
    continueBtn.addEventListener('mouseleave', () => {
      continueBtn.style.transform = 'scale(1)';
      continueBtn.style.boxShadow = 'none';
    });

    victoryOverlay.appendChild(title);
    victoryOverlay.appendChild(subtitle);
    victoryOverlay.appendChild(rewardInfo);
    victoryOverlay.appendChild(continueBtn);
    document.body.appendChild(victoryOverlay);

    console.log('🏆 Chapter 4 volledig voltooid!');
  }

  function updateUI() {
    const sublevel = document.getElementById('sublevel-indicator');
    if (sublevel) {
      sublevel.innerHTML = `<strong>Level:</strong> ${currentLevel}/${LEVELS.length}`;
    }

    const attemptsEl = document.getElementById('attempts-counter');
    if (attemptsEl) {
      attemptsEl.innerHTML = `<strong>Pogingen:</strong> ${attempts}`;
    }

    const status = document.getElementById('game-status');
    if (status) {
      if (gameWon) {
        status.innerHTML = '✅ Level complete!';
        status.style.color = '#00ff88';
      } else if (gameLost) {
        status.innerHTML = '💀 Oeps! Opnieuw...';
        status.style.color = '#ff0066';
      } else {
        status.innerHTML = '🎮 Navigeer naar de portal!';
        status.style.color = '#000';
      }
    }
  }

  // ============================================================
  // 🧹 CLEANUP
  // ============================================================
  function cleanup() {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);

    const container = document.getElementById('chapter4-container');
    if (container) container.remove();

    const ui = document.getElementById('chapter4-ui-panel');
    if (ui) ui.remove();

    const victory = document.getElementById('chapter4-victory');
    if (victory) victory.remove();

    gameActive = false;
  }

  // Export cleanup
  window.cleanupChapter4 = cleanup;
})();
