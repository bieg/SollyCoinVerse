// ===================================================================================
// ==                           SOLLYVERSE CHAPTER MANAGER                        ==
// ==                                                                             ==
// ==      Beheert hoofdstukken en stijlen:                                      ==
// ==      - Hoofdstuk 1: Originele stijl                                        ==
// ==      - Hoofdstuk 2: Brutalistische stijl                                   ==
// ==      - Hoofdstuk switching                                                 ==
// ===================================================================================

export class ChapterManager {
  constructor() {
    this.currentChapter = 1;
    this.chapters = {
      1: new Chapter1(),
      2: new Chapter2()
    };
    this.isTransitioning = false;
    
    console.log('📚 ChapterManager initialized');
  }

  // Switch naar een hoofdstuk
  async switchToChapter(chapterNumber) {
    if (this.isTransitioning || !this.chapters[chapterNumber]) {
      console.warn(`⚠️ Cannot switch to chapter ${chapterNumber}`);
      return false;
    }

    try {
      this.isTransitioning = true;
      console.log(`🔄 Switching to Chapter ${chapterNumber}`);

      // Cleanup huidige hoofdstuk
      if (this.chapters[this.currentChapter]) {
        await this.chapters[this.currentChapter].cleanup();
      }

      // Initialize nieuw hoofdstuk
      await this.chapters[chapterNumber].initialize();
      this.currentChapter = chapterNumber;

      console.log(`✅ Switched to Chapter ${chapterNumber}`);
      return true;
    } catch (error) {
      console.error(`❌ Error switching to chapter ${chapterNumber}:`, error);
      return false;
    } finally {
      this.isTransitioning = false;
    }
  }

  // Get huidige hoofdstuk
  getCurrentChapter() {
    return this.chapters[this.currentChapter];
  }

  // Get hoofdstuk nummer
  getCurrentChapterNumber() {
    return this.currentChapter;
  }

  // Check of hoofdstuk beschikbaar is
  isChapterAvailable(chapterNumber) {
    return this.chapters[chapterNumber] !== undefined;
  }

  // Cleanup alle hoofdstukken
  cleanup() {
    Object.values(this.chapters).forEach(chapter => {
      if (chapter && chapter.cleanup) {
        chapter.cleanup();
      }
    });
  }

  // Initialize method for module compatibility
  async initialize() {
    console.log("📚 ChapterManager initialized");
    return Promise.resolve();
  }
}

// ===================================================================================
// ==                              HOOFDSTUK 1                                    ==
// ==                           (Originele Stijl)                                ==
// ===================================================================================

class Chapter1 {
  constructor() {
    this.name = "Originele Sollyverse";
    this.style = "modern";
    this.isInitialized = false;
  }

  async initialize() {
    console.log('🎮 Initializing Chapter 1 (Original Style)');
    
    // Reset naar originele stijl
    this.setOriginalStyle();
    
    // CTA-buttons weer zichtbaar maken
    const ctaButtons = document.getElementById('cta-buttons');
    if (ctaButtons) ctaButtons.style.display = 'flex';
    
    // Level indicator ook tonen (optioneel)
    const levelIndicator = document.getElementById('solly-level-indicator');
    if (levelIndicator) levelIndicator.style.display = 'block';
    
    // Initialize originele game mechanics
    this.initializeOriginalMechanics();
    
    this.isInitialized = true;
  }

  setOriginalStyle() {
    // Originele kleuren en stijl
    document.documentElement.style.setProperty('--primary-color', '#FFD700');
    document.documentElement.style.setProperty('--secondary-color', '#8e24aa');
    document.documentElement.style.setProperty('--background-color', '#000000');
    document.documentElement.style.setProperty('--text-color', '#ffffff');
    
    // Originele fonts
    document.body.style.fontFamily = '"Open Sans", sans-serif';
  }

  initializeOriginalMechanics() {
    // Originele game mechanics blijven intact
    console.log('🎮 Chapter 1 mechanics loaded');
  }

  cleanup() {
    console.log('🧹 Chapter 1 cleanup');
    this.isInitialized = false;
  }
}

// ===================================================================================
// ==                              HOOFDSTUK 2                                    ==
// ==                          (Brutalistische Stijl)                             ==
// ===================================================================================

class Chapter2 {
  constructor() {
    this.name = "Brutalistische Sollyverse";
    this.style = "brutalist";
    this.isInitialized = false;
    this.terminalMode = false;
    this.audioContext = null;
    this.retroSounds = {};
  }

