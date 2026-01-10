// ===================================================================================
// ==                           SOLLYVERSE MAIN.JS                                 ==
// ==                                                                             ==
// ==      Hoofdbestand voor de Sollyverse applicatie                           ==
// ==      Bevat alle initialisatie en event handling                          ==
// ===================================================================================
/* global THREE, GameManager, UserInterface, ChapterManager, WebSocketClientManager, CollisionManager, Level2Manager, addGalaxyShells, addGalaxyStars, addSollySun, addWhiteStars, addPlanets, addSollys, addSolly1AndSolly2, onPortalClick, showUniverseModal, updateCameraControls, updateOtherPlayerData */

// --- Startscherm en Star Wars intro ---
const startscreen = document.getElementById('startscreen');
const startBtn = document.getElementById('start-btn');
const starwarsIntro = document.getElementById('starwars-intro');
const starwarsCrawl = document.getElementById('starwars-crawl');
let starWarsIntroActive = false;
let sollyConfig = null;
let gameManager = null;
let userInterface = null;
let sollyverseInitialized = false;
let web3Manager = null;
let webSocketClient = null;

// Globale variabelen
let scene, camera, renderer, controls;
let solly1 = null,
  solly2 = null;
let solly1Movement = { time: 0, amplitude: 2000, frequency: 0.05 };
let collisionDetected = false;
let shapeChoiceMade = false;
let shapeModalTimeout = null;
let canSollyMove = false;
let isPaused = false;
window.isPaused = isPaused;
let sollySun, sollySunGlow;

// Camera animatie state
let cameraAnimationState = {
  active: false,
  startTime: 0,
  startPosition: null,
  zoomInDuration: 2500,
  zoomInTargetOffset: new THREE.Vector3(0, 100, 350),
  followDuration: 3500,
  followStartOffset: new THREE.Vector3(0, 100, 350),
  followEndOffset: new THREE.Vector3(0, 400, 1200),
};

// Portal variabelen
let portal = null;
let portalActive = false;
let portalScale = 1.0;
let portalMovement = { time: 0, radius: 8000, speed: 0.02 };
let portalAnimating = false;
let portalClicked = false;

// Import en wallet functionaliteit verwijderd - alleen Start button blijft

// Start button handler
document.getElementById('start-btn').onclick = function () {
  // Reset sollyConfig voor schone slate
  sollyConfig = null;

  // Reset database voor schone kaboom counter
  if (window.databaseManager && window.databaseManager.isInitialized) {
    console.log('🔄 Resetting database for clean start');
    window.databaseManager.resetDatabase();
  }

  startscreen.style.display = 'none';
  starwarsIntro.style.display = 'flex';

  // VOEG STERREN TOE TIJDENS STAR WARS ANIMATIE
  setTimeout(() => {
    console.log('⭐ Voeg sterren toe tijdens Star Wars animatie');
    createStarWarsStars();
  }, 200);

  setTimeout(() => {
    starwarsCrawl.classList.add('starwars-crawl-animate');
  }, 100);
  setTimeout(() => {
    starwarsIntro.style.display = 'none';
    starWarsIntroActive = false;

    // Cleanup CSS sterren
    if (window.cleanupStarWarsStars) {
      window.cleanupStarWarsStars();
    }

    initSollyverse();
  }, 9000);
  starWarsIntroActive = true;
};

// Functie om sterren toe te voegen tijdens Star Wars animatie - IN STAR WARS MODAL
function createStarWarsStars() {
  console.log('🌟 Creating stars INSIDE Star Wars modal');
  const starwarsModal = document.getElementById('starwars-intro');
  if (!starwarsModal) {
    console.error('❌ Star Wars modal not found');
    return;
  }

  const baseStyles = {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    overflow: 'hidden',
  };

  const starsContainer = getOrCreateStarsContainer('starwars-stars', starwarsModal, baseStyles);
  if (starsContainer.childElementCount === 0) {
    const starCount = 1700;
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      const size = 1 + Math.random() * 2;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const opacity = 0.4 + Math.random() * 0.4;
      star.style.cssText = `position:absolute;width:${size}px;height:${size}px;background:white;border-radius:50%;left:${x}%;top:${y}%;opacity:${opacity};box-shadow:0 0 ${size * 1.5}px rgba(255,255,255,.6);`;
      starsContainer.appendChild(star);
    }
    console.log(`⭐ Created ${starCount} stars for Star Wars animation`);
  }

  window.cleanupStarWarsStars = function () {
    if (!starsContainer) return;
    // hernoem id zodat imports het herkennen i.p.v. dupliceren
    starsContainer.id = 'background-stars';
    // pas styling aan voor vaste positie in main scene
    Object.assign(starsContainer.style, {
      position: 'fixed',
      width: '100vw',
      height: '100vh',
      zIndex: '1',
    });
    document.body.appendChild(starsContainer);
    console.log('✅ Starfield promoted to background-stars');
  };
}

