// Solly1/Solly2 and collision functions

// ---- DEBUG Config ------------------------------------------------------------
window.DEBUG = window.DEBUG || false; // Zet true om debuglogs te zien
function debugLog(...args) {
    if (window.DEBUG) {
        console.log(...args);
    }
}
// -----------------------------------------------------------------------------

function addSolly1AndSolly2(scene) {
    // Solly2 is niet meer nodig – alleen Solly1 wordt aangemaakt
    // Solly1 (Wit)
    solly1 = createSolly(60, false, 0xFFFFFF);
    // Geef pyramide een warm materiaal en zachte glow (vorm blijft pyramide)
    // Gebruik een MeshBasicMaterial zodat belichting geen invloed heeft en Solly1 altijd puur wit toont
    const whiteMat = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,      // helder wit
        toneMapped: false     // negeer tone mapping voor maximale helderheid
    });
    if (Array.isArray(solly1.material)) {
        solly1.material.forEach(m => m.dispose());
    } else if (solly1.material) {
        solly1.material.dispose();
    }
    solly1.material = whiteMat;
    solly1.castShadow = false; solly1.receiveShadow = false;
    // Voeg of vervang aura
    const existingAura = solly1.getObjectByName('solly1-aura');
    if (existingAura) existingAura.removeFromParent(); // Geen gloed meer
    solly1.userData.isSolly1 = true;
    solly1.userData.shape = 'piramide';
    solly1.name = 'Solly1';
    solly1.scale.set(3.4, 3.4, 3.4);
    if (solly1.material) {
        solly1.material.color.set(0xFFFFFF);
        solly1.material.opacity = 1;
        solly1.material.transparent = false;
        solly1.material.visible = true;
    }
    solly1.visible = true;
    // Maak ook een globale verwijzing zodat andere scripts uniform window.solly1 kunnen gebruiken
    window.solly1 = solly1;
    if (!solly1.getObjectByName('Solly1Collider')) {
        const pickGeom = new THREE.SphereGeometry(600, 24, 24); // grotere click-zone
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
    
    // Bereken middenpunt (als Solly2 ontbreekt, gebruik Solly1 positie)
    const midPoint = solly2 ? new THREE.Vector3().addVectors(solly1.position, solly2.position).multiplyScalar(0.5) : solly1.position.clone();
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
        debugLog('⏳ [DEBUG] Renderer nog niet beschikbaar, probeer over 100ms opnieuw...');
        setTimeout(addSollyDragListeners, 100);
        return;
    }
    const canvas = window.renderer.domElement;
    debugLog('🖱️ [DEBUG] Drag-listeners worden toegevoegd aan canvas:', canvas);
    // Verwijder eventuele oude listener in bubbelfase
    canvas.removeEventListener('pointerdown', onSolly1PointerDown, false);
    // Voeg pointerdown-listener toe in capture-fase zodat we vóór OrbitControls reageren
    canvas.addEventListener('pointerdown', onSolly1PointerDown, true);
    // Log dat listeners zijn toegevoegd
    debugLog('✅ [DEBUG] Drag-listeners toegevoegd aan canvas!');
}

window.addSollyDragListeners = addSollyDragListeners;