  async initialize() {
    console.log('🏗️ Initializing Chapter 2 (Brutalist Style)');
    
    // Stop de oude render-loop
    if (typeof window.isPaused !== 'undefined') window.isPaused = true;
    
    // Schakel alle camera-controls uit (FlyControls & scroll-zoom)
    if (window.controls) {
      if (typeof window.controls.dispose === 'function') window.controls.dispose();
      window.controls = null;
    }
    if (window.renderer && window.renderer.domElement) {
      // Neutraliseer mouse-wheel zoom
      window.renderer.domElement.addEventListener('wheel', e => { e.preventDefault(); }, { passive: false });
    }
    
    // Blokkeer trackpad-pinch (wheel) en touch-gesture zooms op het hele venster
    window.addEventListener('wheel', e => { e.preventDefault(); }, { passive: false });
    ['gesturestart','gesturechange','gestureend'].forEach(evt => {
      window.addEventListener(evt, e => e.preventDefault());
    });
    
    // Verberg klassieke UI-elementen uit Hoofdstuk 1
    const ctaButtons = document.getElementById('cta-buttons');
    if (ctaButtons) ctaButtons.style.display = 'none';
    const levelIndicator = document.getElementById('solly-level-indicator');
    if (levelIndicator) levelIndicator.style.display = 'none';
    
    // Verberg kaboom teller in Chapter 2
    const kaboomTeller = document.getElementById('kaboom-teller');
    if (kaboomTeller) kaboomTeller.style.display = 'none';
    
    // WIS DE THREE.JS SCENE COMPLEET
    this.clearThreeJSScene();
    
    // Set brutalistische stijl
    this.setBrutalistStyle();
    
    // Initialize terminal mode
    this.initializeTerminalMode();
    
    // Initialize retro audio
    this.initializeRetroAudio();
    
    // Initialize brutalistische mechanics
    this.initializeBrutalistMechanics();
    
    // Maak nieuwe brutalistische scene
    this.createBrutalistScene();
    
    // Start eigen render-loop voor Hoofdstuk 2
    this.startBrutalistAnimate();
    
    // Maak brutale CTA's altijd zichtbaar
    this.createOrShowBrutalistCTAs();
    
    this.isInitialized = true;
  }

  setBrutalistStyle() {
    // Brutalistische kleuren - hoog contrast
    document.documentElement.style.setProperty('--primary-color', '#FF0000');
    document.documentElement.style.setProperty('--secondary-color', '#00FF00');
    document.documentElement.style.setProperty('--accent-color', '#0000FF');
    document.documentElement.style.setProperty('--background-color', '#000000');
    document.documentElement.style.setProperty('--text-color', '#FFFFFF');
    document.documentElement.style.setProperty('--error-color', '#FF0000');
    document.documentElement.style.setProperty('--success-color', '#00FF00');
    
    // Monospace font voor terminal gevoel
    document.body.style.fontFamily = '"Courier New", "Monaco", "Consolas", monospace';
    
    // Brutalistische CSS classes
    this.addBrutalistCSS();
  }

  addBrutalistCSS() {
    const style = document.createElement('style');
    style.textContent = `
      .brutalist-container {
        background: #000000;
        color: #FFFFFF;
        border: none;
        padding: 16px;
        margin: 10px;
        font-family: "Courier New", monospace;
        font-size: 13px;
        line-height: 1.2;
        overflow: hidden;
      }
      
      .brutalist-button {
        background: #000000;
        color: #FFFFFF;
        border: 2px solid #FF0000;
        padding: 10px 20px;
        font-family: "Courier New", monospace;
        font-size: 14px;
        cursor: pointer;
        text-transform: uppercase;
        margin: 5px;
      }
      
      .brutalist-button:hover {
        background: #FF0000;
        color: #000000;
      }
      
      .brutalist-text {
        font-family: "Courier New", monospace;
        color: #FFFFFF;
        text-shadow: 2px 2px 0px #FF0000;
        font-weight: bold;
      }
      
      .brutalist-error {
        color: #FF0000;
        background: #000000;
        border: 2px solid #FF0000;
        padding: 10px;
        margin: 10px 0;
        font-family: "Courier New", monospace;
        font-weight: bold;
      }
      
      .brutalist-success {
        color: #00FF00;
        background: #000000;
        border: 2px solid #00FF00;
        padding: 10px;
        margin: 10px 0;
        font-family: "Courier New", monospace;
        font-weight: bold;
      }
      
      .terminal-cursor {
        display: none !important;
      }
      
      .brutalist-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 10px;
        padding: 20px;
        background: #000000;
        border: 2px solid #FF0000;
      }
      
      .brutalist-panel {
        background: #000000;
        border: 2px solid #00FF00;
        padding: 12px;
        margin: 10px;
        font-family: "Courier New", monospace;
      }

      /* Brutalist style voor CTA buttons in Hoofdstuk 2 */
      .brutalist-cta {
        background: #000000 !important;
        border: 2px solid #FF0000 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        padding: 0 !important;
        transition: background 0.2s, transform 0.15s !important;
      }
      .brutalist-cta:hover {
        background: #FF0000 !important;
        transform: scale(1.05) !important;
      }

      /* Maak success/error boxes smaller */
      .brutalist-success, .brutalist-error, .brutalist-info {
        max-width: 280px;
      }
    `;
    document.head.appendChild(style);
  }