// Functie om achtergrond sterren te maken voor geïmporteerde coins
function createBackgroundStars() {
  if (document.getElementById('background-stars')) {
    console.log('ℹ️ Background stars already exist – skipping creation');
    return;
  }
  console.log('🌟 Creating background stars for imported coin');

  // Maak een container voor de sterren
  const starsContainer = document.createElement('div');
  starsContainer.id = 'background-stars';
  starsContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        overflow: hidden;
        z-index: 1;
    `;
  document.body.appendChild(starsContainer);

  // Voeg sterren toe met CSS - zelfde als Star Wars
  const starCount = 1700;
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    const size = 1 + Math.random() * 2; // 1-3px
    const x = Math.random() * 100; // 0-100%
    const y = Math.random() * 100; // 0-100%
    const opacity = 0.4 + Math.random() * 0.4; // 0.4-0.8

    star.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: white;
            border-radius: 50%;
            left: ${x}%;
            top: ${y}%;
            opacity: ${opacity};
            box-shadow: 0 0 ${size * 1.5}px rgba(255, 255, 255, 0.6);
        `;

    starsContainer.appendChild(star);
  }

  console.log(`⭐ Created ${starCount} background stars for imported coin`);
}

async function loadDefaultConfig() {
  try {
    const response = await fetch('/coins/SollyCoin_default.json');
    return await response.json();
  } catch (error) {
    console.error('❌ Error loading default config:', error);
    return {
      level: 'beginner',
      shape: 'piramide',
      sterren: { totaal: 4000, wit: 4000 },
      planeten: { rood: 1000, groen: 1000 },
      sollys: { geel: 1750, blauw: 1750, pink: 0, rood: 1500 },
    };
  }
}

// Helper om HTML-tekstvriendelijk te maken
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Toon het gekozen SollyCoin-JSON in een modal
function displayChosenCoinJSON() {
  if (!sollyConfig) {
    console.warn('⚠️ Geen SollyCoin-config gevonden om te tonen.');
    return;
  }
  if (typeof showUniverseModal !== 'function') {
    console.warn('⚠️ showUniverseModal niet beschikbaar.');
    return;
  }
  const prettyJson = JSON.stringify(sollyConfig, null, 2);
  const html = `<pre style="text-align:left; color:#FFD700; white-space:pre-wrap; max-width:90vw;">${escapeHTML(prettyJson)}</pre>`;
  showUniverseModal(html, 'Jouw SollyCoin');
}

