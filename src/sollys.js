// Solly1/Solly2 and collision functions

function addSolly1AndSolly2(scene) {
    // Solly2 (Groen) - statisch op een vaste positie
    solly2 = createSolly(60, false, 0x00FF00);
    solly2.position.set(2000, 0, 0);
    solly2.userData.isSolly2 = true;
    solly2.userData.shape = localStorage.getItem('sollyverse_chosen_shape') || 'piramide';
    solly2.scale.set(1.5, 1.5, 1.5);
    scene.add(solly2);
    // Solly1 (Wit)
    solly1 = createSolly(60, false, 0xFFFFFF);
    solly1.position.set(0, 0, 0);
    solly1.userData.isSolly1 = true;
    solly1.userData.shape = 'piramide';
    solly1.name = 'Solly1';
    solly1.scale.set(5, 5, 5);
    if (solly1.material) {
        solly1.material.color.set(0xFFFFFF);
        solly1.material.opacity = 1;
        solly1.material.transparent = false;
        solly1.material.visible = true;
    }
    solly1.visible = true;
    if (!solly1.getObjectByName('Solly1Collider')) {
        const pickGeom = new THREE.SphereGeometry(350, 24, 24);
        const pickMat  = new THREE.MeshBasicMaterial({ visible: false });
        const collider = new THREE.Mesh(pickGeom, pickMat);
        collider.name = 'Solly1Collider';
        collider.userData.isSolly1Collider = true;
        solly1.add(collider);
        window.solly1Collider = collider;
    }
    scene.add(solly1);
    // Camera goed zetten
    if (window.camera) {
        window.camera.position.set(0, 0, 2000);
        window.camera.lookAt(0, 0, 0);
    }
    // Direct drag-listeners toevoegen
    if (window.addSollyDragListeners) {
        window.addSollyDragListeners();
    }
    // Log alles
    console.log('🌟 Solly1 (wit) en Solly2 (groen) toegevoegd');
    console.log('📐 Opgeslagen shape: piramide');
    console.log('📍 Solly1 positie:', solly1.position);
    console.log('📏 Solly1 schaal:', solly1.scale);
    console.log('👁️ Solly1 zichtbaar:', solly1.visible);
    console.log('🎨 Solly1 materiaal:', solly1.material);
    console.log('🖱️ Drag-listeners toegevoegd:', !!window.addSollyDragListeners);
}

function triggerCollision() {
    if (collisionDetected) return;
    
    console.log('💥 Collision getriggerd!');
    collisionDetected = true;
    
    // Pauzeer beweging
    canSollyMove = false;
    
    // Start camera animatie naar collision
    startCameraAnimationToCollision();
}

function startCameraAnimationToCollision() {
    console.log('🎥 Start camera animatie naar collision...');
    
    cameraAnimationState.active = true;
    cameraAnimationState.startTime = Date.now();
    cameraAnimationState.startPosition = camera.position.clone();
    
    // Bereken middenpunt tussen Solly1 en Solly2
    const midPoint = new THREE.Vector3().addVectors(solly1.position, solly2.position).multiplyScalar(0.5);
    const targetPosition = midPoint.clone().add(cameraAnimationState.zoomInTargetOffset);
    
    // Animeer camera naar collision
    function animateCamera() {
        if (!cameraAnimationState.active) return;
        
        const elapsed = Date.now() - cameraAnimationState.startTime;
        const progress = Math.min(elapsed / cameraAnimationState.zoomInDuration, 1);
        
        // Easing
        const ease = 1 - Math.pow(1 - progress, 3);
        
        camera.position.lerpVectors(cameraAnimationState.startPosition, targetPosition, ease);
        camera.lookAt(midPoint);
        
        if (progress < 1) {
            requestAnimationFrame(animateCamera);
        } else {
            console.log('🎥 Camera animatie voltooid, start follow animatie...');
            startCameraFollowAnimation();
        }
    }
    
    animateCamera();
}

function startCameraFollowAnimation() {
    console.log('🎥 Start camera follow-animatie...');
    
    const followStartTime = Date.now();
    const followStartPosition = camera.position.clone();
    const followTargetPosition = solly1.position.clone().add(cameraAnimationState.followEndOffset);
    
    function animateFollow() {
        const elapsed = Date.now() - followStartTime;
        const progress = Math.min(elapsed / cameraAnimationState.followDuration, 1);
        
        // Easing
        const ease = 1 - Math.pow(1 - progress, 3);
        
        camera.position.lerpVectors(followStartPosition, followTargetPosition, ease);
        camera.lookAt(solly1.position);
        
        if (progress < 1) {
            requestAnimationFrame(animateFollow);
        } else {
            console.log('🎥 Camera follow-animatie voltooid.');
            activatePortal();
        }
    }
    
    animateFollow();
}

function activatePortal() {
    if (portalActive) return;
    
    if (!solly1) {
        console.error("❌ Kan portal niet activeren: solly1 is niet gevonden.");
        return;
    }
    
    portal = createPortal(solly1);
    scene.add(portal);
    
    window.portal = portal;
    
    portalActive = true;
    portalMovement.time = 0;
    
    console.log('🎯 Voeg drag & drop listeners toe na shape choice...');
    document.removeEventListener('mousedown', onShapeSollyClick);
    document.addEventListener('mousedown', onShapeSollyClick, true);
    document.removeEventListener('mousemove', onDragMove);
    document.addEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.addEventListener('mouseup', onDragEnd);
    console.log('✅ Drag & drop listeners toegevoegd');
    
    document.addEventListener('click', onPortalClick, false);
}

// Publieke helper: voeg drag-listeners meteen toe zonder portal
function addSollyDragListeners() {
    // Wacht tot renderer beschikbaar is
    if (!window.renderer || !window.renderer.domElement) {
        console.log('⏳ [DEBUG] Renderer nog niet beschikbaar, probeer over 100ms opnieuw...');
        setTimeout(addSollyDragListeners, 100);
        return;
    }
    const canvas = window.renderer.domElement;
    console.log('🖱️ [DEBUG] Drag-listeners worden toegevoegd aan canvas:', canvas);
    canvas.addEventListener('mousedown', onSolly1PointerDown, false);
    canvas.addEventListener('touchstart', onSolly1PointerDown, false);
    // Log dat listeners zijn toegevoegd
    console.log('✅ [DEBUG] Drag-listeners toegevoegd aan canvas!');
}

window.addSollyDragListeners = addSollyDragListeners;

// Automatisch activeren zodra renderer beschikbaar is
function initSollyDragWhenReady() {
    if (window.renderer && window.renderer.domElement) {
        console.log('🎯 [DEBUG] Renderer gevonden, initialiseer Solly drag...');
        addSollyDragListeners();
    } else {
        // console.debug('[SollyDrag] Wacht op renderer…');
        setTimeout(initSollyDragWhenReady, 100);
    }
}

// Start de initialisatie
initSollyDragWhenReady();

// Drag & drop system
let isDragging = false;
let draggedSolly = null;
let dragStartPos = new THREE.Vector3();
let originalSollyPos = new THREE.Vector3();
let solly1MovementPaused = false;
// Globale klik-status voor portal (placeholder)
var portalClicked = false;
// Globale pauzeer-flag voor collision/kaboom: standaard TRUE, we schakelen het later handmatig aan
window.collisionPaused = true;

