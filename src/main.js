// ===================================================================================
// ==                                                                             ==
// ==                             SOLLYVERSE - VEREENVOUDIGD                      ==
// ==                                 KERN VERSIE                                 ==
// ==                                                                             ==
// ==      Deze versie bevat alleen de essentiële functionaliteit:               ==
// ==      - Startscherm en Star Wars intro                                      ==
// ==      - Zon (Core 1)                                                        ==
// ==      - Solly1 en Solly2 botsing                                            ==
// ==      - Shape choice modal                                                  ==
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
let sollySun, sollySunGlow;
let kaboomActive = false; // Globale flag om spammen te voorkomen
let vortexPullActive = false;
let solly2FollowActive = false; // false: Solly2 staat stil
window.solly2FollowActive = solly2FollowActive;

// === INTERACTIE: Click & Drag-and-drop voor Shape Choice ===
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let dragging = false;
let dragOffset = new THREE.Vector3();
let dragPlane = new THREE.Plane();
let dragIntersect = new THREE.Vector3();
let dragObject = null;
let interactionListenersAdded = false;
let mouseDownScreen = { x: 0, y: 0 };
let mouseUpScreen = { x: 0, y: 0 };

// Voeg een 3D paarse vortex toe als drop target
let vortexMesh1 = null;
let vortexInnerShape = null;

function createRadialGradientTexture(size = 256, color = '#8e24aa') {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const r = size / 2;
    const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, 'rgba(142,36,170,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function createSunGradientTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const r = size / 2;
    const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
    gradient.addColorStop(0, '#fffbe7'); // wit-geel kern
    gradient.addColorStop(0.25, '#ffe066'); // lichtgeel
    gradient.addColorStop(0.55, '#ffd700'); // goudgeel
    gradient.addColorStop(0.8, '#ff9800'); // warm oranje
    gradient.addColorStop(1, 'rgba(255,80,0,0)'); // transparant oranje-rood
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function createSunFireTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    // Perlin noise of fake vlammenpatroon
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // Simpele ruis + radiale fade
            const dx = x - size/2;
            const dy = y - size/2;
            const dist = Math.sqrt(dx*dx + dy*dy) / (size/2);
            // Vlamkleur: meer geel/wit in het midden, meer oranje/rood aan de rand
            const t = Math.max(0, 1 - dist*1.1);
            // Simuleer vlammen met sinus en random
            const flame = Math.sin((x+y)/18 + Math.sin(y/22)*2) * 0.2 + Math.random()*0.15;
            let r = 255, g = 120, b = 0;
            if (t > 0.7) { r = 255; g = 220; b = 80; }
            else if (t > 0.4) { r = 255; g = 180; b = 30; }
            else { r = 255; g = 80; b = 0; }
            // Meng met wit in het centrum
            r = r*t + 255*(1-t)*0.7;
            g = g*t + 255*(1-t)*0.7;
            b = b*t + 255*(1-t)*0.7;
            // Voeg vlammen toe
            r = Math.min(255, r + flame*80);
            g = Math.min(255, g + flame*60);
            b = Math.min(255, b + flame*30);
            // Alpha fade naar buiten
            const alpha = Math.max(0, 1 - dist*1.05);
            ctx.fillStyle = `rgba(${r|0},${g|0},${b|0},${alpha.toFixed(2)})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function createShapeFireTexture(size = 256, baseColor = '#ffffff') {
    // baseColor als hex-string of getal
    let rBase = 255, gBase = 255, bBase = 255;
    if (typeof baseColor === 'number') {
        rBase = (baseColor >> 16) & 0xFF;
        gBase = (baseColor >> 8) & 0xFF;
        bBase = baseColor & 0xFF;
    } else if (typeof baseColor === 'string' && baseColor.startsWith('#')) {
        const hex = parseInt(baseColor.slice(1), 16);
        rBase = (hex >> 16) & 0xFF;
        gBase = (hex >> 8) & 0xFF;
        bBase = hex & 0xFF;
    }
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx = x - size/2;
            const dy = y - size/2;
            const dist = Math.sqrt(dx*dx + dy*dy) / (size/2);
            const t = Math.max(0, 1 - dist*1.1);
            const flame = Math.sin((x+y)/14 + Math.sin(y/18)*2) * 0.2 + Math.random()*0.13;
            let r = rBase, g = gBase, b = bBase;
            if (t > 0.7) { r = Math.max(r, 220); g = Math.max(g, 220); b = Math.max(b, 80); }
            else if (t > 0.4) { r = Math.max(r, 180); g = Math.max(g, 180); b = Math.max(b, 30); }
            // Meng met wit in het centrum
            r = r*t + 255*(1-t)*0.7;
            g = g*t + 255*(1-t)*0.7;
            b = b*t + 255*(1-t)*0.7;
            // Voeg vlammen toe
            r = Math.min(255, r + flame*80);
            g = Math.min(255, g + flame*60);
            b = Math.min(255, b + flame*30);
            const alpha = Math.max(0, 1 - dist*1.05);
            ctx.fillStyle = `rgba(${r|0},${g|0},${b|0},${alpha.toFixed(2)})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function addVortexDropTarget(scene) {
    if (vortexMesh1) return;
    const sunRadius = (sollySun && sollySun.geometry.parameters.radius) ? sollySun.geometry.parameters.radius : 330;
    const vortexRadius = sunRadius * 0.7;
    const geometry = new THREE.CircleGeometry(vortexRadius, 64);
    const gradientTexture = createRadialGradientTexture(256, '#8e24aa');
    const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: gradientTexture,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide
    });
    vortexMesh1 = new THREE.Mesh(geometry, material);
    vortexMesh1.name = 'VortexDropTarget1';
    scene.add(vortexMesh1);
    addVortexInnerShape();
}

function addVortexInnerShape(shape) {
    // Verwijder oude binnenvorm
    if (vortexInnerShape && vortexMesh1) {
        vortexMesh1.remove(vortexInnerShape);
        vortexInnerShape = null;
    }
    // Bepaal shape (default: piramide)
    let chosenShape = shape;
    if (!chosenShape) {
        const shapeChoice = getShapeChoiceMesh();
        chosenShape = shapeChoice ? shapeChoice.userData.shape : 'piramide';
    }
    let geometry;
    switch(chosenShape) {
        case 'kubus':
            geometry = new THREE.BoxGeometry(44, 44, 44);
            break;
        case 'bol':
            geometry = new THREE.SphereGeometry(22, 32, 32);
            break;
        default:
            geometry = new THREE.ConeGeometry(22, 44, 4);
    }
    const material = new THREE.MeshPhongMaterial({
        color: 0xFF69B4, // opvallend roze
        shininess: 100,
        transparent: true,
        opacity: 0.95,
        emissive: 0xFF69B4,
        emissiveIntensity: 0.25
    });
    vortexInnerShape = new THREE.Mesh(geometry, material);
    vortexInnerShape.name = 'VortexInnerShape';
    vortexInnerShape.position.set(0, 0, 2); // iets naar voren in de vortex
    if (vortexMesh1) vortexMesh1.add(vortexInnerShape);
}

function addShapeChoiceInteraction() {
    if (!renderer) return;
    renderer.domElement.removeEventListener('mousedown', onPointerDown, false);
    renderer.domElement.removeEventListener('mousemove', onPointerMove, false);
    renderer.domElement.removeEventListener('mouseup', onPointerUp, false);
    renderer.domElement.addEventListener('mousedown', onPointerDown, false);
    renderer.domElement.addEventListener('mousemove', onPointerMove, false);
    renderer.domElement.addEventListener('mouseup', onPointerUp, false);
}

function getShapeChoiceMesh() {
    let found = null;
    scene.traverse(obj => {
        if (obj.isMesh && obj.name && obj.name.startsWith('ShapeChoice_')) found = obj;
    });
    return found;
}

function updatePointerCursor(e) {
    if (!renderer || !camera) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera({ x: mouseX, y: mouseY }, camera);
    const shapeChoice = getShapeChoiceMesh();
    if (shapeChoice) {
        const intersects = raycaster.intersectObject(shapeChoice, false);
        if (intersects.length > 0) {
            renderer.domElement.style.cursor = 'pointer';
            return;
        }
    }
    renderer.domElement.style.cursor = '';
}

function onPointerDown(event) {
    if (isPaused) return;
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const shapeChoice = getShapeChoiceMesh();
    if (!shapeChoice) return;
    const intersects = raycaster.intersectObject(shapeChoice, false);
    if (intersects.length > 0) {
        mouseDownScreen.x = event.clientX;
        mouseDownScreen.y = event.clientY;
        dragging = true;
        dragObject = shapeChoice;
        dragPlane.setFromNormalAndCoplanarPoint(
            camera.getWorldDirection(new THREE.Vector3()),
            intersects[0].point
        );
        dragOffset.copy(intersects[0].point).sub(shapeChoice.position);
        // Animatie direct pauzeren bij drag start
        shapeChoice.userData.shapeChoiceFrozen = true;
    }
}

function onPointerMove(event) {
    if (!dragging || !dragObject) return;
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    if (raycaster.ray.intersectPlane(dragPlane, dragIntersect)) {
        dragObject.position.copy(dragIntersect.sub(dragOffset));
    }
    // Highlight vortex als muis boven vortex
    if (vortexMesh1) {
        const intersects1 = raycaster.intersectObject(vortexMesh1, false);
        highlightVortex(intersects1.length > 0);
        // Kaboom-effect bij hover op vortex
        if (dragObject.userData.isShapeChoice && intersects1.length > 0 && !kaboomActive) {
            kaboomActive = true;
            console.log('[KABOOM] Effect getriggerd bij overlap ShapeChoice & vortex!');
            createKaboomAnimation(vortexMesh1.position);
            setTimeout(() => { kaboomActive = false; }, 2500);
        }
    }
}

// Detecteer of ShapeChoice boven het paneel wordt losgelaten
function isPointerOverDropPane(e) {
    const pane = document.getElementById('drop-pane');
    if (!pane) return false;
    const rect = pane.getBoundingClientRect();
    return e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
}

// Pas onPointerUp aan om drop op pane te detecteren
function onPointerUp(event) {
    if (dragging && dragObject) {
        // Check drop op vortex (3D cirkel)
        mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        if (vortexMesh1) {
            // === FIX: Markeer shapeChoiceMade direct ===
            shapeChoiceMade = true;
            // === FIX: Verwijder altijd modals/overlays ===
            document.querySelectorAll('.solly-modal, .solly-modal-overlay, .new-shape-overlay').forEach(m => m.remove());
            const vortexPos = vortexMesh1.position.clone();
            createKaboomAnimation(vortexPos, true);
            setTimeout(() => {
                startVortexPullAnimation(vortexPos);
            }, 1000);
            scene.remove(vortexMesh1);
            vortexMesh1 = null;
            // Zet collisionPaused nu pas op true!
            window.collisionPaused = true;
            // ShapeChoice wordt bevroren (staat stil)
            dragObject.userData.shapeChoiceFrozen = true;
            window.dispatchEvent(new CustomEvent('NextLevel', { detail: { shape: dragObject.userData.shape } }));
            console.log('[ShapeChoice] DROP OP VORTEX: explosie + animatie');
            dragging = false;
            dragObject = null;
            highlightVortex(false);
            return;
        }
        // Check drop op pane (delete)
        if (dragObject.userData.isShapeChoice && isPointerOverDropPane(event)) {
            const pane = document.getElementById('drop-pane');
            if (pane && pane.firstChild) {
                pane.firstChild.style.background = '#CE93D8';
                setTimeout(() => {
                    pane.firstChild.style.background = '#9C27B0';
                }, 300);
            }
            // ShapeChoice wordt bevroren (staat stil)
            dragObject.userData.shapeChoiceFrozen = true;
            window.dispatchEvent(new CustomEvent('NextLevel', { detail: { shape: dragObject.userData.shape } }));
            if (pane) pane.remove();
            if (vortexMesh1) {
                scene.remove(vortexMesh1);
                vortexMesh1 = null;
            }
            console.log('[ShapeChoice] DROP OP PAARSE VLAK: frozen = true, animatie gestopt');
            dragging = false;
            dragObject = null;
            return;
        }
        // Altijd na elke drop buiten het paarse vlak:
        if (dragObject.userData.isShapeChoice) {
            dragObject.userData.shapeChoiceFrozen = false;
            dragObject.userData.shapeChoiceStartPos = dragObject.position.clone();
            window.shapeChoiceTime = 0;
            console.log('[ShapeChoice] DROP IN UNIVERSUM: frozen = false, animatie hervat vanaf', dragObject.userData.shapeChoiceStartPos);
        }
    }
    mouseUpScreen.x = event.clientX;
    mouseUpScreen.y = event.clientY;
    const dx = mouseUpScreen.x - mouseDownScreen.x;
    const dy = mouseUpScreen.y - mouseDownScreen.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 5) {
        const shapeChoice = getShapeChoiceMesh();
        if (shapeChoice) {
            if (shapeChoice.name === 'ShapeChoice_H1_Slot') {
                console.log('🎯 CLICK OP EINDSOLLY - ChapterManager.switchToChapter(2) wordt aangeroepen!');
                if (window.chapterManager) {
                    window.chapterManager.switchToChapter(2);
                } else {
                    window.switchChapter(2);
                }
                dragging = false;
                dragObject = null;
                highlightVortex(false);
                return;
            }
        }
    }
    dragging = false;
    dragObject = null;
    highlightVortex(false);
}
// Zorg dat de event listener maar één keer wordt toegevoegd
if (renderer && renderer.domElement) {
    renderer.domElement.removeEventListener('mouseup', onPointerUp, false);
    renderer.domElement.addEventListener('mouseup', onPointerUp, false);
}

