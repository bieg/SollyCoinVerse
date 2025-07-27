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
        initSollyverse();
    }, 9000);
    starWarsIntroActive = true;
};

// Functie om sterren toe te voegen tijdens Star Wars animatie
function createStarWarsStars() {
    console.log('🌟 Creating stars for Star Wars animation');
    
    // Maak een tijdelijke scene voor de sterren
    const tempScene = new THREE.Scene();
    const tempCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
    const tempRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    tempRenderer.setSize(window.innerWidth, window.innerHeight);
    tempRenderer.setClearColor(0x000000, 0); // Transparante achtergrond
    tempRenderer.domElement.style.position = 'fixed';
    tempRenderer.domElement.style.top = '0';
    tempRenderer.domElement.style.left = '0';
    tempRenderer.domElement.style.zIndex = '9998'; // Onder de Star Wars tekst
    tempRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(tempRenderer.domElement);
    
    // Voeg sterren toe - EENVOUDIGER EN ZICHTBAARDER
    const starCount = 1000; // Minder sterren voor betere performance
    const starGeometry = new THREE.SphereGeometry(8, 8, 8); // Nog grotere sterren
    const starMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 1.0
    });
    
    for (let i = 0; i < starCount; i++) {
        const star = new THREE.Mesh(starGeometry, starMaterial);
        
        // Verspreid sterren in een 2D vlak voor betere zichtbaarheid
        const x = (Math.random() - 0.5) * window.innerWidth * 2;
        const y = (Math.random() - 0.5) * window.innerHeight * 2;
        const z = -1000; // Vaste diepte
        
        star.position.set(x, y, z);
        
        // Maak sommige sterren groter voor variatie
        const scale = 1 + Math.random() * 3;
        star.scale.set(scale, scale, scale);
        
        tempScene.add(star);
    }
    
    // Position camera voor 2D weergave
    tempCamera.position.set(0, 0, 1000);
    tempCamera.lookAt(0, 0, 0);
    
    // Animate stars
    function animateStars() {
        if (starWarsIntroActive) {
            tempRenderer.render(tempScene, tempCamera);
            requestAnimationFrame(animateStars);
        } else {
            // Cleanup when Star Wars is done
            console.log('🧹 Cleaning up Star Wars stars');
            document.body.removeChild(tempRenderer.domElement);
            tempRenderer.dispose();
        }
    }
    
    // Voeg een test ster toe in het midden om te zien of rendering werkt
    const testStar = new THREE.Mesh(
        new THREE.SphereGeometry(20, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xFF0000 }) // Rode test ster
    );
    testStar.position.set(0, 0, -500);
    tempScene.add(testStar);
    console.log('🔴 Added red test star in center');
    
    console.log(`⭐ Created ${starCount} stars for Star Wars animation`);
    console.log(`📷 Camera position: ${tempCamera.position.x}, ${tempCamera.position.y}, ${tempCamera.position.z}`);
    console.log(`🎬 Renderer added to DOM with z-index: ${tempRenderer.domElement.style.zIndex}`);
    console.log(`🌌 Stars positioned in 2D plane for better visibility`);
    
    animateStars();
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
    
    // TOON KABOOM COUNTER NA STAR WARS ANIMATIE
    const kaboomCounter = document.getElementById('kaboom-counter');
    if (kaboomCounter) {
        kaboomCounter.style.display = 'block';
        console.log('🎯 KABOOM counter zichtbaar gemaakt na Star Wars animatie');
    }
    
    // Initialize GameManager en UserInterface
    gameManager = new GameManager();
    userInterface = new UserInterface(gameManager);

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

    // Add galaxy components TIJDENS Star Wars animatie
    addGalaxyShells(scene);
    addGalaxyStars(scene);
    addSollySun(scene);
    addWhiteStars(scene); // Witte sterren ook TIJDENS Star Wars animatie

    // Add game objects NA Star Wars animatie - met delay voor mooiere introductie
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
        // Skip als er een ShapeChoice modal open is
        if (window.shapeChoiceModalOpen) {
            return;
        }
        
        // Skip als er een modal element wordt geklikt
        const clickedElement = event.target;
        if (clickedElement.closest('.shape-choice-modal') || 
            clickedElement.closest('.modal') || 
            clickedElement.closest('.overlay')) {
            return;
        }
        
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
// Deze functie is vervangen door drag & drop collision detection in sollys.js
// function checkMiniSollyCollision() {
//     // Verwijderd - collision detection gebeurt nu via drag & drop
// }

// applyUniverseScaling verwijderd – universe gebruikt vaste basiswaarden