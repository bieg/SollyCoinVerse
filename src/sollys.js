// Solly1/Solly2 and collision functions
/* eslint-disable */

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
  // Solly1 (Wit) - Maak een duidelijke piramide
  solly1 = createSolly(60, false, 0xffffff);

  // Gebruik een MeshBasicMaterial zodat belichting geen invloed heeft en Solly1 altijd puur wit toont
  const whiteMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, // helder wit
    toneMapped: false, // negeer tone mapping voor maximale helderheid
  });
  if (Array.isArray(solly1.material)) {
    solly1.material.forEach((m) => m.dispose());
  } else if (solly1.material) {
    solly1.material.dispose();
  }
  solly1.material = whiteMat;
  solly1.castShadow = false;
  solly1.receiveShadow = false;

  // Voeg of vervang aura
  const existingAura = solly1.getObjectByName('solly1-aura');
  if (existingAura) existingAura.removeFromParent(); // Geen gloed meer

  solly1.userData.isSolly1 = true;
  solly1.userData.shape = 'piramide';
  solly1.name = 'Solly1';
  solly1.scale.set(5.0, 5.0, 5.0); // Nog grotere schaal voor betere zichtbaarheid

  // ROTEER Solly1 zodat het eruitziet als een duidelijke DRIEHOEK van zijaanzicht
  // Tetrahedron heeft een punt naar boven, dus we roteren het voor een mooi zijaanzicht
  solly1.rotation.set(
    Math.PI * 0.2, // Kanteling naar voren voor betere zichtbaarheid
    Math.PI * 0.4, // 72 graden draaiing voor duidelijk zijaanzicht
    0, // Geen roll
  );

  // Zet Solly1 op een zichtbare positie
  solly1.position.set(0, 200, 0); // Hoger zodat het zichtbaar is

  if (solly1.material) {
    solly1.material.color.set(0xffffff);
    solly1.material.opacity = 1;
    solly1.material.transparent = false;
    solly1.material.visible = true;
  }
  solly1.visible = true;

  // Maak ook een globale verwijzing zodat andere scripts uniform window.solly1 kunnen gebruiken
  window.solly1 = solly1;

  if (!solly1.getObjectByName('Solly1Collider')) {
    const pickGeom = new THREE.SphereGeometry(1000, 24, 24); // Nog grotere click-zone
    const pickMat = new THREE.MeshBasicMaterial({ visible: false });
    const collider = new THREE.Mesh(pickGeom, pickMat);
    collider.name = 'Solly1Collider';
    collider.userData.isSolly1Collider = true;
    solly1.add(collider);
    window.solly1Collider = collider;
  }

  scene.add(solly1);

  // Camera goed zetten voor mooi zijaanzicht van Solly1 en portal
  if (window.camera) {
    window.camera.position.set(0, 800, 4000); // Hogere positie om Solly1 en portal te zien
    window.camera.lookAt(0, 200, 0); // Kijk naar Solly1 positie
  }

  // Direct drag-listeners toevoegen
  if (window.addSollyDragListeners) {
    window.addSollyDragListeners();
  }

  // Log alles
  console.log('🌟 Solly1 (wit driehoek) toegevoegd');
  console.log('📐 Shape: piramide (Tetrahedron)');
  console.log('📍 Solly1 positie:', solly1.position);
  console.log('📏 Solly1 schaal:', solly1.scale);
  console.log('🔄 Solly1 rotatie:', solly1.rotation);
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

  // Start explosie animatie
  createCollisionExplosion();

  // Start camera animatie naar collision
  // Camera animatie uitgeschakeld voor statische camera
  // startCameraAnimationToCollision();
}

// Nieuwe explosie animatie functie
function createCollisionExplosion() {
  console.log('💥 Start collision explosie animatie!');

  // Bereken explosie positie (midden tussen Solly1 en Solly2, of Solly1 positie)
  const explosionPos = solly2
    ? new THREE.Vector3().addVectors(solly1.position, solly2.position).multiplyScalar(0.5)
    : solly1.position.clone();

  // Maak meerdere explosie lagen voor een spectaculair effect
  createExplosionLayer(explosionPos, 0xffd700, 50, 800, 800); // Gouden kern
  createExplosionLayer(explosionPos, 0xff4500, 100, 1200, 600); // Oranje explosie
  createExplosionLayer(explosionPos, 0xff0000, 150, 1600, 400); // Rode schokgolf

  // Voeg particle effect toe
  createExplosionParticles(explosionPos);

  // Voeg screen shake effect toe
  createScreenShake();
}

// Maak explosie functies globaal beschikbaar
window.createCollisionExplosion = createCollisionExplosion;