async function initSollyverse() {
  if (sollyverseInitialized) return;

  // TOON KABOOM COUNTER NA STAR WARS ANIMATIE
  const kaboomCounter = document.getElementById('kaboom-counter');
  if (kaboomCounter) {
    kaboomCounter.style.display = 'block';
    console.log('🎯 KABOOM counter zichtbaar gemaakt na Star Wars animatie');
  }

  // Initialize GameManager en UserInterface
  gameManager = new GameManager();
  userInterface = new UserInterface(gameManager);

  // Initialize ChapterManager
  window.chapterManager = new ChapterManager();

  // Initialize WebSocket Client for real-time communication (OPTIONEEL - alleen als server draait)
  // WebSocket is optioneel - game werkt ook zonder
  try {
    webSocketClient = new WebSocketClientManager();
    const wsInitialized = await webSocketClient.initialize();

    if (wsInitialized && webSocketClient) {
      // Setup WebSocket event listeners alleen als init succesvol was
      setupWebSocketEventListeners();
      console.log('✅ WebSocket client initialized');
    } else {
      console.warn('⚠️ WebSocket initialization skipped - server not available');
      webSocketClient = null;
    }
  } catch (error) {
    console.warn('⚠️ WebSocket initialization failed:', error.message);
    webSocketClient = null;
  }

  // ALTIJD BEGINNEN MET SCHONE SLATE - Default coin met kaboom op 0
  if (sollyConfig) {
    // Alleen als er een specifieke coin is geïmporteerd, gebruik die
    console.log('🪙 Specifieke coin geïmporteerd - behoud bestaande data');
    gameManager.loadCoinData(sollyConfig);
    userInterface.setStartedWithCoin(true);
  } else {
    // Altijd default coin met schone kaboom counter
    console.log('🔄 Schone slate - default coin met kaboom op 0');
    const defaultCoin = await loadDefaultConfig();

    // Zorg ervoor dat kaboom altijd op 0 staat voor nieuwe starts
    defaultCoin.kaboom = 0;

    // Reset database kaboom counter ook
    if (gameManager.databaseManager && gameManager.databaseManager.isInitialized) {
      console.log('🔄 Resetting database kaboom counter');
      gameManager.databaseManager.kaboomData.totalKabooms = 0;
      gameManager.databaseManager.kaboomData.sessionKabooms = 0;
      gameManager.databaseManager.kaboomData.levelKabooms = { 1: 0 };
      gameManager.databaseManager.saveAllData();
    }

    gameManager.loadCoinData(defaultCoin);
    userInterface.setStartedWithCoin(false);
  }

  // Mark game as started
  userInterface.setGameStarted(true);

  // Get current user data
  const currentUser = gameManager.getCurrentUser();
  sollyConfig = currentUser;

  // Three.js setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
  camera.position.set(0, 1000, 4000);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x0a0a0a); // Donkergrijze achtergrond voor Level 1
  document.body.appendChild(renderer.domElement);

  // ✅ Maak globals beschikbaar zodra renderer bestaat
  window.renderer = renderer;
  window.scene = scene;
  window.camera = camera;
  window.controls = controls;
  window.gameManager = gameManager;
  window.userInterface = userInterface;

  // Initialize CollisionManager met schone slate
  window.collisionManager = new CollisionManager();

  // Reset collision detection voor schone start
  if (window.collisionManager) {
    window.collisionManager.resetCollision();
  }

  // Initialize Level2Manager
  if (window.Level2Manager) {
    window.level2Manager = new Level2Manager();
    console.log('🎯 Level2Manager initialized');
  } else {
    console.error('❌ Level2Manager class not available');
  }

  // Mini-Solly click event: kaboom bij click
  renderer.domElement.addEventListener('click', function (e) {
    if (window.solly1DragActive) return; // niet tijdens drag
    if (!window.miniSollys || window.miniSollys.length === 0) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    // Alleen zichtbare mini-Sollys
    const validMiniSollys = window.miniSollys.filter((m) => m && m.parent && m.visible);
    const intersects = raycaster.intersectObjects(validMiniSollys, false);
    if (intersects.length > 0) {
      const mini = intersects[0].object;
      if (typeof window.handleSollyOnMini === 'function') {
        window.handleSollyOnMini(mini);
      }
      if (typeof window.spawnKaboom === 'function') {
        window.spawnKaboom(mini.position);
      }
    }
  });

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 20000;
  controls.minDistance = 0;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1000, 1000, 1000);
  scene.add(directionalLight);

  // Add galaxy components NA Star Wars animatie - sterrenhemel blijft staan
  addGalaxyShells(scene);
  addGalaxyStars(scene);
  addSollySun(scene);
  addWhiteStars(scene); // Voeg 3D sterren toe gebaseerd op SollyCoin data

  // Voor geïmporteerde coins: maak sterrenhemel als er geen Star Wars was
  if (sollyConfig && !starWarsIntroActive) {
    console.log('🌟 Creating background stars for imported coin');
    createBackgroundStars();
  }

  // Add game objects NA Star Wars animatie - sterrenhemel blijft staan als basis
  setTimeout(() => {
    console.log('🌟 Voeg planeten toe na Star Wars animatie');
    addPlanets(scene);
  }, 1000);

  setTimeout(() => {
    console.log('🪙 Voeg Sollies toe na Star Wars animatie');
    addSollys(scene);
  }, 2000);

  setTimeout(() => {
    console.log('🎯 Voeg Solly1 en Solly2 toe na Star Wars animatie');
    addSolly1AndSolly2(scene);
  }, 3000);

  // Plan collision na 7 seconden (4 seconden na laatste objecten)
  setTimeout(() => {
    if (!collisionDetected) {
      triggerCollision();
    }
  }, 7000);

  // Event listeners
  document.addEventListener('mousedown', onPortalClick, false);

  // Start animatie
  animate();
  window.addEventListener('resize', onWindowResize, false);
  showLevelIndicator();
  addPointerListener();

  sollyverseInitialized = true;
  // CTA-buttons tonen als het universum draait
  const ctaButtons = document.getElementById('cta-buttons');
  if (ctaButtons) ctaButtons.style.display = 'flex';

  // CTA-click handlers
  const infoBtn = document.getElementById('cta-info');
  const instructiesBtn = document.getElementById('cta-instructies');
  const personaliseerBtn = document.getElementById('cta-personaliseer');
  const locateSollyBtn = document.getElementById('cta-locate-solly');
  // Forceer pointer-events voor klikbaarheid
  [infoBtn, instructiesBtn, personaliseerBtn, locateSollyBtn].forEach((btn) => {
    if (btn) btn.style.pointerEvents = 'auto';
  });

  function safeShowModal(html, title) {
    if (typeof showUniverseModal === 'function') {
      showUniverseModal(html, title);
    } else {
      alert(title + '\n\n' + html.replace(/<[^>]+>/g, ''));
    }
  }
  if (infoBtn)
    infoBtn.addEventListener('click', () => {
      console.log('CTA Info clicked');
      showInfoModal();
    });
  if (instructiesBtn)
    instructiesBtn.addEventListener('click', () => {
      console.log('CTA Instructies clicked');
      showInstructionsModal();
    });
  if (personaliseerBtn)
    personaliseerBtn.addEventListener('click', () => {
      console.log('CTA Personaliseer clicked');
      showPersonaliseerModal();
    });
  if (locateSollyBtn)
    locateSollyBtn.addEventListener('click', () => {
      console.log('CTA Locate Solly clicked');
      locateSolly();
    });

  // ---------- Modal helpers ----------
  function showInfoModal() {
    const user = gameManager ? gameManager.getCurrentUser() : sollyConfig;
    if (!user) return;

    function fmtDate(iso) {
      if (!iso) return '';
      const d = new Date(iso);
      return d.toLocaleDateString('nl-NL');
    }

    const html = `<ul style="text-align:left; line-height:1.6; list-style:none; padding-left:0;">
            <li><strong>${user.id || ''}</strong></li>
            <li>Level: <strong>${user.level}</strong></li>
            <li>Shape: <strong>${user.shape}</strong></li>
            <li>Size: <strong>${user.size}</strong></li>
            <li>Sterrenscore: <strong>${user.sterren?.totaal || user.sterren}</strong></li>
            <li>Created: <strong>${fmtDate(user.createdAt)}</strong></li>
            <li>Last played: <strong>${fmtDate(user.lastPlayed)}</strong></li>
            <li>Session start: <strong>${fmtDate(user.sessionStart)}</strong></li>
        </ul>`;
    safeShowModal(html, 'SollyCoin Samenvatting');
  }

  function showInstructionsModal() {
    const html = `<ul style="text-align:left; line-height:1.6;">
            <li>Beweeg camera: <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> of pijltjestoetsen</li>
            <li>Zoom: scroll / pinch</li>
            <li>Sleep Solly&nbsp;1 om rond te vliegen</li>
            <li>Botsing: laat Solly&nbsp;1 met minimaal <strong>60&nbsp;% 2D-overlap</strong> landen op een mini-Solly (geel).</li>
        </ul>`;
    safeShowModal(html, 'Instructies');
  }

  function showPersonaliseerModal() {
    const html = `<p>Personaliseer-functie komt binnenkort!<br/>
            Kies straks vormen, kleuren en accessoires voor jouw Solly.</p>`;
    safeShowModal(html, 'Personaliseer');
  }

  window.showInfoModal = showInfoModal;
  window.showInstructionsModal = showInstructionsModal;
  window.showPersonaliseerModal = showPersonaliseerModal;

  // JSON-voorbeeldpanel wordt niet langer automatisch getoond
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Hard 2D-mode voor Level 2: geen camera/scene updates
  if (window.level2Active) {
    if (controls) {
      controls.enabled = false;
    }
    if (cameraAnimationState && cameraAnimationState.active) {
      cameraAnimationState.active = false;
    }
    renderer.render(scene, camera);
    return;
  }

  // Skip animaties tijdens drag
  if (!window.isPaused && !window.solly1DragActive) {
    updateSolly1Movement();
    updateSolly2Movement();
    updatePortalMovement();
    // Collision detection wordt nu alleen via drag & drop afgehandeld
    // Geen automatische collision checks meer
  }

  if (typeof updateCameraControls === 'function') updateCameraControls();
  updateCameraFollow();
  controls.update();
  renderer.render(scene, camera);
}