// Hover-callback eerst declareren zodat het beschikbaar is
function onSollyHoverMove(e) {
    if (!renderer || !camera || !solly1) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const rc = new THREE.Raycaster();
    rc.setFromCamera(mouse, camera);
    const intersects = rc.intersectObject(solly1, true);
    renderer.domElement.style.cursor = intersects.length ? (isDragging ? 'grabbing' : 'pointer') : (isDragging ? 'grabbing' : '');
}

function onShapeSollyClick(event) {
    if (isDragging) return;
    
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // Check alleen Solly1, skip alle andere meshes
    if (solly1 && 
        solly1.visible && 
        !solly1.userData?.raycastDisabled && 
        solly1.material && 
        solly1.material.opacity > 0) {
        
        const hits = raycaster.intersectObject(solly1, true);
        if (hits.length > 0) {
            console.log('🎯 Solly1 geraakt – start drag');
            startDrag(solly1);
            if (window.controls) window.controls.enabled = false;
            event.preventDefault();
            event.stopPropagation();
            return;
        }
    }
    
    // Log alle hits voor debugging
    logRaycastHits(event);
}

function moveCameraToSolly1() {
    if (!solly1) return;
    
    console.log('🎥 Camera beweegt naar Solly1...');
    
    controls.enabled = false;
    
    const startPos = camera.position.clone();
    const endPos = solly1.position.clone().add(new THREE.Vector3(200, 150, 300));
    const startTime = Date.now();
    const duration = 1200;
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const ease = 0.5 * (1 - Math.cos(Math.PI * progress));
        
        camera.position.lerpVectors(startPos, endPos, ease);
        camera.lookAt(solly1.position);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            controls.enabled = true;
            controls.target.copy(solly1.position);
            controls.update();
            console.log('🎥 Camera beweging naar Solly1 voltooid');
        }
    }
    animate();
}

function startDrag(object) {
    isDragging = true;
    draggedSolly = object;
    window.solly1MovementPaused = true; // Pauzeer animatie tijdens drag
    
    console.log('🎯 Start drag - pauzeer alle animaties');
    
    // Pauzeer ALLE animaties en bewegingen
    if (solly1 && solly1.userData) {
        solly1.userData.movementPaused = true;
        solly1.userData.frozen = true;
    }
    
    // Pauzeer ook andere mogelijke animaties
    if (window.solly1Movement) {
        window.solly1Movement.paused = true;
    }
    if (window.solly2Movement) {
        window.solly2Movement.paused = true;
    }
    
    // Zet controls uit
    if (window.controls) {
        window.controls.enabled = false;
        if (window.controls.target && solly1) {
            window.controls.target.copy(solly1.position);
            window.controls.update();
        }
    }
    
    // Lights op 50% (feller)
    scene.traverse(obj => {
        if (obj.type === 'DirectionalLight' || obj.type === 'PointLight' || obj.type === 'SpotLight' || obj.type === 'AmbientLight') {
            obj.visible = true;
            obj.intensity = 0.5;
        }
    });
    // Pauzeer universum tijdens drag
    window.universeSpeedFactor = 0;
    
    // Maak Solly1 supergroot en felrood tijdens drag
    if (draggedSolly.material) {
        if (Array.isArray(draggedSolly.material)) {
            draggedSolly.material.forEach(m => m.color.setHex(0xFF0000));
        } else {
            draggedSolly.material.color.setHex(0xFF0000);
        }
    }
    draggedSolly.scale.set(5, 5, 5);
    
    console.log('❄️ Alle animaties gepauzeerd voor smooth drag');
}

function onDragMove(event) {
    if (!isDragging || !draggedSolly) return;
    console.log('🟢 onDragMove aangeroepen!');

    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // Sleep Solly1 op een vlak evenwijdig aan het scherm, door zijn huidige positie
    const planeNormal = camera.getWorldDirection(new THREE.Vector3()).clone();
    const plane = new THREE.Plane(planeNormal, -draggedSolly.position.dot(planeNormal));
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    
    // Debug: log de intersectie-coördinaten
    console.log('🟠 [onDragMove] intersection:', intersection.x, intersection.y, intersection.z);
    
    // Controleer of intersection geldig is (geen NaN of Infinity waarden)
    if (intersection && 
        Number.isFinite(intersection.x) && 
        Number.isFinite(intersection.y) && 
        Number.isFinite(intersection.z)) {
        draggedSolly.position.copy(intersection);
        
        // Update ook de Solly1Collider als die bestaat
        if (window.solly1Collider) {
            window.solly1Collider.position.set(0, 0, 0); // Reset naar lokale (0,0,0) omdat het een child is
        }
    }
    console.log('🔵 Nieuwe positie Solly1:', draggedSolly.position);

    // Forceer render
    if (window.renderer && window.scene && window.camera) {
        window.renderer.render(window.scene, window.camera);
    }
}

function onDragEnd(event) {
    console.log('[DRAG END FUNCTIE AANGEROEPEN]');
    if (isDragging && draggedSolly) {
        console.log('🖱️ Drag END op Solly1!');
        isDragging = false;
        draggedSolly = null;
        
        // Herstel normale grootte en kleur van Solly1
        if (solly1 && solly1.material) {
            if (Array.isArray(solly1.material)) {
                solly1.material.forEach(m => m.color.setHex(0xFFFFFF)); // Wit
            } else {
                solly1.material.color.setHex(0xFFFFFF); // Wit
            }
        }
        if (solly1) {
            solly1.scale.set(1, 1, 1); // Normale grootte
        }
        
        // Lights weer op 100%
        scene.traverse(obj => {
            if (obj.type === 'DirectionalLight' || obj.type === 'PointLight' || obj.type === 'SpotLight' || obj.type === 'AmbientLight') {
                obj.visible = true;
                obj.intensity = 1.0;
            }
        });
        // Zet universum snelheid weer terug
        window.universeSpeedFactor = 1;
        
        // Richt camera NA drag naar Solly1
        if (window.camera && solly1) {
            window.camera.lookAt(solly1.position);
        }
        // OrbitControls permanent uit tijdens debug
        if (window.controls) {
            window.controls.enabled = false;
            if (window.controls.target && solly1) {
                window.controls.target.copy(solly1.position);
                window.controls.update();
            }
        }
        document.body.style.cursor = 'default';
        
        if (controls) {
            controls.enabled = true;
            console.log('✅ OrbitControls weer ingeschakeld na drag');
        }
        if (window.controls && window.debugSolly1Only) window.controls.enabled = false;
        
        // Hervat automatische beweging van Solly1
        window.solly1MovementPaused = false; // Hervat animatie na drag
        if (solly1 && solly1.userData) {
            solly1.userData.movementPaused = false;
            solly1.userData.frozen = false;
        }
        
        // Hervat ook andere animaties
        if (window.solly1Movement) {
            window.solly1Movement.paused = false;
        }
        if (window.solly2Movement) {
            window.solly2Movement.paused = false;
        }
        
        console.log('💡 Lights weer aangezet en alle animaties hervat');
        // === 2D-collision check direct na drag-end ===
        if (window.checkSolly1MiniSolly2DCollision) {
            window.checkSolly1MiniSolly2DCollision();
        }
    }
}

function restartSolly1Movement() {
    if (!solly1) return;
    
    solly1MovementPaused = false;
    solly1.userData.movementPaused = false;
    solly1Movement.time = 0;
    
    console.log('🔥 Solly1 beweging hervat');
}

function freezeSolly1Completely() {
    if (!solly1) return;
    
    solly1MovementPaused = true;
    solly1.userData.movementPaused = true;
    solly1.userData.frozen = true;
    
    console.log('❄️ Solly1 volledig bevroren');
}