function createExplosionLayer(position, color, delay, maxScale, duration) {
  setTimeout(() => {
    const geo = new THREE.SphereGeometry(1, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const explosion = new THREE.Mesh(geo, mat);
    explosion.position.copy(position);
    scene.add(explosion);

    const start = performance.now();
    const startScale = 10;
    const endScale = maxScale;

    function animate() {
      const t = (performance.now() - start) / duration;
      if (t >= 1) {
        scene.remove(explosion);
        return;
      }

      // Easing functie voor natuurlijke explosie
      const ease = 1 - Math.pow(1 - t, 2);
      const scale = THREE.MathUtils.lerp(startScale, endScale, ease);
      explosion.scale.setScalar(scale);
      explosion.material.opacity = 0.9 * (1 - ease);

      requestAnimationFrame(animate);
    }
    animate();
  }, delay);
}

function createExplosionParticles(position) {
  const particleCount = 50;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    const geo = new THREE.SphereGeometry(0.5, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0xffd700 : 0xff4500,
      transparent: true,
      opacity: 1.0,
    });
    const particle = new THREE.Mesh(geo, mat);

    // Willekeurige richting en snelheid
    const direction = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
    ).normalize();

    const speed = 50 + Math.random() * 100;
    particle.velocity = direction.multiplyScalar(speed);
    particle.position.copy(position);

    scene.add(particle);
    particles.push(particle);
  }

  // Animeer particles
  const start = performance.now();
  const duration = 2000;

  function animateParticles() {
    const t = (performance.now() - start) / duration;
    if (t >= 1) {
      particles.forEach((p) => scene.remove(p));
      return;
    }

    particles.forEach((particle) => {
      particle.position.add(particle.velocity.clone().multiplyScalar(0.016));
      particle.material.opacity = 1.0 * (1 - t);
      particle.scale.setScalar(1 - t * 0.5);
    });

    requestAnimationFrame(animateParticles);
  }
  animateParticles();
}

function createScreenShake() {
  const originalPosition = camera.position.clone();
  const shakeIntensity = 50;
  const shakeDuration = 500;
  const start = performance.now();

  function shake() {
    const t = (performance.now() - start) / shakeDuration;
    if (t >= 1) {
      camera.position.copy(originalPosition);
      return;
    }

    const intensity = shakeIntensity * (1 - t);
    camera.position.x = originalPosition.x + (Math.random() - 0.5) * intensity;
    camera.position.y = originalPosition.y + (Math.random() - 0.5) * intensity;
    camera.position.z = originalPosition.z + (Math.random() - 0.5) * intensity;

    requestAnimationFrame(shake);
  }
  shake();
}

function startCameraAnimationToCollision() {
  console.log('🎥 Start camera animatie naar collision...');

  cameraAnimationState.active = true;
  cameraAnimationState.startTime = Date.now();
  cameraAnimationState.startPosition = camera.position.clone();

  // Bereken middenpunt (als Solly2 ontbreekt, gebruik Solly1 positie)
  const midPoint = solly2
    ? new THREE.Vector3().addVectors(solly1.position, solly2.position).multiplyScalar(0.5)
    : solly1.position.clone();
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
      console.log('🎥 Camera animatie voltooid, portal activeren...');
      // Camera follow animatie uitgeschakeld voor statische camera
      // startCameraFollowAnimation();
      activatePortal();
    }
  }

  animateCamera();
}

function startCameraFollowAnimation() {
  console.log('🎥 Camera follow-animatie uitgeschakeld voor statische camera');
  // Direct portal activeren zonder camera beweging
  activatePortal();
}

function activatePortal() {
  if (portalActive) return;

  if (!solly1) {
    console.error('❌ Kan portal niet activeren: solly1 is niet gevonden.');
    return;
  }

  // Gebruik de nieuwe createShapePortal functie in plaats van de oude createPortal
  // Haal de huidige vorm op van Solly1
  const currentShape = solly1.userData.shape || 'piramide';

  if (window.collisionManager && typeof window.collisionManager.createShapePortal === 'function') {
    console.log(`🔮 Activating portal with shape: ${currentShape}`);
    window.collisionManager.createShapePortal(currentShape);
  } else {
    console.error('❌ CollisionManager of createShapePortal niet beschikbaar');
    // Fallback naar oude methode
    portal = createPortal(solly1);
    scene.add(portal);
    window.portal = portal;
  }

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

  // Zorg ervoor dat Solly1 goed zichtbaar en klikbaar is
  if (solly1) {
    solly1.visible = true;
    solly1.userData.raycastDisabled = false;
    if (solly1.material) {
      if (Array.isArray(solly1.material)) {
        solly1.material.forEach((m) => (m.opacity = 1));
      } else {
        solly1.material.opacity = 1;
      }
    }
    // Maak Solly1 groter voor betere raycasting
    solly1.scale.set(1.5, 1.5, 1.5);
    console.log('🎯 Solly1 klaar voor drag & drop (1.5x groter)');
  }

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
// Globale pauzeer-flag voor collision/kaboom
window.collisionPaused = false;
// === NIEUW: Drop-handled flag ===
window.solly1DropHandled = false;

// Hover-callback eerst declareren zodat het beschikbaar is
function onSollyHoverMove(e) {
  if (!renderer || !camera || !solly1) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1,
  );
  const rc = new THREE.Raycaster();
  rc.setFromCamera(mouse, camera);
  const intersects = rc.intersectObject(solly1, true);
  renderer.domElement.style.cursor = intersects.length
    ? isDragging
      ? 'grabbing'
      : 'pointer'
    : isDragging
      ? 'grabbing'
      : '';
}