// Enable Solly movement after initialization
setTimeout(() => {
  canSollyMove = true;
  console.log('🎮 Solly movement enabled');
}, 2000);

// Solly movement functions
function updateSolly1Movement() {
  if (window.solly1DragActive) return;
  if (window.solly1MovementPaused) return;
  if (!solly1 || !canSollyMove) return;

  solly1Movement.time += 0.016;
  const time = solly1Movement.time;
  const amplitude = solly1Movement.amplitude;
  const frequency = solly1Movement.frequency;

  const x = Math.sin(time * frequency) * amplitude;
  const y = Math.cos(time * frequency * 0.7) * amplitude * 0.3;
  const z = Math.sin(time * frequency * 0.5) * amplitude * 0.8;

  solly1.position.set(x, y, z);
}

function updateSolly2Movement() {
  if (!solly2 || !canSollyMove) return;

  // Solly2 jaagt op Solly1
  if (solly1) {
    const direction = new THREE.Vector3().subVectors(solly1.position, solly2.position);
    const distance = direction.length();

    if (distance > 100) {
      direction.normalize();
      const speed = 2;
      solly2.position.add(direction.multiplyScalar(speed));
    }
  }
}

// Portal movement
function updatePortalMovement() {
  if (!portal || !portalActive) return;

  if (!portalClicked) {
    portalMovement.time += 0.016;
    const time = portalMovement.time;
    const radius = 1500; // Kleinere radius zodat portal dichter bij staat
    const speed = 0.03; // Nog langzamere beweging

    const theta = time * speed;
    const phi = Math.sin(time * speed * 0.3) * (Math.PI / 3);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = 200 + radius * Math.sin(phi) * Math.sin(theta) * 0.3; // Op dezelfde hoogte als Solly1
    const z = radius * Math.cos(phi);

    portal.position.set(x, y, z);
  }
}