function unfreezeSolly1() {
    if (!solly1) {
        console.log('❌ Solly1 bestaat niet');
        return;
    }
    
    solly1MovementPaused = false;
    solly1.userData.movementPaused = false;
    solly1.userData.frozen = false;
    
    if (solly1Movement) {
        solly1Movement.time = 0;
    }
    
    console.log('🔥 Solly1 ontdooid - beweging hervat');
}

// === DEBUG: Alleen Solly1 zichtbaar, controls uit ===
function showOnlySolly1Debug() {
    if (!window.debugSolly1Only) return;
    // Zet alles behalve Solly1 onzichtbaar
    scene.traverse(obj => {
        if (obj.isMesh && obj.userData && obj.userData.isSolly && obj !== solly1) {
            obj.visible = false;
        }
        // Verberg alle andere meshes behalve Solly1
        if (obj.isMesh && !obj.userData?.isSolly && obj !== solly1) {
            obj.visible = false;
        }
    });
    // Zet Solly1 altijd bovenop
    if (solly1 && solly1.material) {
        solly1.renderOrder = 9999;
        if (Array.isArray(solly1.material)) {
            solly1.material.forEach(m => m.depthTest = false);
        } else {
            solly1.material.depthTest = false;
        }
    }
    // Zet controls uit
    if (window.controls) window.controls.enabled = false;
    // Forceer render
    if (window.renderer && window.scene && window.camera) {
        window.renderer.render(window.scene, window.camera);
    }
}

// Roep debug-functie direct aan bij laden
if (typeof solly1 !== 'undefined' && typeof scene !== 'undefined') {
    showOnlySolly1Debug();
}

// === Na aanmaken van Solly1 of reset scene ===
function afterSolly1CreatedOrSceneLoaded() {
    if (typeof solly1 !== 'undefined' && typeof scene !== 'undefined') {
        showOnlySolly1Debug();
    }
}

// Zoek waar Solly1 wordt aangemaakt of scene wordt gereset en roep deze functie aan:
// Voorbeeld:
// solly1 = createSolly1();
// afterSolly1CreatedOrSceneLoaded();

// Utility functions
function safeTraverse(callback) {
    if (!scene) return;
    scene.traverse(callback);
}

// Make functions globally available
window.freezeSolly1Completely = freezeSolly1Completely;
window.unfreezeSolly1 = unfreezeSolly1;
window.restartSolly1Movement = restartSolly1Movement; 

// === DEBUG-ONLY: Alleen Solly1 zichtbaar, controls uit, geen auto-restart, direct sleepbaar ===
// Zet window.debugSolly1Only = true om deze mode te activeren
if (typeof window !== 'undefined') {
    window.debugSolly1Only = true;
} 

// === EENVOUDIGE DEBUG: Alleen Solly1 zichtbaar ===
function showOnlySolly1() {
    console.log('🔍 Toon alleen Solly1...');
    
    // Log alle meshes eerst
    console.log('📋 Alle meshes in scene:');
    scene.traverse(obj => {
        if (obj.isMesh) {
            console.log(`- ${obj.name || 'unnamed'} (visible: ${obj.visible}, type: ${obj.type}, transparent: ${obj.material?.transparent}, opacity: ${obj.material?.opacity})`);
        }
    });
    
    // Verberg ALLE andere meshes, ook transparante
    scene.traverse(obj => {
        if (obj.isMesh && obj !== solly1) {
            obj.visible = false;
            // Zet ook raycast uit voor deze mesh
            if (obj.userData) {
                obj.userData.raycastDisabled = true;
            }
            // Maak material volledig onzichtbaar
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => {
                        m.transparent = false;
                        m.opacity = 0;
                        m.visible = false;
                    });
                } else {
                    obj.material.transparent = false;
                    obj.material.opacity = 0;
                    obj.material.visible = false;
                }
            }
        }
    });
    
    // Zorg dat Solly1 zichtbaar is en raycast enabled
    if (solly1) {
        solly1.visible = true;
        solly1.renderOrder = 9999;
        if (solly1.userData) {
            solly1.userData.raycastDisabled = false;
        }
        // Zorg dat material altijd zichtbaar is
        if (solly1.material) {
            if (Array.isArray(solly1.material)) {
                solly1.material.forEach(m => {
                    m.transparent = false;
                    m.opacity = 1.0;
                    m.depthTest = false;
                    m.visible = true;
                });
            } else {
                solly1.material.transparent = false;
                solly1.material.opacity = 1.0;
                solly1.material.depthTest = false;
                solly1.material.visible = true;
            }
        }
    }
    
    // Zet controls uit
    if (window.controls) {
        window.controls.enabled = false;
    }
    
    // Forceer render
    if (window.renderer && window.scene && window.camera) {
        window.renderer.render(window.scene, window.camera);
    }
    
    console.log('✅ Alleen Solly1 is nu zichtbaar en klikbaar');
}

// === FORCEER: Verberg alle meshes behalve Solly1 ===
function forceHideAllExceptSolly1() {
    console.log('🔨 Forceer verbergen van alle meshes behalve Solly1...');
    
    let hiddenCount = 0;
    scene.traverse(obj => {
        if (obj.isMesh && obj !== solly1) {
            obj.visible = false;
            hiddenCount++;
            
            // Forceer material onzichtbaar
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => {
                        m.visible = false;
                        m.opacity = 0;
                        m.transparent = false;
                    });
                } else {
                    obj.material.visible = false;
                    obj.material.opacity = 0;
                    obj.material.transparent = false;
                }
            }
            
            // Zet raycast uit
            if (obj.userData) {
                obj.userData.raycastDisabled = true;
            }
        }
    });
    
    console.log(`✅ ${hiddenCount} meshes verborgen`);
    
    // Zorg dat Solly1 zichtbaar is
    if (solly1) {
        solly1.visible = true;
        solly1.renderOrder = 9999;
        if (solly1.userData) {
            solly1.userData.raycastDisabled = false;
        }
    }
    
    // Forceer render
    if (window.renderer && window.scene && window.camera) {
        window.renderer.render(window.scene, window.camera);
    }
}

// === DEBUG: Solly1 naar camera brengen ===
function bringSolly1ToCamera() {
    if (!solly1 || !camera) return;
    
    console.log('📷 Camera position:', camera.position);
    console.log('🎯 Solly1 position:', solly1.position);
    console.log('📏 Afstand tot camera:', camera.position.distanceTo(solly1.position));
    
    // Breng Solly1 naar voren, voor de camera
    const direction = new THREE.Vector3(0, 0, -1); // Voor de camera
    const distance = 1000; // Op afstand van camera
    const newPosition = camera.position.clone().add(direction.multiplyScalar(distance));
    
    solly1.position.copy(newPosition);
    console.log('🎯 Nieuwe Solly1 position:', solly1.position);
    
    // Forceer render
    if (window.renderer && window.scene && window.camera) {
        window.renderer.render(window.scene, window.camera);
    }
}

// Functie om camera info te loggen
function logCameraInfo() {
    if (!camera) return;
    console.log('📷 Camera info:');
    console.log('- Position:', camera.position);
    console.log('- FOV:', camera.fov);
    console.log('- Near:', camera.near);
    console.log('- Far:', camera.far);
    console.log('- Aspect:', camera.aspect);
}