function onShapeSollyClick(event) {
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

  if (isDragging) return;

  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Check ALLE objecten in de scene voor debugging
  const allHits = raycaster.intersectObjects(window.scene.children, true);
  console.log(
    '🎯 Alle hits bij click:',
    allHits.map((hit) => hit.object.name || hit.object.type),
  );

  // Check Solly1 met meer tolerantie
  if (solly1 && solly1.visible) {
    // Probeer eerst normale intersect
    let hits = raycaster.intersectObject(solly1, true);

    // Als geen hits, probeer dan met een grotere bounding box
    if (hits.length === 0) {
      // Maak een tijdelijke grotere bounding box voor Solly1
      const originalScale = solly1.scale.clone();
      solly1.scale.multiplyScalar(3); // Maak 3x groter voor raycasting

      hits = raycaster.intersectObject(solly1, true);

      // Herstel originele schaal
      solly1.scale.copy(originalScale);
    }

    if (hits.length > 0) {
      console.log('🎯 Solly1 geraakt – start drag');
      startDrag(solly1);
      if (window.controls) window.controls.enabled = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    } else {
      console.log('❌ Solly1 NIET geraakt!');
    }
  }

  // Log alle hits voor debugging
  logRaycastHits(event);

  // Debug: toon Solly1 positie
  if (solly1) {
    console.log('📍 Solly1 positie:', solly1.position);
    console.log('📍 Solly1 zichtbaar:', solly1.visible);
    console.log('📍 Solly1 schaal:', solly1.scale);
    console.log(
      '📍 Solly1 material opacity:',
      solly1.material
        ? Array.isArray(solly1.material)
          ? solly1.material[0].opacity
          : solly1.material.opacity
        : 'geen material',
    );
  }

  // Als we niet op Solly1 klikken, probeer dan de portal
  if (window.portal && window.portal.children) {
    const portalHits = raycaster.intersectObjects(window.portal.children, true);
    if (portalHits.length > 0) {
      console.log('🎯 Portal geraakt - maar geen drag');
      return;
    }
  }

  console.log('❌ Niet op/naast Solly1 geklikt');
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
  scene.traverse((obj) => {
    if (
      obj.type === 'DirectionalLight' ||
      obj.type === 'PointLight' ||
      obj.type === 'SpotLight' ||
      obj.type === 'AmbientLight'
    ) {
      obj.visible = false;
      obj.intensity = 0;
    }
  });

  // Maak Solly1 groter en felrood tijdens drag (maar niet te groot)
  if (draggedSolly.material) {
    if (Array.isArray(draggedSolly.material)) {
      draggedSolly.material.forEach((m) => m.color.setHex(0xff0000));
    } else {
      draggedSolly.material.color.setHex(0xff0000);
    }
  }
  draggedSolly.scale.set(2, 2, 2); // Niet te groot, maar wel zichtbaar

  // === NIEUW: Zorg dat de zon nooit van kleur verandert ===
  if (window.sollySun && window.sollySun.material && window.sollySun.material.color) {
    window.sollySun.material.color.set(0xffb200); // altijd oranje-geel
  }

  // Zet cursor op grabbing
  document.body.style.cursor = 'grabbing';

  console.log('❄️ Alle animaties gepauzeerd voor smooth drag');

  // Zorg ervoor dat Solly1 goed zichtbaar is voor raycasting
  if (solly1) {
    solly1.userData.raycastDisabled = false;
    solly1.visible = true;
    if (solly1.material) {
      if (Array.isArray(solly1.material)) {
        solly1.material.forEach((m) => (m.opacity = 1));
      } else {
        solly1.material.opacity = 1;
      }
    }
  }
}