// --- Importeren van bestaande modules (GameManager, UserInterface, debug.js) gebeurt via script tags in HTML ---

// --- Startscherm en Star Wars intro ---
document.getElementById('import-file').onchange = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const json = JSON.parse(e.target.result);
            
            // Gebruik de nieuwe security-validated import functie
            const success = await importCustomSollyCoin(json);
            
            if (success) {
                // Start de game met de geïmporteerde coin
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
            }
            
        } catch (err) {
            showImportError('Ongeldig SollyCoin JSON-bestand! (' + err.message + ')');
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
        const response = await fetch('coins/SollyCoin_default.json');
        return await response.json();
    } catch (error) {
        console.error('❌ Error loading default config:', error);
        return {
            level: 'beginner',
            shape: 'piramide',
            size: 200,
            kaboom: 0,
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
    
    // Initialize ChapterManager
    window.chapterManager = new ChapterManager();
    
    // Initialize PerformanceManager
    window.performanceManager = new PerformanceManager();
    
    // Probeer eerst opgeslagen voortgang te laden
    const hasLoadedProgress = gameManager.loadProgress();
    if (sollyConfig) {
        // Geïmporteerde coin heeft voorrang
        console.log('🪙 Geïmporteerde coin geladen:', sollyConfig.level);
        gameManager.loadCoinData(sollyConfig);
        userInterface.setStartedWithCoin(true);
    } else if (hasLoadedProgress) {
        console.log('📂 Opgeslagen voortgang geladen van localStorage');
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
    // Voeg event listeners toe NA het aanmaken van renderer
    renderer.domElement.addEventListener('mousemove', updatePointerCursor);
    renderer.domElement.addEventListener('wheel', function(e) {
        if (!camera) return;
        e.preventDefault();
        const delta = -Math.sign(e.deltaY);
        const speed = 250;
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        camera.position.add(direction.multiplyScalar(delta * speed));
    });
    renderer.domElement.addEventListener('mousedown', onPointerDown, false);
    renderer.domElement.addEventListener('mousemove', onPointerMove, false);
    renderer.domElement.addEventListener('mouseup', onPointerUp, false);
    
    // Mouseover event voor eindsolly naam check
    renderer.domElement.addEventListener('mousemove', function onSollyMouseOver(e) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        // Zoek specifiek naar de eindsolly
        const allMeshes = [];
        scene.traverse(obj => { if (obj.isMesh) allMeshes.push(obj); });
        const intersects = raycaster.intersectObjects(allMeshes);
        if (intersects.length > 0) {
            const hovered = intersects[0].object;
            if (hovered.name === 'ShapeChoice_H1_Slot') {
                console.log('🖱️ Mouseover op eindsolly:', hovered.name);
            }
        }
    });
    
    // Controls (FlyControls)
    controls = new THREE.FlyControls(camera, renderer.domElement);
    controls.movementSpeed = 800;
    controls.rollSpeed = Math.PI / 12;
    controls.dragToLook = true;
    controls.autoForward = false;
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1000, 1000, 1000);
    scene.add(directionalLight);
    // Add Solly sun (Core 1)
    addSollySun(scene);
    // Add Solly1 and Solly2
    addSolly1AndSolly2(scene);
    // Direct drag support voor Solly1 activeren
    if (window.addSollyDragListeners) {
        window.addSollyDragListeners();
    }
    // Start de animatie
    animate();
    window.addEventListener('resize', onWindowResize, false);
    showLevelIndicator();
    sollyverseInitialized = true;
    // Maak belangrijke variabelen globaal beschikbaar voor debugging
    window.renderer = renderer;
    window.scene = scene;
    window.camera = camera;
    window.solly1 = solly1;
    window.solly2 = solly2;
    window.gameManager = gameManager;
    window.controls = controls;
    console.log('✅ Vereenvoudigde Sollyverse geïnitialiseerd');
    
    // Voeg mini solids toe alleen als we nog in Hoofdstuk 1 zijn
    if (window.currentChapter !== 2) {
        addMiniSolids(scene);
    }
    
    // Verwijder het drop-paneel direct bij laden, als het bestaat
    const pane = document.getElementById('drop-pane');
    if (pane) pane.remove();
    
    // Maak CTA-buttons zichtbaar na Star Wars intro
    const ctaButtons = document.getElementById('cta-buttons');
    if (ctaButtons) {
        ctaButtons.style.display = 'flex';
        console.log('🎯 CTA-buttons zichtbaar gemaakt na Star Wars intro');
    }
    
    // Voeg security button toe als master coin is geladen
    if (currentUser && currentUser.isMasterCoin) {
        const securityButton = document.createElement('button');
        securityButton.id = 'cta-security';
        securityButton.className = 'cta-btn';
        securityButton.title = 'Security Status';
        securityButton.style.background = '#ff5722';
        securityButton.innerHTML = `
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        `;
        securityButton.addEventListener('click', showSecurityStatusModal);
        ctaButtons.appendChild(securityButton);
        console.log('🔒 Security CTA-button toegevoegd voor master coin');
    }
    
    // Initialiseer en toon kaboom teller
    initializeKaboomTeller();
    
    // Add performance monitoring UI
    addPerformanceUI();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Voeg een magisch gloeiende, ronde zon toe in het centrum ---
function addSollySun(scene) {
    // Zon (Core 1): vurig, met textuur en meerdere glow-lagen
    const sunGeometry = new THREE.SphereGeometry(330, 128, 128);
    const fireTexture = createSunFireTexture(512);
    const sunMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xFFB300, // warm oranje kern
        metalness: 0.35,
        roughness: 0.18,
        transmission: 0.10,
        transparent: true,
        opacity: 0.99,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        reflectivity: 0.7,
        ior: 1.2,
        emissive: 0xFF6D00, // fel oranje emissive
        emissiveIntensity: 2.8,
        emissiveMap: fireTexture,
        map: fireTexture
    });
    sollySun = new THREE.Mesh(sunGeometry, sunMaterial);
    // Zon altijd in het midden plaatsen
    sollySun.position.set(0, 0, 0);
    sollySun.name = 'Core_1';
    // Glow laag 1: fel geel-wit
    const glow1 = new THREE.Mesh(
        new THREE.SphereGeometry(370, 64, 64),
        new THREE.MeshBasicMaterial({
            color: 0xFFFDE4,
            transparent: true,
            opacity: 0.18,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );
    // Glow laag 2: goudgeel
    const glow2 = new THREE.Mesh(
        new THREE.SphereGeometry(420, 64, 64),
        new THREE.MeshBasicMaterial({
            color: 0xFFD700,
            transparent: true,
            opacity: 0.16,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );
    // Glow laag 3: oranje
    const glow3 = new THREE.Mesh(
        new THREE.SphereGeometry(500, 64, 64),
        new THREE.MeshBasicMaterial({
            color: 0xFF9800,
            transparent: true,
            opacity: 0.10,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );
    // Glow laag 4: rood, heel transparant
    const glow4 = new THREE.Mesh(
        new THREE.SphereGeometry(600, 64, 64),
        new THREE.MeshBasicMaterial({
            color: 0xFF5722,
            transparent: true,
            opacity: 0.06,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );
    sollySun.add(glow1);
    sollySun.add(glow2);
    sollySun.add(glow3);
    sollySun.add(glow4);
    scene.add(sollySun);
}

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

// --- Universe-themed modal styling ---
function showUniverseModal(html, title = '') {
    // Verwijder bestaande modals/overlays
    document.querySelectorAll('.solly-modal, .solly-modal-overlay').forEach(m => m.remove());
    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'solly-modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(3px);
        z-index: 99998;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    document.body.appendChild(overlay);
    // Modal
    const modal = document.createElement('div');
    modal.className = 'solly-modal';
    modal.style.cssText = `
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        background: transparent;
        border: 2px solid rgba(255, 215, 0, 0.6);
        border-radius: 12px;
        padding: 40px 50px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        backdrop-filter: blur(10px);
        box-shadow: 
            0 0 30px rgba(255, 215, 0, 0.3),
            0 0 60px rgba(138, 43, 226, 0.2),
            inset 0 0 20px rgba(255, 255, 255, 0.1);
    `;
    modal.innerHTML = `
        <button class="solly-modal-close" style="
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 2em;
            background: none;
            border: none;
            color: #FFD700;
            cursor: pointer;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
            transition: all 0.3s ease;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        ">&times;</button>
        ${title ? `<h2 style="margin: 0 0 20px 0; color: #FFD700; text-align: center; font-size: 1.8em; text-shadow: 0 0 15px rgba(255, 215, 0, 0.8);">${title}</h2>` : ''}
        <div class="solly-modal-content" style="
            font-size: 1.2em;
            color: #ffffff;
            text-align: center;
            line-height: 1.6;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        ">${html}</div>
    `;
    overlay.appendChild(modal);
    // Close button hover effect
    const closeBtn = modal.querySelector('.solly-modal-close');
    closeBtn.onmouseenter = () => {
        closeBtn.style.background = 'rgba(255, 215, 0, 0.2)';
        closeBtn.style.transform = 'scale(1.1)';
    };
    closeBtn.onmouseleave = () => {
        closeBtn.style.background = 'transparent';
        closeBtn.style.transform = 'scale(1)';
    };
    closeBtn.onclick = () => { 
        overlay.remove(); 
        isPaused = false;
        console.log('▶️ Animatie hervat na sluiten modal');
    };
    // Close on overlay click
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
            isPaused = false;
            console.log('▶️ Animatie hervat na klikken op overlay');
        }
    };
}

// --- CTA-knoppen functionaliteit ---
document.getElementById('cta-info').onclick = () => {
    isPaused = true;
    console.log('⏸️ Animatie gepauzeerd door Info modal');
    let html = '';
    const currentUser = gameManager ? gameManager.getCurrentUser() : null;
    if (currentUser) {
        html += '<b>Overzicht van jouw Sollyverse:</b><br><br>';
        html += 'Level: ' + currentUser.level + '<br>';
        html += 'Shape: ' + currentUser.shape + '<br>';
        html += '💥 Kabooms: ' + (currentUser.kaboom || 0) + '<br>';
        html += 'Gele Sollys: ' + currentUser.sollys.geel + '<br>';
        html += 'Blauwe Sollys: ' + currentUser.sollys.blauw + '<br>';
        html += 'Pink Sollys: ' + currentUser.sollys.pink + '<br>';
        html += 'Rode Sollys: ' + currentUser.sollys.rood + '<br>';
        html += 'Witte sterren: ' + currentUser.sterren.wit + '<br>';
        html += 'Rode planeten: ' + currentUser.planeten.rood + '<br>';
        html += 'Groene planeten: ' + currentUser.planeten.groen + '<br>';
    } else {
        html = 'Geen data beschikbaar.';
    }
    showUniverseModal(html, '🌌 Sollyverse Info');
};

document.getElementById('cta-instructies').onclick = () => {
    isPaused = true;
    console.log('⏸️ Animatie gepauzeerd door Instructies modal');
    const html = `
        <b>Hoe speel je de Sollyverse?</b><br><br>
        <b>🎮 Besturing:</b><br>
        • Gebruik je muis om rond te kijken<br>
        • Scroll om in/uit te zoomen<br>
        • Pijltjestoetsen of WASD om te bewegen<br><br>
        <b>🌟 Interactie:</b><br>
        • Kijk naar de botsing van Solly1 en Solly2<br>
        • Kies je nieuwe shape na de botsing<br>
        • Je voortgang wordt automatisch opgeslagen<br><br>
        <b>💫 Features:</b><br>
        • Verschillende levels en shapes<br>
        • Unieke SollyCoin identifier<br>
        • Automatische localStorage backup<br>
        • Universe-themed interface
    `;
    showUniverseModal(html, '📖 Instructies');
};

document.getElementById('cta-personaliseer').onclick = () => {
    isPaused = true;
    console.log('⏸️ Animatie gepauzeerd door Personaliseer modal');
    const currentUser = gameManager ? gameManager.getCurrentUser() : null;
    let html = '';
    if (currentUser) {
        html += '<b>Personaliseer jouw Sollyverse:</b><br><br>';
        html += 'Huidige Level: ' + currentUser.level + '<br>';
        html += 'Huidige Shape: ' + currentUser.shape + '<br><br>';
        html += '<b>Beschikbare Levels:</b><br>';
        if (currentUser.availableLevels) {
            currentUser.availableLevels.forEach(level => {
                html += '• ' + level + '<br>';
            });
        } else {
            html += '• beginner<br>• intermediate<br>• advanced<br>';
        }
        html += '<br><b>Beschikbare Shapes:</b><br>';
        if (currentUser.availableShapes) {
            currentUser.availableShapes.forEach(shape => {
                html += '• ' + shape + '<br>';
            });
        } else {
            html += '• piramide<br>• kubus<br>• bol<br>';
        }
    } else {
        html = 'Geen personalisatie data beschikbaar.';
    }
    showUniverseModal(html, '🎨 Personaliseer');
};

// --- Solly1 en Solly2 toevoegen ---
function addSolly1AndSolly2(scene) {
    console.log('== Solly wordt aangemaakt! (addSolly1AndSolly2)');
    // Laad opgeslagen shape choice
    const savedShape = localStorage.getItem('sollyverse_chosen_shape') || 'piramide';
    // Solly2 (Groen) - statisch op een vaste positie
    solly2 = createSolly(60, false, 0x00FF00);
    solly2.position.set(2000, 0, 0);
    solly2.userData.isSolly2 = true;
    solly2.userData.shape = savedShape;
    solly2.scale.set(1.5, 1.5, 1.5); // 150% groter
    scene.add(solly2);
    if (!solly2FollowActive) solly2.visible = false;
    // Solly1 (Wit) - komt uit de zon en beweegt
    solly1 = createSolly(60, false, 0xFFFFFF);
    solly1.position.set(0, 0, 0);
    solly1.userData.isSolly1 = true;
    solly1.userData.shape = 'piramide';
    solly1.name = 'Solly1';
    solly1.scale.set(1.5, 1.5, 1.5); // 150% groter
    // Voeg onzichtbare collider toe voor makkelijke click/drag
    if (!solly1.getObjectByName('Solly1Collider')) {
        const pickGeom = new THREE.SphereGeometry(600, 24, 24); // NOG grotere hitbox voor makkelijk aanklikken
        const pickMat  = new THREE.MeshBasicMaterial({ visible: false });
        const collider = new THREE.Mesh(pickGeom, pickMat);
        collider.name = 'Solly1Collider';
        collider.userData.isSolly1Collider = true;
        solly1.add(collider);
        window.solly1Collider = collider;
    }
    scene.add(solly1);
    console.log('🌟 Solly1 (wit) en Solly2 (groen) toegevoegd');
    console.log('📐 Opgeslagen shape:', savedShape);
}

// --- Solly maken ---
function createSolly(size = 36, isYellow = true, color = 0xFFD700) {
    // console.log('== Solly wordt aangemaakt! (createSolly)', {size, isYellow, color});
    const geometry = new THREE.ConeGeometry(size/2, size, 4);
    const material = new THREE.MeshPhongMaterial({ 
        color: color,
        shininess: 60,
        transparent: true,
        opacity: 0.9,
        emissive: color,
        emissiveIntensity: 0.2
    });
    const solly = new THREE.Mesh(geometry, material);
    solly.userData.isYellow = isYellow;
    solly.userData.isSolly = true;
    solly.rotation.x = 0;
    return solly;
}

// --- Animatie ---
function animate() {
    requestAnimationFrame(animate);
    
    // Performance optimizations
    if (window.performanceManager) {
        window.performanceManager.updateFrustumCulling(camera);
        window.performanceManager.updateLOD(camera);
    }
    
    if (window.currentChapter === 2) {
        renderer.render(scene, camera);
        return;
    }
    if (!isPaused) {
        if (!collisionDetected) {
            updateSolly1Movement();
        }
        updateSolly2Movement();
        
        // Check voor collision tussen Solly1 en Solly2 (alleen na 4 kabooms)
        if (!window.collisionPaused && !collisionDetected && solly1 && solly2 && solly2FollowActive) {
            const distance = solly1.position.distanceTo(solly2.position);
            if (distance < 200) { // Collision threshold
                // Alleen collision triggeren als we 4 kabooms hebben bereikt
                if (gameManager && gameManager.getKaboomCount() >= 4) {
                    console.log('💥 Collision detected! Distance:', distance, 'Kaboom count:', gameManager.getKaboomCount());
                    triggerCollision();
                }
            }
        }
        
        const shapeChoice = getShapeChoiceMesh();
        if (shapeChoice) {
            if (dragging && dragObject === shapeChoice) {
            } else if (shapeChoice.userData.shapeChoiceFrozen) {
            } else {
                if (!window.shapeChoiceTime) window.shapeChoiceTime = 0;
                window.shapeChoiceTime += 0.016;
                let base = shapeChoice.userData.shapeChoiceStartPos || new THREE.Vector3(0,0,0);
                const t = window.shapeChoiceTime + 2000;
                const sx = base.x + Math.sin(t * 0.045) * 2200 + Math.cos(t * 0.021) * 1100 + Math.sin(t * 0.013) * 400;
                const sy = base.y + Math.cos(t * 0.031) * 900 + Math.sin(t * 0.017) * 500 + Math.cos(t * 0.011) * 300;
                const sz = base.z + Math.sin(t * 0.027) * 1300 + Math.cos(t * 0.019) * 900 + Math.sin(t * 0.009) * 200;
                shapeChoice.position.set(sx, sy, sz);
            }
        }
        if (vortexMesh1 && sollySun) {
            const sunRadius = sollySun.geometry.parameters.radius || 330;
            const orbitDist = sunRadius * 6;
            const t = performance.now() * 0.0008;
            const angle1 = t * 1.8 + Math.sin(t * 0.7) * 0.7;
            const y1 = Math.sin(t * 1.5) * sunRadius * 0.7;
            vortexMesh1.position.x = sollySun.position.x + Math.cos(angle1) * orbitDist;
            vortexMesh1.position.y = sollySun.position.y + y1;
            vortexMesh1.position.z = sollySun.position.z + Math.sin(angle1) * orbitDist;
            vortexMesh1.rotation.y = angle1 + Math.PI/2;
        }
    }
    controls.update(0.016);
    renderer.render(scene, camera);
}

// --- Solly1 beweging updaten met offset ---
function updateSolly1Movement() {
    if (!solly1 || collisionDetected || window.solly1MovementPaused) {
        return;
    }
    if (!solly1Movement.offset) {
        solly1Movement.offset = { x: 0, y: 0, z: 0 };
    }
    // Alleen animeren als NIET aan het draggen!
    if (!solly1Movement.dragging) {
        solly1Movement.time += 0.016;
        const t = solly1Movement.time;
        const x = solly1Movement.offset.x + Math.sin(t * 0.1) * 1500 + Math.cos(t * 0.07) * 800;
        const y = solly1Movement.offset.y + Math.cos(t * 0.08) * 1200 + Math.sin(t * 0.12) * 600;
        const z = solly1Movement.offset.z + Math.sin(t * 0.09) * 1000 + Math.cos(t * 0.11) * 700;
        solly1.position.set(x, y, z);
    }
    // Tijdens drag: positie wordt door drag-handler gezet!
}

// --- Solly2 beweging updaten (jacht op Solly1) ---
function updateSolly2Movement() {
    if (!solly2FollowActive || !solly2 || !solly1 || collisionDetected) return;
    // Solly2 beweegt naar Solly1 toe
    const targetPosition = solly1.position.clone();
    const currentPosition = solly2.position.clone();
    // Bereken richting naar Solly1
    const direction = targetPosition.sub(currentPosition).normalize();
    // Beweeg met constante snelheid naar Solly1
    const speed = 42.5;
    const newPosition = currentPosition.add(direction.multiplyScalar(speed));
    solly2.position.copy(newPosition);
}

// --- Collision trigger ---
function triggerCollision() {
    if (window.collisionPaused) {
        console.warn('Collision is gepauzeerd, geen kaboom!');
        return;
    }
    if (collisionDetected || kaboomActive) return;
    
    // Security validation voor collision (sync versie)
    if (gameManager && gameManager.securityManager) {
        const securityManager = gameManager.securityManager;
        
        // Check rate limiting
        if (!securityManager.rateLimiter.canPerformAction('collision')) {
            console.warn('🔒 Collision blocked by rate limiting');
            return;
        }
        
        // Check anti-cheat
        if (!securityManager.antiCheat.validateGameState()) {
            console.warn('🔒 Collision blocked by anti-cheat');
            return;
        }
        
        // Record action
        securityManager.rateLimiter.recordAction('collision');
        securityManager.behaviorAnalyzer.analyzePlayerBehavior('collision');
    }
    
    collisionDetected = true;
    kaboomActive = true;
    
    // Increment kaboom count in GameManager
    if (gameManager) {
        gameManager.incrementKaboomCount();
    }
    
    // Bereken collision positie (tussen Solly1 en Solly2)
    const collisionPos = new THREE.Vector3();
    collisionPos.addVectors(solly1.position, solly2.position);
    collisionPos.multiplyScalar(0.5);
    
    // Maak Solly1 en Solly2 onzichtbaar
    solly1.visible = false;
    solly2.visible = false;
    
    // Start de kaboom animatie
    createKaboomAnimation(collisionPos, true);
    
    // Maak CTA-buttons zichtbaar
    const cta = document.getElementById('cta-buttons');
    if (cta) cta.style.display = 'flex';
    
    // Toon shape choice modal na 1 seconde (dit gebeurt nu alleen na 4 kabooms)
    setTimeout(() => {
        if (!shapeChoiceMade) {
            showShapeChoiceModal();
        }
    }, 1000);
}

// --- Kaboom animatie ---
function createKaboomAnimation(collisionPos = null, isMax = false) {
    document.querySelectorAll('.kaboom-animation').forEach(k => k.remove());
    const kaboom = document.createElement('div');
    kaboom.className = 'kaboom-animation';
    kaboom.style.cssText = `
        position: fixed;
        left: 0; top: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 100000;`;
    let x = '50%', y = '50%';
    if (collisionPos && camera && renderer) {
        const vector = collisionPos.clone().project(camera);
        x = ((vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth) + 'px';
        y = ((-vector.y * 0.5 + 0.5) * renderer.domElement.clientHeight) + 'px';
        if (isNaN(parseFloat(x)) || isNaN(parseFloat(y))) {
            x = '50%';
            y = '50%';
        }
    }
    const size = isMax ? '12em' : '5em';
    const color = isMax ? '#fffbe7' : '#FFD700';
    const shadow = isMax ? '0 0 80px #fffbe7, 0 0 160px #ffd700, 0 0 320px #ff9800, 0 0 480px #ff5722' : '0 0 20px #FFD700, 0 0 40px #FFD700, 0 0 60px #FFD700, 0 0 80px #FFD700';
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
        position: absolute;
        left: ${x};
        top: ${y};
        transform: translate(-50%,-50%);
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        animation: kaboomExplosion ${isMax ? '1s' : '2.5s'} ease-out forwards;
    `;
    // Ster
    const star = document.createElement('span');
    star.textContent = '💥';
    star.style.cssText = `
        font-size: ${size};
        color: ${color};
        text-shadow: ${shadow};
        line-height: 1;
        position: relative;
    `;
    // Tekst gecentreerd over ster
    const text = document.createElement('span');
    text.textContent = 'kaboom';
    text.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%,-50%);
        font-size: calc(${size} * 0.05);
        color: #fff;
        text-shadow: 0 0 10px #CE93D8, 0 0 20px #9C27B0;
        line-height: 1;
        pointer-events: none;
    `;
    star.appendChild(text);
    wrapper.appendChild(star);
    kaboom.appendChild(wrapper);
    // Animatie duur 10% sneller
    const animDur = isMax ? 0.33 : 0.75; // seconden
    wrapper.style.animation = `kaboomExplosion ${animDur}s ease-out forwards`;
    const style = document.createElement('style');
    style.textContent = `
        @keyframes kaboomExplosion {
            0% { transform: translate(-50%,-50%) scale(0); opacity: 1; }
            50% { transform: translate(-50%,-50%) scale(1.5); opacity: 1; }
            100% { transform: translate(-50%,-50%) scale(${isMax ? '3.5' : '2'}); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(kaboom);
    setTimeout(() => { kaboom.remove(); style.remove(); }, isMax ? 330 : 750);
}

// --- Shape choice modal ---
function showShapeChoiceModal() {
    // === EXTRA GUARD: Nooit tonen als vortex bezig is of shape al gekozen ===
    if (window.vortexPullActive || window.shapeChoiceMade) {
        console.warn('[GUARD] showShapeChoiceModal() geblokkeerd: vortexPullActive of shapeChoiceMade actief');
        return;
    }
    // Verwijder het drop-paneel direct na de botsing
    const pane = document.getElementById('drop-pane');
    if (pane) pane.remove();
    // NIET collisionPaused hier zetten!
    // Voeg nu de vortexen toe
    addVortexDropTarget(scene);
    const html = `
        <b>🎨 Kies je nieuwe Solly shape!</b><br><br>
        Solly1 en Solly2 zijn samengesmolten!<br>
        Welke shape wil je voor je nieuwe Solly?<br><br>
        <div style="margin: 20px 0;">
            <button onclick="chooseShape('piramide')" style="
                background: linear-gradient(45deg, #FFD700, #FFA500);
                border: none;
                color: white;
                padding: 15px 25px;
                margin: 5px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1.1em;
                font-weight: bold;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            ">🔺 Piramide</button>
            <button onclick="chooseShape('kubus')" style="
                background: linear-gradient(45deg, #2196F3, #03A9F4);
                border: none;
                color: white;
                padding: 15px 25px;
                margin: 5px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1.1em;
                font-weight: bold;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            ">⬜ Kubus</button>
            <button onclick="chooseShape('bol')" style="
                background: linear-gradient(45deg, #4CAF50, #8BC34A);
                border: none;
                color: white;
                padding: 15px 25px;
                margin: 5px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1.1em;
                font-weight: bold;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            ">🔵 Bol</button>
        </div>
        <small>Je keuze wordt opgeslagen en gebruikt bij de volgende keer!</small>
    `;
    showUniverseModal(html, '💥 Shape Choice!');
}

// --- Shape choice functie (globale functie) ---
window.chooseShape = function(shape) {
    // Verwijder het drop-paneel altijd zodra een nieuwe shape gekozen is
    const pane = document.getElementById('drop-pane');
    if (pane) pane.remove();
    if (shapeChoiceMade) return;
    shapeChoiceMade = true;
    // === Collision permanent uitschakelen na shapechoice ===
    window.collisionPaused = true;
    // Verwijder oude Solly1 en Solly2 pas nu
    if (solly1) { scene.remove(solly1); solly1 = null; }
    if (solly2) { scene.remove(solly2); solly2 = null; }
    console.log('🎨 Gebruiker koos:', shape);
    if (shapeModalTimeout) {
        clearTimeout(shapeModalTimeout);
        shapeModalTimeout = null;
        console.log('⏰ Shape modal timeout geannuleerd');
    }
    localStorage.setItem('sollyverse_chosen_shape', shape);
    document.querySelectorAll('.solly-modal, .solly-modal-overlay').forEach(m => m.remove());
    showNewShapeOverlay(shape);
    
    // Update alle mini-Solly's naar de gekozen shape
    updateAllMiniSolidsToShape(shape);
    
    // Voeg ShapeChoice pas toe NA de overlay-animatie (1.5s)
    setTimeout(() => {
        const newSolly = createSollyWithShape(shape, 0xFFFFFF);
        // Zet positie rechtsonder buiten de zon
        if (sollySun) {
            const sunRadius = sollySun.geometry.parameters.radius || 330;
            newSolly.position.set(
                sollySun.position.x + sunRadius * 1.2,
                sollySun.position.y - 50,
                sollySun.position.z + sunRadius * 1.2
            );
            // Schaal ShapeChoice naar 45% van de zon
            let targetScale = (sunRadius * 0.45) / getShapeBaseSize(shape);
            newSolly.scale.set(targetScale, targetScale, targetScale);
        }
        newSolly.userData.isSolly1 = true;
        newSolly.userData.shape = shape;
        newSolly.name = `ShapeChoice_${shape}`;
        newSolly.visible = true;
        scene.add(newSolly);
        solly1 = newSolly;
        if (gameManager) {
            gameManager.changeShape(shape);
        }
        addShapeChoiceInteraction();
        console.log('✅ Shape choice voltooid!');
        // Markeer als Shape Choice
        newSolly.userData.isShapeChoice = true;
        // Update de binnenvorm van de vortex
        addVortexInnerShape(shape);
    }, 1500);
   // createDropPane();
};

// Helper om de basismaat van de shape te bepalen
function getShapeBaseSize(shape) {
    switch(shape) {
        case 'piramide': return 60; // hoogte
        case 'kubus': return 50; // zijde
        case 'bol': return 70; // diameter (2*radius)
        default: return 60;
    }
}

// Functie om alle mini-Solly's te updaten naar de gekozen shape
function updateAllMiniSolidsToShape(shape) {
    console.log('🔄 Updating alle mini-Solly\'s naar shape:', shape);
    
    if (!window.miniSollys || window.miniSollys.length === 0) {
        if (window.refreshMiniSollys) window.refreshMiniSollys();
    }
    if (!window.miniSollys || window.miniSollys.length === 0) {
        console.warn('❌ Geen mini-Sollys gevonden voor update');
        return;
    }
    
    let updatedCount = 0;
    
    // Kopieer array omdat we hem tijdens de loop aanpassen
    const miniSollysCopy = [...window.miniSollys];
    miniSollysCopy.forEach(obj => {
        if (!obj || !obj.isMesh) return;
        // Bewaar originele eigenschappen
        const originalPosition = obj.position.clone();
        const originalScale = obj.scale.clone();
        const originalColor = obj.material ? obj.material.color.getHex() : 0xFFD700;
        const originalParent = obj.parent;
        // Verwijder oude mesh
        if (originalParent) {
            originalParent.remove(obj);
        }
        // Maak nieuwe mesh met gekozen shape
        let newGeometry;
        const baseSize = 24; // Basis grootte voor mini-Solly's
        switch(shape) {
            case 'kubus':
                newGeometry = new THREE.BoxGeometry(baseSize, baseSize, baseSize);
                break;
            case 'bol':
                newGeometry = new THREE.SphereGeometry(baseSize/2, 32, 32);
                break;
            case 'piramide':
            default:
                newGeometry = new THREE.ConeGeometry(baseSize/2, baseSize, 4);
                break;
        }
        // Maak nieuw materiaal met originele kleur
        const newMaterial = new THREE.MeshPhongMaterial({
            color: originalColor,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        // Maak nieuwe mesh
        const newMesh = new THREE.Mesh(newGeometry, newMaterial);
        // Herstel originele eigenschappen
        newMesh.position.copy(originalPosition);
        newMesh.scale.copy(originalScale);
        newMesh.userData = {
            ...obj.userData,
            shape: shape // Update shape in userData
        };
        // Voeg toe aan parent
        if (originalParent) {
            originalParent.add(newMesh);
        } else if (window.scene) {
            window.scene.add(newMesh);
        }
        updatedCount++;
    });
    // Update window.miniSollys array
    if (window.refreshMiniSollys) {
        window.refreshMiniSollys();
    }
    console.log(`✅ ${updatedCount} mini-Solly's geüpdatet naar shape: ${shape}`);
}

// --- Toon nieuwe vorm als overlay ---
function showNewShapeOverlay(shape) {
    const overlay = document.createElement('div');
    overlay.className = 'new-shape-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 100001;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeInOut 1.5s ease-in-out forwards;
    `;
    const shapeIcon = document.createElement('div');
    shapeIcon.style.cssText = `
        font-size: 15em;
        color: #FFD700;
        text-shadow: 0 0 30px #FFD700;
        animation: shapePulse 1.5s ease-in-out;
    `;
    // Kies juiste emoji voor shape
    switch(shape) {
        case 'piramide':
            shapeIcon.innerHTML = '🔺';
            break;
        case 'kubus':
            shapeIcon.innerHTML = '⬜';
            break;
        case 'bol':
            shapeIcon.innerHTML = '🔵';
            break;
        default:
            shapeIcon.innerHTML = '🔺';
    }
    overlay.appendChild(shapeIcon);
    document.body.appendChild(overlay);
    // Voeg CSS animaties toe
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; }
        }
        @keyframes shapePulse {
            0% { transform: scale(0.5); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
    // Verwijder na animatie
    setTimeout(() => {
        overlay.remove();
        style.remove();
    }, 1500);
}

// --- Maak Solly met specifieke shape ---
function createSollyWithShape(shape, color = 0xFFFFFF) {
    let geometry, material;
    let sollyMesh;
    if (shape === 'bol') {
        geometry = new THREE.SphereGeometry(35, 64, 64);
        const baseMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: false });
        sollyMesh = new THREE.Mesh(geometry, baseMaterial);
        // Metallic gradient: extra semi-transparante bol met metallic kleur
        const gradGeometry = new THREE.SphereGeometry(36.5, 64, 64);
        const fireTexture = createShapeFireTexture(256, 0x4FC3F7); // blauw voor bol
        const gradMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 1.0,
            roughness: 0.18,
            transparent: true,
            opacity: 0.22,
            clearcoat: 0.7,
            reflectivity: 0.0,
            emissive: 0x4FC3F7,
            emissiveIntensity: 0.7,
            emissiveMap: fireTexture,
            map: fireTexture
        });
        const grad = new THREE.Mesh(gradGeometry, gradMaterial);
        sollyMesh.add(grad);
        sollyMesh.userData.isSolly = true;
        sollyMesh.userData.shape = shape;
        sollyMesh.userData.isShapeChoice = true;
        sollyMesh.name = `ShapeChoice_${shape}`;
        return sollyMesh;
    }
    if (shape === 'kubus') {
        geometry = new THREE.BoxGeometry(50, 50, 50);
        const baseMaterialK = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: false });
        sollyMesh = new THREE.Mesh(geometry, baseMaterialK);
        // Metallic gradient
        const gradGeometryK = new THREE.BoxGeometry(53, 53, 53);
        const fireTextureK = createShapeFireTexture(256, 0xffffff); // wit voor kubus
        const gradMaterialK = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 1.0,
            roughness: 0.18,
            transparent: true,
            opacity: 0.16,
            clearcoat: 0.7,
            reflectivity: 0.0,
            emissive: 0xffffff,
            emissiveIntensity: 0.7,
            emissiveMap: fireTextureK,
            map: fireTextureK
        });
        const gradK = new THREE.Mesh(gradGeometryK, gradMaterialK);
        sollyMesh.add(gradK);
        sollyMesh.userData.isSolly = true;
        sollyMesh.userData.shape = shape;
        sollyMesh.userData.isShapeChoice = true;
        sollyMesh.name = `ShapeChoice_${shape}`;
        return sollyMesh;
    }
    // Default: piramide
    geometry = new THREE.ConeGeometry(30, 60, 4);
    const baseMaterialP = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: false });
    sollyMesh = new THREE.Mesh(geometry, baseMaterialP);
    // Metallic gradient
    const gradGeometryP = new THREE.ConeGeometry(32, 62, 4);
    const fireTextureP = createShapeFireTexture(256, 0xFFD700); // geel voor piramide
    const gradMaterialP = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 1.0,
        roughness: 0.18,
        transparent: true,
        opacity: 0.22,
        clearcoat: 0.7,
        reflectivity: 0.0,
        emissive: 0xFFD700,
        emissiveIntensity: 0.7,
        emissiveMap: fireTextureP,
        map: fireTextureP
    });
    const gradP = new THREE.Mesh(gradGeometryP, gradMaterialP);
    sollyMesh.add(gradP);
    sollyMesh.userData.isSolly = true;
    sollyMesh.userData.shape = shape;
    sollyMesh.userData.isShapeChoice = true;
    sollyMesh.name = `ShapeChoice_${shape}`;
    return sollyMesh;
}

function addMiniSolids(scene) {
    // Voeg originele mini Sollys toe (zoals in Hoofdstuk 1)
    const currentUser = gameManager.getCurrentUser();
    const miniSollys = [];
    const geel = currentUser?.sollys?.geel || 1750;
    const blauw = currentUser?.sollys?.blauw || 1750;
    const pink = currentUser?.sollys?.pink || 0;
    const rood = currentUser?.sollys?.rood || 1500;
    const wit = 1; // Voeg 1 witte Solly toe als trigger

    // Haal size multiplier op voor scaling
    const sizeMultiplier = gameManager.getSizeMultiplier();
    const baseSize = 24; // Basis grootte voor mini-Solly's
    const scaledSize = baseSize * sizeMultiplier;

    function addSollyToScene(count, isYellow, color, array) {
        for (let i = 0; i < count; i++) {
            const solly = createSolly(scaledSize, isYellow, color);
            const radius = 2000 + Math.random() * 8000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            solly.position.x = radius * Math.sin(phi) * Math.cos(theta);
            solly.position.y = radius * Math.sin(phi) * Math.sin(theta);
            solly.position.z = radius * Math.cos(phi);
            scene.add(solly);
            array.push(solly);
        }
    }

    addSollyToScene(geel, true, 0xFFD700, miniSollys);
    addSollyToScene(blauw, false, 0x2196F3, miniSollys);
    addSollyToScene(pink, false, 0xFF69B4, miniSollys);
    addSollyToScene(rood, false, 0xFF0000, miniSollys);
    addSollyToScene(wit, false, 0xFFFFFF, miniSollys); // 1 witte Solly als trigger
    // Vul window.miniSollys na toevoegen
    if (window.refreshMiniSollys) window.refreshMiniSollys();

    // Event listener voor mini Solly clicks - maak globaal voor verwijdering
    window.onMiniSollyClick = function onMiniSollyClick(e) {
        if (!canSollyMove || isPaused || window.currentChapter === 2) return;
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        // Kijk naar alle meshes in de scene zodat ShapeChoice_H1_Slot ook meegeteld wordt
        const allMeshes = [];
        scene.traverse(obj => { if (obj.isMesh) allMeshes.push(obj); });
        const intersects = raycaster.intersectObjects(allMeshes);
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            // Start Hoofdstuk 2 alleen bij klik op witte Solly
            if (clickedObject.material.color.getHex() === 0xFFFFFF) {
                console.log('⚡ Witte Solly clicked - Starting Chapter 2!');
                if (window.chapterManager) {
                    chapterManager.switchToChapter(2);
                }
                return;
            }
            // Highlight effect voor andere kleuren
            clickedObject.material.color.setHex(0xFFFF00);
            setTimeout(() => {
                clickedObject.material.color.setHex(clickedObject.userData?.originalColor || clickedObject.material.color.getHex());
            }, 200);
        }
    };
    
    renderer.domElement.addEventListener('mousedown', window.onMiniSollyClick);
}

// Highlight vortex tijdens drag
function highlightVortex(active) {
    if (vortexMesh1) {
        vortexMesh1.material.color.set(active ? 0xCE93D8 : 0x8e24aa);
        vortexMesh1.material.opacity = active ? 0.85 : 0.55;
    }
}

function removeSpheresFromMesh(mesh) {
    if (!mesh || !mesh.children) return;
    // Speciale fix: als dit een ShapeChoice_bol is, verwijder alleen de eerste child (de gradient), niet de hoofdmesh zelf
    if (mesh.name && mesh.name.startsWith('ShapeChoice_bol')) {
        // Zoek de eerste child met SphereGeometry (de gradient)
        for (let i = mesh.children.length - 1; i >= 0; i--) {
            const child = mesh.children[i];
            if (child.isMesh && child.geometry && child.geometry.type === 'SphereGeometry') {
                mesh.remove(child);
            }
        }
        return;
    }
    // Standaard: verwijder alle SphereGeometry children recursief
    for (let i = mesh.children.length - 1; i >= 0; i--) {
        const child = mesh.children[i];
        if (child.isMesh && child.geometry && child.geometry.type === 'SphereGeometry') {
            mesh.remove(child);
        } else {
            removeSpheresFromMesh(child);
        }
    }
}

function startVortexPullAnimation(vortexPos) {
    // === Collision definitief uitschakelen zodra vortex start ===
    window.collisionPaused = true;
    if (vortexPullActive) return;
    vortexPullActive = true;
    const pullDuration = 2.5; // seconden
    const startTime = performance.now();
    // Verzamel alle te animeren objecten
    const objectsToPull = [];
    scene.traverse(obj => {
        if (obj.isMesh && obj !== vortexMesh1 && obj.name !== 'VortexInnerShape') {
            objectsToPull.push({
                mesh: obj,
                startPos: obj.position.clone(),
                startRot: obj.rotation.y
            });
        }
    });
    const camStart = camera.position.clone();
    const camTarget = vortexPos.clone().add(new THREE.Vector3(0, 0, 200));
    const camStartFov = camera.fov;
    const camTargetFov = 110;
    // Fade overlay
    let fadeDiv = document.createElement('div');
    fadeDiv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:100010;background:radial-gradient(circle,#fffbe7 0%,#ffd700 40%,#ff9800 80%,rgba(0,0,0,0.7) 100%);opacity:0;transition:opacity 0.7s;display:flex;align-items:center;justify-content:center;transform:scale(1);transform-origin:center center;';
    document.body.appendChild(fadeDiv);
    let animationActive = true;
    function animatePull() {
        if (!animationActive) return;
        const t = Math.min(1, (performance.now() - startTime) / (pullDuration * 1000));
        const ease = t < 0.7 ? Math.pow(t, 0.7) : 1 - Math.pow(1-t, 2.5);
        // Trek alle objecten in een spiraal naar het midden
        objectsToPull.forEach((o, i) => {
            const spiral = 1 - ease + 0.2 * Math.sin(i + t * 12 + i*0.3);
            const dir = new THREE.Vector3().subVectors(vortexPos, o.startPos).normalize();
            const dist = o.startPos.distanceTo(vortexPos);
            const angle = o.startRot + t * 16 + i*0.4; // Verhoogd van 8 naar 16, van 0.2 naar 0.4
            const radius = dist * (1 - ease) * spiral;
            o.mesh.position.x = vortexPos.x + Math.cos(angle) * radius;
            o.mesh.position.y = THREE.MathUtils.lerp(o.startPos.y, vortexPos.y, ease) + Math.sin(angle*1.2) * radius*0.08;
            o.mesh.position.z = vortexPos.z + Math.sin(angle) * radius;
            o.mesh.rotation.y = angle;
        });
        // Camera beweegt en zoomt
        camera.position.lerpVectors(camStart, camTarget, ease);
        camera.fov = camStartFov + (camTargetFov - camStartFov) * ease;
        camera.updateProjectionMatrix();
        // Fade overlay
        if (t > 0.7) fadeDiv.style.opacity = (t-0.7)/0.3;
        if (t < 1) {
            requestAnimationFrame(animatePull);
        } else {
            fadeDiv.style.opacity = 1;
            animationActive = false;
            // EINDSHOT: zon naar midden zuigen en camera inzoomen
            const shapeChoice = getShapeChoiceMesh();
            if (shapeChoice) {
                removeSpheresFromMesh(shapeChoice);
                while (shapeChoice.children.length > 0) {
                    shapeChoice.remove(shapeChoice.children[0]);
                }
                shapeChoice.scale.set(0.3, 0.3, 0.3); // Veranderd van 0.8 naar 0.3
                shapeChoice.position.set(0, 0, 0);
            }
            
            // Zon naar midden zuigen en laten krimpen
            if (sollySun) {
                // Forceer zon en alle children naar (0,0,0) vóór animatie
                sollySun.position.set(0, 0, 0);
                sollySun.children.forEach(child => child.position.set(0, 0, 0));
                if (typeof sollySunGlow !== 'undefined' && sollySunGlow) sollySunGlow.position.set(0, 0, 0);
                const sunStartScale = sollySun.scale.clone();
                const sunAnimDuration = 1350; // ~1.35 seconden (1/3 sneller)
                const sunStartTime = performance.now();
                if (shapeChoice) shapeChoice.visible = false; // Verberg witte Solly tijdens zon animatie
                
                function animateSunShrink() {
                    const elapsed = performance.now() - sunStartTime;
                    const progress = Math.min(elapsed / sunAnimDuration, 1);
                    const ease = 1 - Math.pow(1 - progress, 2); // Ease-out
                    // Zon laten draaien om verticale as (Y-as)
                    const rotationSpeed = 8;
                    sollySun.rotation.y = elapsed * 0.01 * rotationSpeed;
                    // Zon en alle children laten krimpen naar 0
                    const newScale = progress < 1 ? 1 - ease : 0;
                    sollySun.scale.set(newScale, newScale, newScale);
                    sollySun.children.forEach(child => child.scale.set(newScale, newScale, newScale));
                    if (typeof sollySunGlow !== 'undefined' && sollySunGlow) sollySunGlow.scale.set(newScale, newScale, newScale);
                    // Laat fadeDiv (gele overlay) mee krimpen en vervagen
                    if (fadeDiv) {
                        fadeDiv.style.opacity = 1 - ease;
                        fadeDiv.style.transform = `scale(${1 - ease})`;
                    }
                    // Camera perfect centreren op het midden
                    const camStartPos = camera.position.clone();
                    const camTargetPos = new THREE.Vector3(0, 0, 800);
                    camera.position.lerpVectors(camStartPos, camTargetPos, ease);
                    camera.lookAt(new THREE.Vector3(0, 0, 0));
                    camera.fov = 60 + (25 - 60) * ease;
                    camera.updateProjectionMatrix();
                    if (progress < 1) {
                        requestAnimationFrame(animateSunShrink);
                    } else {
                        // Zon volledig weg, echt onzichtbaar maken
                        sollySun.visible = false;
                        sollySun.scale.set(0, 0, 0);
                        sollySun.children.forEach(child => { child.visible = false; child.scale.set(0,0,0); });
                        if (typeof sollySunGlow !== 'undefined' && sollySunGlow) { sollySunGlow.visible = false; sollySunGlow.scale.set(0,0,0); }
                        // Nu pas de witte Solly tonen, perfect gecentreerd
                        if (shapeChoice) {
                            shapeChoice.visible = true;
                            shapeChoice.position.set(0, 0, 0);
                            shapeChoice.scale.set(0.3, 0.3, 0.3);
                            // Pulse animatie: 3 keer oplichten/pulseren
                            const baseScale = 0.3;
                            const pulses = 3;
                            const pulseDuration = 600; // ms per pulse (op/neer)
                            const pulseStart = performance.now();
                            function pulseAnim() {
                                if (!shapeChoice) return;
                                const elapsed = performance.now() - pulseStart;
                                const t = (elapsed % pulseDuration) / pulseDuration; // 0-1 in één pulse
                                const factor = 1 + 0.18 * Math.sin(t * Math.PI); // 18% groter op piek
                                shapeChoice.scale.set(baseScale * factor, baseScale * factor, baseScale * factor);
                                if (elapsed < pulses * pulseDuration) {
                                    requestAnimationFrame(pulseAnim);
                                } else {
                                    // Zet schaal netjes terug
                                    shapeChoice.scale.set(baseScale, baseScale, baseScale);
                                }
                            }
                            pulseAnim();
                            canSollyMove = true; // eindsolly nu klikbaar
                        }
                        // Verwijder alle andere objecten behalve shapeChoice
                        if (scene) {
                            const objectsToRemove = [];
                            scene.traverse(obj => {
                                if (obj.isMesh && obj !== shapeChoice && obj !== sollySun && obj !== sollySunGlow) {
                                    objectsToRemove.push(obj);
                                }
                            });
                            objectsToRemove.forEach(obj => {
                                if (obj.parent) {
                                    obj.parent.remove(obj);
                                }
                            });
                        }
                        if (renderer) renderer.setClearColor(0x000000);
                        if (fadeDiv) fadeDiv.remove();
                        canSollyMove = true; // fallback: eindsolly klikbaar
                        vortexPullActive = false;
                    }
                }
                animateSunShrink();
            } else {
                // Fallback als zon niet bestaat
                // Veilig alle andere objecten verwijderen
                if (scene) {
                    const objectsToRemove = [];
                    scene.traverse(obj => {
                        if (obj.isMesh && obj !== shapeChoice) {
                            objectsToRemove.push(obj);
                        }
                    });
                    // Nu pas verwijderen
                    objectsToRemove.forEach(obj => {
                        if (obj.parent) {
                            obj.parent.remove(obj);
                        }
                    });
                }
                // Zet de achtergrond op zwart
                if (renderer) renderer.setClearColor(0x000000);
                // Overlay shrink animatie: scale van 1 naar 0
                fadeDiv.style.transition = 'opacity 0.3s, transform 1.1s cubic-bezier(0.7,0,0.3,1)';
                fadeDiv.style.transformOrigin = '50% 50%';
                fadeDiv.style.transform = 'scale(1)';
                setTimeout(() => {
                    fadeDiv.style.transform = 'scale(0)';
                    fadeDiv.style.opacity = '0';
                }, 400);
                setTimeout(() => {
                    fadeDiv.remove();
                    vortexPullActive = false;
                }, 1500);
            }
        }
    }
    animatePull();
}

// ===================================================================================
// ==                           CUSTOM SOLLYCOIN IMPORT                           ==
// ===================================================================================

async function importCustomSollyCoin(customData) {
    try {
        console.log('🪙 Importing custom SollyCoin:', customData);
        
        // Voor import op startpagina: sla data op in sollyConfig
        if (!gameManager) {
            console.log('📝 GameManager nog niet geïnitialiseerd, sla coin op in sollyConfig');
            
            // Clear localStorage om opgeslagen voortgang te overschrijven
            console.log('🗑️ Clearing localStorage to overwrite saved progress');
            localStorage.removeItem('sollyverse_data');
            localStorage.removeItem('sollyverse_encrypted');
            localStorage.removeItem('sollyverse_checksum');
            localStorage.removeItem('sollyverse_timestamp');
            localStorage.removeItem('sollyverse_id');
            
            sollyConfig = customData;
            return true;
        }
        
        // Security validation van de custom data (sync versie)
        if (gameManager.securityManager) {
            const securityManager = gameManager.securityManager;
            
            // Check data validation
            if (!securityManager.dataValidator.validateUserData(customData)) {
                console.error('🔒 Custom coin import blocked: Invalid data');
                showImportError('Ongeldige coin data: Invalid data structure');
                return false;
            }
            
            // Check rate limiting
            if (!securityManager.rateLimiter.canPerformAction('importCoin')) {
                console.error('🔒 Custom coin import blocked: Rate limit exceeded');
                showImportError('Te snel importeren, probeer het later opnieuw');
                return false;
            }
            
            // Record action
            securityManager.rateLimiter.recordAction('importCoin');
            securityManager.behaviorAnalyzer.analyzePlayerBehavior('importCoin');
        }
        
        // Clear localStorage om opgeslagen voortgang te overschrijven
        console.log('🗑️ Clearing localStorage to overwrite saved progress');
        localStorage.removeItem('sollyverse_data');
        localStorage.removeItem('sollyverse_encrypted');
        localStorage.removeItem('sollyverse_checksum');
        localStorage.removeItem('sollyverse_timestamp');
        localStorage.removeItem('sollyverse_id');
        
        // Load de custom coin data
        gameManager.loadCoinData(customData);
        
        // Update UI
        if (userInterface) {
            userInterface.setStartedWithCoin(true);
            userInterface.setGameStarted(true);
        }
        
        // Update sollyConfig
        sollyConfig = customData;
        
        console.log('✅ Custom SollyCoin successfully imported');
        return true;
        
    } catch (error) {
        console.error('❌ Error importing custom SollyCoin:', error);
        showImportError('Fout bij importeren: ' + error.message);
        return false;
    }
}

function showImportError(message) {
    const errorDiv = document.getElementById('import-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

// ===================================================================================
// ==                           SECURITY DEBUG FUNCTIONS                           ==
// ===================================================================================

function enableSecurityDebug() {
    if (gameManager && gameManager.securityManager) {
        gameManager.securityManager.setSecurityEnabled(false);
        console.log('🔓 Security disabled for debugging');
    }
}

function disableSecurityDebug() {
    if (gameManager && gameManager.securityManager) {
        gameManager.securityManager.setSecurityEnabled(true);
        console.log('🔒 Security re-enabled');
    }
}

function getSecurityStatus() {
    if (gameManager && gameManager.securityManager) {
        return gameManager.securityManager.getSecurityStatus();
    }
    return null;
}

// Maak security functies globaal beschikbaar voor debugging
window.importCustomSollyCoin = importCustomSollyCoin;
window.enableSecurityDebug = enableSecurityDebug;
window.disableSecurityDebug = disableSecurityDebug;
window.getSecurityStatus = getSecurityStatus;

// ===================================================================================
// ==                           SECURITY STATUS MODAL                             ==
// ===================================================================================

function showSecurityStatusModal() {
    const status = getSecurityStatus();
    if (!status) {
        showUniverseModal('Security system niet beschikbaar', 'Security Status');
        return;
    }

    let html = `
        <div style="text-align: left; line-height: 1.6;">
            <h3 style="color: #FFD700; margin-bottom: 20px;">🔒 Security Status</h3>
            
            <div style="background: ${status.enabled ? '#4CAF50' : '#FF5722'}; color: white; padding: 10px; border-radius: 8px; margin-bottom: 20px;">
                <strong>Status:</strong> ${status.enabled ? '🔒 Enabled' : '🔓 Disabled'}
            </div>
            
            <h4 style="color: #FFD700; margin-top: 20px;">Anti-Cheat Status:</h4>
            <ul style="margin: 10px 0;">
                <li>Violations: ${status.antiCheatStatus.violationCount}/${status.antiCheatStatus.maxViolations}</li>
                <li>Suspicious Actions: ${status.antiCheatStatus.suspiciousActions}</li>
            </ul>
            
            <h4 style="color: #FFD700; margin-top: 20px;">Rate Limiter Status:</h4>
            <ul style="margin: 10px 0;">
                <li>Total Actions: ${status.rateLimiterStatus.totalActions}</li>
                <li>Active Cooldowns: ${Object.keys(status.rateLimiterStatus.activeCooldowns).length}</li>
            </ul>
            
            <h4 style="color: #FFD700; margin-top: 20px;">Behavior Analysis:</h4>
            <ul style="margin: 10px 0;">
                <li>Patterns Analyzed: ${status.behaviorAnalyzerStatus.patternsCount}</li>
                <li>Recent Suspicious Score: ${status.behaviorAnalyzerStatus.recentScore}</li>
            </ul>
            
            <div style="margin-top: 30px; padding: 15px; background: #1a1a1a; border-radius: 8px;">
                <h4 style="color: #FFD700; margin-bottom: 10px;">Debug Controls:</h4>
                <button onclick="enableSecurityDebug()" style="background: #FF5722; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px; cursor: pointer;">Disable Security</button>
                <button onclick="disableSecurityDebug()" style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Enable Security</button>
            </div>
        </div>
    `;

    showUniverseModal(html, 'Security Status');
}

// Event listener voor chapter2 button
document.addEventListener('DOMContentLoaded', function() {
    const chapter2Btn = document.getElementById('cta-chapter2');
    if (chapter2Btn) {
        chapter2Btn.addEventListener('click', () => {
            if (window.chapterManager) {
                chapterManager.switchToChapter(2);
            }
        });
    }
});

// Mouseover event voor eindsolly naam check wordt verplaatst naar initSollyverse

// Debug functie voor ChapterManager
window.debugChapterManager = function() {
    console.log('📚 ChapterManager Debug:');
    console.log('- ChapterManager beschikbaar:', !!window.chapterManager);
    if (window.chapterManager) {
        console.log('- Huidige hoofdstuk:', window.chapterManager.getCurrentChapterNumber());
        console.log('- Hoofdstuk 2 beschikbaar:', window.chapterManager.isChapterAvailable(2));
        console.log('- Is transitioning:', window.chapterManager.isTransitioning);
    }
    return window.chapterManager;
};

// Voeg een debug-knop toe om Hoofdstuk 2 te forceren
window.forceChapter2 = function() {
    if (window.chapterManager) {
        window.chapterManager.switchToChapter(2);
    } else {
        alert('ChapterManager niet beschikbaar!');
    }
};

// Globale hoofdstuk state
window.currentChapter = 1;

// Centrale switchChapter functie
window.switchChapter = function(chapter) {
    console.log('== switchChapter aangeroepen, chapter:', chapter);
    window.currentChapter = chapter;
    if (chapter === 2) {
        console.log('🔄 STARTING HOOFDSTUK 2 - STOPPING ALLE HOOFDSTUK 1 LOGICA');
        
        // Stop bekende timers/intervals
        if (window.sollyInterval) {
            clearInterval(window.sollyInterval);
            window.sollyInterval = null;
            console.log('⏹️ Solly interval gestopt');
        }
        if (window.sollyTimeout) {
            clearTimeout(window.sollyTimeout);
            window.sollyTimeout = null;
            console.log('⏹️ Solly timeout gestopt');
        }
        if (window.shapeModalTimeout) {
            clearTimeout(window.shapeModalTimeout);
            window.shapeModalTimeout = null;
            console.log('⏹️ Shape modal timeout gestopt');
        }
        
        // Stop GameManager auto-save interval
        if (gameManager && gameManager.autoSaveInterval) {
            clearInterval(gameManager.autoSaveInterval);
            gameManager.autoSaveInterval = null;
            console.log('⏹️ GameManager auto-save interval gestopt');
        }
        
        // Verwijder specifieke event listeners van Hoofdstuk 1
        if (window.renderer && window.renderer.domElement) {
            // Verwijder mini Solly click listener
            if (window.onMiniSollyClick) {
                window.renderer.domElement.removeEventListener('mousedown', window.onMiniSollyClick);
                window.onMiniSollyClick = null;
                console.log('⏹️ Mini Solly click listener verwijderd');
            }
            
            // Verwijder andere Hoofdstuk 1 event listeners
            window.renderer.domElement.removeEventListener('mousemove', updatePointerCursor);
            window.renderer.domElement.removeEventListener('mousedown', onPointerDown);
            window.renderer.domElement.removeEventListener('mousemove', onPointerMove);
            window.renderer.domElement.removeEventListener('mouseup', onPointerUp);
            console.log('⏹️ Hoofdstuk 1 event listeners verwijderd');
        }
        
        // Wis echt alles uit de scene
        if (window.scene) {
            while (window.scene.children.length > 0) {
                window.scene.remove(window.scene.children[0]);
            }
            console.log('🧹 Scene volledig gewist');
        }
        
        // Forceer garbage collection van oude objecten
        window.solly1 = null;
        window.solly2 = null;
        window.sollySun = null;
        window.vortexMesh1 = null;
        window.vortexInnerShape = null;
        console.log('🗑️ Oude objecten opgeruimd');
        
        // Zet renderer op zwart
        if (window.renderer) {
            window.renderer.setClearColor(0x000000);
            console.log('⚫ Renderer op zwart gezet');
        }
        
        // Zet camera opnieuw voor Hoofdstuk 2
        if (window.camera) {
            window.camera.position.set(0, 0, 2000);
            window.camera.lookAt(0, 0, 0);
            console.log('📷 Camera gereset voor Hoofdstuk 2');
        }
        
        // Voeg een grote rode kubus toe (brutalistische stijl)
        if (window.scene) {
            const coreGeometry = new THREE.BoxGeometry(500, 500, 500);
            const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
            const core = new THREE.Mesh(coreGeometry, coreMaterial);
            core.position.set(0, 0, 0);
            core.name = 'BrutalistCore';
            window.scene.add(core);
            console.log('🏗️ Brutalistische rode kubus toegevoegd');
        }
        
        // Start officieel Hoofdstuk 2 via ChapterManager
        if (window.chapterManager && typeof window.chapterManager.switchToChapter === 'function') {
            console.log('🚀 ChapterManager wordt nu aangeroepen voor Chapter 2');
            window.chapterManager.switchToChapter(2);
        } else {
            console.warn('⚠️ ChapterManager niet beschikbaar; Hoofdstuk 2 init kan beperkt zijn');
        }
        
        console.log('✅ HOOFDSTUK 2 SUCCESVOL GESTART - ALLE HOOFDSTUK 1 LOGICA GESTOPT');
    }
};

// ===================================================================================
// ==                        CUBE CHALLENGE  (Hoofdstuk 1 vervolg)                   ==
// ===================================================================================

let cubeChallengeStarted = false;
let cubeGroup = null;
let cubePlaceholderMeshes = [];
let cubePlaceholderTargets = [];
let cubePuzzleShapes = [];
let puzzleDragging = false;
let puzzleDragPlane = new THREE.Plane();
let puzzleDragOffset = new THREE.Vector3();
let puzzleDragObject = null;
let puzzleDraggableObjects = [];
const CUBE_SIZE = 200; // basisgrootte (wordt nog geschaald)
const CUBE_SCALE = 0.65; // 65% van basisgrootte

// Rotatie interactie
let rotatingCube = false;
let lastMousePos = {x:0, y:0};
let movingCube = false;
let movePlane = new THREE.Plane();
let moveOffset = new THREE.Vector3();

// === Morph globals ===
let cubeMorphing = false;       // true tijdens morph-animatie
let cubeMorphProgress = 0;      // 0..1 voortgang
let cubeMorphFinalMesh = null;  // referentie naar uiteindelijke mesh

// Helpers
function getGeometryForShape(shape, size = 40) {
    switch (shape) {
        case 'kubus':
            return new THREE.BoxGeometry(size, size, size);
        case 'bol':
            return new THREE.SphereGeometry(size * 0.5, 24, 24);
        default: // piramide of fallback
            return new THREE.ConeGeometry(size * 0.5, size, 4);
    }
}

// == Cube Challenge globals ==
let cubeChosenShape = 'piramide'; // onthoudt de gekozen vorm zodat we later kunnen morphen

function startCubeChallenge(chosenShape = 'piramide') {
    if (!scene) return;
    console.log('🧩 Start Cube Challenge met shape:', chosenShape);
    cubeChosenShape = chosenShape; // sla gekozen vorm op voor latere morph
    cubeChallengeStarted = true;

    // 1. Verplaats (of verstop) het bestaande drop-paneel naar rechts
    const dropPane = document.getElementById('drop-pane-overlay');
    if (dropPane) {
        dropPane.style.left = '';
        dropPane.style.right = '-60%';
    }

    // 2. Grote draad-kubus in het midden
    const boxGeo = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const wireframe = new THREE.LineSegments(edgesGeo, lineMat);
    wireframe.userData.isWire = true;

    cubeGroup = new THREE.Group();
    cubeGroup.name = 'CubeChallengeGroup';
    cubeGroup.add(wireframe);

    // Pas schaal toe zodat de kubus niet te groot oogt
    cubeGroup.scale.set(CUBE_SCALE, CUBE_SCALE, CUBE_SCALE);

    // 2b. Onzichtbare hitbox (iets groter) om verplaatsen te detecteren
    const hitboxGeo = new THREE.BoxGeometry(CUBE_SIZE * 1.1, CUBE_SIZE * 1.1, CUBE_SIZE * 1.1);
    const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
    hitbox.name = 'CubeHitbox';
    cubeGroup.add(hitbox);

    scene.add(cubeGroup);

    // Centreer camera netjes op de geschaalde kubus
    if (camera) {
        const camDist = 600; // vaste afstand zodat kubus zichtbaar klein blijft
        camera.position.set(0, 300, camDist);
        camera.lookAt(cubeGroup.position);
    }

    // 3. Plaats placeholders op de acht hoekpunten
    const half = CUBE_SIZE / 2;
    const vertexOffsets = [
        [ half,  half,  half], [ half,  half, -half],
        [ half, -half,  half], [ half, -half, -half],
        [-half,  half,  half], [-half,  half, -half],
        [-half, -half,  half], [-half, -half, -half]
    ];

    const placeholderGeom = getGeometryForShape(chosenShape, 20); // wordt ook 30% geschaald
    const placeholderMat = new THREE.MeshStandardMaterial({
        color: 0xFFD700, // zelfde geel als de shape-choice
        transparent: true,
        opacity: 0.35,   // half transparant
        emissive: 0xFFD700,
        emissiveIntensity: 0.4
    });

    cubePlaceholderMeshes = [];
    cubePlaceholderTargets = [];
    vertexOffsets.forEach((v, idx) => {
        const ph = new THREE.Mesh(placeholderGeom.clone(), placeholderMat.clone());
        ph.position.set(v[0], v[1], v[2]);
        ph.name = `CubePlaceholder_${idx}`;
        ph.userData.isPlaceholder = true;
        ph.userData.filled = false;
        cubeGroup.add(ph);
        cubePlaceholderMeshes.push(ph);

        // Extra onzichtbare detectie-sfeer (groter – makkelijker raken)
        const detGeom = new THREE.SphereGeometry(25, 8, 8); // iets ruimer voor makkelijk droppen
        const detMat  = new THREE.MeshBasicMaterial({ visible:false });
        const det = new THREE.Mesh(detGeom, detMat);
        det.position.set(v[0], v[1], v[2]);
        det.userData.placeholderRef = ph;
        cubeGroup.add(det);
        cubePlaceholderTargets.push(det);
    });

    // 4. HTML Shape-choice paneel linksboven
    createShapeChoiceHTMLPanel(chosenShape);

    // 5. Activeer nieuwe interactieluisteraars
    addPuzzleInteraction();

    // Draai de kubus 35° om X en Y zodat een hoek naar de camera wijst
    const tiltDeg = 35;
    cubeGroup.rotation.x = THREE.MathUtils.degToRad(tiltDeg);
    cubeGroup.rotation.y = THREE.MathUtils.degToRad(-tiltDeg);
}

function addPuzzleInteraction() {
    if (!renderer) return;
    renderer.domElement.removeEventListener('mousedown', onPointerDown, false);
    renderer.domElement.removeEventListener('mousemove', onPointerMove, false);
    renderer.domElement.removeEventListener('mouseup', onPointerUp, false);

    renderer.domElement.addEventListener('mousedown', puzzlePointerDown, false);
    renderer.domElement.addEventListener('mousemove', puzzlePointerMove, false);
    renderer.domElement.addEventListener('mouseup', puzzlePointerUp, false);
}

function puzzlePointerDown(event) {
    if (!cubeChallengeStarted) return;
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(puzzleDraggableObjects, true);
    // Klik je niet op een draggable shape?
    if (intersects.length === 0) {
        // Als challenge voltooid is, laat we roteren bij mouse-drag op de kubus/hitbox
        if (cubeChallengeCompleted) {
            const cubeHits = raycaster.intersectObject(cubeGroup.getObjectByName('CubeHitbox'), false);
            if (cubeHits.length > 0) {
                rotatingCube = true;
                lastMousePos.x = event.clientX;
                lastMousePos.y = event.clientY;
            }
        }
        return; // verder geen drag
    }

    const obj = intersects[0].object;

    // Indien het object nog in panelGroup zit: losmaken zodat het vrij beweegt in de scene
    if (obj.parent && obj.userData.sourcePanel && obj.parent === obj.userData.sourcePanel) {
        const worldPos = new THREE.Vector3();
        const worldQuat = new THREE.Quaternion();
        obj.getWorldPosition(worldPos);
        obj.getWorldQuaternion(worldQuat);
        obj.parent.remove(obj);
        scene.add(obj);
        obj.position.copy(worldPos);
        obj.quaternion.copy(worldQuat);
    }

    puzzleDragging = true;
    puzzleDragObject = obj;

    // Definieer sleep-vlak
    puzzleDragPlane.setFromNormalAndCoplanarPoint(
        camera.getWorldDirection(new THREE.Vector3()),
        intersects[0].point
    );
    puzzleDragOffset.copy(intersects[0].point).sub(obj.position);
}

function puzzlePointerMove(event) {
    if (rotatingCube && cubeGroup) {
        const dx = (event.clientX - lastMousePos.x) * 0.01;
        const dy = (event.clientY - lastMousePos.y) * 0.01;
        cubeGroup.rotation.y += dx;
        cubeGroup.rotation.x += dy;
        lastMousePos.x = event.clientX;
        lastMousePos.y = event.clientY;
        return;
    }

    if (!puzzleDragging || !puzzleDragObject) return;
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    if (raycaster.ray.intersectPlane(puzzleDragPlane, dragIntersect)) {
        puzzleDragObject.position.copy(dragIntersect.sub(puzzleDragOffset));
    }
}

function puzzlePointerUp(event) {
    if (rotatingCube) {
        rotatingCube = false;
        return;
    }

    if (!puzzleDragging || !puzzleDragObject) return;

    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const placeHits = raycaster.intersectObjects(cubePlaceholderTargets, true);
    if (placeHits.length > 0) {
        const target = placeHits[0].object;
        const ph = target.userData.placeholderRef;
        if (ph && !ph.userData.filled) {
            // Snap shape to placeholder
            ph.userData.filled = true;
            // Highlight de placeholder (geel + oplichten)
            if (ph.material) {
                ph.material.color.setHex(0xFFD700);
                ph.material.opacity = 1;
                ph.material.emissive.setHex(0xFFD700);
                ph.material.emissiveIntensity = 1;
                ph.material.needsUpdate = true;
            }

            // Plaats shape exact in de hoek: maak child van placeholder
            ph.add(puzzleDragObject);
            puzzleDragObject.position.set(0, 0, 0);
            puzzleDragObject.rotation.set(0,0,0);
            puzzleDragObject.scale.set(0.6, 0.6, 0.6); // iets kleiner zodat hij mooi past
            puzzleDraggableObjects = puzzleDraggableObjects.filter(o => o !== puzzleDragObject);
            // Check of alle placeholders gevuld zijn
            if (!cubeChallengeCompleted && cubePlaceholderMeshes.every(p => p.userData.filled)) {
                cubeChallengeCompleted = true;
                console.log('🎉 Cube Challenge voltooid!');
                startCubeSpinAndMorph();
            }
        }
    }

    puzzleDragging = false;
    puzzleDragObject = null;
}

// Exporteer Cube Challenge functie zodat Chapter 2 het kan aanroepen
window.startCubeChallenge = startCubeChallenge;

// =================== HTML Shape Choice Panel =====================

function createShapeChoiceHTMLPanel(shape) {
    // Verwijder bestaand panel
    let existing = document.getElementById('shape-choice-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'shape-choice-panel';
    panel.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        padding: 24px;
        /* border: 2px solid #FF0000; */ /* UITGESCHAKELD: geen rode rand meer */
        background: #000000;
        display: grid;
        grid-template-columns: repeat(2, 70px);
        grid-column-gap: 5px;
        grid-row-gap: 16px;
        z-index: 3000;`;

    document.body.appendChild(panel);

    for (let i = 0; i < 8; i++) {
        const item = document.createElement('div');
        item.className = 'shape-item';
        item.dataset.shape = shape;
        item.style.cssText = `width: 49px; height: 49px; background: #FFD700; cursor: grab; justify-self:center;`;

        // Vormspecifieke styling
        if (shape === 'bol') {
            item.style.borderRadius = '50%';
        } else if (shape === 'piramide') {
            item.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
            item.style.background = '#FFD700';
        }

        item.addEventListener('mousedown', (e) => startDragFromHTMLItem(e, shape, item));
        panel.appendChild(item);
    }
}

function startDragFromHTMLItem(e, shape, htmlElement) {
    e.preventDefault();
    // Bereken mouse positie binnen canvas voor raycaster
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Maak 3D shape mesh
    const geom = getGeometryForShape(shape, 40);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.4 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.userData.isPuzzleShape = true;
    scene.add(mesh);
    puzzleDraggableObjects.push(mesh);

    // Init drag-plane en offsets
    raycaster.setFromCamera(mouse, camera);
    const camDir = camera.getWorldDirection(new THREE.Vector3());
    const planePoint = camera.position.clone().add(camDir.clone().multiplyScalar(400)); // 400 units vóór de camera
    puzzleDragPlane.setFromNormalAndCoplanarPoint(camDir, planePoint);
    if (raycaster.ray.intersectPlane(puzzleDragPlane, dragIntersect)) {
        mesh.position.copy(dragIntersect);
    } else {
        // Fallback: zet de shape alsnog 400 units vóór de camera
        mesh.position.copy(planePoint);
    }

    puzzleDragOffset.set(0,0,0);
    puzzleDragging = true;
    puzzleDragObject = mesh;

    // Verwijder HTML item uit panel
    htmlElement.remove();
}

function isPointerOverShapeChoicePanel(clientX, clientY) {
    const panel = document.getElementById('shape-choice-panel');
    if (!panel) return false;
    const rect = panel.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}

// === Spin & Morph ===
function startCubeSpinAndMorph() {
    if (!cubeGroup) return;
    cubeSpinActive = true;
    window.cubeSpinActive = true;

    // activeer spin
    cubeSpinActive = true;
    window.cubeSpinActive = true;

    // Initialiseer morph
    cubeMorphing = true;
    cubeMorphProgress = 0;

    // Zorg dat wireframe transparant kan worden
    cubeGroup.children.forEach(ch => {
        if (ch.userData.isWire && ch.material) {
            ch.material.transparent = true;
            ch.material.opacity = 1;
        }
    });

    // Maak finale shape (nog klein & onzichtbaar)
    const baseGeom = getGeometryForShape(cubeChosenShape, CUBE_SIZE);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.6, transparent:true, opacity:0 });
    cubeMorphFinalMesh = new THREE.Mesh(baseGeom, mat);
    cubeMorphFinalMesh.name = 'CubeFinalShape';
    cubeMorphFinalMesh.scale.set(0.0001,0.0001,0.0001);
    cubeGroup.add(cubeMorphFinalMesh);

    showCongratulations();
}

function removeCubeWireframe() {
    if (!cubeGroup) return;
    const toRemove = cubeGroup.children.filter(ch => ch.userData.isWire);
    toRemove.forEach(ch => cubeGroup.remove(ch));
}

function showCongratulations() {
    const msg = document.createElement('div');
    msg.textContent = '🎉 Congratulations!';
    msg.style.cssText = `position:fixed; bottom:40px; left:50%; transform:translateX(-50%); color:#FFD700; font-family:'Courier New', monospace; font-size:28px; background:#000; padding:12px 24px; border:2px solid #FFD700; z-index:3000;`;
    document.body.appendChild(msg);
}

let cubeChallengeCompleted = false;
let cubeSpinActive = false;
window.cubeSpinActive = cubeSpinActive;

// Easing functie (elastic)
function easeOutElastic(x) {
    const c4 = (2 * Math.PI) / 3;
    return x === 0
        ? 0
        : x === 1
        ? 1
        : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

// Update morph animatie – aanroepen in render-loop
function updateCubeMorph(delta=0.016) {
    if (!cubeMorphing) return;
    cubeMorphProgress += delta / 2; // ~2s totaal
    if (cubeMorphProgress > 1) cubeMorphProgress = 1;

    const t = cubeMorphProgress;
    const eased = easeOutElastic(t);

    // Update finale mesh
    if (cubeMorphFinalMesh) {
        const s = CUBE_SCALE * eased;
        cubeMorphFinalMesh.scale.set(s, s, s);
        cubeMorphFinalMesh.material.opacity = t;
    }

    // Fade & scale placeholders
    cubePlaceholderMeshes.forEach(ph => {
        const s = 0.6 * (1 - t);
        ph.scale.set(s, s, s);
        if (ph.material) {
            ph.material.opacity = 0.35 * (1 - t);
        }
    });

    // Fade wireframe
    cubeGroup.children.forEach(ch => {
        if (ch.userData.isWire && ch.material) {
            ch.material.opacity = 1 - t;
        }
    });

    // Klaar?
    if (cubeMorphProgress >= 1) {
        cubeMorphing = false;
        // Verberg placeholders definitief en verwijder draadframe
        cubePlaceholderMeshes.forEach(ph => ph.visible = false);
        removeCubeWireframe();
        if (cubeMorphFinalMesh) {
            cubeMorphFinalMesh.material.opacity = 1;
        }
    }
}

// Exporteer zodat Chapter2-call kan updaten
window.updateCubeMorph = updateCubeMorph;

window.collisionPaused = true; // collisions standaard gepauzeerd

function logAllSolly1Meshes() {
    console.log('🔴 Solly1 Meshes:', solly1.children);
}

// DEBUG: Volledig nieuwe debug-scene met alleen Solly1
function createDebugScene() {
    console.log('🔧 === DEBUG SCENE AANGEMAAKT ===');
    
    // Reset alles
    if (window.scene) {
        window.scene.clear();
    }
    
    // Nieuwe scene
    window.scene = new THREE.Scene();
    window.scene.background = new THREE.Color(0x000000);
    
    // Nieuwe camera
    window.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    window.camera.position.set(0, 0, 2000);
    window.camera.lookAt(0, 0, 0);
    
    // Nieuwe renderer
    if (window.renderer) {
        window.renderer.dispose();
    }
    window.renderer = new THREE.WebGLRenderer({ antialias: true });
    window.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(window.renderer.domElement);
    
    // Alleen Solly1 - geen andere meshes!
    const sollyGeometry = new THREE.SphereGeometry(100, 32, 32);
    const sollyMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFFFFF, 
        transparent: true, 
        opacity: 1.0 
    });
    
    window.solly1 = new THREE.Mesh(sollyGeometry, sollyMaterial);
    window.solly1.name = 'Solly1';
    window.solly1.position.set(0, 0, 0);
    window.scene.add(window.solly1);
    
    console.log('🎯 Solly1 aangemaakt:', window.solly1.id, window.solly1.position);
    
    // Geen lights, geen controls, geen animaties
    window.controls = null;
    
    // Simpele render loop
    function debugAnimate() {
        requestAnimationFrame(debugAnimate);
        window.renderer.render(window.scene, window.camera);
    }
    debugAnimate();
    
    // Voeg drag listeners toe
    addSollyDragListeners();
}

// Vervang de normale init met debug scene
// initSollyverse(); // NORMAAL
// createDebugScene(); // DEBUG SCENE UITGESCHAKELD

// === DEBUG: Log alle canvassen en clicks ===
function debugLogAllCanvases() {
    const canvassen = document.querySelectorAll('canvas');
    if (canvassen.length === 0) {
        if (window.renderer) {
            console.warn('❌ Geen canvas gevonden in de DOM!');
        }
    } else {
        console.log('🖼️ Alle canvassen in de DOM:', canvassen.length);
        canvassen.forEach((c, i) => {
            console.log(`Canvas #${i}:`, c, {
                parent: c.parentElement,
                visible: !!(c.offsetWidth || c.offsetHeight || c.getClientRects().length),
                width: c.width,
                height: c.height
            });
        });
    }
}

const miniSollys = [];
window.miniSollys = miniSollys;

// --- Kaboom teller initialisatie ---
function initializeKaboomTeller() {
    // Maak kaboom teller element
    let teller = document.getElementById('kaboom-teller');
    if (!teller) {
        teller = document.createElement('div');
        teller.id = 'kaboom-teller';
        teller.style.cssText = `
            position: fixed;
            left: 24px;
            top: 24px;
            z-index: 10010;
            font-size: 2em;
            color: #FFD700;
            font-weight: bold;
            text-shadow: 0 2px 8px #000, 0 0 2px #FFD700;
            pointer-events: none;
            font-family: 'Open Sans', sans-serif;
        `;
        document.body.appendChild(teller);
    }
    
    // Update teller met huidige waarde uit GameManager
    updateKaboomTeller();
}

// --- Update kaboom teller display ---
function updateKaboomTeller() {
    const teller = document.getElementById('kaboom-teller');
    if (teller && gameManager) {
        const count = gameManager.getKaboomCount();
        teller.textContent = `💥 Kabooms: ${count}`;
    }
}

// Performance monitoring UI
function addPerformanceUI() {
    const performanceDiv = document.createElement('div');
    performanceDiv.id = 'performance-ui';
    performanceDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: #00ff00;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        border-radius: 5px;
        z-index: 10000;
        pointer-events: none;
        user-select: none;
        border: 1px solid #00ff00;
    `;
    
    performanceDiv.innerHTML = `
        <div>⚡ FPS: <span id="fps-display">--</span></div>
        <div>🧩 Objects: <span id="objects-display">--</span></div>
        <div>🎨 Draw Calls: <span id="drawcalls-display">--</span></div>
        <div>⏱️ Frame: <span id="frametime-display">--</span></div>
    `;
    
    document.body.appendChild(performanceDiv);
    
    // Update performance display
    setInterval(() => {
        if (window.performanceManager) {
            const stats = window.performanceManager.stats;
            document.getElementById('fps-display').textContent = stats.fps;
            document.getElementById('objects-display').textContent = stats.objectCount;
            document.getElementById('drawcalls-display').textContent = stats.drawCalls;
            document.getElementById('frametime-display').textContent = `${stats.frameTime.toFixed(1)}ms`;
        }
    }, 1000);
}

// In scene cleanup, verwijder GEEN mesh met naam die begint met 'ShapeChoice_'.
// In clearThreeJSScene():
if (scene) {
    scene.traverse(obj => {
        if (obj.isMesh && !obj.name?.startsWith('ShapeChoice_')) {
            scene.remove(obj);
        }
    });
}