// Automatisch activeren zodra renderer beschikbaar is
function initSollyDragWhenReady() {
    if (window.renderer && window.renderer.domElement) {
        debugLog('🎯 [DEBUG] Renderer gevonden, initialiseer Solly drag...');
        addSollyDragListeners();
    } else {
        debugLog('⏳ [DEBUG] Wacht op renderer...');
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
// Globale pauzeer-flag voor collision/kaboom
window.collisionPaused = false;

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
    
    // Zet alle lights uit tijdens drag
    scene.traverse(obj => {
        if (obj.type === 'DirectionalLight' || obj.type === 'PointLight' || obj.type === 'SpotLight' || obj.type === 'AmbientLight') {
            obj.visible = false;
            obj.intensity = 0;
        }
    });
    
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
    debugLog('🟢 onDragMove aangeroepen!');

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
        
        // Zet alle lights weer aan na drag
        scene.traverse(obj => {
            if (obj.type === 'DirectionalLight' || obj.type === 'PointLight' || obj.type === 'SpotLight' || obj.type === 'AmbientLight') {
                obj.visible = true;
                obj.intensity = 1;
            }
        });
        
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
        document.body.style.cursor = 'pointer';
        
        if (controls) {
            controls.enabled = true;
            console.log('✅ OrbitControls weer ingeschakeld na drag');
        }
        if (window.controls && window.debugSolly1Only) window.controls.enabled = false;
        
        // Hervat automatische beweging van Solly1
        // Laat Solly1 op zijn nieuwe positie staan: animatie blijft gepauzeerd
        // window.solly1MovementPaused blijft TRUE
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
        
        // Controleer of Solly1 bovenop een miniSolly is gedropt
        evaluateDropOnMiniSolly();

        console.log('💡 Lights weer aangezet en alle animaties hervat');
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
if (window.debugSolly1Only && typeof solly1 !== 'undefined' && typeof scene !== 'undefined') {
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

// === DEBUG-ONLY: Alleen Solly1 zichtbaar ===
// Zet handmatig window.debugSolly1Only = true in console om te activeren
if (typeof window !== 'undefined') {
    window.debugSolly1Only = false;
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
    debugLog('🖱️ [DEBUG] PointerDown event op canvas!');
    if (window.solly1) {
        debugLog('🔍 [DEBUG] Solly1 bestaat:', window.solly1);
        debugLog('👁️ [DEBUG] Solly1 zichtbaar:', window.solly1.visible);
        if (window.solly1.material) {
            debugLog('🎨 [DEBUG] Solly1 materiaal zichtbaar:', window.solly1.material.visible, 'opacity:', window.solly1.material.opacity, 'transparent:', window.solly1.material.transparent);
        }
        debugLog('🧲 [DEBUG] Solly1 raycast:', typeof window.solly1.raycast === 'function');
    } else {
        debugLog('❌ [DEBUG] Solly1 bestaat NIET op moment van click!');
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
    // Raycast check op Solly1 of collider
    const hits = raycaster.intersectObjects([solly1, ...solly1.children], true);
    let sollyHit = hits.length > 0;
    // Fallback: als cursor visueel dicht bij projectie van Solly1 is (<40px)
    if (!sollyHit) {
        const sollyScreen = solly1.position.clone().project(camera);
        const sx = (sollyScreen.x * 0.5 + 0.5) * rect.width + rect.left;
        const sy = (-sollyScreen.y * 0.5 + 0.5) * rect.height + rect.top;
        const dx = event.clientX - sx;
        const dy = event.clientY - sy;
        if (Math.hypot(dx, dy) < 40) sollyHit = true;
    }
    if (!sollyHit) {
        console.log('❌ Niet op/naast Solly1 geklikt');
        return;
    }
    // Stop event zodat OrbitControls geen rotatie start
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    if (event.stopPropagation) event.stopPropagation();
    if (event.preventDefault) event.preventDefault();
    // Log welk object je raakt
    const hitObj = hits[0].object;
    console.log('🎯 Raycast hit:', hitObj.name, 'is hoofdmesh:', hitObj === solly1, 'is child van solly1:', hitObj.parent === solly1);
    // Als Solly1 geraakt
    draggedSolly = solly1;
    // Definieer vlak loodrecht op camera door Solly1 positie
    const camDir = camera.getWorldDirection(new THREE.Vector3());
    dragPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(camDir, solly1.position);
    dragOffsetDist = camDir.dot(solly1.position.clone().sub(camera.position));
    // Listener naar window zodat het blijft werken buiten canvas
    window.addEventListener('pointermove', onSolly1PointerMove);
    window.addEventListener('pointerup', onSolly1PointerUp);
    // Start drag
    // Pauzeer universum-animaties
    if (typeof window.isPaused !== 'undefined') {
        window.__prevIsPaused = window.isPaused;
        window.isPaused = true;
    }
    window.solly1DragActive = true;
    window.solly1MovementPaused = true;
    isDragging = true;
    document.body.style.cursor = 'grabbing';
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
    window.solly1.scale.set(3.4, 3.4, 3.4);
    // oude listeners niet meer nodig
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
    if (!window.solly1DragActive || !draggedSolly || !dragPlane) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, camera);
    const hit = new THREE.Vector3();
    if (ray.ray.intersectPlane(dragPlane, hit)) {
        draggedSolly.position.copy(hit);
    } else {
        // fallback: zet op ray op zelfde diepte als origineel
        ray.ray.at(dragOffsetDist, hit);
        draggedSolly.position.copy(hit);
    }
 }

function onSolly1PointerUp(event) {
    if (!window.solly1DragActive) return;
    window.solly1DragActive = false;
    // Hervat universum-animaties
    if (typeof window.isPaused !== 'undefined') {
        if (typeof window.__prevIsPaused !== 'undefined') {
            window.isPaused = window.__prevIsPaused;
            delete window.__prevIsPaused;
        } else {
            window.isPaused = false;
        }
    }
    // Laat Solly1 op nieuwe positie staan; animatie blijft gepauzeerd
    isDragging = false;
    draggedSolly = null;
    dragPlane = null;
    document.body.style.cursor = 'pointer';
    // Lights weer aan
    scene.traverse(obj => {
        if (obj.type === 'DirectionalLight' || obj.type === 'PointLight' || obj.type === 'SpotLight' || obj.type === 'AmbientLight') {
            obj.visible = true;
            obj.intensity = 1;
        }
    });
    // Controls weer aan
    if (window.controls) window.controls.enabled = true;
    // Solly1 weer wit en normaal formaat
    if (solly1.material) solly1.material.color.setHex(0xFFFFFF);
    solly1.scale.set(1, 1, 1);
    // Ontkoppel mousemove/mouseup
    window.removeEventListener('pointermove', onSolly1PointerMove);
    window.removeEventListener('pointerup', onSolly1PointerUp);
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

// Maak collider niet-raycastable tijdens debug
if (typeof solly1 !== 'undefined' && solly1.getObjectByName && solly1.getObjectByName('Solly1Collider')) {
    solly1.getObjectByName('Solly1Collider').raycast = () => {};
    console.log('🛡️ Collider van Solly1 is niet-raycastable gemaakt voor debug.');
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

// Detecteer drop
function evaluateDropOnMiniSolly() {
    if (!window.miniSollys || !solly1) return;
    const threshold = 150; // afstand voor succesvolle drop
    for (const mini of window.miniSollys) {
        if (!mini) continue;
        if (solly1.position.distanceTo(mini.position) < threshold) {
            console.log('🎯 Solly1 gedropt op miniSolly!', mini);
            handleSollyOnMini(mini);
            break;
        }
    }
}

function handleSollyOnMini(targetMini) {
    if (!targetMini) return;

    // 1. Highlight Solly1 kort geel
    if (window.solly1 && window.solly1.material) {
        const originalColor = window.solly1.material.color.clone();
        window.solly1.material.color.setHex(0xFFFF00);
        setTimeout(() => {
            if (window.solly1 && window.solly1.material) {
                window.solly1.material.color.copy(originalColor);
            }
        }, 350);
    }

    // 2. Pulse & fade-out animatie voor de mini-Solly
    const startScale = targetMini.scale.clone();
    const endScale   = startScale.clone().multiplyScalar(2.2);

    // Zorg dat materiaal kan faden
    if (Array.isArray(targetMini.material)) {
        targetMini.material.forEach(m => { m.transparent = true; });
    } else if (targetMini.material) {
        targetMini.material.transparent = true;
    }

    const startOpacity = (Array.isArray(targetMini.material) ? targetMini.material[0].opacity : targetMini.material.opacity) ?? 1;
    const duration = 600;
    const startTime = performance.now();

    function animate() {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const ease = 0.5 - Math.cos(t * Math.PI) / 2; // easeInOut

        // Scale
        targetMini.scale.lerpVectors(startScale, endScale, ease);

        // Opacity fade
        const newOpacity = startOpacity * (1 - ease);
        if (Array.isArray(targetMini.material)) {
            targetMini.material.forEach(m => m.opacity = newOpacity);
        } else if (targetMini.material) {
            targetMini.material.opacity = newOpacity;
        }

        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            // Verwijder uit scene na animatie
            if (window.scene) {
                scene.remove(targetMini);
            }
        }
    }
    animate();
}