  initializeTerminalMode() {
    this.terminalMode = true;
    console.log('🖥️ Terminal mode activated');
    
    // Terminal-style interface
    this.createTerminalInterface();
  }

  createTerminalInterface() {
    // Vervang de huidige UI met terminal interface
    const terminalContainer = document.createElement('div');
    terminalContainer.id = 'brutalist-terminal';
    terminalContainer.className = 'brutalist-container';
    terminalContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      /* geen scrollbar */
      z-index: 2000;
      background: #000000;
      color: #FFFFFF;
      border: none;
      padding: 16px;
      font-family: "Courier New", monospace;
      font-size: 14px;
      line-height: 1.2;
      overflow: hidden;
    `;
    terminalContainer.innerHTML = `
      <div class="brutalist-panel">
        <h2 class="brutalist-text">SOLLYVERSE TERMINAL</h2>
        <p class="brutalist-text">SYSTEM: BRUTALIST MODE ACTIVE</p>
        <p class="brutalist-text">STATUS: READY</p>
        <!-- static only -->
      </div>
    `;
    
    // Verberg alleen de startscreen, niet de hele game
    const existingContent = document.getElementById('startscreen');
    if (existingContent) {
      existingContent.style.display = 'none';
    }
    
    document.body.appendChild(terminalContainer);
    
    // Geen dynamische terminal-output nodig
    this.terminalOutput = () => {};
  }

  initializeRetroAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.createRetroSounds();
    } catch (error) {
      console.warn('⚠️ Audio context not available');
    }
  }

  createRetroSounds() {
    // 8-bit style sounds
    this.retroSounds = {
      beep: this.createBeepSound(800, 0.1),
      error: this.createBeepSound(200, 0.3),
      success: this.createBeepSound(1200, 0.2),
      click: this.createBeepSound(400, 0.05)
    };
  }

  createBeepSound(frequency, duration) {
    return () => {
      if (!this.audioContext) return;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    };
  }

  initializeBrutalistMechanics() {
    console.log('🏗️ Brutalist mechanics loaded');
    
    // Brutalistische game mechanics
    this.setupBrutalistCollisions();
    this.setupBrutalistUI();
  }

  setupBrutalistCollisions() {
    // Brutalistische collision detection
    if (window.solly1 && window.solly2) {
      // Maak objecten meer "ruw" en mechanisch
      solly1.material.color.setHex(0xFF0000);
      solly2.material.color.setHex(0x00FF00);
      
      // Brutalistische beweging
      this.brutalistMovement();
    }
  }

  brutalistMovement() {
    // Staccato, mechanische beweging
    if (window.solly1) {
      solly1.position.x = Math.round(solly1.position.x / 50) * 50;
      solly1.position.y = Math.round(solly1.position.y / 50) * 50;
      solly1.position.z = Math.round(solly1.position.z / 50) * 50;
    }
    
    if (window.solly2) {
      solly2.position.x = Math.round(solly2.position.x / 50) * 50;
      solly2.position.y = Math.round(solly2.position.y / 50) * 50;
      solly2.position.z = Math.round(solly2.position.z / 50) * 50;
    }
  }

  setupBrutalistUI() {
    // Brutalistische UI elementen
    this.createBrutalistControls();

    // Maak CTA buttons brutalistisch
    const ids = ['cta-info', 'cta-instructies', 'cta-personaliseer'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('brutalist-cta');
    });
  }

  createBrutalistControls() {
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'brutalist-grid';
    controlsContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 200px;
      z-index: 2000;
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      padding: 24px;
      background: #000000;
      border: 2px solid #FF0000;
    `;
    controlsContainer.innerHTML = `
      <button class="brutalist-button" onclick="chapterManager.getCurrentChapter().executeCommand('COLLIDE')">EXECUTE COLLISION</button>
      <button class="brutalist-button" onclick="chapterManager.getCurrentChapter().executeCommand('RESET')">START AGAIN</button>
      <button class="brutalist-button" onclick="chapterManager.getCurrentChapter().executeCommand('STATUS')">SYSTEM STATUS</button>
    `;
    
    document.body.appendChild(controlsContainer);
  }

