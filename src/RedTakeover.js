// ===================================================================================
// ==                           RED TAKEOVER - SECRET LEVEL                        ==
// ==                                                                               ==
// ==      Ctrl+6 = Secret Level                                                   ==
// ==      Sleep rode planeten naar een hoek → Universum kantelt                  ==
// ==      100% rood → SPIDERVERSE PORTAL                                         ==
// ===================================================================================
/* global THREE */

class RedTakeover {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.isActive = false;
    this.redPlanets = [];
    this.collectedCount = 0;
    this.targetCount = 1000; // All red planets in universe
    this.takeoverPercent = 0;

    // Escalation mechanic - more planets disappear each drop
    this.dropCount = 0;
    this.escalationTable = [50, 75, 100, 150, 175, 200, 200, 50]; // Per drop
    this.totalConsumed = 0;

    // Corner dump zone (linksonder)
    this.dropZone = {
      x: -window.innerWidth / 2 + 150,
      y: -window.innerHeight / 2 + 150,
      radius: 120,
    };

    // Red overlay elements
    this.redOverlays = {
      top: null,
      bottom: null,
      left: null,
      right: null,
    };

    // Spiderverse portal state
    this.portalActive = false;
    this.glitchIntensity = 0;

    // Dragging state
    this.isDragging = false;
    this.draggedPlanet = null;
    this.dragOffset = { x: 0, y: 0 };

    // UI elements
    this.counterElement = null;
    this.dropZoneIndicator = null;