// Camera follow
function updateCameraFollow() {
  if (!cameraAnimationState.active) return;

  const now = Date.now();
  const elapsed = now - cameraAnimationState.startTime;
  const t = Math.min(elapsed / cameraAnimationState.zoomInDuration, 1);
  const ease = 1 - Math.pow(1 - t, 3);

  camera.position.lerpVectors(
    cameraAnimationState.startPosition,
    cameraAnimationState.zoomInTargetOffset,
    ease,
  );

  if (t >= 1) {
    cameraAnimationState.active = false;
    camera.position.copy(cameraAnimationState.zoomInTargetOffset);
  }
}

// Window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Show level indicator
function showLevelIndicator() {
  const levelIndicator = document.getElementById('solly-level-indicator');
  if (levelIndicator) {
    levelIndicator.style.display = 'block';
    levelIndicator.textContent = `Level: ${gameManager.getCurrentLevel()}`;
  }
}

// Add pointer listener
function addPointerListener() {
  // Portal click detection
  function onPortalClick(event) {
    // Skip als er een ShapeChoice modal open is
    if (window.shapeChoiceModalOpen) {
      return;
    }

    // Skip als er een modal element wordt geklikt
    const clickedElement = event.target;
    if (
      clickedElement.closest('.shape-choice-modal') ||
      clickedElement.closest('.modal') ||
      clickedElement.closest('.overlay')
    ) {
      return;
    }

    if (!portal || !portalActive) return;

    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(portal, true);

    if (intersects.length > 0) {
      portalClicked = true;
      console.log('🚪 Portal clicked!');
    }
  }
}