// Functie om alle meshes te loggen
function logAllMeshes() {
    console.log('📋 ALLE MESHES IN SCENE:');
    scene.traverse(obj => {
        if (obj.isMesh) {
            console.log(`- ${obj.name || 'unnamed'} (visible: ${obj.visible}, type: ${obj.type}, position: ${obj.position.x.toFixed(1)}, ${obj.position.y.toFixed(1)}, ${obj.position.z.toFixed(1)})`);
        }
    });
}

// === DEBUG: Alle objecten in scene loggen ===
function logAllSceneObjects() {
    console.log('🔍 ALLE OBJECTEN IN SCENE:');
    scene.traverse(obj => {
        console.log(`- ${obj.name || 'unnamed'} (type: ${obj.type}, visible: ${obj.visible})`);
    });
}

// === DEBUG: Check voor lights, cameras, helpers ===
function checkForBlockingObjects() {
    console.log('🔍 Check voor blokkerende objecten...');
    
    const blockingObjects = [];
    scene.traverse(obj => {
        // Check voor lights
        if (obj.type === 'DirectionalLight' || obj.type === 'PointLight' || obj.type === 'SpotLight' || obj.type === 'AmbientLight') {
            blockingObjects.push({type: 'Light', name: obj.name, visible: obj.visible, object: obj});
        }
        // Check voor cameras
        if (obj.type === 'PerspectiveCamera' || obj.type === 'OrthographicCamera') {
            blockingObjects.push({type: 'Camera', name: obj.name, visible: obj.visible, object: obj});
        }
        // Check voor helpers
        if (obj.type.includes('Helper') || obj.type.includes('Grid') || obj.type.includes('Axes')) {
            blockingObjects.push({type: 'Helper', name: obj.name, visible: obj.visible, object: obj});
        }
        // Check voor onzichtbare meshes die nog raycast kunnen doen
        if (obj.isMesh && !obj.visible && !obj.userData?.raycastDisabled) {
            blockingObjects.push({type: 'InvisibleMesh', name: obj.name, visible: obj.visible, object: obj});
        }
    });
    
    console.log('🚫 Mogelijk blokkerende objecten:', blockingObjects);
    
    // Log details van elk blokkerend object
    blockingObjects.forEach((obj, index) => {
        console.log(`🚫 Blokkerend object #${index + 1}:`, {
            type: obj.type,
            name: obj.name,
            visible: obj.visible,
            position: obj.object.position,
            uuid: obj.object.uuid
        });
    });
    
    return blockingObjects;
}

// === DEBUG: Verberg alle objecten behalve Solly1 ===
function hideAllObjectsExceptSolly1() {
    console.log('🔨 Verberg ALLE objecten behalve Solly1...');
    
    let hiddenCount = 0;
    scene.traverse(obj => {
        if (obj !== solly1 && obj !== camera) { // Behoud camera
            if (obj.visible !== undefined) {
                obj.visible = false;
                hiddenCount++;
            }
            // Voor meshes, zet ook raycast uit
            if (obj.isMesh && obj.userData) {
                obj.userData.raycastDisabled = true;
            }
        }
    });
    
    console.log(`✅ ${hiddenCount} objecten verborgen`);
    
    // Zorg dat Solly1 zichtbaar is
    if (solly1) {
        solly1.visible = true;
        solly1.renderOrder = 9999;
        if (solly1.userData) {
            solly1.userData.raycastDisabled = false;
        }
    }
    
    // Forceer render
    if (window.renderer && window.scene && window.camera) {
        window.renderer.render(window.scene, window.camera);
    }
}

// Functie om alle raycast hits te loggen
function logRaycastHits(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    const allMeshes = [];
    scene.traverse(obj => {
        if (obj.isMesh) {
            allMeshes.push(obj);
        }
    });
    
    const hits = raycaster.intersectObjects(allMeshes, true);
    console.log('🎯 Alle raycast hits:', hits.map(hit => ({
        name: hit.object.name || 'unnamed',
        visible: hit.object.visible,
        transparent: hit.object.material?.transparent,
        opacity: hit.object.material?.opacity,
        distance: hit.distance
    })));
}

// === DEBUG: Schakel alle lights uit ===
function disableAllLights() {
    console.log('💡 Schakel alle lights uit...');
    
    let disabledCount = 0;
    scene.traverse(obj => {
        if (obj.type === 'DirectionalLight' || obj.type === 'PointLight' || obj.type === 'SpotLight' || obj.type === 'AmbientLight') {
            obj.visible = false;
            obj.intensity = 0;
            disabledCount++;
            console.log(`💡 Light uitgeschakeld: ${obj.type} (${obj.uuid})`);
        }
    });
    
    console.log(`✅ ${disabledCount} lights uitgeschakeld`);
    
    // Forceer render
    if (window.renderer && window.scene && window.camera) {
        window.renderer.render(window.scene, window.camera);
    }
}

// Maak functies beschikbaar in console
if (typeof window !== 'undefined') {
    window.showOnlySolly1 = showOnlySolly1;
    window.logAllMeshes = logAllMeshes;
    window.logRaycastHits = logRaycastHits;
    window.bringSolly1ToCamera = bringSolly1ToCamera;
    window.logCameraInfo = logCameraInfo;
    window.forceHideAllExceptSolly1 = forceHideAllExceptSolly1;
    window.logAllSceneObjects = logAllSceneObjects;
    window.checkForBlockingObjects = checkForBlockingObjects;
    window.hideAllObjectsExceptSolly1 = hideAllObjectsExceptSolly1;
    window.disableAllLights = disableAllLights;
} 

// === DEBUG: Log alle Solly1 meshes in de scene ===
function logAllSolly1Meshes() {
    let count = 0;
    scene.traverse(obj => {
        if (obj.isMesh && (obj.name === 'Solly1' || obj.userData?.isSolly1)) {
            count++;
            console.log(`Solly1 #${count}:`, obj, 'Pos:', obj.position, 'Visible:', obj.visible);
        }
    });
    if (count === 0) console.log('Geen Solly1 meshes gevonden!');
    else console.log(`Totaal ${count} Solly1 meshes gevonden.`);
}
if (typeof window !== 'undefined') {
    window.logAllSolly1Meshes = logAllSolly1Meshes;
} 

// === DEBUG: Alleen Solly1 zichtbaar en raycastable, alles behalve zon en Solly1 onzichtbaar en niet-raycastable ===
function makeOnlySolly1Raycastable() {
    scene.traverse(obj => {
        if (obj.isMesh) {
            // Zon altijd zichtbaar, maar niet raycastable
            if (obj.name && obj.name.toLowerCase().includes('core_1')) {
                obj.visible = true;
                obj.raycast = () => {};
                return;
            }
            // Alleen Solly1 zichtbaar en raycastable
            if (obj === solly1) {
                obj.visible = true;
                if (obj.material) obj.material.visible = true;
                obj.raycast = THREE.Mesh.prototype.raycast;
                return;
            }
            // Alle andere meshes onzichtbaar en niet-raycastable
            obj.visible = false;
            if (obj.material) obj.material.visible = false;
            obj.raycast = () => {};
        }
    });
    console.log('🔬 Alleen Solly1 is nu zichtbaar en raycastable. Zon blijft zichtbaar maar niet klikbaar.');
}

// Roep deze functie direct aan na laden
if (typeof solly1 !== 'undefined' && typeof scene !== 'undefined') {
    makeOnlySolly1Raycastable();
}