    this.DEBUG = true;
  }

  debugLog(...args) {
    if (this.DEBUG) {
      console.log('[RedTakeover]', ...args);
    }
  }

  // Initialize the secret level
  init() {
    this.debugLog('🔴 Initializing Red Takeover Secret Level...');
    this.isActive = true;

    // Create UI
    this.createUI();

    // Create drop zone indicator
    this.createDropZoneIndicator();

    // Create red overlays (initially hidden)
    this.createRedOverlays();

    // Use existing red planets from the universe instead of spawning new ones
    this.captureExistingRedPlanets();

    // Setup event listeners
    this.setupEventListeners();

    this.debugLog('✅ Red Takeover initialized!');
    this.debugLog(`🔴 Found ${this.redPlanets.length} red planets in universe`);
    this.showNotification(
      '🔴 SECRET LEVEL: Red Takeover!',
      `Sleep ${this.redPlanets.length} rode planeten naar de hoek!`,
    );
  }

  // Capture existing red planets from the galaxy
  captureExistingRedPlanets() {
    // Get red planets from window.redPlanets (set by galaxy.js)
    if (window.redPlanets && window.redPlanets.length > 0) {
      // Filter only the actual red planets (not green)
      this.redPlanets = window.redPlanets.filter(
        (planet) => planet && planet.userData && planet.userData.isRed === true,
      );
      this.targetCount = this.redPlanets.length;
      this.debugLog(`🔴 Captured ${this.redPlanets.length} existing red planets`);
    } else {
      // Fallback: find red planets in scene
      this.scene.traverse((obj) => {
        if (obj.userData && obj.userData.isPlanet && obj.userData.isRed) {
          this.redPlanets.push(obj);
        }
      });
      this.targetCount = this.redPlanets.length;
      this.debugLog(`🔴 Found ${this.redPlanets.length} red planets via scene traverse`);
    }

    // Mark all as draggable for this level
    this.redPlanets.forEach((planet, i) => {
      planet.userData.isRedTakeoverPlanet = true;
      planet.userData.redTakeoverId = `red-${i}`;
    });
  }

  // Create UI elements
  createUI() {
    // Counter display
    this.counterElement = document.createElement('div');
    this.counterElement.id = 'red-takeover-counter';
    this.counterElement.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Courier New', monospace;
      font-size: 24px;
      font-weight: bold;
      color: #ff0000;
      text-shadow: 0 0 10px #ff0000, 0 0 20px #ff0000;
      z-index: 10001;
      padding: 10px 20px;
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid #ff0000;
      border-radius: 10px;
    `;
    this.updateCounter();
    document.body.appendChild(this.counterElement);
  }

  // Update counter display
  updateCounter() {
    if (this.counterElement) {
      const nextDrop =
        this.escalationTable[Math.min(this.dropCount, this.escalationTable.length - 1)];
      this.counterElement.innerHTML = `
        💥 TAKEOVER: ${this.takeoverPercent}%<br>
        🔴 ${this.totalConsumed}/${this.targetCount} consumed<br>
        <span style="font-size: 16px; color: #ff6666;">Drop #${this.dropCount + 1}: ${nextDrop} planets!</span>
      `;
    }
  }

  // Create drop zone indicator
  createDropZoneIndicator() {
    this.dropZoneIndicator = document.createElement('div');
    this.dropZoneIndicator.id = 'red-drop-zone';
    this.dropZoneIndicator.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 30px;
      width: ${this.dropZone.radius * 2}px;
      height: ${this.dropZone.radius * 2}px;
      border: 4px dashed #ff0000;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,0,0,0.3) 0%, rgba(255,0,0,0) 70%);
      z-index: 10000;
      pointer-events: none;
      animation: pulse-red 1.5s ease-in-out infinite;
    `;

    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-red {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(this.dropZoneIndicator);
  }

  // Create red overlay elements for takeover effect
  createRedOverlays() {
    const sides = ['top', 'bottom', 'left', 'right'];
    const positions = {
      top: { top: '0', left: '0', width: '100%', height: '0%' },
      bottom: { bottom: '0', left: '0', width: '100%', height: '0%' },
      left: { top: '0', left: '0', width: '0%', height: '100%' },
      right: { top: '0', right: '0', width: '0%', height: '100%' },
    };

    sides.forEach((side) => {
      const overlay = document.createElement('div');
      overlay.id = `red-overlay-${side}`;
      overlay.style.cssText = `
        position: fixed;
        ${Object.entries(positions[side])
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ')};
        background: linear-gradient(${side === 'top' || side === 'bottom' ? '180deg' : '90deg'},
          rgba(255, 0, 0, 0.9) 0%,
          rgba(200, 0, 0, 0.7) 50%,
          rgba(150, 0, 0, 0) 100%);
        z-index: 9999;
        pointer-events: none;
        transition: all 0.5s ease-out;
      `;
      document.body.appendChild(overlay);
      this.redOverlays[side] = overlay;
    });
  }

  // Spawn red planets in the scene
  spawnRedPlanets(count) {
    const geometry = new THREE.SphereGeometry(50, 32, 32);

    for (let i = 0; i < count; i++) {
      const material = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0x330000,
        emissiveIntensity: 0.5,
        metalness: 0.3,
        roughness: 0.7,
      });

      const planet = new THREE.Mesh(geometry, material);

      // Random position in the universe
      planet.position.set(
        (Math.random() - 0.5) * 8000,
        (Math.random() - 0.5) * 8000,
        (Math.random() - 0.5) * 4000,
      );

      // Mark as red planet for identification
      planet.userData.isRedPlanet = true;
      planet.userData.id = `red-planet-${i}`;

      this.scene.add(planet);
      this.redPlanets.push(planet);
    }

    this.debugLog(`🔴 Spawned ${count} red planets`);
  }

  // Setup event listeners for drag & drop
  setupEventListeners() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));

    // Touch support
    canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
    canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
    canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
  }

  // Raycaster for planet detection
  getIntersectedPlanet(event) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const rect = this.renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, this.camera);

    const intersects = raycaster.intersectObjects(this.redPlanets);
    return intersects.length > 0 ? intersects[0].object : null;
  }

  onMouseDown(event) {
    if (!this.isActive) return;

    const planet = this.getIntersectedPlanet(event);
    if (planet && planet.userData.isRedPlanet) {
      this.isDragging = true;
      this.draggedPlanet = planet;
      this.draggedPlanet.material.emissiveIntensity = 1.0;
      this.debugLog('🖱️ Started dragging planet:', planet.userData.id);
    }
  }

  onMouseMove(event) {
    if (!this.isDragging || !this.draggedPlanet) return;

    // Move planet towards mouse in screen space
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Convert screen to world coordinates (simplified)
    const vector = new THREE.Vector3(
      (mouseX / rect.width) * 2 - 1,
      -(mouseY / rect.height) * 2 + 1,
      0.5,
    );
    vector.unproject(this.camera);

    const dir = vector.sub(this.camera.position).normalize();
    const distance = -this.camera.position.z / dir.z;
    const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));

    this.draggedPlanet.position.x = pos.x;
    this.draggedPlanet.position.y = pos.y;
  }

  onMouseUp(event) {
    if (!this.isDragging || !this.draggedPlanet) return;

    // Check if dropped in zone
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Drop zone is bottom-left
    const dropX = this.dropZone.radius + 30;
    const dropY = rect.height - this.dropZone.radius - 30;

    const distance = Math.sqrt(Math.pow(mouseX - dropX, 2) + Math.pow(mouseY - dropY, 2));

    if (distance < this.dropZone.radius) {
      this.collectPlanet(this.draggedPlanet);
    } else {
      // Reset planet glow
      this.draggedPlanet.material.emissiveIntensity = 0.5;
    }

    this.isDragging = false;
    this.draggedPlanet = null;
  }

  // Touch event handlers
  onTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
  }

  onTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  }

  onTouchEnd(event) {
    event.preventDefault();
    const touch = event.changedTouches[0];
    this.onMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
  }

  // Collect a planet (dropped in zone) - with ESCALATION
  collectPlanet(planet) {
    this.dropCount++;
    const escalationIndex = Math.min(this.dropCount - 1, this.escalationTable.length - 1);
    const planetsToConsume = this.escalationTable[escalationIndex];

    this.debugLog(`💥 DROP #${this.dropCount}! Consuming ${planetsToConsume} planets!`);

    // Remove the dropped planet first
    this.scene.remove(planet);
    let index = this.redPlanets.indexOf(planet);
    if (index > -1) {
      this.redPlanets.splice(index, 1);
    }
    this.totalConsumed++;

    // Now consume additional random planets based on escalation
    const additionalToConsume = Math.min(planetsToConsume - 1, this.redPlanets.length);
    for (let i = 0; i < additionalToConsume; i++) {
      if (this.redPlanets.length === 0) break;

      // Pick random planet
      const randomIndex = Math.floor(Math.random() * this.redPlanets.length);
      const victimPlanet = this.redPlanets[randomIndex];

      // Explosion effect at victim location
      this.spawnExplosion(victimPlanet.position);

      // Remove from scene
      this.scene.remove(victimPlanet);
      this.redPlanets.splice(randomIndex, 1);
      this.totalConsumed++;
    }

    // Update counts
    this.collectedCount = this.totalConsumed;
    this.takeoverPercent = Math.min(100, Math.floor((this.totalConsumed / this.targetCount) * 100));
    this.updateCounter();

    // Show escalation message
    this.showEscalationMessage(planetsToConsume, this.totalConsumed);

    // Visual feedback - expand red overlays
    this.expandRedOverlays();

    // Camera shake - more intense with higher drops
    this.cameraShake(this.dropCount);

    // Spawn main explosion at drop zone
    this.spawnExplosion(planet.position);

    // Check for completion
    if (this.redPlanets.length === 0 || this.takeoverPercent >= 100) {
      this.debugLog('🕷️ ALL PLANETS CONSUMED! SPIDERVERSE TIME!');
      this.triggerSpiderversePortal();
    } else if (this.takeoverPercent >= 50) {
      // Start tilting universe
      this.tiltUniverse();
    }
  }

  // Show escalation message
  showEscalationMessage(consumed, total) {
    const msg = document.createElement('div');
    msg.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      font-family: 'Impact', sans-serif;
      font-size: ${40 + this.dropCount * 10}px;
      color: #ff0000;
      text-shadow: 0 0 20px #ff0000, 0 0 40px #ff0000, 4px 4px 0 #000;
      z-index: 10002;
      pointer-events: none;
      animation: escalate-pop 1s ease-out forwards;
    `;
    msg.textContent = `💥 ${consumed}x! ${total}/${this.targetCount}`;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes escalate-pop {
        0% { transform: translate(-50%, -50%) scale(0) rotate(-10deg); opacity: 1; }
        30% { transform: translate(-50%, -50%) scale(1.3) rotate(5deg); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(msg);

    setTimeout(() => msg.remove(), 1000);
  }

  // Expand red overlays based on takeover percentage
  expandRedOverlays() {
    const percent = this.takeoverPercent;
    const expansion = (percent / 100) * 25; // Max 25% from each side

    if (this.redOverlays.bottom) {
      this.redOverlays.bottom.style.height = `${expansion}%`;
    }
    if (this.redOverlays.left) {
      this.redOverlays.left.style.width = `${expansion * 0.8}%`;
    }
    if (this.redOverlays.top && percent > 30) {
      this.redOverlays.top.style.height = `${((percent - 30) / 100) * 20}%`;
    }
    if (this.redOverlays.right && percent > 50) {
      this.redOverlays.right.style.width = `${((percent - 50) / 100) * 30}%`;
    }
  }

  // Camera shake effect - intensity scales with drop count
  cameraShake(dropNum = 1) {
    const originalPos = this.camera.position.clone();
    const intensity = 20 + dropNum * 15 + this.takeoverPercent * 0.5;
    let shakeCount = 0;
    const maxShakes = 10 + dropNum * 3;

    const shake = () => {
      if (shakeCount >= maxShakes) {
        this.camera.position.copy(originalPos);
        return;
      }

      this.camera.position.x = originalPos.x + (Math.random() - 0.5) * intensity;
      this.camera.position.y = originalPos.y + (Math.random() - 0.5) * intensity;
      shakeCount++;

      requestAnimationFrame(shake);
    };

    shake();
  }

  // Spawn explosion particle effect
  spawnExplosion(position) {
    const particleCount = 30;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(10, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 1,
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);

      // Random velocity
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
      );

      this.scene.add(particle);
      particles.push(particle);
    }

    // Animate particles
    let frame = 0;
    const animate = () => {
      frame++;
      if (frame > 60) {
        particles.forEach((p) => this.scene.remove(p));
        return;
      }

      particles.forEach((p) => {
        p.position.add(p.userData.velocity);
        p.material.opacity = 1 - frame / 60;
        p.scale.multiplyScalar(0.95);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }

  // Tilt the universe when reaching 50%
  tiltUniverse() {
    const tiltAngle = ((this.takeoverPercent - 50) / 50) * 0.3; // Max 0.3 radians

    // Tilt camera
    if (this.camera) {
      this.camera.rotation.z = tiltAngle;
    }

    // Make red planets "fall" towards the corner
    this.redPlanets.forEach((planet) => {
      planet.position.x -= 10;
      planet.position.y -= 10;
    });
  }

  // SPIDERVERSE PORTAL - The grand finale!
  triggerSpiderversePortal() {
    this.debugLog('🕷️ SPIDERVERSE PORTAL ACTIVATED!');
    this.portalActive = true;

    // Full screen red flash
    this.fullScreenFlash();

    // After flash, show Spiderverse effect
    setTimeout(() => {
      this.createSpiderverseEffect();
    }, 500);
  }

  // Full screen red flash
  fullScreenFlash() {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #ff0000;
      z-index: 99999;
      animation: flash-fade 0.5s ease-out forwards;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes flash-fade {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(flash);

    setTimeout(() => flash.remove(), 500);
  }

  // Create Spiderverse visual effect
  createSpiderverseEffect() {
    const container = document.createElement('div');
    container.id = 'spiderverse-portal';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 100000;
      background: #000;
      overflow: hidden;
    `;

    // Create glitchy comic panels
    const colors = ['#ff0066', '#00ffff', '#ffff00', '#ff00ff', '#00ff00'];
    const panelCount = 12;

    for (let i = 0; i < panelCount; i++) {
      const panel = document.createElement('div');
      const color = colors[i % colors.length];

      panel.style.cssText = `
        position: absolute;
        width: ${20 + Math.random() * 40}%;
        height: ${20 + Math.random() * 40}%;
        left: ${Math.random() * 80}%;
        top: ${Math.random() * 80}%;
        background: ${color};
        border: 4px solid #000;
        transform: rotate(${(Math.random() - 0.5) * 30}deg) skew(${(Math.random() - 0.5) * 10}deg);
        opacity: 0.8;
        mix-blend-mode: screen;
        animation: panel-glitch ${0.5 + Math.random() * 1}s ease-in-out infinite;
      `;

      // Add halftone dots
      panel.innerHTML = `
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: radial-gradient(circle, #000 1px, transparent 1px);
          background-size: 8px 8px;
          opacity: 0.3;
        "></div>
      `;

      container.appendChild(panel);
    }

    // Add chromatic aberration text
    const title = document.createElement('div');
    title.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Impact', sans-serif;
      font-size: 80px;
      color: #fff;
      text-shadow:
        -4px 0 #ff0066,
        4px 0 #00ffff,
        0 0 20px #fff;
      animation: glitch-text 0.3s ease-in-out infinite;
      z-index: 100001;
    `;
    title.textContent = 'SPIDERVERSE';
    container.appendChild(title);

    // Add glitch animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes panel-glitch {
        0%, 100% { transform: rotate(${(Math.random() - 0.5) * 30}deg) translate(0, 0); }
        25% { transform: rotate(${(Math.random() - 0.5) * 35}deg) translate(${Math.random() * 20}px, ${Math.random() * 20}px); }
        50% { transform: rotate(${(Math.random() - 0.5) * 25}deg) translate(${-Math.random() * 20}px, ${Math.random() * 20}px); }
        75% { transform: rotate(${(Math.random() - 0.5) * 30}deg) translate(${Math.random() * 20}px, ${-Math.random() * 20}px); }
      }
      @keyframes glitch-text {
        0%, 100% { transform: translate(-50%, -50%) skew(0deg); }
        20% { transform: translate(-52%, -50%) skew(2deg); }
        40% { transform: translate(-48%, -50%) skew(-2deg); }
        60% { transform: translate(-50%, -52%) skew(1deg); }
        80% { transform: translate(-50%, -48%) skew(-1deg); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(container);

    // Auto-close after 5 seconds and transition to next
    setTimeout(() => {
      this.closeSpiderversePortal(container);
    }, 5000);
  }

  // Close Spiderverse portal and transition
  closeSpiderversePortal(container) {
    container.style.transition = 'opacity 1s ease-out';
    container.style.opacity = '0';

    setTimeout(() => {
      container.remove();
      this.cleanup();

      // Trigger game ending or next level
      this.showNotification('🎉 SECRET LEVEL COMPLETE!', 'Je hebt de Spiderverse ontgrendeld!');

      // Could trigger Chapter 5 or game ending here
      if (window.gameManager) {
        window.gameManager.completeSecretLevel();
      }
    }, 1000);
  }

  // Show notification
  showNotification(title, message) {
    const notif = document.createElement('div');
    notif.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      border: 3px solid #ff0000;
      border-radius: 15px;
      padding: 30px 50px;
      z-index: 100002;
      text-align: center;
      animation: notif-pop 0.3s ease-out;
    `;
    notif.innerHTML = `
      <h2 style="color: #ff0000; margin: 0 0 10px 0; font-size: 28px;">${title}</h2>
      <p style="color: #fff; margin: 0; font-size: 18px;">${message}</p>
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes notif-pop {
        0% { transform: translate(-50%, -50%) scale(0); }
        100% { transform: translate(-50%, -50%) scale(1); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
  }

  // Cleanup
  cleanup() {
    this.isActive = false;
    this.portalActive = false;

    // Remove red planets
    this.redPlanets.forEach((planet) => {
      this.scene.remove(planet);
    });
    this.redPlanets = [];

    // Remove UI elements
    if (this.counterElement) this.counterElement.remove();
    if (this.dropZoneIndicator) this.dropZoneIndicator.remove();

    // Remove overlays
    Object.values(this.redOverlays).forEach((overlay) => {
      if (overlay) overlay.remove();
    });

    // Reset camera
    if (this.camera) {
      this.camera.rotation.z = 0;
    }

    this.debugLog('🧹 Red Takeover cleaned up');
  }
}

// Make available globally
window.RedTakeover = RedTakeover;

// Initialize function for Ctrl+6
window.initSecretLevel = function () {
  if (!window.scene || !window.camera || !window.renderer) {
    console.error('❌ Scene/Camera/Renderer not available for Secret Level');
    return;
  }

  if (window.redTakeover && window.redTakeover.isActive) {
    console.log('⚠️ Secret Level already active');
    return;
  }

  window.redTakeover = new RedTakeover(window.scene, window.camera, window.renderer);
  window.redTakeover.init();
};

console.log('🔴 RedTakeover.js loaded - Press Ctrl+6 for Secret Level!');