// Trigger collision
function triggerCollision() {
  if (collisionDetected) return;
  collisionDetected = true;

  console.log('💥 Collision triggered!');

  // Start explosie animatie als de functie beschikbaar is
  if (typeof window.createCollisionExplosion === 'function') {
    window.createCollisionExplosion();
  }
}

// === Collision Solly1 vs miniSollys ===
// Deze functie is vervangen door drag & drop collision detection in sollys.js
// function checkMiniSollyCollision() {
//     // Verwijderd - collision detection gebeurt nu via drag & drop
// }

// applyUniverseScaling verwijderd – universe gebruikt vaste basiswaarden

// === ⭐️ UTIL: STERRENCONTAINER  ==================================================
function getOrCreateStarsContainer(id, parent, baseStyles) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    Object.assign(el.style, baseStyles);
    parent.appendChild(el);
  }
  return el;
}

// === 🎯 LOCATE SOLLY FUNCTIONALITY ================================================
function locateSolly() {
  console.log('🎯 Locating Solly...');

  // Check if Solly1 exists
  if (!window.solly1) {
    console.warn('❌ Solly1 not found');
    alert('❌ Solly niet gevonden! Probeer het spel opnieuw te starten.');
    return;
  }

  // Check if camera exists
  if (!window.camera) {
    console.warn('❌ Camera not found');
    alert('❌ Camera niet gevonden!');
    return;
  }

  // Smooth camera transition to Solly1
  const startPosition = window.camera.position.clone();

  // Animation parameters
  const duration = 2000; // 2 seconds
  const startTime = performance.now();

  function animateCamera() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Get Solly1's CURRENT position (updated every frame)
    const currentSollyPosition = window.solly1.position.clone();

    // Calculate target position based on current Solly position
    const targetPosition = new THREE.Vector3(
      currentSollyPosition.x + 500, // Offset to the right
      currentSollyPosition.y + 200, // Offset above
      currentSollyPosition.z + 500, // Offset forward
    );

    // Smooth easing function
    const easeProgress = 1 - Math.pow(1 - progress, 3);

    // Interpolate camera position
    window.camera.position.lerpVectors(startPosition, targetPosition, easeProgress);

    // Look at Solly1's current position
    window.camera.lookAt(currentSollyPosition);

    if (progress < 1) {
      requestAnimationFrame(animateCamera);
    } else {
      console.log('✅ Camera focused on Solly1 at position:', currentSollyPosition);

      // Add visual highlight effect
      highlightSolly();
    }
  }

  // Start animation
  animateCamera();
}

// Highlight Solly1 with visual effect
function highlightSolly() {
  if (!window.solly1) return;

  // Store original material
  const originalMaterial = window.solly1.material;

  // Create highlight material
  const highlightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd700, // Gold color
    transparent: true,
    opacity: 0.8,
    emissive: 0xffd700,
    emissiveIntensity: 0.3,
  });

  // Apply highlight
  window.solly1.material = highlightMaterial;

  // Remove highlight after 3 seconds
  setTimeout(() => {
    if (window.solly1 && originalMaterial) {
      window.solly1.material = originalMaterial;
      console.log('✨ Solly1 highlight removed');
    }
  }, 3000);

  console.log('✨ Solly1 highlighted');
}

// ===================================================================================
// ==                           WEBSOCKET EVENT LISTENERS                          ==
// ===================================================================================

