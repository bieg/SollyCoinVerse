// ===================================================================================
// ==                                                                             ==
// ==                             SOLLYVERSE - FASE 1                             ==
// ==                                 COMPLEET                                    ==
// ==                                                                             ==
// ==      Deze versie markeert de succesvolle voltooiing van de eerste fase.     ==
// ==      Alle kernfunctionaliteiten zijn geïmplementeerd en stabiel.            ==
// ==                                                                             ==
// ===================================================================================

console.log('SCRIPT LOADED!');

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
let miniSollys = [], redPlanets = [], blueSollys = [], whiteStars = [];
let solly1 = null, solly2 = null;
let solly1Movement = { time: 0, amplitude: 2000, frequency: 0.05 };
let collisionDetected = false;
let shapeChoiceMade = false;
let shapeModalTimeout = null;
let canSollyMove = false;
let isPaused = false;
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

// Camera follow variabelen
let cameraFollowActive = false;
let cameraFollowTarget = null;
let cameraFollowStart = null;
let cameraFollowStartTime = 0;
let cameraFollowDuration = 2000;

// Portal variabelen
let portal = null;
let portalActive = false;
let portalClicked = false;
let portalScale = 1.0;
let portalMovement = { time: 0, radius: 8000, speed: 0.02 };
let portalAnimating = false;

// Event listeners
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
        gameManager.loadCoinData(sollyConfig);
        userInterface.setStartedWithCoin(true);
    } else {
        const defaultCoin = await loadDefaultConfig();
        gameManager.loadCoinData(defaultCoin);
        userInterface.setStartedWithCoin(false);
    }

    userInterface.setGameStarted(true);
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

    // Camera logging wrappers
    const origSet = camera.position.set;
    camera.position.set = function(...args) {
        origSet.apply(this, args);
        console.log('camera.position.set', ...args, this);
        return this;
    };
    const origCopy = camera.position.copy;
    camera.position.copy = function(...args) {
        origCopy.apply(this, args);
        console.log('camera.position.copy', ...args, this);
        return this;
    };
    const origLookAt = camera.lookAt;
    camera.lookAt = function(...args) {
        origLookAt.apply(this, args);
        console.log('camera.lookAt', ...args, this.position);
        return this;
    };

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
    addPlanets(scene);
    addSollys(scene);
    addWhiteStars(scene);
    addSolly1AndSolly2(scene);

    // Plan collision after 4 seconds
    setTimeout(() => {
        if (!collisionDetected) {
            triggerCollision();
        }
    }, 4000);

    // Event listeners
    document.addEventListener('mousedown', onPortalClick, false);
    animate();
    window.addEventListener('resize', onWindowResize, false);
    showLevelIndicator();
    addPointerListener();

    sollyverseInitialized = true;
}

// Window resize handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Level indicator
function showLevelIndicator() {
    const el = document.getElementById('solly-level-indicator');
    const currentUser = gameManager ? gameManager.getCurrentUser() : null;
    
    if (currentUser && currentUser.level) {
        el.textContent = 'Level: ' + currentUser.level + ' | Shape: ' + currentUser.shape;
        el.style.display = 'block';
    } else if (sollyConfig && sollyConfig.level) {
        el.textContent = 'Level: ' + sollyConfig.level;
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

// ... Plaats hier alle JavaScript uit de inline <script>...</script> van index.html ... 