// Log alle raycast hits bij click
if (window && window.renderer && window.renderer.domElement) {
    window.renderer.domElement.addEventListener('mousedown', function(e) {
        const rect = window.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, window.camera);
        // Verzamel ALLE meshes
        const allMeshes = [];
        scene.traverse(obj => { if (obj.isMesh) allMeshes.push(obj); });
        const hits = raycaster.intersectObjects(allMeshes, true);
        console.log('== Alle raycast hits bij click ==');
        if (hits.length === 0) {
            console.log('Niets geraakt!');
        } else {
            hits.forEach((hit, i) => {
                const o = hit.object;
                console.log(`#${i}:`, o.name || o.id || o.uuid, 'visible:', o.visible, 'userData:', o.userData, 'material.visible:', o.material?.visible);
            });
        }
    });
} 

// === ROBUUSTE DRAG & DROP VOOR SOLLY1 ===
window.solly1DragActive = false;

function onSolly1PointerDown(event) {
    window.solly1DragActive = true;
    console.log('✅ [SOLLY1 POINTER DOWN] Drag state gestart!');
    if (window.solly1) {
        console.log('🔍 [DEBUG] Solly1 bestaat:', window.solly1);
        console.log('👁️ [DEBUG] Solly1 zichtbaar:', window.solly1.visible);
        if (window.solly1.material) {
            console.log('🎨 [DEBUG] Solly1 materiaal zichtbaar:', window.solly1.material.visible, 'opacity:', window.solly1.material.opacity, 'transparent:', window.solly1.material.transparent);
        }
        console.log('🧲 [DEBUG] Solly1 raycast:', typeof window.solly1.raycast === 'function');
    } else {
        console.warn('❌ [DEBUG] Solly1 bestaat NIET op moment van click!');
    }
    // Forceer Solly1 raycastable en zichtbaar
    if (window.solly1) {
        window.solly1.visible = true;
        if (window.solly1.material) {
            window.solly1.material.visible = true;
            window.solly1.material.opacity = 1;
            window.solly1.material.transparent = false;
        }
        window.solly1.raycast = THREE.Mesh.prototype.raycast;
    }
    // Lights direct op 50% bij mouse down
    scene.traverse(obj => {
        if (obj.type === 'DirectionalLight' || obj.type === 'PointLight' || obj.type === 'SpotLight' || obj.type === 'AmbientLight') {
            obj.visible = true;
            obj.intensity = 0.5;
        }
    });
    // Raycast loggen
    const rect = window.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, window.camera);
    const allMeshes = [];
    window.scene.traverse(obj => { if (obj.isMesh) allMeshes.push(obj); });
    const intersects = raycaster.intersectObjects(allMeshes, true);
    console.log('🎯 Alle raycast hits bij click:', intersects.map(i => ({name: i.object.name, id: i.object.id, visible: i.object.visible, userData: i.object.userData})));
    if (intersects.length === 0) {
        console.log('❌ Geen enkel object geraakt!');
    } else {
        const solly1Hit = intersects.find(i => i.object === window.solly1);
        if (solly1Hit) {
            console.log('✅ Solly1 is geraakt!');
        } else {
            console.log('❌ Solly1 NIET geraakt!');
        }
    }
    // Gebruik dezelfde raycaster voor bestaande raycast-check hieronder
    // Raycast om te checken of Solly1 geraakt is
    const hits = raycaster.intersectObject(solly1, true);
    if (!hits.length) {
        console.log('❌ Niet op Solly1 geklikt');
        return;
    }
    // Log welk object je raakt
    const hitObj = hits[0].object;
    console.log('🎯 Raycast hit:', hitObj.name, 'is hoofdmesh:', hitObj === solly1, 'is child van solly1:', hitObj.parent === solly1);
    // Sleep ALTIJD de hoofdmesh
    if (hitObj === solly1 || hitObj.parent === solly1) {
        draggedSolly = solly1;
    } else {
        console.log('❌ Niet de hoofdmesh of child van Solly1 geraakt!');
        return;
    }
    // Start drag
    window.solly1MovementPaused = true;
    isDragging = true;
    document.body.style.cursor = 'grabbing';
    // === NIEUW: animatie-tijd bevriezen tijdens drag ===
    if (window.solly1Movement) {
        window.solly1Movement.dragging = true;
        window.solly1Movement.timeAtDragStart = window.solly1Movement.time;
    }
    // Lights uit
    scene.traverse(obj => {
        if (obj.type === 'DirectionalLight' || obj.type === 'PointLight' || obj.type === 'SpotLight' || obj.type === 'AmbientLight') {
            obj.visible = false;
            obj.intensity = 0;
        }
    });
    // Controls uit
    if (window.controls) window.controls.enabled = false;
    // Solly1 groot en rood
    if (solly1.material) solly1.material.color.setHex(0xFF0000);
    solly1.scale.set(3, 3, 3);
    // Koppel mousemove/mouseup
    renderer.domElement.addEventListener('mousemove', onSolly1PointerMove);
    renderer.domElement.addEventListener('mouseup', onSolly1PointerUp);
    console.log('🟢 [DRAG] Start drag op Solly1');
    // === EXTRA DEBUG LOGS ===
    console.log('Dragging object:', draggedSolly.name, draggedSolly.id, 'parent:', draggedSolly.parent?.name || draggedSolly.parent);
    console.log('Solly1 wereldpositie:', solly1.getWorldPosition(new THREE.Vector3()));
    const sollySun = scene.getObjectByName('Core_1');
    if (sollySun) console.log('Zon wereldpositie:', sollySun.getWorldPosition(new THREE.Vector3()));
    console.log('Camera positie:', camera.position);
    console.log('Scene positie:', scene.position);
    logAllSolly1Meshes();
}

function onSolly1PointerMove(event) {
    if (!window.solly1DragActive || !draggedSolly) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // Gebruik een vlak door Solly1, loodrecht op de camerakijkrichting
    const planeNormal = camera.getWorldDirection(new THREE.Vector3()).clone();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, draggedSolly.position);
    const intersection = new THREE.Vector3();
    
    if (raycaster.ray.intersectPlane(plane, intersection)) {
        // Behoud de afstand tot de camera door de intersectie precies in het vlak te gebruiken
        draggedSolly.position.copy(intersection);
        
        // Forceer matrix update
        draggedSolly.updateMatrix();
        draggedSolly.updateMatrixWorld(true);
        console.log('🔧 Matrix geüpdatet voor Solly1');
        
        console.log('🟠 [DRAG] Solly1 positie:', draggedSolly.position);
        // Log wereldpositie, parent en matrix
        const worldPos = solly1.getWorldPosition(new THREE.Vector3());
        console.log('🌍 Wereldpositie Solly1:', worldPos);
        console.log('Dragging object:', draggedSolly.name, draggedSolly.id, 'parent:', draggedSolly.parent?.name || draggedSolly.parent);
        const sollySun = scene.getObjectByName('Core_1');
        if (sollySun) console.log('Zon wereldpositie:', sollySun.getWorldPosition(new THREE.Vector3()));
        console.log('Camera positie:', camera.position);
        console.log('Scene positie:', scene.position);
        
        // Debug scene graph
        console.log('🔍 Scene graph debug:');
        console.log('  - Solly1 in scene:', scene.children.includes(solly1));
        console.log('  - Solly1 parent:', solly1.parent?.name || solly1.parent);
        console.log('  - Solly1 matrix:', solly1.matrix.elements);
        console.log('  - Solly1 matrixWorld:', solly1.matrixWorld.elements);
        
        logAllSolly1Meshes();
    }
}

