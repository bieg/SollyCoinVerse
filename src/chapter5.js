// ===================================================================================
// ==                           CHAPTER 5: THE VOID WALK                            ==
// ==                                                                                ==
// ==      Voice-controlled navigation through darkness                             ==
// ==      "step", "big step", "small step", "left", "right", "echo"               ==
// ==      Echo = sonar pulse that reveals map when hitting edges                   ==
// ==      Steps cause brief de-blur to show position                               ==
// ==      Ctrl+7 = Start Chapter 5                                                 ==
// ===================================================================================
/* global THREE */

class Chapter5 {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.isActive = false;
    this.recognition = null;

    // Grid settings - clearer map
    this.gridSize = 8; // 8x8 grid for clearer visibility
    this.cellSize = 60; // Larger cells
    this.grid = []; // 2D array: true = safe, false = black hole

    // Player position (grid coordinates)
    this.playerPos = { x: 0, y: 0 };
    this.playerDirection = 0; // 0 = up, 90 = right, 180 = down, 270 = left

    // Goal position
    this.goalPos = { x: 0, y: 0 };

    // Visual elements
    this.playerMesh = null;
    this.goalMesh = null;
    this.blackHoleMeshes = [];
    this.gridGroup = null;
    this.sonarRing = null;

    // UI elements
    this.overlay = null;
    this.blurOverlay = null;

    // Game state
    this.mapVisible = true;
    this.previewDuration = 4000; // 4 seconds to memorize
    this.isBlurred = false;

    // Audio
    this.audioContext = null;

    // Voice commands - NL + EN
    this.commands = {
      links: () => this.moveDirection('left'),
      left: () => this.moveDirection('left'),
      rechts: () => this.moveDirection('right'),
      right: () => this.moveDirection('right'),
      omhoog: () => this.moveDirection('up'),
      up: () => this.moveDirection('up'),
      omlaag: () => this.moveDirection('down'),
      down: () => this.moveDirection('down'),
      stap: () => this.move(1),
      step: () => this.move(1),
      spring: () => this.move(2),
      jump: () => this.move(2),
    };