function onDragMove(event) {
  if (!isDragging || !draggedSolly) return;
  debugLog('🟢 onDragMove aangeroepen!');

  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Sleep Solly1 direct naar de muispositie zonder centrum/spinning
  // Gebruik een vlak op de Y-as (horizontaal vlak) voor natuurlijke beweging
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const intersection = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, intersection);

  // Debug: log de intersectie-coördinaten
  console.log('🟠 [onDragMove] intersection:', intersection.x, intersection.y, intersection.z);

  // Controleer of intersection geldig is (geen NaN of Infinity waarden)
  if (
    intersection &&
    Number.isFinite(intersection.x) &&
    Number.isFinite(intersection.y) &&
    Number.isFinite(intersection.z)
  ) {
    // Behoud de Y-positie van Solly1 (hoogte blijft hetzelfde)
    intersection.y = draggedSolly.position.y;
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
        solly1.material.forEach((m) => m.color.setHex(0xffffff)); // Wit
      } else {
        solly1.material.color.setHex(0xffffff); // Wit
      }
    }
    if (solly1) {
      solly1.scale.set(0.75, 0.75, 0.75); // 25% kleiner zoals eerder ingesteld
    }

    // Zet alle lights weer aan na drag
    scene.traverse((obj) => {
      if (
        obj.type === 'DirectionalLight' ||
        obj.type === 'PointLight' ||
        obj.type === 'SpotLight' ||
        obj.type === 'AmbientLight'
      ) {
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
    document.body.style.cursor = 'default';

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

    // Controleer ook of Solly1 op de portal is gedropt
    const portalDropZone = window.scene.getObjectByName('PortalDropZone');
    if (portalDropZone && solly1) {
      const distance = solly1.position.distanceTo(portalDropZone.position);
      console.log('🎯 Check portal drop - afstand:', Math.round(distance));
      if (distance < 1200) {
        console.log('🎯 Solly1 gedropt op portal via drag & drop!');
        // Trigger portal drop effect
        if (window.collisionManager) {
          window.collisionManager.handlePortalDrop(
            portalDropZone.userData.portalRing,
            portalDropZone.userData.shapeMesh,
          );
        }
      }
    }

    // Controleer ook direct op portal object
    if (window.portal && solly1) {
      const portalDistance = solly1.position.distanceTo(window.portal.position);
      console.log('🎯 Check direct portal drop - afstand:', Math.round(portalDistance));
      console.log('📍 Solly1 positie:', solly1.position);
      console.log('📍 Portal positie:', window.portal.position);
      if (portalDistance < 1200) {
        console.log('🎯 Solly1 gedropt direct op portal!');
        // Trigger portal drop effect
        if (window.collisionManager) {
          window.collisionManager.handlePortalDrop(window.portal, null);
        }
      }
    }

    // === Zet drop-handled flag ===
    window.solly1DropHandled = true;
    console.log('[DEBUG] solly1DropHandled = true na drag end');

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
  scene.traverse((obj) => {
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
      solly1.material.forEach((m) => (m.depthTest = false));
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
  scene.traverse((obj) => {
    if (obj.isMesh) {
      console.log(
        `- ${obj.name || 'unnamed'} (visible: ${obj.visible}, type: ${obj.type}, transparent: ${obj.material?.transparent}, opacity: ${obj.material?.opacity})`,
      );
    }
  });

  // Verberg ALLE andere meshes, ook transparante
  scene.traverse((obj) => {
    if (obj.isMesh && obj !== solly1) {
      obj.visible = false;
      // Zet ook raycast uit voor deze mesh
      if (obj.userData) {
        obj.userData.raycastDisabled = true;
      }
      // Maak material volledig onzichtbaar
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => {
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
        solly1.material.forEach((m) => {
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
  scene.traverse((obj) => {
    if (obj.isMesh && obj !== solly1) {
      obj.visible = false;
      hiddenCount++;

      // Forceer material onzichtbaar
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => {
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
  scene.traverse((obj) => {
    if (obj.isMesh) {
      console.log(
        `- ${obj.name || 'unnamed'} (visible: ${obj.visible}, type: ${obj.type}, position: ${obj.position.x.toFixed(1)}, ${obj.position.y.toFixed(1)}, ${obj.position.z.toFixed(1)})`,
      );
    }
  });
}

// === DEBUG: Alle objecten in scene loggen ===
function logAllSceneObjects() {
  console.log('🔍 ALLE OBJECTEN IN SCENE:');
  scene.traverse((obj) => {
    console.log(`- ${obj.name || 'unnamed'} (type: ${obj.type}, visible: ${obj.visible})`);
  });
}

// === DEBUG: Check voor lights, cameras, helpers ===
function checkForBlockingObjects() {
  console.log('🔍 Check voor blokkerende objecten...');

  const blockingObjects = [];
  scene.traverse((obj) => {
    // Check voor lights
    if (
      obj.type === 'DirectionalLight' ||
      obj.type === 'PointLight' ||
      obj.type === 'SpotLight' ||
      obj.type === 'AmbientLight'
    ) {
      blockingObjects.push({ type: 'Light', name: obj.name, visible: obj.visible, object: obj });
    }
    // Check voor cameras
    if (obj.type === 'PerspectiveCamera' || obj.type === 'OrthographicCamera') {
      blockingObjects.push({ type: 'Camera', name: obj.name, visible: obj.visible, object: obj });
    }
    // Check voor helpers
    if (obj.type.includes('Helper') || obj.type.includes('Grid') || obj.type.includes('Axes')) {
      blockingObjects.push({ type: 'Helper', name: obj.name, visible: obj.visible, object: obj });
    }
    // Check voor onzichtbare meshes die nog raycast kunnen doen
    if (obj.isMesh && !obj.visible && !obj.userData?.raycastDisabled) {
      blockingObjects.push({
        type: 'InvisibleMesh',
        name: obj.name,
        visible: obj.visible,
        object: obj,
      });
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
      uuid: obj.object.uuid,
    });
  });

  return blockingObjects;
}

// === DEBUG: Verberg alle objecten behalve Solly1 ===
function hideAllObjectsExceptSolly1() {
  console.log('🔨 Verberg ALLE objecten behalve Solly1...');

  let hiddenCount = 0;
  scene.traverse((obj) => {
    if (obj !== solly1 && obj !== camera) {
      // Behoud camera
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
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const allMeshes = [];
  scene.traverse((obj) => {
    if (obj.isMesh) {
      allMeshes.push(obj);
    }
  });

  const hits = raycaster.intersectObjects(allMeshes, true);
  console.log(
    '🎯 Alle raycast hits:',
    hits.map((hit) => ({
      name: hit.object.name || 'unnamed',
      visible: hit.object.visible,
      transparent: hit.object.material?.transparent,
      opacity: hit.object.material?.opacity,
      distance: hit.distance,
    })),
  );
}

// === DEBUG: Schakel alle lights uit ===
function disableAllLights() {
  console.log('💡 Schakel alle lights uit...');

  let disabledCount = 0;
  scene.traverse((obj) => {
    if (
      obj.type === 'DirectionalLight' ||
      obj.type === 'PointLight' ||
      obj.type === 'SpotLight' ||
      obj.type === 'AmbientLight'
    ) {
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
  scene.traverse((obj) => {
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
  scene.traverse((obj) => {
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
  console.log(
    '🔬 Alleen Solly1 is nu zichtbaar en raycastable. Zon blijft zichtbaar maar niet klikbaar.',
  );
}

// Roep deze functie direct aan na laden
if (typeof solly1 !== 'undefined' && typeof scene !== 'undefined') {
  makeOnlySolly1Raycastable();
}

// Log alle raycast hits bij click
if (window && window.renderer && window.renderer.domElement) {
  window.renderer.domElement.addEventListener('mousedown', function (e) {
    const rect = window.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, window.camera);
    // Verzamel ALLE meshes
    const allMeshes = [];
    scene.traverse((obj) => {
      if (obj.isMesh) allMeshes.push(obj);
    });
    const hits = raycaster.intersectObjects(allMeshes, true);
    console.log('== Alle raycast hits bij click ==');
    if (hits.length === 0) {
      console.log('Niets geraakt!');
    } else {
      hits.forEach((hit, i) => {
        const o = hit.object;
        console.log(
          `#${i}:`,
          o.name || o.id || o.uuid,
          'visible:',
          o.visible,
          'userData:',
          o.userData,
          'material.visible:',
          o.material?.visible,
        );
      });
    }
  });
}

// === ROBUUSTE DRAG & DROP VOOR SOLLY1 ===
window.solly1DragActive = false;

function onSolly1PointerDown(event) {
  // Skip als RedTakeover actief is - die handelt z'n eigen clicks af
  if (window.redTakeover && window.redTakeover.isActive) {
    return;
  }

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

  debugLog('🖱️ [DEBUG] PointerDown event op canvas!');
  if (window.solly1) {
    debugLog('🔍 [DEBUG] Solly1 bestaat:', window.solly1);
    debugLog('👁️ [DEBUG] Solly1 zichtbaar:', window.solly1.visible);
    if (window.solly1.material) {
      debugLog(
        '🎨 [DEBUG] Solly1 materiaal zichtbaar:',
        window.solly1.material.visible,
        'opacity:',
        window.solly1.material.opacity,
        'transparent:',
        window.solly1.material.transparent,
      );
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
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, window.camera);
  const allMeshes = [];
  window.scene.traverse((obj) => {
    if (obj.isMesh) allMeshes.push(obj);
  });
  const intersects = raycaster.intersectObjects(allMeshes, true);
  console.log(
    '🎯 Alle raycast hits bij click:',
    intersects.map((i) => ({
      name: i.object.name,
      id: i.object.id,
      visible: i.object.visible,
      userData: i.object.userData,
    })),
  );
  if (intersects.length === 0) {
    console.log('❌ Geen enkel object geraakt!');
  } else {
    const solly1Hit = intersects.find((i) => i.object === window.solly1);
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
  // Log welk object je raakt (veilig checken of hits[0] bestaat)
  if (hits.length > 0 && hits[0]) {
    const hitObj = hits[0].object;
    console.log(
      '🎯 Raycast hit:',
      hitObj.name,
      'is hoofdmesh:',
      hitObj === solly1,
      'is child van solly1:',
      hitObj.parent === solly1,
    );
  } else {
    console.log('🎯 Raycast hit: fallback (geen directe hit, maar dichtbij)');
  }
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
  scene.traverse((obj) => {
    if (
      obj.type === 'DirectionalLight' ||
      obj.type === 'PointLight' ||
      obj.type === 'SpotLight' ||
      obj.type === 'AmbientLight'
    ) {
      obj.visible = false;
      obj.intensity = 0;
    }
  });
  // Controls uit
  if (window.controls) window.controls.enabled = false;
  // Solly1 GROTER maken maar NIET rood (verwijder rode kleur)
  window.solly1.scale.set(3.4, 3.4, 3.4);
  // oude listeners niet meer nodig
  console.log('🟢 [DRAG] Start drag op Solly1');
  // === EXTRA DEBUG LOGS ===
  console.log(
    'Dragging object:',
    draggedSolly.name,
    draggedSolly.id,
    'parent:',
    draggedSolly.parent?.name || draggedSolly.parent,
  );
  console.log('Solly1 wereldpositie:', solly1.getWorldPosition(new THREE.Vector3()));
  const sollySun = scene.getObjectByName('Core_1');
  if (sollySun) console.log('Zon wereldpositie:', sollySun.getWorldPosition(new THREE.Vector3()));
  console.log('Camera positie:', camera.position);
  console.log('Scene positie:', scene.position);
  logAllSolly1Meshes();
  // === Reset drop-handled flag bij nieuwe drag ===
  window.solly1DropHandled = false;
}

function onSolly1PointerMove(event) {
  if (!window.solly1DragActive || !draggedSolly || !dragPlane) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
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

  // ==== Highlight logica voor dichtstbijzijnde mini-Solly ====
  if (window.miniSollys && window.miniSollys.length) {
    const rectSolly = getScreenRect(draggedSolly);
    let closestMini = null;
    let closestDist = Infinity;
    window.miniSollys.forEach((mini) => {
      if (!mini) return;
      const rectMini = getScreenRect(mini);
      // meet afstand tussen middens als snelle heuristiek
      const centerSolly = new THREE.Vector2(
        (rectSolly.minX + rectSolly.maxX) / 2,
        (rectSolly.minY + rectSolly.maxY) / 2,
      );
      const centerMini = new THREE.Vector2(
        (rectMini.minX + rectMini.maxX) / 2,
        (rectMini.minY + rectMini.maxY) / 2,
      );
      const d = centerSolly.distanceTo(centerMini);
      if (d < closestDist) {
        closestDist = d;
        closestMini = mini;
      }
    });
    const pixelThreshold = 140; // iets ruimer voor highlight

    window.miniSollys.forEach((mini) => {
      if (!mini.material) return;
      // === Skip de zon (Core_1/sollySun) ===
      if (mini.name && mini.name.toLowerCase().includes('core_1')) return;
      if (window.sollySun && mini === window.sollySun) return;
      const isTarget = mini === closestMini && closestDist < pixelThreshold;
      if (isTarget) {
        // Opslaan originele kleur bij eerste keer highlight
        if (!mini.userData.__origColor) mini.userData.__origColor = mini.material.color.clone();
        mini.material.color.setHex(0xffff00);
      } else {
        if (mini.userData.__origColor) {
          mini.material.color.copy(mini.userData.__origColor);
        }
      }
    });
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
  scene.traverse((obj) => {
    if (
      obj.type === 'DirectionalLight' ||
      obj.type === 'PointLight' ||
      obj.type === 'SpotLight' ||
      obj.type === 'AmbientLight'
    ) {
      obj.visible = true;
      obj.intensity = 1;
    }
  });
  // Controls weer aan
  if (window.controls) window.controls.enabled = true;
  // Solly1 weer normaal formaat (verwijder rode kleur fix)
  solly1.scale.set(1, 1, 1);
  // Ontkoppel mousemove/mouseup
  window.removeEventListener('pointermove', onSolly1PointerMove);
  window.removeEventListener('pointerup', onSolly1PointerUp);
  // GEEN camera lookAt!

  // ==== CHECK VOOR DROP OP MINI-SOLLY ====
  // Reset alle highlights
  if (window.miniSollys) {
    window.miniSollys.forEach((mini) => {
      if (mini && mini.material && mini.userData.__origColor) {
        mini.material.color.copy(mini.userData.__origColor);
      }
    });
  }

  // Check voor drop op mini-Solly
  evaluateDropOnMiniSolly();

  console.log('🔴 [DRAG] Drag gestopt op Solly1');
}

// Alleen Solly1 klikbaar maken
function enableSolly1DragOnly() {
  if (!renderer || !renderer.domElement) return;
  renderer.domElement.addEventListener('mousedown', onSolly1PointerDown);
  // Zorg dat alleen Solly1 raycastable is
  scene.traverse((obj) => {
    if (obj.isMesh) {
      if (obj === solly1) {
        obj.visible = true;
        if (obj.material) obj.material.visible = true;
        obj.raycast = THREE.Mesh.prototype.raycast;
      } else if (obj.name && obj.name.toLowerCase().includes('core_1')) {
        obj.visible = true;
        obj.raycast = () => {};
      } else if (solly1.children && solly1.children.includes(obj)) {
        // Zorg dat children van Solly1 (voor zandloper) ook raycastable zijn
        obj.visible = true;
        if (obj.material) obj.material.visible = true;
        obj.raycast = THREE.Mesh.prototype.raycast;
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
if (
  typeof solly1 !== 'undefined' &&
  solly1.getObjectByName &&
  solly1.getObjectByName('Solly1Collider')
) {
  solly1.getObjectByName('Solly1Collider').raycast = () => {};
  console.log('🛡️ Collider van Solly1 is niet-raycastable gemaakt voor debug.');
}

// Forceer Solly1 altijd zichtbaar, groot, wit en in het midden
function forceSolly1Visible() {
  if (window.solly1) {
    window.solly1.visible = true;
    if (window.solly1.material) {
      window.solly1.material.color.set(0xffffff);
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

function projectToScreen(vec3) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const projected = vec3.clone().project(camera);
  return new THREE.Vector2((projected.x * 0.5 + 0.5) * width, (-projected.y * 0.5 + 0.5) * height);
}

// === Helper: projecteer volledige bounding-box naar scherm ===
function getScreenRect(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  const pts = [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y, box.max.z),
  ];
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const w = window.innerWidth,
    h = window.innerHeight;
  pts.forEach((p) => {
    const proj = p.clone().project(camera);
    const x = (proj.x * 0.5 + 0.5) * w;
    const y = (-proj.y * 0.5 + 0.5) * h;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  return { minX, maxX, minY, maxY };
}

function rectsOverlap(r1, r2) {
  return r1.minX <= r2.maxX && r1.maxX >= r2.minX && r1.minY <= r2.maxY && r1.maxY >= r2.minY;
}

function spawnKaboom(pos) {
  console.log('💥 Mini-Kaboom op positie:', pos);

  // Maak meerdere lagen voor een mooier effect
  createExplosionLayer(pos, 0xffd700, 0, 400, 500); // Gele kern
  createExplosionLayer(pos, 0xffa500, 50, 600, 400); // Oranje explosie

  // Voeg kleine particles toe
  createMiniExplosionParticles(pos);
}

function createMiniExplosionParticles(position) {
  const particleCount = 20;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    const geo = new THREE.SphereGeometry(0.3, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0xffff00 : 0xffa500,
      transparent: true,
      opacity: 1.0,
    });
    const particle = new THREE.Mesh(geo, mat);

    // Willekeurige richting en snelheid
    const direction = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
    ).normalize();

    const speed = 20 + Math.random() * 40;
    particle.velocity = direction.multiplyScalar(speed);
    particle.position.copy(position);

    scene.add(particle);
    particles.push(particle);
  }

  // Animeer particles
  const start = performance.now();
  const duration = 1000;

  function animateParticles() {
    const t = (performance.now() - start) / duration;
    if (t >= 1) {
      particles.forEach((p) => scene.remove(p));
      return;
    }

    particles.forEach((particle) => {
      particle.position.add(particle.velocity.clone().multiplyScalar(0.016));
      particle.material.opacity = 1.0 * (1 - t);
      particle.scale.setScalar(1 - t * 0.3);
    });

    requestAnimationFrame(animateParticles);
  }
  animateParticles();
}

function evaluateDropOnMiniSolly() {
  if (!window.miniSollys || !solly1) return;

  // Eenvoudige distance-based collision detection
  const threshold = 250; // Afstand in 3D units

  for (const mini of window.miniSollys) {
    if (!mini) continue;

    const distance = solly1.position.distanceTo(mini.position);

    if (distance < threshold) {
      console.log('💥 KABOOM! Distance-based hit met mini-Solly:', mini);
      console.log('📏 Afstand:', distance, 'Threshold:', threshold);

      // Gebruik de EXACTE positie van de mini-Solly voor de explosie
      const explosionPosition = mini.position.clone();
      handleSollyOnMini(mini);
      spawnKaboom(explosionPosition);
      break;
    }
  }
}

function handleSollyOnMini(targetMini) {
  console.log('[DEBUG] handleSollyOnMini aangeroepen', targetMini);
  if (!targetMini) return;

  // Kaboom-teller ophogen via GameManager
  if (window.gameManager && typeof window.gameManager.incrementKaboomCount === 'function') {
    // Record kaboom with position and shape data
    const position = solly1.position.clone();
    const shape = window.gameManager.getCurrentShape();
    window.gameManager.incrementKaboomCount(1, position, shape);
    console.log(`💥 Kaboom! Totaal: ${window.gameManager.getKaboomCount()}`);
  } else {
    console.warn('⚠️ GameManager niet beschikbaar voor kaboom increment');
  }

  // Spectaculaire explosie animatie op de EXACTE positie van de mini-Solly
  const explosionPos = targetMini.position.clone();
  console.log('💥 Explosie positie:', explosionPos);

  // Meerdere explosie lagen met verschillende kleuren en timing
  createExplosionLayer(explosionPos, 0xffd700, 0, 600, 600); // Gouden kern
  createExplosionLayer(explosionPos, 0xff4500, 100, 900, 500); // Oranje explosie
  createExplosionLayer(explosionPos, 0xff0000, 200, 1200, 400); // Rode schokgolf

  // Extra grote particle explosie
  createMegaExplosionParticles(explosionPos);

  // Toon ShapeChoice modal na elke 5 collisions
  const currentKaboom = window.gameManager ? window.gameManager.getKaboomCount() : 0;
  if (currentKaboom % 5 === 0) {
    setTimeout(() => {
      if (window.collisionManager && window.collisionManager.showShapeChoiceModal) {
        window.collisionManager.showShapeChoiceModal();
      }
    }, 1000); // Wacht 1 seconde zodat de explosie eerst te zien is
  }

  // Verwijder mini-Solly na explosie
  setTimeout(() => {
    if (window.scene) {
      // Eerst alle children loskoppelen en verwijderen
      while (targetMini.children.length > 0) {
        const child = targetMini.children[0];
        targetMini.remove(child);
        if (child.parent === null && child instanceof THREE.Mesh) {
          scene.remove(child);
        }
      }
      scene.remove(targetMini);

      // Verwijder ook uit de miniSollys array
      if (window.miniSollys) {
        const index = window.miniSollys.indexOf(targetMini);
        if (index > -1) {
          window.miniSollys.splice(index, 1);
          console.log('[DEBUG] mini-Solly ook uit array verwijderd - UUID:', targetMini.uuid);
        }
      }

      console.log('[DEBUG] mini-Solly + outline verwijderd uit scene - UUID:', targetMini.uuid);
    }
  }, 600);
}

function createMegaExplosionParticles(position) {
  const particleCount = 80;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    const geo = new THREE.SphereGeometry(0.8, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: [0xffd700, 0xff4500, 0xff0000, 0xffff00][Math.floor(Math.random() * 4)],
      transparent: true,
      opacity: 1.0,
    });
    const particle = new THREE.Mesh(geo, mat);

    // Willekeurige richting en snelheid
    const direction = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
    ).normalize();

    const speed = 80 + Math.random() * 120;
    particle.velocity = direction.multiplyScalar(speed);
    particle.position.copy(position);

    scene.add(particle);
    particles.push(particle);
  }

  // Animeer particles
  const start = performance.now();
  const duration = 2500;

  function animateParticles() {
    const t = (performance.now() - start) / duration;
    if (t >= 1) {
      particles.forEach((p) => scene.remove(p));
      return;
    }

    particles.forEach((particle) => {
      particle.position.add(particle.velocity.clone().multiplyScalar(0.016));
      particle.material.opacity = 1.0 * (1 - t);
      particle.scale.setScalar(1 - t * 0.7);
    });

    requestAnimationFrame(animateParticles);
  }
  animateParticles();
}

// Helper: grootste projectie-radius van een object
function getScreenRadius(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  const pts = [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y, box.max.z),
  ];
  const c2d = projectToScreen(center);
  let maxR = 0;
  pts.forEach((p) => {
    const p2d = projectToScreen(p);
    const r = c2d.distanceTo(p2d);
    if (r > maxR) maxR = r;
  });
  return maxR;
}

// FORCEER SHAPECHOICE MODAL - voor testing
window.forceShowShapeChoice = function () {
  debugLog('🎨 [DEBUG] Forcing ShapeChoice modal to show...');
  if (window.collisionManager && window.collisionManager.forceShowShapeChoiceModal) {
    window.collisionManager.forceShowShapeChoiceModal();
  } else {
    debugLog('❌ [DEBUG] CollisionManager niet beschikbaar');
  }
};