function onSolly1PointerUp(event) {
    console.log('[POINTER UP] miniSollys:', window.miniSollys ? window.miniSollys.length : 'undefined');
    if (!window.solly1DragActive) return;
    window.solly1DragActive = false;
    // === KABOOM OP MINI-SOLLY (2D-projectie check) ===
    if (window.miniSollys && window.miniSollys.length && typeof THREE !== 'undefined') {
        // Projecteer Solly1 naar 2D
        const solly1Screen = solly1.position.clone().project(camera);
        const canvas = renderer.domElement;
        const solly1X = (solly1Screen.x * 0.5 + 0.5) * canvas.width;
        const solly1Y = (-solly1Screen.y * 0.5 + 0.5) * canvas.height;
        // Bepaal de 2D-radius van Solly1 (neem schaal en geometry)
        let solly1Radius = 0;
        if (solly1.geometry && solly1.scale) {
            // Neem de grootste dimensie van geometry * schaal * projectie
            const size = solly1.geometry.boundingSphere ? solly1.geometry.boundingSphere.radius : 30;
            solly1Radius = size * Math.max(solly1.scale.x, solly1.scale.y);
            // Projecteer een punt op de rand naar 2D voor nauwkeurigheid
            const edge3D = solly1.position.clone().add(new THREE.Vector3(solly1Radius, 0, 0));
            const edge2D = edge3D.project(camera);
            const edgeX = (edge2D.x * 0.5 + 0.5) * canvas.width;
            solly1Radius = Math.abs(edgeX - solly1X);
        } else {
            solly1Radius = 40;
        }
        let closest2D = null;
        let minDist2D = Infinity;
        let closestRadius = 0;
        window.miniSollys.forEach(obj => {
            if (!obj.position) return;
            const objScreen = obj.position.clone().project(camera);
            const objX = (objScreen.x * 0.5 + 0.5) * canvas.width;
            const objY = (-objScreen.y * 0.5 + 0.5) * canvas.height;
            // Bepaal de 2D-radius van de mini-Solly
            let objRadius = 0;
            if (obj.geometry && obj.scale) {
                const size = obj.geometry.boundingSphere ? obj.geometry.boundingSphere.radius : 12;
                objRadius = size * Math.max(obj.scale.x, obj.scale.y);
                const edge3D = obj.position.clone().add(new THREE.Vector3(objRadius, 0, 0));
                const edge2D = edge3D.project(camera);
                const edgeX = (edge2D.x * 0.5 + 0.5) * canvas.width;
                objRadius = Math.abs(edgeX - objX);
            } else {
                objRadius = 12;
            }
            const dist2D = Math.sqrt((solly1X - objX) ** 2 + (solly1Y - objY) ** 2);
            // Overlap-percentage: 1 - (afstand / som van de stralen)
            const overlap = 1 - (dist2D / (solly1Radius + objRadius));
            if (overlap > 0.65 && dist2D < minDist2D) {
                minDist2D = dist2D;
                closest2D = obj;
                closestRadius = objRadius;
            }
        });
        if (closest2D) {
            // Log overlap info
            const objScreen = closest2D.position.clone().project(camera);
            const objX = (objScreen.x * 0.5 + 0.5) * canvas.width;
            const objY = (-objScreen.y * 0.5 + 0.5) * canvas.height;
            const dist2D = Math.sqrt((solly1X - objX) ** 2 + (solly1Y - objY) ** 2);
            const overlap = 1 - (dist2D / (solly1Radius + closestRadius));
            console.log('[2D COLLISION DEBUG]', {
                solly1: { x: solly1X, y: solly1Y, r: solly1Radius },
                miniSolly: { x: objX, y: objY, r: closestRadius },
                dist2D,
                overlap,
                threshold: 0.65,
                collision: overlap > 0.65,
                closest2D
            });
        }
        if (closest2D) {
            // Kaboom op de dichtstbijzijnde mini-Solly
            console.log('[KABOOM TRIGGERED]', { closest2D, minDist2D });
            if (typeof window.createKaboomAnimation === 'function') {
                window.createKaboomAnimation(closest2D.position.clone(), true);
            }
                                            // Increment kaboom count in GameManager
                if (window.gameManager) {
                    window.gameManager.incrementKaboomCount();
                    
                    // Check of we 4 kabooms hebben bereikt
                    const kaboomCount = window.gameManager.getKaboomCount();
                    console.log('💥 Kaboom count:', kaboomCount);
                    
                    if (kaboomCount >= 4 && !window.shapeChoiceMade) {
                        console.log('🎯 4 kabooms bereikt! Toon shape choice modal');
                        
                        // Toon shape choice modal na 1 seconde
                        setTimeout(() => {
                            if (!window.shapeChoiceMade) {
                                window.showShapeChoiceModal();
                            }
                        }, 1000);
                    }
                }
                closest2D.parent && closest2D.parent.remove(closest2D);
                // Solly1 blijft op 200% grootte, wit en zichtbaar
                if (solly1) {
                    solly1.scale.set(2, 2, 2);
                    if (solly1.material) solly1.material.color.setHex(0xFFFFFF);
                    solly1.visible = true;
                }
                // Zet alle lights op 1.0
                scene.traverse(obj => {
                    if (obj.type === 'DirectionalLight' || obj.type === 'PointLight' || obj.type === 'SpotLight' || obj.type === 'AmbientLight') {
                        obj.visible = true;
                        obj.intensity = 1.0;
                    }
                });
                // Update kaboom teller display
                if (typeof window.updateKaboomTeller === 'function') {
                    window.updateKaboomTeller();
                }
                // Forceer Solly1 altijd op 200% na Kaboom
                setTimeout(() => {
                    if (solly1) solly1.scale.set(2, 2, 2);
                }, 100);
                return; // Sla de 3D-afstand-checks hieronder over als er een 2D-collision is
        } else {
            console.log('[GEEN KABOOM] Geen mini-Solly met >65% overlap');
        }
    }
    // === KABOOM OP MINI-SOLLY (afstand-check) ===
    if (window.miniSollys && window.miniSollys.length && typeof THREE !== 'undefined') {
        // Gebruik een raycaster vanaf de muispositie
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        let hits = raycaster.intersectObjects(window.miniSollys, false);
        // Als geen raycast-hit, doe een afstandscheck
        if (hits.length === 0 && solly1) {
            let minDist = Infinity;
            let closest = null;
            const dropPos = solly1.position.clone();
            window.miniSollys.forEach(obj => {
                if (!obj.position) return;
                const dist = dropPos.distanceTo(obj.position);
                if (dist < minDist) {
                    minDist = dist;
                    closest = obj;
                }
            });
            if (closest && minDist < 300) { // 300 units tolerantiedrempel
                hits = [ { object: closest } ];
            }
        }
        console.log('[DEBUG][KABOOM] Raycast/afstand hits:', hits);
        if (hits.length > 0) {
            const mini = hits[0].object;
            console.log('[DEBUG][KABOOM] Eerste hit:', mini.name, mini.position, mini.visible, mini.type);
            if (typeof window.createKaboomAnimation === 'function') {
                window.createKaboomAnimation(mini.position.clone(), true);
            }
            // Increment kaboom count in GameManager
            if (window.gameManager) {
                window.gameManager.incrementKaboomCount();
                
                // Check of we 4 kabooms hebben bereikt
                const kaboomCount = window.gameManager.getKaboomCount();
                console.log('💥 Kaboom count:', kaboomCount);
                
                if (kaboomCount >= 4 && !window.shapeChoiceMade) {
                    console.log('🎯 4 kabooms bereikt! Toon shape choice modal');
                    
                    // Toon shape choice modal na 1 seconde
                    setTimeout(() => {
                        if (!window.shapeChoiceMade) {
                            window.showShapeChoiceModal();
                        }
                    }, 1000);
                }
            }
            mini.parent && mini.parent.remove(mini);
            // Update kaboom teller display
            if (typeof window.updateKaboomTeller === 'function') {
                window.updateKaboomTeller();
            }
        } else {
            console.log('[DEBUG][KABOOM] Geen mini-Solly geraakt bij drop.');
        }
    }
    window.solly1MovementPaused = false;
    isDragging = false;
    draggedSolly = null;
    document.body.style.cursor = 'default';
    // Lights weer aan
    scene.traverse(obj => {
        if (obj.type === 'DirectionalLight' || obj.type === 'PointLight' || obj.type === 'SpotLight' || obj.type === 'AmbientLight') {
            obj.visible = true;
            obj.intensity = 1;
        }
    });
    // Controls weer aan
    if (window.controls) window.controls.enabled = true;
    // Solly1 blijft wit en op 200% grootte
    if (solly1.material) solly1.material.color.setHex(0xFFFFFF);
    solly1.scale.set(2, 2, 2);
    // --- FIX: Zet offset zodat Solly1 vanaf drop-positie verder beweegt ---
    if (window.solly1Movement) {
        if (!window.solly1Movement.offset) window.solly1Movement.offset = {x:0, y:0, z:0};
        window.solly1Movement.dragging = false;
        // DEBUG: log animatie-tijd en drop-positie vóór reset
        console.log('[DEBUG][DRAG-END] Drop-positie:', solly1.position.clone());
        console.log('[DEBUG][DRAG-END] Animatie-tijd vóór reset:', window.solly1Movement.time);
        let t;
        if (window.solly1Movement.resetTimeOnDrop) {
            window.solly1Movement.time = 0;
            t = 0;
            console.log('[DEBUG][DRAG-END] Animatie-tijd GERESet naar 0');
        } else {
            t = window.solly1Movement.time || 0;
        }
        const sinX = Math.sin(t * 0.1) * 1500 + Math.cos(t * 0.07) * 800;
        const sinY = Math.cos(t * 0.08) * 1200 + Math.sin(t * 0.12) * 600;
        const sinZ = Math.sin(t * 0.09) * 1000 + Math.cos(t * 0.11) * 700;
        window.solly1Movement.offset.x = solly1.position.x - sinX;
        window.solly1Movement.offset.y = solly1.position.y - sinY;
        window.solly1Movement.offset.z = solly1.position.z - sinZ;
        // === CORRECTIE: offset is drop-positie min volledige animatiepositie op t ===
        const animX0 = Math.sin(t * 0.1) * 1500 + Math.cos(t * 0.07) * 800;
        const animY0 = Math.cos(t * 0.08) * 1200 + Math.sin(t * 0.12) * 600;
        const animZ0 = Math.sin(t * 0.09) * 1000 + Math.cos(t * 0.11) * 700;
        window.solly1Movement.offset.x = solly1.position.x - animX0;
        window.solly1Movement.offset.y = solly1.position.y - animY0;
        window.solly1Movement.offset.z = solly1.position.z - animZ0;
        solly1.position.set(
            window.solly1Movement.offset.x + Math.sin(t * 0.1) * 1500 + Math.cos(t * 0.07) * 800,
            window.solly1Movement.offset.y + Math.cos(t * 0.08) * 1200 + Math.sin(t * 0.12) * 600,
            window.solly1Movement.offset.z + Math.sin(t * 0.09) * 1000 + Math.cos(t * 0.11) * 700
        );
        console.log('[DEBUG][DRAG-END] Solly1 positie direct na offset-correctie:', solly1.position.clone());
        // === NIEUW: animatie hervatten na drag/kaboom ===
        if (window.solly1Movement.stopAfterDrag) {
            window.solly1MovementPaused = true;
            console.log('[DEBUG][DRAG-END] Animatie van Solly1 is nu volledig gepauzeerd na drag.');
        } else {
            window.solly1MovementPaused = false;
            console.log('[DEBUG][DRAG-END] Solly1 gaat weer verder bewegen door het universum!');
        }
        // === VISUEEL EFFECT: Solly1 wordt 300% groter, knippert/oplicht, en keert terug naar 200% ===
        if (solly1 && solly1.scale && solly1.material) {
            const origScale = solly1.scale.x;
            const origColor = solly1.material.color.getHex();
            solly1.scale.set(origScale * 3.0, origScale * 3.0, origScale * 3.0);
            let blink = true;
            let blinkCount = 0;
            const blinkInterval = setInterval(() => {
                if (!solly1.material) return;
                solly1.material.color.setHex(blink ? 0xFFFF66 : origColor);
                blink = !blink;
                blinkCount++;
                if (blinkCount > 5) {
                    clearInterval(blinkInterval);
                    solly1.scale.set(origScale * 2.0, origScale * 2.0, origScale * 2.0);
                    solly1.material.color.setHex(origColor);
                }
            }, 100);
        }
    }
    // Ontkoppel mousemove/mouseup
    renderer.domElement.removeEventListener('mousemove', onSolly1PointerMove);
    renderer.domElement.removeEventListener('mouseup', onSolly1PointerUp);
    // GEEN camera lookAt!
    console.log('🔵 [DRAG] Drag beëindigd, alles weer normaal');
}

