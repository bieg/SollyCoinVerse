// ===================================================================================
// ==                           SOLLYVERSE MAIN.JS                                 ==
// ==                                                                             ==
// ==      Hoofdbestand voor de Sollyverse applicatie                           ==
// ==      Bevat alle initialisatie en event handling                          ==
// ===================================================================================

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

// Globale variabelen
let scene, camera, renderer, controls;
let solly1 = null, solly2 = null;
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
    followEndOffset: new THREE.Vector3(0, 400, 1200)
};

// Portal variabelen
let portal = null;
let portalActive = false;
let portalScale = 1.0;
let portalMovement = { time: 0, radius: 8000, speed: 0.02 };
let portalAnimating = false;

// Import file handler
document.getElementById('import-file').onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const json = JSON.parse(evt.target.result);
            function isValidSollyCoin(obj) {
                if (!obj || typeof obj !== 'object') return false;
                if (typeof obj.level !== 'string') return false;
                if (!obj.sterren || typeof obj.sterren.wit !== 'number') return false;
                if (!obj.planeten || typeof obj.planeten.rood !== 'number') return false;
                if (!obj.sollys || typeof obj.sollys !== 'object') return false;
                if (typeof obj.sollys.geel !== 'number') return false;
                if (typeof obj.sollys.blauw !== 'number') return false;
                if (typeof obj.sollys.pink !== 'number') return false;
                if (typeof obj.sollys.rood !== 'number') return false;
                return true;
            }
            if (!isValidSollyCoin(json)) {
                throw new Error('Structuur van het JSON-bestand klopt niet met de SollyCoin-specificatie.');
            }
            sollyConfig = json;
            document.getElementById('import-error').style.display = 'none';
        } catch (err) {
            document.getElementById('import-error').textContent = 'Ongeldig SollyCoin JSON-bestand! (' + err.message + ')';
            document.getElementById('import-error').style.display = 'block';
            startscreen.style.display = 'flex';
            starwarsIntro.style.display = 'none';
        }
    };
    reader.readAsText(file);
};

// Start button handler
document.getElementById('start-btn').onclick = function() {
    startscreen.style.display = 'none';
    starwarsIntro.style.display = 'flex';
    setTimeout(() => {
        starwarsCrawl.classList.add('starwars-crawl-animate');
    }, 100);
    setTimeout(() => {
        starwarsIntro.style.display = 'none';
        starWarsIntroActive = false;
        initSollyverse();
    }, 9000);
    starWarsIntroActive = true;
};

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
            sollys: { geel: 1750, blauw: 1750, pink: 0, rood: 1500 }
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
    
    // Initialize GameManager en UserInterface
    gameManager = new GameManager();
    userInterface = new UserInterface(gameManager);

    // Probeer eerst opgeslagen voortgang te laden
    const hasLoadedProgress = gameManager.loadProgress();
    
    if (hasLoadedProgress) {
        console.log('📂 Opgeslagen voortgang geladen van localStorage');
        userInterface.setStartedWithCoin(true);
    } else if (sollyConfig) {
        // Import config als coin data
        gameManager.loadCoinData(sollyConfig);
        userInterface.setStartedWithCoin(true);
    } else {
        // Laad default coin data
        const defaultCoin = await loadDefaultConfig();
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
    renderer.setClearColor(0x000000);
    document.body.appendChild(renderer.domElement);

    // ✅ Maak globals beschikbaar zodra renderer bestaat
    window.renderer = renderer;
    window.scene = scene;
    window.camera = camera;
    window.controls = controls;
    window.gameManager = gameManager;

    // Initialize CollisionManager
    window.collisionManager = new CollisionManager();

    // Mini-Solly click event: kaboom bij click
    renderer.domElement.addEventListener('click', function(e) {
        if (window.solly1DragActive) return; // niet tijdens drag
        if (!window.miniSollys || window.miniSollys.length === 0) return;
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        // Alleen zichtbare mini-Sollys
        const validMiniSollys = window.miniSollys.filter(m => m && m.parent && m.visible);
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

    // Add galaxy components
    addGalaxyShells(scene);
    addGalaxyStars(scene);
    addSollySun(scene);

    // Add game objects
    addPlanets(scene);
    addSollys(scene);
    addWhiteStars(scene);
    addSolly1AndSolly2(scene);

    // Plan collision na 4 seconden
    setTimeout(() => {
        if (!collisionDetected) {
            triggerCollision();
        }
    }, 4000);

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
    // Forceer pointer-events voor klikbaarheid
    [infoBtn, instructiesBtn, personaliseerBtn].forEach(btn => {
        if (btn) btn.style.pointerEvents = 'auto';
    });

    function safeShowModal(html, title) {
        if (typeof showUniverseModal === 'function') {
            showUniverseModal(html, title);
        } else {
            alert(title + "\n\n" + html.replace(/<[^>]+>/g, ''));
        }
    }
    if (infoBtn) infoBtn.addEventListener('click', () => {
        console.log('CTA Info clicked');
        showInfoModal();
    });
    if (instructiesBtn) instructiesBtn.addEventListener('click', () => {
        console.log('CTA Instructies clicked');
        showInstructionsModal();
    });
    if (personaliseerBtn) personaliseerBtn.addEventListener('click', () => {
        console.log('CTA Personaliseer clicked');
        showPersonaliseerModal();
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
            <li>Botsing: laat Solly&nbsp;2 (groen) Solly&nbsp;1 raken!</li>
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
    
    if (!window.isPaused && !window.solly1DragActive) {
        updateSolly1Movement();
        updateSolly2Movement();
        updatePortalMovement();
        if (!collisionDetected) checkMiniSollyCollision();
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
        const radius = 2000;
        const speed = 0.08;
        
        const theta = time * speed;
        const phi = Math.sin(time * speed * 0.3) * (Math.PI / 3);

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta) * 0.8;
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
    
    camera.position.lerpVectors(cameraAnimationState.startPosition, cameraAnimationState.zoomInTargetOffset, ease);
    
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
        if (!portal || !portalActive) return;
        
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
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
function checkMiniSollyCollision() {
    // === Alleen collision checken als drop nog niet is afgehandeld ===
    if (window.solly1DropHandled === true) return;
    
    // Gebruik CollisionManager voor collision detection
    if (window.collisionManager) {
        window.collisionManager.checkMiniSollyCollision();
    }
}

// applyUniverseScaling verwijderd – universe gebruikt vaste basiswaarden