  executeCommand(command) {
    this.retroSounds.click();
    
    switch (command) {
      case 'COLLIDE':
        console.log('EXECUTING COLLISION SEQUENCE');
        this.triggerBrutalistCollision();
        break;
      case 'RESET':
        console.log('RESETTING SYSTEM');
        this.resetSystem();
        break;
      case 'STATUS':
        console.log('SYSTEM STATUS: OPERATIONAL');
        this.showSystemStatus();
        break;
      default:
        console.log(`UNKNOWN COMMAND: ${command}`);
    }
  }

  triggerBrutalistCollision() {
    this.retroSounds.error();
    this.terminalOutput('COLLISION DETECTED', 'error');
    this.terminalOutput('INITIATING DESTRUCTION SEQUENCE', 'error');
    
    // Brutalistische collision effect
    if (window.solly1 && window.solly2) {
      solly1.visible = false;
      solly2.visible = false;
      
      // Rode flash effect
      document.body.style.backgroundColor = '#FF0000';
      setTimeout(() => {
        document.body.style.backgroundColor = '#000000';
      }, 200);
    }
  }

  resetSystem() {
    this.retroSounds.beep();
    this.terminalOutput('RESTARTING SOLLYVERSE...', 'error');

    // Geef gebruiker 1 seconde voor de reload (zodat melding zichtbaar is)
    setTimeout(() => {
      // Fallback: wis alle chapterdata en herlaad de pagina
      try {
        if (window.chapterManager) window.chapterManager.cleanup();
      } catch (e) {}
      location.reload();
    }, 1000);
  }

  showSystemStatus() {
    const status = {
      chapter: chapterManager.getCurrentChapterNumber(),
      style: this.style,
      terminal: this.terminalMode,
      audio: this.audioContext ? 'ACTIVE' : 'DISABLED'
    };
    
    this.terminalOutput('=== SYSTEM STATUS ===', 'info');
    Object.entries(status).forEach(([key, value]) => {
      this.terminalOutput(`${key.toUpperCase()}: ${value}`, 'info');
    });
  }

  cleanup() {
    console.log('🧹 Chapter 2 cleanup');
    
    // Remove brutalist elements
    const terminal = document.getElementById('brutalist-terminal');
    if (terminal) terminal.remove();
    const brutalistCTAs = document.getElementById('brutalist-cta-container');
    if (brutalistCTAs) brutalistCTAs.remove();
    
    // Reset styles
    document.body.style.fontFamily = '';
    document.body.style.backgroundColor = '';
    
    // Toon kaboom teller weer als je teruggaat naar Chapter 1
    const kaboomTeller = document.getElementById('kaboom-teller');
    if (kaboomTeller) kaboomTeller.style.display = 'block';
    
    this.isInitialized = false;
    this.terminalMode = false;
  }

  ensureThreeJSSceneVisible() {
    // Zorg ervoor dat de Three.js canvas zichtbaar blijft
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.display = 'block';
      canvas.style.position = 'absolute';
      canvas.style.zIndex = '1000';
      canvas.style.pointerEvents = 'auto';
    }
    
    // Zorg ervoor dat de renderer blijft renderen
    if (window.renderer) {
      window.renderer.setClearColor(0x000000);
    }
    