// Alleen Solly1 klikbaar maken
function enableSolly1DragOnly() {
    if (!renderer || !renderer.domElement) return;
    renderer.domElement.addEventListener('mousedown', onSolly1PointerDown);
    // Zorg dat alleen Solly1 raycastable is
    scene.traverse(obj => {
        if (obj.isMesh) {
            if (obj === solly1) {
                obj.visible = true;
                if (obj.material) obj.material.visible = true;
                obj.raycast = THREE.Mesh.prototype.raycast;
            } else if (obj.name && obj.name.toLowerCase().includes('core_1')) {
                obj.visible = true;
                obj.raycast = () => {};
            } else {
                obj.visible = false;
                if (obj.material) obj.material.visible = false;
                obj.raycast = () => {};
            }
        }
    });
    console.log('🟢 Alleen Solly1 is klikbaar en dragbaar. Zon blijft zichtbaar.');
}

// Roep deze functie aan na laden
if (typeof solly1 !== 'undefined' && typeof scene !== 'undefined') {
    enableSolly1DragOnly();
} 

// Zorg dat de Solly1Collider WEL raycastable is, zodat aanklikken eenvoudiger is
if (typeof solly1 !== 'undefined' && solly1.getObjectByName && solly1.getObjectByName('Solly1Collider')) {
    const col = solly1.getObjectByName('Solly1Collider');
    col.raycast = THREE.Mesh.prototype.raycast;
    col.visible = false; // onzichtbaar maar klikbaar
    console.log('🛡️ Collider van Solly1 is weer raycastable gemaakt.');
} 