function setupWebSocketEventListeners() {
  if (!webSocketClient || !webSocketClient.socket) {
    console.warn('⚠️ WebSocket not available - skipping event listeners');
    return;
  }

  // Connection events
  webSocketClient.on('connected', (data) => {
    console.log('🔗 WebSocket connected:', data.playerId);
    // Update UI to show multiplayer status
    updateMultiplayerStatus(true);
  });

  webSocketClient.on('disconnected', () => {
    console.log('🔌 WebSocket disconnected');
    updateMultiplayerStatus(false);
  });

  webSocketClient.on('connectionError', (error) => {
    // VERMINDER CONSOLE SPAM - alleen eerste error loggen
    if (!window.wsErrorLogged) {
      console.warn('⚠️ WebSocket connection failed - multiplayer disabled');
      window.wsErrorLogged = true;
    }
    updateMultiplayerStatus(false);
  });

  // Game state events
  webSocketClient.on('gameStateReceived', (gameState) => {
    console.log('📊 Game state received:', gameState);
    // Sync local game state with server
    syncGameState(gameState);
  });

  webSocketClient.on('gameStateUpdated', (update) => {
    // VOORKOMEN VAN CONSOLE SPAM - alleen bij wijzigingen loggen
    // console.log('📊 Game state updated:', update);
    // Update global stats display
    updateGlobalStats(update.globalStats);
  });

  // Player events
  webSocketClient.on('playerMoved', (data) => {
    console.log('👤 Player moved:', data);
    // Update other players' positions in 3D scene
    updateOtherPlayerPosition(data);
  });

  webSocketClient.on('playerCountUpdate', (count) => {
    console.log('👥 Player count updated:', count);
    updatePlayerCountDisplay(count);
  });

  // Collision events
  webSocketClient.on('collision', (data) => {
    console.log('💥 Remote collision:', data);
    // Show collision effect for other players
    showRemoteCollisionEffect(data);
  });

  webSocketClient.on('kaboom', (data) => {
    console.log('💥 Remote kaboom:', data);
    // Update global kaboom counter
    updateGlobalKaboomCounter(data.totalKabooms);
  });

  // Universe events
  webSocketClient.on('universeUpdated', (universe) => {
    console.log('🌌 Universe updated:', universe);
    // Sync universe state
    syncUniverseState(universe);
  });

  // Chat events
  webSocketClient.on('chatMessage', (message) => {
    console.log('💬 Chat message:', message);
    // Display chat message in UI
    displayChatMessage(message);
  });

  // Max reconnect attempts reached
  webSocketClient.on('maxReconnectAttemptsReached', () => {
    if (!window.wsMaxReconnectLogged) {
      console.warn('⚠️ WebSocket disabled - continuing without multiplayer');
      window.wsMaxReconnectLogged = true;
    }
  });
}

// Helper functions for WebSocket integration
function updateMultiplayerStatus(isConnected) {
  const statusElement = document.getElementById('multiplayer-status');
  if (statusElement) {
    statusElement.textContent = isConnected ? '🔗 Verbonden' : '🔌 Verbinding verbroken';
    statusElement.style.color = isConnected ? '#28a745' : '#dc3545';
  }
}

function syncGameState(gameState) {
  // Sync local game state with server state
  if (gameManager && gameState.players) {
    // Update player data from server
    Object.values(gameState.players).forEach((player) => {
      if (player.playerId !== webSocketClient.getPlayerId()) {
        // This is another player's data
        updateOtherPlayerData(player);
      }
    });
  }
}

function updateGlobalStats(globalStats) {
  // Update global statistics display
  const statsElement = document.getElementById('global-stats');
  if (statsElement) {
    statsElement.innerHTML = `
      <div>👥 Actieve spelers: ${globalStats.activePlayers}</div>
      <div>💥 Totale kabooms: ${globalStats.totalKabooms}</div>
      <div>⏱️ Totale speeltijd: ${Math.round(globalStats.totalPlayTime / 1000)}s</div>
    `;
  }
}

function updateOtherPlayerPosition(data) {
  // Update other players' positions in 3D scene
  if (scene && data.position) {
    // Find or create player object
    let playerObject = scene.getObjectByName(`player_${data.playerId}`);
    if (!playerObject) {
      // Create new player object
      playerObject = createPlayerObject(data.playerId);
      scene.add(playerObject);
    }

    // Update position and rotation
    playerObject.position.set(data.position.x, data.position.y, data.position.z);
    playerObject.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
  }
}