    // Zorg ervoor dat de scene zichtbaar is
    if (window.scene) {
      console.log('🏗️ Three.js scene is visible in Chapter 2');
    }
  }

  clearThreeJSScene() {
    console.log('🧹 Clearing Three.js scene...');
    
    // Verwijder alle objecten uit de scene
    if (window.scene) {
      while (window.scene.children.length > 0) {
        window.scene.remove(window.scene.children[0]);
      }
      console.log('✅ Scene cleared');
    }
    
    // Reset globale variabelen
    if (window.solly1) {
      window.solly1 = null;
    }
    if (window.solly2) {
      window.solly2 = null;
    }
    if (window.sollySun) {
      window.sollySun = null;
    }
    
    // Reset game state
    if (window.collisionDetected !== undefined) {
      window.collisionDetected = false;
    }
    if (window.shapeChoiceMade !== undefined) {
      window.shapeChoiceMade = false;
    }
    
    // Verwijder alle modals en overlays
    document.querySelectorAll('.solly-modal, .solly-modal-overlay, .kaboom-animation').forEach(el => el.remove());
    
    console.log('✅ Three.js scene completely cleared');
  }

  createBrutalistScene() {
    console.log('🏗️ Creating brutalist scene...');
    
    if (!window.scene || !window.camera || !window.renderer) {
      console.error('❌ Three.js components not available');
      return;
    }
    
    // Zet camera naar brutalistische positie
    window.camera.position.set(0, 2000, 6000);
    window.camera.lookAt(0, 0, 0);
    
    // Zet renderer naar brutalistische kleuren
    window.renderer.setClearColor(0x000000);
    
    // Voeg brutalistische lighting toe
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    window.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xFF0000, 1.0); // Rode licht
    directionalLight.position.set(1000, 1000, 1000);
    window.scene.add(directionalLight);
    
    // Maak brutalistische objecten
    this.createBrutalistObjects();
    
    console.log('✅ Brutalist scene created');
  }

  createBrutalistObjects() {
    // Start de Cube Challenge (grote draadkubus + placeholders)
    const chosenShape = localStorage.getItem('sollyverse_chosen_shape') || 'piramide';
    if (window.startCubeChallenge) {
      window.startCubeChallenge(chosenShape);
      console.log('✅ Cube Challenge gestart binnen Hoofdstuk 2');
    } else {
      console.warn('⚠️ startCubeChallenge functie niet gevonden');
    }
  }

  startBrutalistAnimate() {
    if (!window.renderer || !window.scene || !window.camera) return;
    function brutalistAnimate() {
      // Hier kun je animaties toevoegen voor brutalistische objecten
      if (window.cubeSpinActive && window.cubeGroup) {
        window.cubeGroup.rotation.y += 0.03;
      }
      // Update morph (indien actief)
      if (window.updateCubeMorph) {
        window.updateCubeMorph(0.016);
      }
      // eventuele andere animaties
      requestAnimationFrame(brutalistAnimate);
    }
    brutalistAnimate();
  }

  createOrShowBrutalistCTAs() {
    // Verwijder oude brutale controls als ze bestaan
    const old = document.getElementById('brutalist-cta-container');
    if (old) old.remove();
    // Maak container
    const container = document.createElement('div');
    container.id = 'brutalist-cta-container';
    container.style.cssText = `
      position: fixed;
      bottom: 32px;
      right: 32px;
      z-index: 3000;
      display: flex;
      flex-direction: column;
      gap: 18px;
      background: #000;
      border: 2.5px solid #FF0000;
      padding: 24px 18px;
      border-radius: 0;
      box-shadow: none;
    `;
    // Maak knoppen
    const ctas = [
      { id: 'cta-info', label: 'INFO', onclick: () => window.showInfoModal && window.showInfoModal() },
      { id: 'cta-instructies', label: 'INSTRUCTIES', onclick: () => window.showInstructionsModal && window.showInstructionsModal() },
      { id: 'cta-personaliseer', label: 'PERSONALISEER', onclick: () => window.showPersonaliseerModal && window.showPersonaliseerModal() }
    ];
    ctas.forEach(btn => {
      const el = document.createElement('button');
      el.id = btn.id;
      el.textContent = btn.label;
      el.className = 'brutalist-cta';
      el.style.cssText = `
        background: #000 !important;
        color: #fff !important;
        border: 2.5px solid #FF0000 !important;
        border-radius: 0 !important;
        font-family: 'Courier New', monospace;
        font-size: 1.1em;
        font-weight: bold;
        padding: 14px 0;
        margin: 0;
        box-shadow: none;
        text-transform: uppercase;
        letter-spacing: 2px;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
      `;
      el.onmouseenter = () => { el.style.background = '#FF0000'; el.style.color = '#000'; };
      el.onmouseleave = () => { el.style.background = '#000'; el.style.color = '#fff'; };
      el.onclick = btn.onclick;
      container.appendChild(el);
    });
    document.body.appendChild(container);
  }
}

// Export voor gebruik in andere modules
window.ChapterManager = ChapterManager; 