// Forceer Solly1 altijd zichtbaar, groot, wit en in het midden
function forceSolly1Visible() {
    if (window.solly1) {
        window.solly1.visible = true;
        if (window.solly1.material) {
            window.solly1.material.color.set(0xFFFFFF);
            window.solly1.material.opacity = 1;
            window.solly1.material.transparent = false;
        }
        window.solly1.scale.set(5, 5, 5);
        window.solly1.position.set(0, 0, 0);
        if (window.camera) {
            window.camera.position.set(0, 0, 2000);
            window.camera.lookAt(0, 0, 0);
        }
        if (window.renderer && window.scene && window.camera) {
            window.renderer.render(window.scene, window.camera);
        }
        console.log('✅ Solly1 geforceerd zichtbaar, groot, wit en gecentreerd!');
    } else {
        console.warn('❌ window.solly1 niet gevonden!');
    }
}

// Roep deze functie direct na het aanmaken van Solly1 aan
if (window.solly1) {
    forceSolly1Visible();
}

// === ANIMATIE-OPTIE: tijd resetten na drag? ===
window.solly1Movement = window.solly1Movement || {};
window.solly1Movement.resetTimeOnDrop = true; // Animatie-tijd wordt nu altijd gereset na drag
window.solly1Movement.stopAfterDrag = false; // Zet op false: Solly1 gaat verder bewegen na drag/kaboom

// Zet de 2D-collision check in een aparte functie zodat deze overal aanroepbaar is
window.checkSolly1MiniSolly2DCollision = function() {
    console.log('[2D COLLISION FUNCTIE AANGEROEPEN] miniSollys:', window.miniSollys ? window.miniSollys.length : 'undefined');
    if (window.refreshMiniSollys) window.refreshMiniSollys();
    if (window.miniSollys && window.miniSollys.length && typeof THREE !== 'undefined') {
        const solly1Screen = solly1.position.clone().project(camera);
        const canvas = renderer.domElement;
        const solly1X = (solly1Screen.x * 0.5 + 0.5) * canvas.width;
        const solly1Y = (-solly1Screen.y * 0.5 + 0.5) * canvas.height;
        // Bepaal de 2D-radius van Solly1 (neem schaal en geometry)
        let solly1Radius = 0;
        if (solly1.geometry && solly1.scale) {
            // Neem de grootste dimensie van geometry * schaal * projectie
            const size = solly1.geometry.boundingSphere ? solly1.geometry.boundingSphere.radius : 30;
            solly1Radius = size * Math.max(solly1.scale.x, solly1.scale.y);
            // Projecteer een punt op de rand naar 2D voor nauwkeurigheid
            const edge3D = solly1.position.clone().add(new THREE.Vector3(solly1Radius, 0, 0));
            const edge2D = edge3D.project(camera);
            const edgeX = (edge2D.x * 0.5 + 0.5) * canvas.width;
            solly1Radius = Math.abs(edgeX - solly1X);
        } else {
            solly1Radius = 40;
        }
        let closest2D = null;
        let minDist2D = Infinity;
        let closestRadius = 0;
        window.miniSollys.forEach(obj => {
            if (!obj.position) return;
            const objScreen = obj.position.clone().project(camera);
            const objX = (objScreen.x * 0.5 + 0.5) * canvas.width;
            const objY = (-objScreen.y * 0.5 + 0.5) * canvas.height;
            // Bepaal de 2D-radius van de mini-Solly
            let objRadius = 0;
            if (obj.geometry && obj.scale) {
                const size = obj.geometry.boundingSphere ? obj.geometry.boundingSphere.radius : 12;
                objRadius = size * Math.max(obj.scale.x, obj.scale.y);
                const edge3D = obj.position.clone().add(new THREE.Vector3(objRadius, 0, 0));
                const edge2D = edge3D.project(camera);
                const edgeX = (edge2D.x * 0.5 + 0.5) * canvas.width;
                objRadius = Math.abs(edgeX - objX);
            } else {
                objRadius = 12;
            }
            const dist2D = Math.sqrt((solly1X - objX) ** 2 + (solly1Y - objY) ** 2);
            // Overlap-percentage: 1 - (afstand / som van de stralen)
            const overlap = 1 - (dist2D / (solly1Radius + objRadius));
            if (overlap > 0.65 && dist2D < minDist2D) {
                minDist2D = dist2D;
                closest2D = obj;
                closestRadius = objRadius;
            }
        });
        if (closest2D) {
            // Log overlap info
            const objScreen = closest2D.position.clone().project(camera);
            const objX = (objScreen.x * 0.5 + 0.5) * canvas.width;
            const objY = (-objScreen.y * 0.5 + 0.5) * canvas.height;
            const dist2D = Math.sqrt((solly1X - objX) ** 2 + (solly1Y - objY) ** 2);
            const overlap = 1 - (dist2D / (solly1Radius + closestRadius));
            console.log('[2D COLLISION RESULT]', {
                minDist2D,
                threshold: 0.65,
                collision: overlap > 0.65,
                closest2D
            });
            if (closest2D && overlap > 0.65) { // 0.65 is de overlap-drempel
                // Kaboom op de dichtstbijzijnde mini-Solly
                console.log('[KABOOM TRIGGERED]', { closest2D, minDist2D });
                if (typeof window.createKaboomAnimation === 'function') {
                    window.createKaboomAnimation(closest2D.position.clone(), true);
                }
                // Increment kaboom count in GameManager
                if (window.gameManager) {
                    window.gameManager.incrementKaboomCount();
                    
                    // Check of we 4 kabooms hebben bereikt
                    const kaboomCount = window.gameManager.getKaboomCount();
                    console.log('💥 Kaboom count:', kaboomCount);
                    
                    if (kaboomCount >= 4 && !window.shapeChoiceMade) {
                        console.log('🎯 4 kabooms bereikt! Toon shape choice modal');
                        
                        // Toon shape choice modal na 1 seconde
                        setTimeout(() => {
                            if (!window.shapeChoiceMade) {
                                window.showShapeChoiceModal();
                            }
                        }, 1000);
                    }
                }
                closest2D.parent && closest2D.parent.remove(closest2D);
                // Solly1 blijft op 200% grootte, wit en zichtbaar
                if (solly1) {
                    solly1.scale.set(2, 2, 2);
                    if (solly1.material) solly1.material.color.setHex(0xFFFFFF);
                    solly1.visible = true;
                }
                // Zet alle lights op 1.0
                scene.traverse(obj => {
                    if (obj.type === 'DirectionalLight' || obj.type === 'PointLight' || obj.type === 'SpotLight' || obj.type === 'AmbientLight') {
                        obj.visible = true;
                        obj.intensity = 1.0;
                    }
                });
                // Update kaboom teller display
                if (typeof window.updateKaboomTeller === 'function') {
                    window.updateKaboomTeller();
                }
                // Forceer Solly1 altijd op 200% na Kaboom
                setTimeout(() => {
                    if (solly1) solly1.scale.set(2, 2, 2);
                }, 100);
                return; // Sla de 3D-afstand-checks hieronder over als er een 2D-collision is
            } else {
                console.log('[GEEN KABOOM] Geen mini-Solly met >65% overlap');
            }
        }
    }
}

// Vul window.miniSollys altijd met alle mini-Solly's in de scene
window.refreshMiniSollys = function() {
    if (!window.scene) return;
    window.miniSollys = [];
    window.scene.traverse(obj => {
        if (obj.isMesh && obj.userData && obj.userData.isSolly && !obj.userData.isSolly1 && !obj.userData.isSolly2) {
            window.miniSollys.push(obj);
        }
    });
    console.log('[REFRESH MINI SOLLYS] Aantal mini-Solly\'s:', window.miniSollys.length);
};
// Roep deze direct aan na laden
if (window.scene) window.refreshMiniSollys();
