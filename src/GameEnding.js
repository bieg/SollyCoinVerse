// ===================================================================================
// ==                           GAME ENDING - THE CREATION                          ==
// ==                                                                                 ==
// ==      Multiverse Space Trip Finale:                                            ==
// ==      1. IMPLOSIE - Alles wordt naar één punt gezogen                          ==
// ==      2. MULTIVERSE TUNNEL - Wormhole met parallelle universums                ==
// ==      3. BIG BANG REBIRTH - Nieuwe ster explodeert                             ==
// ==      4. SATURNUS RING - Wallet address als orbiterende ring                   ==
// ==      5. ZOOM TO INFINITY - Je bent deel van het universum                     ==
// ===================================================================================
/* global THREE */

class GameEnding {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.isActive = false;
    this.phase = 0;
    this.phaseStartTime = 0;

    // Store original camera position
    this.originalCameraPos = camera.position.clone();
    this.originalCameraRot = camera.rotation.clone();

    // Implosion center
    this.implosionCenter = new THREE.Vector3(0, 0, 0);

    // Collected objects for implosion
    this.sceneObjects = [];

    // New star after big bang
    this.newStar = null;
    this.saturnRing = null;
    this.ringParticles = [];

    // Multiverse panels
    this.multiversePanels = [];

    // Wormhole tunnel
    this.tunnelRings = [];

    // Final galaxy of stars
    this.galaxyStars = [];

    // Player wallet address (or fallback name)
    this.playerIdentifier = this.getPlayerIdentifier();

    // Phase durations in ms
    this.phaseDurations = {
      0: 3000, // Implosion
      1: 8000, // Multiverse tunnel
      2: 5000, // Big bang rebirth
      3: 6000, // Saturn ring formation
      4: -1, // Infinite zoom (endless)
    };