    this.DEBUG = true;
  }

  debugLog(...args) {
    if (this.DEBUG) {
      console.log('[Chapter5]', ...args);
    }
  }

  // ==================== INITIALIZATION ====================

  init() {
    this.debugLog('🌑 Initializing Chapter 5: The Void Walk...');
    this.isActive = true;

    // FIRST: Disable ALL other chapters and levels
    this.disableAllLevels();

    // Hide all existing scene objects (sun, planets, etc)
    this.hideSceneObjects();

    // Set dark background
    this.originalBackground = this.scene.background;
    this.scene.background = new THREE.Color(0x0a0a0f);

    // Disable OrbitControls
    if (window.controls) {
      window.controls.enabled = false;
      window.controls.enableRotate = false;
      window.controls.enableZoom = false;
      window.controls.enablePan = false;
      window.controls.dispose();
      this.debugLog('🎮 OrbitControls disabled');
    }

    // Generate the map
    this.generateMap();

    // Create visual elements
    this.createVisuals();

    // Create UI with blur overlay
    this.createUI();

    // Setup voice recognition
    this.setupVoiceRecognition();

    // Show map preview, then blur
    this.showMapPreview();

    this.debugLog('✅ Chapter 5 initialized!');
  }

  hideSceneObjects() {
    this.debugLog('🙈 Hiding existing scene objects...');
    this.hiddenObjects = [];

    // Hide all children except our grid group
    this.scene.children.forEach((obj) => {
      if (obj.name !== 'chapter5-grid' && obj.visible) {
        obj.visible = false;
        this.hiddenObjects.push(obj);
      }
    });

    this.debugLog(`  ↳ Hidden ${this.hiddenObjects.length} objects`);
  }

  showSceneObjects() {
    if (this.hiddenObjects) {
      this.hiddenObjects.forEach((obj) => {
        obj.visible = true;
      });
      this.debugLog(`👁️ Restored ${this.hiddenObjects.length} scene objects`);
    }
  }

  disableAllLevels() {
    this.debugLog('🛑 Disabling all active levels...');

    // All possible active levels/chapters
    const levels = ['chapter2', 'chapter3', 'chapter4', 'redTakeover', 'gameEnding', 'gameIntro'];

    levels.forEach((level) => {
      if (window[level] && window[level].isActive) {
        if (typeof window[level].cleanup === 'function') {
          window[level].cleanup();
        }
        window[level].isActive = false;
        this.debugLog(`  ↳ ${level} disabled`);
      }
    });

    // Disable level2Active flag (used by main.js)
    if (window.level2Active) {
      window.level2Active = false;
      this.debugLog('  ↳ level2Active flag disabled');
    }

    // Remove any UI overlays from other levels
    const selectors = [
      '.chapter-overlay',
      '.chapter-ui',
      '.game-ui',
      '#chapter2-ui',
      '#chapter3-ui',
      '#chapter4-ui',
      '#red-takeover-ui',
      '#game-ending-overlay',
      '#game-intro-screen',
      '#level2-indicator',
      '#wireframe-counter',
      '#wireframe-instructions',
      '.level-ui',
      '#kaboom-counter',
    ];
    document.querySelectorAll(selectors.join(', ')).forEach((el) => {
      el.style.display = 'none';
      this.debugLog(`  ↳ Hidden UI: ${el.id || el.className}`);
    });

    this.debugLog('✅ All levels disabled');
  }

  // ==================== MAP GENERATION ====================

  generateMap() {
    this.debugLog('🗺️ Generating clear map...');

    // Initialize grid with all safe cells
    this.grid = [];
    for (let y = 0; y < this.gridSize; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.gridSize; x++) {
        this.grid[y][x] = true; // safe by default
      }
    }

    // Set start position (bottom-left)
    this.playerPos = { x: 1, y: 1 };

    // Set goal position (top-right)
    this.goalPos = { x: this.gridSize - 2, y: this.gridSize - 2 };

    // Create a clear winding path
    this.createWindingPath();

    // Add black holes (not on the path)
    this.addBlackHoles(10);

    this.debugLog('  ↳ Start:', this.playerPos);
    this.debugLog('  ↳ Goal:', this.goalPos);
  }

  createWindingPath() {
    // Create a memorable winding path
    const path = [
      // Start area
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      // Go up
      { x: 3, y: 2 },
      { x: 3, y: 3 },
      // Go right
      { x: 4, y: 3 },
      { x: 5, y: 3 },
      // Go up
      { x: 5, y: 4 },
      { x: 5, y: 5 },
      // Go left a bit
      { x: 4, y: 5 },
      // Go up to goal
      { x: 4, y: 6 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
    ];

    // Mark path cells
    path.forEach((p) => {
      if (p.x >= 0 && p.x < this.gridSize && p.y >= 0 && p.y < this.gridSize) {
        this.grid[p.y][p.x] = 'path';
      }
    });

    this.debugLog('  ↳ Winding path created');
  }

  addBlackHoles(count) {
    let added = 0;
    let attempts = 0;
    const maxAttempts = 500;

    while (added < count && attempts < maxAttempts) {
      attempts++;
      const x = Math.floor(Math.random() * this.gridSize);
      const y = Math.floor(Math.random() * this.gridSize);

      // Don't place on path, start, goal, or edges
      if (
        this.grid[y][x] === true &&
        x > 0 &&
        y > 0 &&
        x < this.gridSize - 1 &&
        y < this.gridSize - 1
      ) {
        this.grid[y][x] = false; // black hole
        added++;
      }
    }

    // Convert 'path' markers back to true (safe)
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.grid[y][x] === 'path') {
          this.grid[y][x] = true;
        }
      }
    }

    this.debugLog(`  ↳ Added ${added} black holes`);
  }

  // ==================== VISUALS ====================

  createVisuals() {
    this.gridGroup = new THREE.Group();
    this.gridGroup.name = 'chapter5-grid';

    const offsetX = -(this.gridSize * this.cellSize) / 2;
    const offsetY = -(this.gridSize * this.cellSize) / 2;

    // Create grid cells with clear visuals
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const isBlackHole = !this.grid[y][x];
        const isStart = x === this.playerPos.x && y === this.playerPos.y;
        const isGoal = x === this.goalPos.x && y === this.goalPos.y;

        // Cell background
        const cellGeom = new THREE.PlaneGeometry(this.cellSize - 4, this.cellSize - 4);
        let cellColor = 0x1a2a3a; // dark blue-grey for safe
        if (isBlackHole) cellColor = 0x000000; // pure black for holes
        if (isStart) cellColor = 0x00aa44; // green for start
        if (isGoal) cellColor = 0xffaa00; // orange/gold for goal

        const cellMat = new THREE.MeshBasicMaterial({
          color: cellColor,
          transparent: true,
          opacity: isBlackHole ? 1 : 0.6,
        });
        const cell = new THREE.Mesh(cellGeom, cellMat);
        cell.position.set(
          offsetX + x * this.cellSize + this.cellSize / 2,
          offsetY + y * this.cellSize + this.cellSize / 2,
          0,
        );
        this.gridGroup.add(cell);

        // Add danger ring around black holes
        if (isBlackHole) {
          const ringGeom = new THREE.RingGeometry(this.cellSize * 0.35, this.cellSize * 0.45, 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
          });
          const ring = new THREE.Mesh(ringGeom, ringMat);
          ring.position.set(
            offsetX + x * this.cellSize + this.cellSize / 2,
            offsetY + y * this.cellSize + this.cellSize / 2,
            0.1,
          );
          this.blackHoleMeshes.push(ring);
          this.gridGroup.add(ring);
        }

        // Add markers for start and goal
        if (isStart) {
          const marker = this.createMarker(0x00ff66, 'S');
          marker.position.set(
            offsetX + x * this.cellSize + this.cellSize / 2,
            offsetY + y * this.cellSize + this.cellSize / 2,
            0.2,
          );
          this.gridGroup.add(marker);
        }

        if (isGoal) {
          const marker = this.createMarker(0xffd700, '★');
          marker.position.set(
            offsetX + x * this.cellSize + this.cellSize / 2,
            offsetY + y * this.cellSize + this.cellSize / 2,
            0.2,
          );
          this.goalMesh = marker;
          this.gridGroup.add(marker);
        }
      }
    }

    // Grid lines for clarity
    const gridLinesMat = new THREE.LineBasicMaterial({
      color: 0x334455,
      transparent: true,
      opacity: 0.5,
    });
    for (let i = 0; i <= this.gridSize; i++) {
      // Horizontal lines
      const hGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(offsetX, offsetY + i * this.cellSize, 0.05),
        new THREE.Vector3(
          offsetX + this.gridSize * this.cellSize,
          offsetY + i * this.cellSize,
          0.05,
        ),
      ]);
      this.gridGroup.add(new THREE.Line(hGeom, gridLinesMat));

      // Vertical lines
      const vGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(offsetX + i * this.cellSize, offsetY, 0.05),
        new THREE.Vector3(
          offsetX + i * this.cellSize,
          offsetY + this.gridSize * this.cellSize,
          0.05,
        ),
      ]);
      this.gridGroup.add(new THREE.Line(vGeom, gridLinesMat));
    }

    // Create player marble
    const playerGeom = new THREE.SphereGeometry(12, 32, 32);
    const playerMat = new THREE.MeshBasicMaterial({
      color: 0x4ecdc4,
      transparent: false,
    });
    this.playerMesh = new THREE.Mesh(playerGeom, playerMat);

    // Add glow to player
    const glowGeom = new THREE.SphereGeometry(18, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x4ecdc4,
      transparent: true,
      opacity: 0.3,
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    this.playerMesh.add(glow);

    this.updatePlayerPosition();
    this.gridGroup.add(this.playerMesh);

    // Create sonar ring (hidden initially)
    const sonarGeom = new THREE.RingGeometry(1, 5, 64);
    const sonarMat = new THREE.MeshBasicMaterial({
      color: 0x4ecdc4,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    this.sonarRing = new THREE.Mesh(sonarGeom, sonarMat);
    this.sonarRing.position.z = 0.5;
    this.gridGroup.add(this.sonarRing);

    // Add to scene
    this.scene.add(this.gridGroup);

    // Position camera
    this.camera.position.set(0, 0, 450);
    this.camera.lookAt(0, 0, 0);
  }

  createMarker(color, _text) {
    const group = new THREE.Group();

    // Circle background
    const circleGeom = new THREE.CircleGeometry(15, 32);
    const circleMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const circle = new THREE.Mesh(circleGeom, circleMat);
    group.add(circle);

    return group;
  }

  updatePlayerPosition() {
    const offsetX = -(this.gridSize * this.cellSize) / 2;
    const offsetY = -(this.gridSize * this.cellSize) / 2;

    this.playerMesh.position.set(
      offsetX + this.playerPos.x * this.cellSize + this.cellSize / 2,
      offsetY + this.playerPos.y * this.cellSize + this.cellSize / 2,
      20,
    );
  }

  // ==================== UI ====================

  createUI() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'chapter5-overlay';
    this.overlay.innerHTML = `
      <style>
        #chapter5-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 10000;
        }

        /* TV Static background */
        #chapter5-static {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        /* Scanlines UNDER video */
        #chapter5-scanlines-under {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15) 0px,
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 3px
          );
          z-index: 2;
          pointer-events: none;
        }

        /* Video container */
        #chapter5-video-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80%;
          max-width: 900px;
          z-index: 3;
          overflow: hidden;
        }

        #chapter5-video {
          width: 100%;
          display: block;
        }

        /* Watermark cover - rechtsonder */
        #chapter5-watermark-cover {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 150px;
          height: 50px;
          background: linear-gradient(135deg, transparent 30%, rgba(0,0,0,0.9) 70%);
          z-index: 4;
        }

        /* Scanlines OVER video */
        #chapter5-scanlines-over {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.1) 0px,
            rgba(0, 0, 0, 0.1) 1px,
            transparent 1px,
            transparent 2px
          );
          z-index: 5;
          pointer-events: none;
        }

        /* Tuning frequency overlay */
        #chapter5-frequency {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.03) 50%,
            transparent 100%
          );
          animation: frequencySweep 3s ease-in-out infinite;
          z-index: 6;
          pointer-events: none;
        }

        @keyframes frequencySweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Flicker effect */
        #chapter5-flicker {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
          animation: tvFlicker 0.1s infinite;
          z-index: 7;
          pointer-events: none;
        }

        @keyframes tvFlicker {
          0% { opacity: 0; }
          5% { opacity: 0.02; background: white; }
          10% { opacity: 0; }
          95% { opacity: 0; }
          100% { opacity: 0.01; background: white; }
        }

        #chapter5-blur {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          opacity: 0;
          transition: opacity 1.5s ease-in-out;
          z-index: 10;
        }

        #chapter5-blur.active {
          opacity: 1;
        }

        #chapter5-blur.peek {
          opacity: 0.3;
          transition: opacity 0.2s ease-out;
        }

        #chapter5-status {
          position: absolute;
          top: 30px;
          left: 50%;
          transform: translateX(-50%);
          color: #ffd700;
          font-family: 'Open Sans', sans-serif;
          font-size: 1.8em;
          font-weight: 600;
          text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
          z-index: 20;
        }

        #chapter5-hint {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255, 255, 255, 0.6);
          font-family: 'Open Sans', sans-serif;
          font-size: 1em;
          font-weight: 300;
          text-align: center;
          z-index: 20;
        }

        #chapter5-voice-feedback {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #4ECDC4;
          font-family: 'Open Sans', sans-serif;
          font-size: 2.5em;
          font-weight: 700;
          opacity: 0;
          transition: opacity 0.3s;
          text-shadow: 0 0 30px rgba(78, 205, 196, 0.8);
          z-index: 20;
        }

        #chapter5-voice-feedback.show {
          opacity: 1;
        }

        #chapter5-countdown {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: rgba(255, 255, 255, 0.3);
          font-family: 'Open Sans', sans-serif;
          font-size: 8em;
          font-weight: 100;
          z-index: 20;
        }
      </style>

      <!-- TV Static background -->
      <canvas id="chapter5-static"></canvas>

      <!-- Scanlines under video -->
      <div id="chapter5-scanlines-under"></div>

      <!-- Video with watermark cover -->
      <div id="chapter5-video-container">
        <video id="chapter5-video" autoplay loop muted playsinline>
          <source src="video/the_idea.mp4" type="video/mp4">
        </video>
        <div id="chapter5-watermark-cover"></div>
      </div>

      <!-- Scanlines over video -->
      <div id="chapter5-scanlines-over"></div>

      <!-- Frequency sweep -->
      <div id="chapter5-frequency"></div>

      <!-- Flicker -->
      <div id="chapter5-flicker"></div>

      <!-- Game UI -->
      <div id="chapter5-blur"></div>
      <div id="chapter5-status">🗺️ Memorize the path...</div>
      <div id="chapter5-countdown"></div>
      <div id="chapter5-hint">links • rechts • omhoog • omlaag • stap • spring</div>
      <div id="chapter5-voice-feedback"></div>
    `;
    document.body.appendChild(this.overlay);
    this.blurOverlay = document.getElementById('chapter5-blur');

    // Start TV static animation
    this.startTVStatic();
  }

  // TV Static noise effect
  startTVStatic() {
    const canvas = document.getElementById('chapter5-static');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const renderStatic = () => {
      if (!this.isActive) return;

      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 255;
        data[i] = noise; // R
        data[i + 1] = noise; // G
        data[i + 2] = noise; // B
        data[i + 3] = 40; // A - semi-transparent
      }

      ctx.putImageData(imageData, 0, 0);
      requestAnimationFrame(renderStatic);
    };

    renderStatic();
  }

  // ==================== MAP PREVIEW ====================

  showMapPreview() {
    this.debugLog('👁️ Showing map preview...');
    this.mapVisible = true;

    // const status = document.getElementById('chapter5-status');
    const countdown = document.getElementById('chapter5-countdown');

    // Countdown
    let secondsLeft = this.previewDuration / 1000;
    countdown.textContent = secondsLeft;

    const countdownInterval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft > 0) {
        countdown.textContent = secondsLeft;
      } else {
        countdown.textContent = '';
        clearInterval(countdownInterval);
      }
    }, 1000);

    // After preview, blur the screen
    setTimeout(() => {
      this.activateBlur();
    }, this.previewDuration);
  }

  activateBlur() {
    this.debugLog('🌑 Activating blur...');
    this.mapVisible = false;
    this.isBlurred = true;

    if (this.blurOverlay) {
      this.blurOverlay.classList.add('active');
    }

    const status = document.getElementById('chapter5-status');
    if (status) status.textContent = '🎤 Navigate by voice...';

    // Start voice recognition
    setTimeout(() => {
      this.startVoiceRecognition();
    }, 1500);
  }

  // Brief de-blur when stepping (to see where you landed)
  peekMap(duration = 500) {
    if (!this.isBlurred) return;

    this.blurOverlay.classList.remove('active');
    this.blurOverlay.classList.add('peek');

    setTimeout(() => {
      this.blurOverlay.classList.remove('peek');
      this.blurOverlay.classList.add('active');
    }, duration);
  }

  // ==================== ECHO / SONAR ====================

  doEcho() {
    this.debugLog('🦇 Echo sonar pulse!');
    this.playSound('echo');

    // Get player position in world coords
    const offsetX = -(this.gridSize * this.cellSize) / 2;
    const offsetY = -(this.gridSize * this.cellSize) / 2;
    const playerWorldX = offsetX + this.playerPos.x * this.cellSize + this.cellSize / 2;
    const playerWorldY = offsetY + this.playerPos.y * this.cellSize + this.cellSize / 2;

    // Position sonar at player
    this.sonarRing.position.x = playerWorldX;
    this.sonarRing.position.y = playerWorldY;
    this.sonarRing.scale.set(1, 1, 1);
    this.sonarRing.material.opacity = 0.8;

    // Animate the sonar ring expanding
    const maxScale = 80;
    const duration = 1500;
    const startTime = Date.now();

    const animateSonar = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);

      const scale = 1 + maxScale * eased;
      this.sonarRing.scale.set(scale, scale, 1);
      this.sonarRing.material.opacity = 0.8 * (1 - progress);

      // When sonar reaches edge, reveal map briefly
      if (progress > 0.7 && !this.sonarRevealed) {
        this.sonarRevealed = true;
        this.revealMapSonar();
      }

      if (progress < 1) {
        requestAnimationFrame(animateSonar);
      } else {
        this.sonarRing.material.opacity = 0;
        this.sonarRevealed = false;
      }
    };

    animateSonar();
  }

  revealMapSonar() {
    this.debugLog('📡 Sonar hit edges - revealing map!');

    // Flash reveal the map
    if (this.blurOverlay) {
      this.blurOverlay.classList.remove('active');

      // Quick flash then back to blur
      setTimeout(() => {
        this.blurOverlay.classList.add('active');
      }, 800);
    }
  }

  // ==================== VOICE RECOGNITION ====================

  setupVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.debugLog('⚠️ Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => this.handleVoiceResult(event);
    this.recognition.onerror = (e) => this.debugLog('⚠️ Voice error:', e.error);
    this.recognition.onend = () => {
      if (this.isActive && this.isBlurred) {
        try {
          this.recognition.start();
        } catch (e) {
          /* ignore */
        }
      }
    };
  }

  startVoiceRecognition() {
    if (this.recognition) {
      try {
        this.recognition.start();
        this.debugLog('🎤 Voice recognition started');
      } catch (e) {
        this.debugLog('⚠️ Could not start voice recognition:', e);
      }
    }
  }

  handleVoiceResult(event) {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (!event.results[i].isFinal) continue; // Only act on final results

      const transcript = event.results[i][0].transcript.toLowerCase().trim();
      this.debugLog('🎤 Heard:', transcript);

      // Show voice feedback
      this.showVoiceFeedback(transcript);

      // Check for commands (longest match first)
      const sortedCommands = Object.keys(this.commands).sort((a, b) => b.length - a.length);

      for (const command of sortedCommands) {
        if (transcript.includes(command)) {
          this.debugLog(`✅ Command: "${command}"`);
          this.commands[command]();
          return;
        }
      }
    }
  }

  showVoiceFeedback(text) {
    const feedback = document.getElementById('chapter5-voice-feedback');
    if (feedback) {
      feedback.textContent = `"${text}"`;
      feedback.classList.add('show');
      setTimeout(() => feedback.classList.remove('show'), 1000);
    }
  }

  // ==================== MOVEMENT ====================

  moveDirection(direction, distance = 1) {
    if (this.mapVisible) return;

    let dx = 0,
      dy = 0;
    switch (direction) {
      case 'left':
        dx = -distance;
        break;
      case 'right':
        dx = distance;
        break;
      case 'up':
        dy = distance;
        break;
      case 'down':
        dy = -distance;
        break;
    }

    const newX = this.playerPos.x + dx;
    const newY = this.playerPos.y + dy;

    this.debugLog(
      `🚶 Moving ${direction}: (${this.playerPos.x.toFixed(1)}, ${this.playerPos.y.toFixed(1)}) → (${newX.toFixed(1)}, ${newY.toFixed(1)})`,
    );

    // Check bounds
    if (newX < 0 || newX >= this.gridSize || newY < 0 || newY >= this.gridSize) {
      this.playSound('edge');
      this.showVoiceFeedback('⚠️ Rand!');
      return;
    }

    // Check for black hole
    const gridX = Math.floor(newX + 0.5);
    const gridY = Math.floor(newY + 0.5);

    if (!this.grid[gridY] || !this.grid[gridY][gridX]) {
      this.fallIntoVoid();
      return;
    }

    // Move is safe
    this.playerPos.x = newX;
    this.playerPos.y = newY;
    this.updatePlayerPosition();
    this.playSound('step');
    this.peekMap(400);

    // Check goal
    if (gridX === this.goalPos.x && gridY === this.goalPos.y) {
      this.reachGoal();
    }
  }

  move(distance) {
    if (this.mapVisible) return;

    // Calculate direction vector
    const rad = this.playerDirection * (Math.PI / 180);
    const dx = Math.sin(rad) * distance;
    const dy = Math.cos(rad) * distance;

    const newX = this.playerPos.x + dx;
    const newY = this.playerPos.y + dy;

    this.debugLog(
      `🚶 Moving ${distance}: (${this.playerPos.x.toFixed(1)}, ${this.playerPos.y.toFixed(1)}) → (${newX.toFixed(1)}, ${newY.toFixed(1)})`,
    );

    // Check bounds
    if (newX < 0 || newX >= this.gridSize || newY < 0 || newY >= this.gridSize) {
      this.playSound('edge');
      this.showVoiceFeedback('⚠️ Edge!');
      this.debugLog('⚠️ Edge of map!');
      return;
    }

    // Check for black hole at new position
    const gridX = Math.floor(newX + 0.5);
    const gridY = Math.floor(newY + 0.5);

    if (!this.grid[gridY] || !this.grid[gridY][gridX]) {
      this.fallIntoVoid();
      return;
    }

    // Move is safe - animate and peek
    this.playerPos.x = newX;
    this.playerPos.y = newY;
    this.updatePlayerPosition();
    this.playSound('step');

    // Brief de-blur to see where you landed
    this.peekMap(400);

    // Check for goal
    if (gridX === this.goalPos.x && gridY === this.goalPos.y) {
      this.reachGoal();
    }
  }

  turn(degrees) {
    this.playerDirection = (this.playerDirection + degrees + 360) % 360;

    const directions = { 0: '↑ North', 90: '→ East', 180: '↓ South', 270: '← West' };
    const dir = directions[this.playerDirection] || this.playerDirection + '°';

    this.debugLog(`🔄 Facing: ${dir}`);
    this.showVoiceFeedback(`Facing ${dir}`);
    this.playSound('turn');
  }

  // ==================== GAME EVENTS ====================

  fallIntoVoid() {
    this.debugLog('💀 Fell into the void!');
    this.playSound('fall');

    const status = document.getElementById('chapter5-status');
    if (status) status.textContent = '💀 You fell into the void!';

    // Show the map briefly so player sees where they fell
    if (this.blurOverlay) {
      this.blurOverlay.classList.remove('active');
    }

    // Reset after delay
    setTimeout(() => {
      this.resetPlayer();
    }, 2500);
  }

  resetPlayer() {
    this.playerPos = { x: 1, y: 1 };
    this.playerDirection = 0;
    this.updatePlayerPosition();

    // Re-blur
    if (this.blurOverlay) {
      this.blurOverlay.classList.add('active');
    }

    const status = document.getElementById('chapter5-status');
    if (status) status.textContent = '🔄 Try again...';

    this.debugLog('🔄 Player reset to start');
  }

  reachGoal() {
    this.debugLog('🎉 Reached the goal!');
    this.playSound('victory');

    const status = document.getElementById('chapter5-status');
    if (status) status.textContent = '✨ You found the portal! ✨';

    // Remove blur
    if (this.blurOverlay) {
      this.blurOverlay.classList.remove('active');
    }

    // Celebration effect
    this.showVoiceFeedback('🎉 VICTORY! 🎉');
  }

  // ==================== AUDIO ====================

  playSound(type) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    switch (type) {
      case 'step':
        oscillator.type = 'sine';
        oscillator.frequency.value = 220;
        gainNode.gain.value = 0.15;
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
        break;

      case 'turn':
        oscillator.type = 'sine';
        oscillator.frequency.value = 440;
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.08);
        break;

      case 'edge':
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 100;
        gainNode.gain.value = 0.2;
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
        break;

      case 'fall':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 1.5);
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.5);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1.5);
        break;

      case 'echo':
        // Sonar ping
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.8);
        break;

      case 'victory': {
        // Fanfare
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          osc.connect(gain);
          gain.connect(this.audioContext.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.value = 0.15;
          osc.start(this.audioContext.currentTime + i * 0.15);
          osc.stop(this.audioContext.currentTime + i * 0.15 + 0.3);
        });
        return; // Skip the default oscillator
      }
    }
  }

  // ==================== CLEANUP ====================

  cleanup() {
    this.debugLog('🧹 Cleaning up Chapter 5...');
    this.isActive = false;
    this.isBlurred = false;

    // Stop voice recognition
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        /* ignore */
      }
    }

    // Remove visuals
    if (this.gridGroup) {
      this.scene.remove(this.gridGroup);
    }

    // Remove UI
    if (this.overlay) {
      this.overlay.remove();
    }

    // Restore scene objects
    this.showSceneObjects();

    // Restore original background
    if (this.originalBackground) {
      this.scene.background = this.originalBackground;
    }

    this.debugLog('✅ Chapter 5 cleaned up');
  }
}

// Make available globally
window.Chapter5 = Chapter5;

// Initialize function for Ctrl+7
window.initChapter5 = function () {
  if (!window.scene || !window.camera || !window.renderer) {
    console.error('❌ Scene/Camera/Renderer not available for Chapter 5');
    return;
  }

  if (window.chapter5 && window.chapter5.isActive) {
    console.log('⚠️ Chapter 5 already active');
    return;
  }

  window.chapter5 = new Chapter5(window.scene, window.camera, window.renderer);
  window.chapter5.init();
};

console.log('🌑 Chapter5.js loaded - Press Ctrl+7 for The Void Walk!');