function createPlayerObject(playerId) {
  // Create a simple player representation
  const geometry = new THREE.ConeGeometry(50, 100, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const playerObject = new THREE.Mesh(geometry, material);
  playerObject.name = `player_${playerId}`;
  return playerObject;
}

function updatePlayerCountDisplay(count) {
  const countElement = document.getElementById('player-count');
  if (countElement) {
    countElement.textContent = `👥 ${count} spelers online`;
  }
}

function showRemoteCollisionEffect(data) {
  // Show collision effect for other players
  if (typeof window.spawnKaboom === 'function') {
    window.spawnKaboom(data.position);
  }
}

function updateGlobalKaboomCounter(totalKabooms) {
  // Update global kaboom counter display
  const globalKaboomElement = document.getElementById('global-kaboom-counter');
  if (globalKaboomElement) {
    globalKaboomElement.textContent = `🌍 ${totalKabooms}`;
  }
}

function syncUniverseState(universe) {
  // Sync universe state with server
  if (gameManager && universe) {
    // Update universe data
    gameManager.updateUniverseState(universe);
  }
}

function displayChatMessage(message) {
  // Display chat message in UI
  const chatContainer = document.getElementById('chat-container');
  if (chatContainer) {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `
      <span class="player-id">${message.playerId}:</span>
      <span class="message-text">${message.message}</span>
      <span class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</span>
    `;
    chatContainer.appendChild(messageElement);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

// Send player movement to server
function sendPlayerMovement(position, rotation) {
  if (webSocketClient && webSocketClient.isWebSocketConnected()) {
    webSocketClient.sendPlayerMove(position, rotation);
  }
}

// Keyboard shortcuts om hoofdstukken direct te laden
document.addEventListener('keydown', (e) => {
  // Ctrl+2 (Windows/Linux) of Cmd+2 (Mac) - Chapter 2
  if ((e.ctrlKey || e.metaKey) && e.key === '2') {
    e.preventDefault();
    console.log('⌨️ Keyboard shortcut: Direct naar Hoofdstuk 2');

    if (window.initChapter2) {
      if (window.level2Active) {
        console.log('⚠️ Hoofdstuk 2 is al actief');
        return;
      }

      try {
        console.log('🚀 Loading Hoofdstuk 2 via keyboard shortcut...');
        window.initChapter2();
      } catch (error) {
        console.error('❌ Error loading Hoofdstuk 2:', error);
      }
    } else {
      console.warn('⚠️ initChapter2 niet beschikbaar');
    }
  }

  // Ctrl+3 (Windows/Linux) of Cmd+3 (Mac) - Chapter 3
  if ((e.ctrlKey || e.metaKey) && e.key === '3') {
    e.preventDefault();
    console.log('⌨️ Keyboard shortcut: Direct naar Hoofdstuk 3 (Neon Cyberpunk)');

    if (window.initChapter3) {
      if (window.level3Active) {
        console.log('⚠️ Hoofdstuk 3 is al actief');
        return;
      }

      try {
        console.log('🚀 Loading Hoofdstuk 3: Neon Cyberpunk via keyboard shortcut...');
        window.initChapter3();
      } catch (error) {
        console.error('❌ Error loading Hoofdstuk 3:', error);
      }
    } else {
      console.warn('⚠️ initChapter3 niet beschikbaar');
    }
  }

  // Ctrl+4 (Windows/Linux) of Cmd+4 (Mac) - Chapter 4
  if ((e.ctrlKey || e.metaKey) && e.key === '4') {
    e.preventDefault();
    console.log('⌨️ Keyboard shortcut: Direct naar Hoofdstuk 4 (De Meester)');

    if (window.initChapter4) {
      if (window.level4Active) {
        console.log('⚠️ Hoofdstuk 4 is al actief');
        return;
      }

      try {
        console.log('🚀 Loading Hoofdstuk 4: De Meester via keyboard shortcut...');
        window.initChapter4();
      } catch (error) {
        console.error('❌ Error loading Hoofdstuk 4:', error);
      }
    } else {
      console.warn('⚠️ initChapter4 niet beschikbaar');
    }
  }
});

// Send collision to server
function sendCollisionToServer(position, level) {
  if (webSocketClient && webSocketClient.isWebSocketConnected()) {
    webSocketClient.sendCollision(position, level);
  }
}

// Send universe update to server
function sendUniverseUpdateToServer(universeData) {
  if (webSocketClient && webSocketClient.isWebSocketConnected()) {
    webSocketClient.sendUniverseUpdate(universeData);
  }
}

// Send chat message to server
function sendChatMessageToServer(message) {
  if (webSocketClient && webSocketClient.isWebSocketConnected()) {
    webSocketClient.sendChatMessage(message);
  }
}