    this.DEBUG = window.DEBUG || false;
  }

  debugLog(...args) {
    if (this.DEBUG) {
      console.log('[GameEnding]', ...args);
    }
  }

  // Get player identifier (wallet or name)
  getPlayerIdentifier() {
    // Try to get wallet address
    if (window.web3Manager && window.web3Manager.currentAccount) {
      const addr = window.web3Manager.currentAccount;
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }
    // Fallback to localStorage name or default
    return localStorage.getItem('playerName') || 'SOLLY MASTER';
  }

  // Start the ending sequence
  start() {
    if (this.isActive) return;

    this.debugLog('🌌 GAME ENDING SEQUENCE INITIATED');
    this.isActive = true;
    this.phase = 0;
    this.phaseStartTime = Date.now();

    // Collect all scene objects for implosion
    this.collectSceneObjects();

    // Create ending UI overlay
    this.createOverlay();

    // Start the animation loop
    this.animate();

    // Start phase 1: Implosion
    this.startImplosion();
  }

  // Collect objects to implode
  collectSceneObjects() {
    this.scene.traverse((obj) => {
      if (obj.isMesh && obj !== this.camera) {
        this.sceneObjects.push({
          mesh: obj,
          originalPos: obj.position.clone(),
          originalScale: obj.scale.clone(),
        });
      }
    });
    this.debugLog(`📦 Collected ${this.sceneObjects.length} objects for implosion`);
  }

  // Create visual overlay
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'game-ending-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10000;
      background: transparent;
      transition: background 2s ease;
    `;
    document.body.appendChild(this.overlay);
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 0: IMPLOSION - Everything gets sucked to one point
  // ═══════════════════════════════════════════════════════════════
  startImplosion() {
    this.debugLog('💫 PHASE 0: IMPLOSION');
    this.showPhaseText('EVERYTHING YOU BUILT...', 'rgba(255,255,255,0.9)');

    // Create implosion core
    const coreGeometry = new THREE.SphereGeometry(10, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
    });
    this.implosionCore = new THREE.Mesh(coreGeometry, coreMaterial);
    this.implosionCore.position.copy(this.implosionCenter);
    this.scene.add(this.implosionCore);

    // Audio cue (if available)
    this.playSound('implosion_buildup');
  }

  updateImplosion(progress) {
    // All objects move toward center
    this.sceneObjects.forEach((obj) => {
      if (!obj.mesh.parent) return;

      const targetPos = this.implosionCenter;
      obj.mesh.position.lerp(targetPos, progress * 0.05);
      obj.mesh.scale.multiplyScalar(0.98);

      // Fade out
      if (obj.mesh.material && obj.mesh.material.opacity !== undefined) {
        obj.mesh.material.transparent = true;
        obj.mesh.material.opacity = Math.max(0, 1 - progress);
      }
    });

    // Core grows and brightens
    if (this.implosionCore) {
      this.implosionCore.scale.setScalar(1 + progress * 50);
      this.implosionCore.material.opacity = progress;
    }

    // Camera shake builds
    const shake = progress * 30;
    this.camera.position.x = this.originalCameraPos.x + (Math.random() - 0.5) * shake;
    this.camera.position.y = this.originalCameraPos.y + (Math.random() - 0.5) * shake;

    // Overlay darkens
    if (this.overlay) {
      this.overlay.style.background = `rgba(0,0,0,${progress * 0.8})`;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 1: MULTIVERSE TUNNEL - Wormhole with parallel universes
  // ═══════════════════════════════════════════════════════════════
  startMultiverseTunnel() {
    this.debugLog('🌀 PHASE 1: MULTIVERSE TUNNEL');
    this.showPhaseText('THROUGH THE MULTIVERSE...', 'rgba(150,50,255,0.9)');

    // Clear scene for tunnel
    this.sceneObjects.forEach((obj) => {
      if (obj.mesh.parent) this.scene.remove(obj.mesh);
    });
    if (this.implosionCore) this.scene.remove(this.implosionCore);

    // Create tunnel rings
    for (let i = 0; i < 50; i++) {
      const ringGeometry = new THREE.TorusGeometry(200 + i * 30, 5, 8, 64);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(i / 50, 1, 0.5),
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.z = -i * 200;
      ring.rotation.x = Math.PI / 2;
      this.scene.add(ring);
      this.tunnelRings.push(ring);
    }

    // Create multiverse panels (glimpses of other realities)
    this.createMultiversePanels();

    // Reset camera
    this.camera.position.set(0, 0, 500);
    this.camera.rotation.set(0, 0, 0);

    // Add chromatic aberration effect
    this.addChromaticAberration();
  }

  createMultiversePanels() {
    const panelTexts = [
      'UNIVERSE-α: SOLLY WON',
      'UNIVERSE-β: SOLLY LOST',
      'UNIVERSE-γ: SOLLY NEVER EXISTED',
      'UNIVERSE-δ: YOU ARE SOLLY',
      'UNIVERSE-ε: EVERYTHING IS SOLLY',
      'UNIVERSE-∞: THIS ONE',
    ];

    panelTexts.forEach((text, i) => {
      const panel = document.createElement('div');
      panel.className = 'multiverse-panel';
      panel.style.cssText = `
        position: fixed;
        padding: 20px 40px;
        background: rgba(0,0,0,0.8);
        border: 3px solid hsl(${(i / panelTexts.length) * 360}, 100%, 50%);
        color: white;
        font-family: 'Courier New', monospace;
        font-size: 18px;
        opacity: 0;
        transform: perspective(500px) rotateY(${-30 + i * 10}deg);
        z-index: 10001;
        pointer-events: none;
        box-shadow: 0 0 30px hsl(${(i / panelTexts.length) * 360}, 100%, 50%);
      `;
      panel.textContent = text;

      // Random position
      panel.style.left = `${10 + Math.random() * 60}%`;
      panel.style.top = `${10 + Math.random() * 60}%`;

      document.body.appendChild(panel);
      this.multiversePanels.push({
        element: panel,
        showAt: 0.1 + (i / panelTexts.length) * 0.7,
        hideAt: 0.2 + (i / panelTexts.length) * 0.7,
      });
    });
  }

  addChromaticAberration() {
    // CSS-based chromatic aberration
    this.chromaticStyle = document.createElement('style');
    this.chromaticStyle.textContent = `
      @keyframes chromatic-shift {
        0% { filter: none; }
        25% { filter: drop-shadow(-3px 0 0 rgba(255,0,0,0.5)) drop-shadow(3px 0 0 rgba(0,255,255,0.5)); }
        50% { filter: drop-shadow(-5px 0 0 rgba(255,0,0,0.7)) drop-shadow(5px 0 0 rgba(0,255,255,0.7)); }
        75% { filter: drop-shadow(-3px 0 0 rgba(255,0,0,0.5)) drop-shadow(3px 0 0 rgba(0,255,255,0.5)); }
        100% { filter: none; }
      }
      #game-ending-overlay {
        animation: chromatic-shift 0.1s infinite;
      }
    `;
    document.head.appendChild(this.chromaticStyle);
  }

  updateMultiverseTunnel(progress) {
    // Move through tunnel
    this.camera.position.z = 500 - progress * 10000;

    // Rotate tunnel rings
    this.tunnelRings.forEach((ring, i) => {
      ring.rotation.z += 0.02 + i * 0.001;
      ring.material.opacity = 0.3 + Math.sin(progress * 10 + i) * 0.3;
    });

    // Show/hide multiverse panels
    this.multiversePanels.forEach((panel) => {
      if (progress >= panel.showAt && progress < panel.hideAt) {
        panel.element.style.opacity = '1';
        panel.element.style.transform = `
          perspective(500px)
          rotateY(${Math.sin(progress * 20) * 20}deg)
          translateZ(${Math.sin(progress * 10) * 50}px)
        `;
      } else {
        panel.element.style.opacity = '0';
      }
    });

    // Glitch effect
    if (Math.random() < 0.1) {
      this.overlay.style.background = `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},0.3)`;
      setTimeout(() => {
        this.overlay.style.background = 'rgba(0,0,0,0.5)';
      }, 50);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2: BIG BANG REBIRTH - New star explodes outward
  // ═══════════════════════════════════════════════════════════════
  startBigBangRebirth() {
    this.debugLog('💥 PHASE 2: BIG BANG REBIRTH');
    this.showPhaseText('A NEW CREATION...', 'rgba(255,200,50,0.9)');

    // Clean up tunnel
    this.tunnelRings.forEach((ring) => this.scene.remove(ring));
    this.tunnelRings = [];
    this.multiversePanels.forEach((p) => p.element.remove());
    this.multiversePanels = [];
    if (this.chromaticStyle) this.chromaticStyle.remove();

    // WHITE FLASH
    this.overlay.style.background = 'rgba(255,255,255,1)';
    setTimeout(() => {
      this.overlay.style.transition = 'background 3s ease';
      this.overlay.style.background = 'rgba(0,0,20,0.9)';
    }, 200);

    // Reset camera
    this.camera.position.set(0, 0, 2000);
    this.camera.rotation.set(0, 0, 0);

    // Create the new SOLLY STAR
    const starGeometry = new THREE.IcosahedronGeometry(1, 2);
    const starMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd00,
      transparent: true,
      opacity: 1,
    });
    this.newStar = new THREE.Mesh(starGeometry, starMaterial);
    this.newStar.position.set(0, 0, 0);
    this.scene.add(this.newStar);

    // Add glow
    const glowGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.5,
      side: THREE.BackSide,
    });
    this.starGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.newStar.add(this.starGlow);

    // Create explosion particles
    this.explosionParticles = [];
    for (let i = 0; i < 500; i++) {
      const particleGeom = new THREE.SphereGeometry(2 + Math.random() * 5, 8, 8);
      const particleMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.1 + Math.random() * 0.1, 1, 0.5 + Math.random() * 0.5),
        transparent: true,
        opacity: 1,
      });
      const particle = new THREE.Mesh(particleGeom, particleMat);
      particle.position.set(0, 0, 0);

      // Random direction
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
      );

      this.scene.add(particle);
      this.explosionParticles.push(particle);
    }

    this.playSound('big_bang');
  }

  updateBigBangRebirth(progress) {
    // Star grows
    if (this.newStar) {
      const targetScale = 50 + Math.sin(progress * Math.PI) * 100;
      this.newStar.scale.setScalar(targetScale);
      this.newStar.rotation.y += 0.02;
      this.newStar.rotation.z += 0.01;

      // Glow pulses
      if (this.starGlow) {
        this.starGlow.scale.setScalar(1.2 + Math.sin(progress * 20) * 0.3);
      }
    }

    // Particles expand outward
    this.explosionParticles.forEach((particle) => {
      particle.position.add(particle.userData.velocity);
      particle.userData.velocity.multiplyScalar(0.98);
      particle.material.opacity = Math.max(0, 1 - progress);
      particle.scale.multiplyScalar(0.995);
    });

    // Camera slowly pulls back
    this.camera.position.z = 2000 + progress * 1000;
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 3: SATURN RING - Wallet address orbits the star
  // ═══════════════════════════════════════════════════════════════
  startSaturnRing() {
    this.debugLog('💍 PHASE 3: SATURN RING FORMATION');
    this.showPhaseText(`${this.playerIdentifier}`, 'rgba(100,200,255,0.9)');

    // Clean up explosion particles
    this.explosionParticles.forEach((p) => this.scene.remove(p));
    this.explosionParticles = [];

    // Stabilize star
    if (this.newStar) {
      this.newStar.scale.setScalar(100);
    }

    // Create the Saturn ring from wallet address characters
    const ringRadius = 250;
    const chars = this.playerIdentifier.split('');

    chars.forEach((char, i) => {
      const angle = (i / chars.length) * Math.PI * 2;

      // Create text sprite for each character
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 48px Courier New';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char, 32, 32);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
      });
      const sprite = new THREE.Sprite(spriteMaterial);

      sprite.position.set(Math.cos(angle) * ringRadius, 0, Math.sin(angle) * ringRadius);
      sprite.scale.set(30, 30, 1);

      sprite.userData.angle = angle;
      sprite.userData.radius = ringRadius;
      sprite.userData.targetOpacity = 1;

      this.scene.add(sprite);
      this.ringParticles.push(sprite);
    });

    // Add ring glow
    const ringGeometry = new THREE.TorusGeometry(ringRadius, 10, 8, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    this.saturnRing = new THREE.Mesh(ringGeometry, ringMaterial);
    this.saturnRing.rotation.x = Math.PI / 2;
    this.scene.add(this.saturnRing);

    // Add blockchain "confirmation" pings
    this.startBlockchainPings();
  }

  startBlockchainPings() {
    let pingIndex = 0;
    this.pingInterval = setInterval(() => {
      if (pingIndex >= this.ringParticles.length) {
        clearInterval(this.pingInterval);
        return;
      }

      const particle = this.ringParticles[pingIndex];
      particle.material.opacity = 1;

      // Flash effect
      const originalColor = particle.material.color.clone();
      particle.material.color.setHex(0xffffff);
      setTimeout(() => {
        particle.material.color.copy(originalColor);
      }, 100);

      this.playSound('blockchain_ping');
      pingIndex++;
    }, 150);
  }

  updateSaturnRing(progress) {
    // Rotate ring
    this.ringParticles.forEach((particle, i) => {
      particle.userData.angle += 0.005;
      particle.position.x = Math.cos(particle.userData.angle) * particle.userData.radius;
      particle.position.z = Math.sin(particle.userData.angle) * particle.userData.radius;

      // Fade in
      particle.material.opacity = Math.min(particle.material.opacity + 0.02, 1);
    });

    // Ring glow pulses
    if (this.saturnRing) {
      this.saturnRing.rotation.z += 0.002;
      this.saturnRing.material.opacity = 0.2 + Math.sin(progress * 10) * 0.1;
    }

    // Star continues rotating
    if (this.newStar) {
      this.newStar.rotation.y += 0.01;
    }

    // Camera orbits slightly
    const camAngle = progress * Math.PI * 0.5;
    this.camera.position.x = Math.sin(camAngle) * 500;
    this.camera.position.z = 3000 + Math.cos(camAngle) * 500;
    this.camera.lookAt(0, 0, 0);
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 4: ZOOM TO INFINITY - You're part of the universe now
  // ═══════════════════════════════════════════════════════════════
  startZoomToInfinity() {
    this.debugLog('🌌 PHASE 4: ZOOM TO INFINITY');

    // Create thousands of other "player stars"
    for (let i = 0; i < 1000; i++) {
      const starGeom = new THREE.SphereGeometry(5 + Math.random() * 20, 8, 8);
      const starMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.5, 0.5 + Math.random() * 0.5),
        transparent: true,
        opacity: 0.8,
      });
      const star = new THREE.Mesh(starGeom, starMat);

      star.position.set(
        (Math.random() - 0.5) * 50000,
        (Math.random() - 0.5) * 50000,
        (Math.random() - 0.5) * 50000,
      );

      this.scene.add(star);
      this.galaxyStars.push(star);
    }

    // Final message
    setTimeout(() => {
      this.showFinalMessage();
    }, 2000);
  }

  updateZoomToInfinity(progress) {
    // Endless zoom out
    this.camera.position.z += 50;

    // Rotate camera slowly
    this.camera.rotation.z += 0.0005;

    // Stars twinkle
    this.galaxyStars.forEach((star) => {
      star.material.opacity = 0.5 + Math.sin(Date.now() * 0.001 + star.position.x) * 0.3;
    });

    // Your star remains highlighted
    if (this.newStar) {
      this.newStar.material.emissive = new THREE.Color(0xffaa00);
    }
  }

  showFinalMessage() {
    const finalMsg = document.createElement('div');
    finalMsg.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: white;
      font-family: 'Georgia', serif;
      z-index: 10002;
      opacity: 0;
      transition: opacity 3s ease;
    `;
    finalMsg.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 20px; letter-spacing: 5px;">
        YOU DIDN'T JUST PLAY THE GAME
      </div>
      <div style="font-size: 48px; margin-bottom: 30px; color: #ffdd00; text-shadow: 0 0 30px #ffdd00;">
        YOU BECAME PART OF IT
      </div>
      <div style="font-size: 18px; color: #888; letter-spacing: 3px;">
        FOREVER
      </div>
      <div style="margin-top: 50px; font-size: 14px; color: #666;">
        ${this.playerIdentifier} • SOLLYVERSE • ${new Date().getFullYear()}
      </div>
    `;

    document.body.appendChild(finalMsg);

    setTimeout(() => {
      finalMsg.style.opacity = '1';
    }, 100);

    // Show credits after delay
    setTimeout(() => {
      this.showCredits();
    }, 8000);
  }

  showCredits() {
    const credits = document.createElement('div');
    credits.style.cssText = `
      position: fixed;
      bottom: 50px;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      color: #666;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      z-index: 10002;
      opacity: 0;
      transition: opacity 2s ease;
    `;
    credits.innerHTML = `
      Created in the SOLLYVERSE<br>
      Built with Three.js • Web3 • Dreams<br><br>
      🔺 SOLLY 🔺
    `;

    document.body.appendChild(credits);

    setTimeout(() => {
      credits.style.opacity = '1';
    }, 100);
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  showPhaseText(text, color) {
    // Remove previous phase text
    const existing = document.getElementById('phase-text');
    if (existing) existing.remove();

    const phaseText = document.createElement('div');
    phaseText.id = 'phase-text';
    phaseText.style.cssText = `
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Impact', sans-serif;
      font-size: 36px;
      color: ${color};
      text-shadow: 0 0 20px ${color};
      letter-spacing: 10px;
      z-index: 10002;
      opacity: 0;
      transition: opacity 1s ease;
      pointer-events: none;
    `;
    phaseText.textContent = text;

    document.body.appendChild(phaseText);

    setTimeout(() => {
      phaseText.style.opacity = '1';
    }, 100);

    setTimeout(() => {
      phaseText.style.opacity = '0';
      setTimeout(() => phaseText.remove(), 1000);
    }, 3000);
  }

  playSound(soundName) {
    // Placeholder for audio - would connect to actual audio system
    this.debugLog(`🔊 Playing sound: ${soundName}`);

    // If AudioManager exists, use it
    if (window.audioManager && window.audioManager.play) {
      window.audioManager.play(soundName);
    }
  }

  // Main animation loop
  animate() {
    if (!this.isActive) return;

    const now = Date.now();
    const phaseElapsed = now - this.phaseStartTime;
    const phaseDuration = this.phaseDurations[this.phase];
    const progress =
      phaseDuration > 0 ? Math.min(1, phaseElapsed / phaseDuration) : phaseElapsed / 10000;

    // Update current phase
    switch (this.phase) {
      case 0:
        this.updateImplosion(progress);
        break;
      case 1:
        this.updateMultiverseTunnel(progress);
        break;
      case 2:
        this.updateBigBangRebirth(progress);
        break;
      case 3:
        this.updateSaturnRing(progress);
        break;
      case 4:
        this.updateZoomToInfinity(progress);
        break;
    }

    // Check for phase transition
    if (phaseDuration > 0 && phaseElapsed >= phaseDuration) {
      this.nextPhase();
    }

    requestAnimationFrame(() => this.animate());
  }

  // Transition to next phase
  nextPhase() {
    this.phase++;
    this.phaseStartTime = Date.now();

    this.debugLog(`➡️ Transitioning to phase ${this.phase}`);

    switch (this.phase) {
      case 1:
        this.startMultiverseTunnel();
        break;
      case 2:
        this.startBigBangRebirth();
        break;
      case 3:
        this.startSaturnRing();
        break;
      case 4:
        this.startZoomToInfinity();
        break;
    }
  }

  // Cleanup
  cleanup() {
    this.isActive = false;

    // Clear intervals
    if (this.pingInterval) clearInterval(this.pingInterval);

    // Remove DOM elements
    if (this.overlay) this.overlay.remove();
    if (this.chromaticStyle) this.chromaticStyle.remove();
    this.multiversePanels.forEach((p) => p.element.remove());

    // Remove 3D objects
    this.tunnelRings.forEach((r) => this.scene.remove(r));
    this.ringParticles.forEach((p) => this.scene.remove(p));
    this.galaxyStars.forEach((s) => this.scene.remove(s));
    this.explosionParticles.forEach((p) => this.scene.remove(p));

    if (this.newStar) this.scene.remove(this.newStar);
    if (this.saturnRing) this.scene.remove(this.saturnRing);
    if (this.implosionCore) this.scene.remove(this.implosionCore);

    // Reset camera
    this.camera.position.copy(this.originalCameraPos);
    this.camera.rotation.copy(this.originalCameraRot);

    this.debugLog('🧹 GameEnding cleaned up');
  }
}

// Make available globally
window.GameEnding = GameEnding;

// Trigger function (can be called when game is completed)
window.triggerGameEnding = function () {
  if (!window.scene || !window.camera || !window.renderer) {
    console.error('❌ Scene/Camera/Renderer not available for Game Ending');
    return;
  }

  if (window.gameEnding && window.gameEnding.isActive) {
    console.log('⚠️ Game Ending already active');
    return;
  }

  console.log('🌌 TRIGGERING GAME ENDING SEQUENCE');
  window.gameEnding = new GameEnding(window.scene, window.camera, window.renderer);
  window.gameEnding.start();
};

// Export for module use
/* eslint-disable no-undef */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEnding;
}
/* eslint-enable no-undef */
