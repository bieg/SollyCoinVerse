// @ts-nocheck
/* eslint-env browser */
/* global THREE */
// src/chapter2.js
// Hoofdstuk 2 – Brutalist cube puzzle

(function () {
  const CHAPTER2 = {};
  window.initChapter2 = initChapter2;

  // ============================================================
  // 🔧 CONFIGURATIE
  // ============================================================
  const DEBUG = false; // Zet op true voor uitgebreide console logs
  const Z_DEPTH_WEIGHT = 0.3; // Gewicht voor Z-depth in afstand berekening (0-1)

  let scene, camera, renderer, controls;
  let cubeGroup,
    placeholders = [],
    dragShapes = [];
  let holderFrame = null;
  let isDragging = false,
    dragged = null,
    offset = new THREE.Vector3();
  let loadingScene, loadingCamera;
  let highlightedPlaceholder = null; // Voor visual feedback tijdens drag

  function showLoadingScreen(callback) {
    // Maak statisch 2D loading screen - exact zoals screenshot
    loadingScene = new THREE.Scene();
    loadingScene.background = new THREE.Color(0x000000);

    const aspect = window.innerWidth / window.innerHeight;
    const halfH = 600;
    const halfW = halfH * aspect;
    loadingCamera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 3000);
    loadingCamera.position.set(0, 0, 1000);
    loadingCamera.lookAt(0, 0, 0);

    // Twee wireframe kubussen (boven en onder) - STATISCH 2D
    const cubeSize = 280;
    const boxGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x5b3fa3, linewidth: 2 });

    // Bovenste kubus - vaste rotatie voor perspectief
    const topCube = new THREE.LineSegments(edges.clone(), lineMat.clone());
    topCube.position.set(0, 180, 0);
    topCube.rotation.y = 0.4;
    topCube.rotation.x = 0.25;
    loadingScene.add(topCube);

    // Onderste kubus - vaste rotatie
    const bottomCube = new THREE.LineSegments(edges.clone(), lineMat.clone());
    bottomCube.position.set(0, -180, 0);
    bottomCube.rotation.y = 0.4;
    bottomCube.rotation.x = 0.25;
    loadingScene.add(bottomCube);

    // Gele bollen op hoekpunten
    const sphereGeo = new THREE.SphereGeometry(12, 16, 16);
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const corners = [
      [-1, -1, -1],
      [1, -1, -1],
      [-1, 1, -1],
      [1, 1, -1],
      [-1, -1, 1],
      [1, -1, 1],
      [-1, 1, 1],
      [1, 1, 1],
    ];

    [topCube, bottomCube].forEach((cube) => {
      corners.forEach((c) => {
        const sphere = new THREE.Mesh(sphereGeo, yellowMat.clone());
        sphere.position.set((c[0] * cubeSize) / 2, (c[1] * cubeSize) / 2, (c[2] * cubeSize) / 2);
        cube.add(sphere);
      });
    });

    // Paars rechthoekig vlak in het midden (horizontaal)
    const planeGeo = new THREE.PlaneGeometry(260, 35);
    const planeMat = new THREE.MeshBasicMaterial({ color: 0x7b3fa3, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.position.set(0, 0, 0);
    loadingScene.add(plane);

    // Groene driehoeken links boven (2 kolommen x 3 rijen = 6 stuks)
    const triangleGeo = new THREE.ConeGeometry(25, 45, 3);
    const greenMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa });
    const holderX = -halfW + 140;
    const holderY = halfH - 220;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const triangle = new THREE.Mesh(triangleGeo, greenMat.clone());
        triangle.position.set(holderX + col * 55, holderY - row * 55, 0);
        triangle.rotation.z = Math.PI; // Driehoek wijst naar beneden
        loadingScene.add(triangle);
      }
    }

    // Witte rechthoekige rand om driehoeken
    const frameGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(holderX - 40, holderY + 35, 0),
      new THREE.Vector3(holderX + 95, holderY + 35, 0),
      new THREE.Vector3(holderX + 95, holderY - 165, 0),
      new THREE.Vector3(holderX - 40, holderY - 165, 0),
      new THREE.Vector3(holderX - 40, holderY + 35, 0),
    ]);
    const frameLine = new THREE.Line(
      frameGeo,
      new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }),
    );
    loadingScene.add(frameLine);

    // Tekst "Hoofdstuk 2" gecentreerd
    const loadingText = document.createElement('div');
    loadingText.id = 'loading-text';
    loadingText.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      font-family: 'Open Sans', sans-serif; font-size: 36px; font-weight: bold;
      color: white; z-index: 15000; text-align: center;
    `;
    loadingText.innerHTML = 'Hoofdstuk 2';
    document.body.appendChild(loadingText);

    // Render STATISCH - geen animatie
    renderer.render(loadingScene, loadingCamera);

    // Wacht 3 seconden, dan verder naar het hoofdstuk
    setTimeout(() => {
      loadingText.remove();
      // Scene wordt gewist in cleanupChapter1Objects
      if (callback) callback();
    }, 3000);
  }

  function initChapter2() {
    // Pak globals uit hoofdstuk 1
    scene = window.scene;
    renderer = window.renderer;
    controls = window.controls;
    if (!scene || !renderer) {
      console.warn('Scene niet beschikbaar, wacht nog even...');
      // Wacht even en probeer opnieuw als scene nog niet beschikbaar is
      setTimeout(() => {
        if (window.scene && window.renderer) {
          console.log('Scene nu beschikbaar, initialiseer Chapter 2...');
          initChapter2();
        }
      }, 500);
      return;
    }

    // Start Chapter 2 direct - GEEN loading screen
    // Zet Level 2 modus (3D) aan
    window.level2Active = true;

    // Update chapter state in ChapterManager
    if (window.chapterManager) {
      window.chapterManager.setCurrentChapter(2);
      console.log('📚 Chapter 2 active in ChapterManager');
    }

    // ============================================================
    // ⭐ DEFINITIEVE CAMERA CONFIGURATIE - FOREVER BEHOUDEN ⭐
    // ============================================================
    // Camera setup: ORTHOGRAPHIC camera voor geometrisch perfecte isometrische kubus
    // Orthographic camera heeft geen perspectief vervorming - perfect voor isometrisch
    // Deze configuratie zorgt voor een geometrisch correcte kubus zonder vervorming
    // ============================================================
    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = 6000; // Vergroot view size voor betere zichtbaarheid van hoeken (was 4000)
    const halfHeight = viewSize / 2;
    const halfWidth = halfHeight * aspect;
    camera = new THREE.OrthographicCamera(
      -halfWidth,
      halfWidth,
      halfHeight,
      -halfHeight,
      0.1,
      10000,
    );

    // Perfect isometrische camera positie (geen perspectief vervorming)
    // Voor isometrisch: camera op gelijke afstand van alle assen
    const cameraDistance = 5000;
    camera.position.set(
      cameraDistance * 0.577, // X: 1/√3
      cameraDistance * 0.577, // Y: 1/√3 (symmetrisch)
      cameraDistance * 0.577, // Z: 1/√3
    );
    camera.lookAt(0, 0, 0); // Kijk naar het midden waar de kubus komt
    // ============================================================
    window.camera = camera;

    // Verwijder oude CTA-buttons
    const cta = document.getElementById('cta-buttons');
    if (cta) cta.remove();

    // Verwijder Wallet button rechtsbovenin
    const walletBtn = document.getElementById('wallet-hub-btn');
    if (walletBtn) {
      walletBtn.style.display = 'none';
      walletBtn.remove();
      console.log('🗑️ Wallet button verwijderd');
    }

    // Maak camera & controls statisch
    if (controls) {
      controls.enabled = false;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableRotate = false;
    }
    // Verwijder referentie zodat niets de camera meer kan draaien
    window.controls = null;

    // Verberg KABOOM teller uit vorig hoofdstuk
    const kaboomEl = document.getElementById('kaboom-counter');
    if (kaboomEl) kaboomEl.style.display = 'none';

    // Responderen op resize (houd orthographic view consistent)
    function onResize() {
      const aspect = window.innerWidth / window.innerHeight;
      const viewSize = 6000; // Match met camera setup (was 4000)
      const halfHeight = viewSize / 2;
      const halfWidth = halfHeight * aspect;
      camera.left = -halfWidth;
      camera.right = halfWidth;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', () => {
      onResize();
      positionHolder();
    });

    cleanupChapter1Objects();

    // VERWIJDER ALLE SOLLY OBJECTEN (witte Solly en andere Sollys)
    const sollyObjectsToRemove = [];
    scene.traverse((obj) => {
      // Verwijder Solly1 (witte Solly)
      if (obj.userData && (obj.userData.isSolly1 || obj.name === 'Solly1')) {
        sollyObjectsToRemove.push(obj);
      }
      // Verwijder alle Solly objecten (mini Sollys, etc.)
      if (obj.userData && (obj.userData.isSolly || obj.userData.type === 'solly')) {
        sollyObjectsToRemove.push(obj);
      }
      // Verwijder op basis van geometrie (TetrahedronGeometry = Solly)
      if (obj.geometry && obj.geometry.type === 'TetrahedronGeometry') {
        if (!obj.userData.isDraggable && !obj.userData.isPlaceholder) {
          sollyObjectsToRemove.push(obj);
        }
      }
    });
    sollyObjectsToRemove.forEach((obj) => {
      if (obj.parent) obj.parent.remove(obj);
      else scene.remove(obj);
      console.log('🗑️ Solly object verwijderd:', obj.name || obj.userData);
    });
    console.log(`🗑️ Totaal ${sollyObjectsToRemove.length} Solly objecten verwijderd`);

    // VERWIJDER ALLE STERREN uit de scene
    const starsToRemove = [];
    scene.traverse((obj) => {
      // Verwijder InstancedMesh sterren (gebruikt voor performance)
      if (obj.isInstancedMesh && obj.geometry && obj.geometry.type === 'SphereGeometry') {
        const radius = obj.geometry.parameters?.radius || 0;
        if (radius < 10 && obj.material && obj.material.color) {
          const color = obj.material.color;
          const isWhite = color.r > 0.9 && color.g > 0.9 && color.b > 0.9;
          if (isWhite) {
            starsToRemove.push(obj);
          }
        }
      }
      // Verwijder alle sterren met userData.isStar
      if (obj.userData && (obj.userData.isStar || obj.userData.type === 'star')) {
        starsToRemove.push(obj);
      }
      // Ook verwijderen op basis van naam
      if (obj.name && obj.name.toLowerCase().includes('star')) {
        starsToRemove.push(obj);
      }
      // Verwijder kleine witte bollen die waarschijnlijk sterren zijn
      if (obj.geometry && obj.geometry.type === 'SphereGeometry' && !obj.isInstancedMesh) {
        const radius = obj.geometry.parameters?.radius || 0;
        if (radius < 10 && obj.material && obj.material.color) {
          const color = obj.material.color;
          const isWhite = color.r > 0.9 && color.g > 0.9 && color.b > 0.9;
          if (
            isWhite &&
            !obj.userData.isDraggable &&
            !obj.userData.isPlaceholder &&
            !obj.userData.isHotspot
          ) {
            starsToRemove.push(obj);
          }
        }
      }
    });
    starsToRemove.forEach((obj) => {
      if (obj.parent) obj.parent.remove(obj);
      else scene.remove(obj);
      // Dispose geometry en material voor InstancedMesh
      if (obj.isInstancedMesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      }
      console.log('⭐ Ster verwijderd:', obj.type || obj.constructor.name);
    });
    console.log(`🗑️ Totaal ${starsToRemove.length} sterren verwijderd`);

    // VERWIJDER ALLE GEplaatste BLOKJES EN SHAPES
    // Verwijder geplaatste blokjes op de kubus en alle dragShapes
    const toRemove = [];
    scene.traverse((obj) => {
      // Verwijder geplaatste blokjes op de kubus
      if (obj.userData && obj.userData.isPlacedBlock) {
        toRemove.push(obj);
      }
      // Verwijder ook alle draggable shapes (isDraggable)
      if (obj.userData && obj.userData.isDraggable) {
        toRemove.push(obj);
      }
    });
    toRemove.forEach((obj) => {
      if (obj.parent) obj.parent.remove(obj);
      else scene.remove(obj);
    });

    // Reset dragShapes array
    dragShapes = [];

    // Verwijder ALLE groene tekst/debug elementen (behalve het UI panel)
    const debugTexts = document.querySelectorAll(
      '[style*="color: green"], [style*="color: rgb(0, 255"], .debug, [id*="debug"]',
    );
    debugTexts.forEach((el) => {
      if (el.id !== 'chapter2-ui-panel' && !el.closest('#chapter2-ui-panel')) {
        el.remove();
      }
    });

    // Verwijder ALLE groene objecten uit de scene (behalve draggable shapes)
    const greenObjectsToRemove = [];
    scene.traverse((obj) => {
      if (obj.material && obj.material.color && !obj.userData.isDraggable) {
        const color = obj.material.color;
        const isGreen = color.getHex() === 0x00ff00 || color.getHex() === 0x00ffaa;
        if (isGreen) {
          greenObjectsToRemove.push(obj);
        }
      }
    });
    greenObjectsToRemove.forEach((obj) => {
      if (obj.parent) obj.parent.remove(obj);
      else scene.remove(obj);
      console.log('🗑️ Groen object verwijderd:', obj);
    });

    // Reset alle placeholders
    placeholders = [];

    // VERWIJDER ALLE OUDE EVENT LISTENERS VAN HOOFDSTUK 1
    // Verwijder oude pointer listeners (zonder canvas te vervangen!)
    const canvas = renderer.domElement;
    // Clone de event listeners door nieuwe toe te voegen die de oude overschrijven
    canvas.style.cursor = 'default';

    createBrutalistUI();
    createCube();
    createShapeChoicesHolder(); // ✅ HTML holder onder instructiepanel

    // Pointer events - alleen voor hoofdstuk 2
    canvas.addEventListener('pointerdown', onPointerDown, { capture: true });
    canvas.addEventListener('pointermove', onPointerMove, { capture: true });
    canvas.addEventListener('pointerup', onPointerUp, { capture: true });

    // Blokkeer muiswiel-zoom/scroll in canvas (2D fixed view)
    renderer.domElement.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
      },
      { passive: false },
    );
  }

  function cleanupChapter1Objects() {
    // Verwijder alle kinderen behalve camera/lights uit scene
    const keep = new Set();
    scene.traverse((obj) => {
      if (obj.isCamera || obj.isLight) keep.add(obj);
    });
    [...scene.children].forEach((o) => {
      if (!keep.has(o)) scene.remove(o);
    });
  }

  function createBrutalistUI() {
    // Verwijder oude UI elementen (ook het chapter2 panel)
    const oldTerm = document.getElementById('brutal-terminal');
    if (oldTerm) oldTerm.remove();
    const oldPanel = document.getElementById('chapter2-ui-panel');
    if (oldPanel) oldPanel.remove();

    // Maak één panel voor alle UI elementen
    const uiPanel = document.createElement('div');
    uiPanel.id = 'chapter2-ui-panel';
    uiPanel.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      padding: 20px;
      background: linear-gradient(135deg, #8A2BE2, #4B0082);
      color: white;
      border-radius: 15px;
      font-family: 'Open Sans', sans-serif;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      gap: 15px;
      border: 2px solid #9370DB;
      width: 158px; /* 126px + 25% breder */
    `;

    // Level indicator (grotere titel)
    const levelIndicator = document.createElement('div');
    levelIndicator.style.cssText = `
      font-size: 20px;
      padding-bottom: 15px;
      font-weight: bold;
    `;
    levelIndicator.innerHTML = '🎯 LEVEL 2:<br>De Cubus (3D)';

    // Instructions (nu tweede)
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      font-size: 16px;
      line-height: 1.4;
      padding-bottom: 15px;
    `;
    instructions.innerHTML =
      '<strong>Doel:</strong><br><span style="font-weight: normal">Sleep de shapes naar de hoekpunten van de kubus!</span>';

    // Progress counter (nu derde)
    const progressCounter = document.createElement('div');
    progressCounter.id = 'wireframe-counter';
    progressCounter.style.cssText = `
      font-size: 16px;
      line-height: 1.4;
    `;
    progressCounter.innerHTML =
      '<strong>Geplaatst:</strong><br><span style="font-weight: normal">Blokjes [0/8]</span>';

    // Voeg alle elementen toe aan het panel
    uiPanel.appendChild(levelIndicator);
    uiPanel.appendChild(instructions);
    uiPanel.appendChild(progressCounter);

    // Voeg het panel toe aan de pagina
    document.body.appendChild(uiPanel);
  }

  /**
   * ✅ DEFINITIEVE KUBUS CONFIGURATIE - GOEDGEKEURD ✅
   *
   * Deze kubus is goedgekeurd en moet ongewijzigd blijven:
   * - Perfect symmetrische 3D wireframe kubus
   * - Paarse lijnen (0x8A2BE2) met linewidth 6
   * - Isometrische rotatie: X ~35.26°, Y 40° (45° - 5°)
   * - Alle 12 ribben zichtbaar
   * - Gecentreerd op (0,0,0)
   * - Geen groene blokjes
   *
   * ⚠️ NIET WIJZIGEN zonder expliciete toestemming ⚠️
   */
  function createCube() {
    // Verwijder oude kubus volledig
    if (cubeGroup) {
      scene.remove(cubeGroup);
      cubeGroup.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      cubeGroup = null;
    }
    placeholders = [];

    cubeGroup = new THREE.Group();

    // PERFECTE SYMMETRISCHE 3D KUBUS
    const size = 2500;

    // Maak perfecte BoxGeometry - CENTREERD op oorsprong (default)
    const boxGeometry = new THREE.BoxGeometry(size, size, size);

    // Maak wireframe edges - CLEAN paarse lijnen (alle 12 ribben)
    const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: 0x8a2be2, // Paars (BlueViolet)
      linewidth: 6, // Dikke duidelijke lijnen
      transparent: false,
      opacity: 1.0,
    });
    const wireframe = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    // Wireframe niet raycastable maken (zodat alleen placeholders worden geraakt)
    wireframe.raycast = () => {};
    cubeGroup.add(wireframe);

    // Bereken PERFECTE hoekpunten voor placeholders
    // BoxGeometry is al gecentreerd, dus hoekpunten zijn op ±size/2
    const half = size / 2;
    const points = [
      // Voorvlak (z = +half) - Y+ = omhoog
      { x: -half, y: half, z: half }, // 0: Links boven voor
      { x: half, y: half, z: half }, // 1: Rechts boven voor
      { x: half, y: -half, z: half }, // 2: Rechts beneden voor
      { x: -half, y: -half, z: half }, // 3: Links beneden voor
      // Achtervlak (z = -half)
      { x: -half, y: half, z: -half }, // 4: Links boven achter
      { x: half, y: half, z: -half }, // 5: Rechts boven achter
      { x: half, y: -half, z: -half }, // 6: Rechts beneden achter
      { x: -half, y: -half, z: -half }, // 7: Links beneden achter
    ];

    // ZICHTBARE HOTSPOTS op elke hoek van de kubus
    points.forEach((p, i) => {
      // Kleinere, subtielere hotspots die niet in de weg zitten
      const placeholderSphere = new THREE.SphereGeometry(150, 16, 16); // 150 radius - klein en subtiel
      const placeholderMaterial = new THREE.MeshBasicMaterial({
        color: 0x8a2be2, // Paars, matching kubus
        transparent: true,
        opacity: 0.15, // Bijna onzichtbaar, alleen als hint
        side: THREE.DoubleSide,
      });
      const placeholderMesh = new THREE.Mesh(placeholderSphere, placeholderMaterial);
      placeholderMesh.position.set(p.x, p.y, p.z);
      placeholderMesh.userData.cornerIndex = i;
      placeholderMesh.userData.isPlaceholder = true;
      placeholderMesh.userData.isHotspot = true; // Markeer als hotspot voor drag & drop
      placeholderMesh.visible = true; // EXPLICIET zichtbaar maken voor raycasting
      placeholderMesh.raycast = THREE.Mesh.prototype.raycast; // Zorg dat raycast werkt
      cubeGroup.add(placeholderMesh);
      placeholders.push({ mesh: placeholderMesh, filled: false });
      debugLog(`📍 Hotspot ${i} geplaatst op hoek:`, p);
    });

    // PERFECT gecentreerd op oorsprong (BoxGeometry is al gecentreerd)
    cubeGroup.position.set(0, 0, 0);

    // ============================================================
    // ⭐ DEFINITIEVE KUBUS CONFIGURATIE - FOREVER BEHOUDEN ⭐
    // ============================================================
    // Deze kubus configuratie is perfect en mag NIET worden aangepast!
    // - Geometrisch correct (OrthographicCamera, geen perspectief vervorming)
    // - Perfect isometrisch perspectief (alle 12 ribben zichtbaar)
    // - Symmetrisch en visueel perfect
    // ============================================================
    // PERFECTE ISOMETRISCHE ROTATIE - GEOMETRISCH CORRECT
    // Voor perfect isometrisch perspectief: eerst Y-rotatie (45°), dan X-rotatie (35.264°)
    // Dit zorgt voor een geometrisch correcte kubus zonder vervorming
    cubeGroup.rotation.order = 'YXZ'; // Rotatie volgorde: eerst Y, dan X, dan Z
    cubeGroup.rotation.y = Math.PI / 4; // Exact 45° rond Y-as
    cubeGroup.rotation.x = Math.atan(1 / Math.sqrt(2)); // ~35.264° rond X-as (arctan(1/√2))
    cubeGroup.rotation.z = 0; // Geen z-rotatie
    // ============================================================

    scene.add(cubeGroup);
  }

  // ============================================================
  // ⭐ SHAPE CHOICES HOLDER - HTML CONTENT BLOCK
  // ============================================================
  function createShapeChoicesHolder() {
    debugLog('🎨 Creating shape choices holder...');

    // Haal de gekozen shape op uit hoofdstuk 1
    let userShape = 'piramide'; // Default
    if (window.gameManager && window.gameManager.getCurrentShape) {
      userShape = window.gameManager.getCurrentShape();
    }
    debugLog(`🎯 User chose shape in chapter 1: ${userShape}`);

    // Verwijder oude holder als die bestaat
    const oldHolder = document.getElementById('shape-choices-holder');
    if (oldHolder) oldHolder.remove();

    // Bereken positie: ONDER het instructiepaneel
    const uiPanel = document.getElementById('chapter2-ui-panel');
    let topPosition = 260; // Fallback
    if (uiPanel) {
      const rect = uiPanel.getBoundingClientRect();
      topPosition = rect.bottom + 20; // 20px marge onder het panel
      debugLog(`📍 UI panel bottom: ${rect.bottom}px, holder top: ${topPosition}px`);
    }

    // Blokjes: 28px
    const blockSize = 28;
    const gap = 8;
    const padding = 10;

    // Maak de holder container
    const holder = document.createElement('div');
    holder.id = 'shape-choices-holder';
    holder.style.cssText = `
      position: fixed;
      top: ${topPosition}px;
      left: 20px;
      padding: ${padding}px;
      background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
      border: 0.5px solid #00ff00;
      border-radius: 8px;
      display: grid;
      grid-template-columns: repeat(2, ${blockSize}px);
      grid-template-rows: repeat(4, ${blockSize}px);
      gap: ${gap}px;
      z-index: 9999;
      box-shadow: 0 4px 15px rgba(0, 255, 0, 0.3);
    `;

    // Maak 8 blokjes (2 kolommen x 4 rijen)
    for (let i = 0; i < 8; i++) {
      const block = document.createElement('div');
      block.className = 'shape-choice-block';
      block.draggable = true;
      block.dataset.shapeType = userShape;
      block.dataset.blockIndex = i;
      block.style.cssText = `
        width: ${blockSize}px;
        height: ${blockSize}px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 255, 0, 0.2);
        border: 0.075px solid #00ff00;
        border-radius: 4px;
        cursor: grab;
        transition: all 0.2s ease;
      `;

      // Maak de shape (gebaseerd op de keuze uit hoofdstuk 1)
      const shapeElement = document.createElement('div');
      shapeElement.style.cssText = getShapeStyle(userShape);
      shapeElement.style.pointerEvents = 'none';

      block.appendChild(shapeElement);

      // Hover effect
      block.addEventListener('mouseenter', () => {
        if (!block.dataset.placed) {
          block.style.background = 'rgba(0, 255, 0, 0.4)';
          block.style.transform = 'scale(1.1)';
        }
      });
      block.addEventListener('mouseleave', () => {
        if (!block.dataset.placed) {
          block.style.background = 'rgba(0, 255, 0, 0.2)';
          block.style.transform = 'scale(1)';
        }
      });

      // Drag & Drop event listeners
      block.addEventListener('dragstart', handleDragStart);
      block.addEventListener('dragend', handleDragEnd);

      holder.appendChild(block);
    }

    // Add drop zone listeners to canvas
    setTimeout(() => {
      const canvas = renderer.domElement;
      canvas.addEventListener('dragover', handleDragOver);
      canvas.addEventListener('drop', handleDrop);
    }, 100);

    document.body.appendChild(holder);
    debugLog(`✅ Shape choices holder created with 8 blocks (shape: ${userShape})`);
  }

  // Helper functie: Geef de juiste CSS style voor elke shape
  function getShapeStyle(shape) {
    switch (shape) {
      case 'piramide':
        return `
          width: 0;
          height: 0;
          border-left: 9.6px solid transparent;
          border-right: 9.6px solid transparent;
          border-bottom: 17.6px solid #00ff00;
        `;

      case 'kubus':
      case 'vierkant':
        return `
          width: 17.6px;
          height: 17.6px;
          background: #00ff00;
          border: 0.8px solid #00cc00;
        `;

      case 'bol':
        return `
          width: 17.6px;
          height: 17.6px;
          background: #00ff00;
          border-radius: 50%;
          border: 0.8px solid #00cc00;
        `;

      case 'ruit':
      case 'oktaeder':
        return `
          width: 16px;
          height: 16px;
          background: #00ff00;
          border: 0.8px solid #00cc00;
          transform: rotate(45deg);
        `;

      case 'zandloper':
        return `
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid #00ff00;
          border-bottom: 8px solid #00ff00;
        `;

      default:
        return `
          width: 17.6px;
          height: 17.6px;
          background: #00ff00;
          border: 0.8px solid #00cc00;
        `;
    }
  }

  // ============================================================
  // 🔧 HELPER FUNCTIES
  // ============================================================

  // Debug logging helper
  function debugLog(...args) {
    if (DEBUG) {
      console.log(...args);
    }
  }

  // Reset alle placeholder highlights
  function resetPlaceholderHighlights() {
    placeholders.forEach((p) => {
      if (!p.filled) {
        p.mesh.material.opacity = 0.5;
        p.mesh.material.color.setHex(0x8a2be2); // Terug naar paars
      }
    });
    highlightedPlaceholder = null;
  }

  // Highlight een specifieke placeholder
  function highlightPlaceholder(placeholder) {
    if (!placeholder || placeholder.filled) return;

    // Reset alle andere
    resetPlaceholderHighlights();

    // Highlight deze
    placeholder.mesh.material.opacity = 0.9;
    placeholder.mesh.material.color.setHex(0x00ff00); // Groen
    highlightedPlaceholder = placeholder;
  }

  // ============================================================
  // ⭐ DRAG & DROP SYSTEEM - HTML BLOKJES NAAR KUBUS
  // ============================================================

  let draggedBlock = null;
  let draggedShapeType = null;

  function handleDragStart(e) {
    draggedBlock = e.target;
    draggedShapeType = e.target.dataset.shapeType;

    e.target.style.opacity = '0.6';
    e.target.style.cursor = 'grabbing';
    e.target.style.transform = 'scale(1.2)';

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);

    const dragImage = e.target.cloneNode(true);
    dragImage.style.opacity = '0.8';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 14, 14);
    setTimeout(() => dragImage.remove(), 0);

    debugLog(`🎯 START DRAG: ${draggedShapeType}`);
  }

  function handleDragEnd(e) {
    // Reset visual feedback
    resetPlaceholderHighlights();

    if (draggedBlock && draggedBlock.parentElement) {
      draggedBlock.style.opacity = '1';
      draggedBlock.style.cursor = 'grab';
      draggedBlock.style.transform = 'scale(1)';
    }
    debugLog('🎯 EINDE DRAG');
  }

  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';

    // VISUAL FEEDBACK: Highlight dichtstbijzijnde hoek tijdens drag
    if (draggedBlock && draggedShapeType) {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const mouse = new THREE.Vector2(mouseX, mouseY);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      raycaster.params.Mesh.threshold = 300;

      // Bereken relatief threshold
      const DROP_THRESHOLD = Math.min(rect.width, rect.height) * 0.15; // 15% van scherm
      let minWeightedDistance = Infinity;
      let closestPlaceholder = null;

      placeholders.forEach((p) => {
        if (p.filled) return;

        const worldPos = new THREE.Vector3();
        p.mesh.getWorldPosition(worldPos);
        const screenPos = worldPos.clone();
        screenPos.project(camera);

        const isInViewport =
          screenPos.x >= -1 && screenPos.x <= 1 && screenPos.y >= -1 && screenPos.y <= 1;
        if (!isInViewport) return;

        const screenX = (screenPos.x * 0.5 + 0.5) * rect.width + rect.left;
        const screenY = (screenPos.y * -0.5 + 0.5) * rect.height + rect.top;

        const dx = screenX - e.clientX;
        const dy = screenY - e.clientY;
        const screenDistance = Math.sqrt(dx * dx + dy * dy);

        // Z-DEPTH SORTING: Weeg Z-depth mee (hoe verder weg, hoe zwaarder)
        // screenPos.z is tussen -1 (dichtbij) en 1 (ver weg)
        const zDepth = (screenPos.z + 1) / 2; // Normaliseer naar 0-1
        const weightedDistance =
          screenDistance + zDepth * Z_DEPTH_WEIGHT * Math.min(rect.width, rect.height);

        if (weightedDistance < minWeightedDistance && screenDistance < DROP_THRESHOLD) {
          minWeightedDistance = weightedDistance;
          closestPlaceholder = p;
        }
      });

      // Highlight de dichtstbijzijnde hoek
      if (closestPlaceholder && closestPlaceholder !== highlightedPlaceholder) {
        highlightPlaceholder(closestPlaceholder);
      } else if (!closestPlaceholder) {
        resetPlaceholderHighlights();
      }
    }

    return false;
  }

  function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    e.preventDefault();

    // Reset visual feedback
    resetPlaceholderHighlights();

    if (!draggedBlock || !draggedShapeType) {
      debugLog('❌ Geen gedraggd block');
      return false;
    }

    debugLog(`🎯 DROP at pixels: (${e.clientX}, ${e.clientY})`);

    const rect = renderer.domElement.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const mouse = new THREE.Vector2(mouseX, mouseY);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Verhoog threshold voor betere detectie van placeholders (verdubbeld)
    raycaster.params.Mesh.threshold = 600;

    // Zoek recursief in de cubeGroup (inclusief alle children)
    const intersects = raycaster.intersectObjects([cubeGroup], true);

    debugLog(`🔍 Raycaster vond ${intersects.length} object hits (inclusief cubeGroup children)`);

    // DEBUG: Log alle gevonden objecten
    if (DEBUG && intersects.length > 0) {
      intersects.forEach((hit, i) => {
        const obj = hit.object;
        debugLog(
          `  Hit ${i}: ${obj.type} - name: ${obj.name || 'unnamed'}, userData:`,
          obj.userData,
          `distance: ${hit.distance.toFixed(1)}`,
        );
      });
    }

    let closestPlaceholder = null;

    // EERST: Probeer directe raycast hit op placeholder
    if (intersects.length > 0) {
      for (const intersect of intersects) {
        const obj = intersect.object;

        if (obj.userData && obj.userData.isPlaceholder) {
          const placeholder = placeholders.find((p) => p.mesh === obj);

          if (placeholder && !placeholder.filled) {
            closestPlaceholder = placeholder;
            debugLog(
              `✅ DIRECT HIT op hoek ${placeholder.mesh.userData.cornerIndex} (distance: ${intersect.distance.toFixed(1)})`,
            );
            break;
          } else if (placeholder && placeholder.filled) {
            debugLog(`⚠️ Hoek ${placeholder.mesh.userData.cornerIndex} is al gevuld`);
          }
        }
      }
    }

    // FALLBACK: Gebruik screen space distance met Z-DEPTH SORTING en relatief THRESHOLD
    if (!closestPlaceholder) {
      debugLog('⚠️ Geen directe hit, gebruik screen space distance met threshold en Z-depth');

      // RELATIEF THRESHOLD: 40% van scherm voor makkelijke dragability (was 25%)
      const DROP_THRESHOLD = Math.min(rect.width, rect.height) * 0.4;
      let minWeightedDistance = Infinity;
      let bestPlaceholder = null;

      placeholders.forEach((p) => {
        if (p.filled) return;

        // Bereken world positie van hoek
        const worldPos = new THREE.Vector3();
        p.mesh.getWorldPosition(worldPos);

        // Projecteer naar screen space
        const screenPos = worldPos.clone();
        screenPos.project(camera);

        // Check of hoek binnen viewport is (tussen -1 en 1 in x en y)
        const isInViewport =
          screenPos.x >= -1 && screenPos.x <= 1 && screenPos.y >= -1 && screenPos.y <= 1;

        if (!isInViewport) {
          debugLog(
            `👁️ Hoek ${p.mesh.userData.cornerIndex} is buiten viewport (x: ${screenPos.x.toFixed(3)}, y: ${screenPos.y.toFixed(3)})`,
          );
          return; // Skip hoeken buiten het scherm
        }

        // Bereken screen space afstand in pixels
        const screenX = (screenPos.x * 0.5 + 0.5) * rect.width + rect.left;
        const screenY = (screenPos.y * -0.5 + 0.5) * rect.height + rect.top;

        const dx = screenX - e.clientX;
        const dy = screenY - e.clientY;
        const screenDistance = Math.sqrt(dx * dx + dy * dy);

        // Z-DEPTH SORTING: Weeg Z-depth mee (hoe verder weg, hoe zwaarder)
        // screenPos.z is tussen -1 (dichtbij) en 1 (ver weg)
        const zDepth = (screenPos.z + 1) / 2; // Normaliseer naar 0-1
        const weightedDistance =
          screenDistance + zDepth * Z_DEPTH_WEIGHT * Math.min(rect.width, rect.height);

        debugLog(
          `📏 Hoek ${p.mesh.userData.cornerIndex}: screen(${Math.round(screenX)}, ${Math.round(screenY)}) - screenDist: ${Math.round(screenDistance)}px, weightedDist: ${Math.round(weightedDistance)}px, z: ${screenPos.z.toFixed(3)}, zDepth: ${zDepth.toFixed(3)}`,
        );

        // Alleen hoeken binnen threshold overwogen, gebruik weighted distance
        if (screenDistance < DROP_THRESHOLD && weightedDistance < minWeightedDistance) {
          minWeightedDistance = weightedDistance;
          bestPlaceholder = p;
        }
      });

      if (bestPlaceholder && minWeightedDistance < Infinity) {
        closestPlaceholder = bestPlaceholder;
        debugLog(
          `✅ Dichtstbijzijnde hoek binnen threshold: ${closestPlaceholder.mesh.userData.cornerIndex} (weighted afstand: ${Math.round(minWeightedDistance)}px, threshold: ${Math.round(DROP_THRESHOLD)}px)`,
        );
      } else {
        debugLog(
          `❌ Geen hoek binnen threshold gevonden! Threshold: ${Math.round(DROP_THRESHOLD)}px`,
        );
      }
    }

    if (closestPlaceholder) {
      debugLog(`✅ SNAP naar hoek ${closestPlaceholder.mesh.userData.cornerIndex}`);

      closestPlaceholder.mesh.visible = true;
      closestPlaceholder.mesh.material.opacity = 1.0;
      closestPlaceholder.mesh.material.color.setHex(0x00ff00);

      setTimeout(() => {
        if (closestPlaceholder) {
          placeShapeOnCorner(closestPlaceholder, draggedShapeType);

          if (draggedBlock) {
            draggedBlock.style.transition = 'all 0.3s ease';
            draggedBlock.style.transform = 'scale(0)';
            draggedBlock.style.opacity = '0';

            setTimeout(() => {
              if (draggedBlock && draggedBlock.parentElement) {
                draggedBlock.remove();
                debugLog('🗑️ Shape choice verwijderd uit lijstje');
              }
            }, 300);
          }

          debugLog(
            `✅ SUCCES! Shape geplaatst op hoek ${closestPlaceholder.mesh.userData.cornerIndex}!`,
          );
        }
      }, 100);

      draggedBlock = null;
      draggedShapeType = null;
      return false;
    } else {
      debugLog(`❌ Geen beschikbare hoek gevonden`);
      if (draggedBlock) {
        draggedBlock.style.opacity = '1';
      }
      draggedBlock = null;
      draggedShapeType = null;
    }

    return false;
  }

  function createGeometry(shapeType) {
    switch (shapeType) {
      case 'piramide':
        return new THREE.TetrahedronGeometry(70, 0);
      case 'kubus':
      case 'vierkant':
        return new THREE.BoxGeometry(100, 100, 100);
      case 'bol':
        return new THREE.SphereGeometry(60, 24, 24);
      case 'ruit':
      case 'oktaeder':
        return new THREE.OctahedronGeometry(70, 0);
      case 'zandloper': {
        const hourglassGeometry = new THREE.CylinderGeometry(0, 50, 80, 8);
        return hourglassGeometry;
      }
      default:
        return new THREE.BoxGeometry(100, 100, 100);
    }
  }

  function placeShapeOnCorner(placeholder, shapeType) {
    // Gebruik de EXACTE lokale positie van de placeholder
    // De placeholder is al een child van cubeGroup, dus zijn positie is al lokaal
    const localPos = new THREE.Vector3();
    localPos.copy(placeholder.mesh.position);

    // DEBUG: Log de exacte positie
    debugLog(
      `📍 Plaats shape op hoek ${placeholder.mesh.userData.cornerIndex} - lokale positie:`,
      localPos.x,
      localPos.y,
      localPos.z,
    );

    const geometry = createGeometry(shapeType);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });

    const placedShape = new THREE.Mesh(geometry, material);

    // Plaats de shape EXACT op dezelfde lokale positie als de placeholder
    // Gebruik set() met exacte waarden (niet copy) om zeker te zijn
    placedShape.position.x = localPos.x;
    placedShape.position.y = localPos.y;
    placedShape.position.z = localPos.z;

    // Zorg dat de shape NIET roteert (behoudt lokale orientatie)
    placedShape.rotation.set(0, 0, 0);

    // Lock de positie zodat deze niet kan worden veranderd
    placedShape.userData.positionLocked = true;
    placedShape.userData.lockedPosition = localPos.clone();

    placedShape.userData.isPlacedBlock = true;
    placedShape.userData.cornerIndex = placeholder.mesh.userData.cornerIndex;
    placedShape.userData.shape = shapeType;

    // Voeg toe aan de cubeGroup (niet scene!) zodat het meedraait met de kubus
    cubeGroup.add(placedShape);

    // VERIFICATIE: Check direct na toevoegen of positie correct is
    const verifyPos = new THREE.Vector3();
    placedShape.getWorldPosition(verifyPos);
    const placeholderWorldPos = new THREE.Vector3();
    placeholder.mesh.getWorldPosition(placeholderWorldPos);

    debugLog(
      `🔍 VERIFICATIE - Shape world positie:`,
      verifyPos.x.toFixed(1),
      verifyPos.y.toFixed(1),
      verifyPos.z.toFixed(1),
    );
    debugLog(
      `🔍 VERIFICATIE - Placeholder world positie:`,
      placeholderWorldPos.x.toFixed(1),
      placeholderWorldPos.y.toFixed(1),
      placeholderWorldPos.z.toFixed(1),
    );

    const distance = verifyPos.distanceTo(placeholderWorldPos);
    if (distance > 1) {
      debugLog(`⚠️ WAARSCHUWING: Shape staat ${distance.toFixed(1)} units van placeholder af!`);
    }

    // Markeer placeholder als gevuld
    placeholder.filled = true;
    placeholder.mesh.visible = false;

    // Forceer een render update
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }

    // Zorg dat de positie behouden blijft
    maintainPlacedShapesPositions();

    checkCompletion();

    debugLog(
      `✅ 3D Shape EXACT geplaatst op hoek ${placeholder.mesh.userData.cornerIndex} (lokale positie: ${localPos.x}, ${localPos.y}, ${localPos.z})`,
    );
  }

  function checkCompletion() {
    const allFilled = placeholders.every((p) => p.filled);

    if (allFilled) {
      console.log('🎉 ALLE 8 HOEKEN GEVULD! PUZZEL COMPLEET!'); // Success message blijft zichtbaar

      setTimeout(() => {
        alert('🎉 Gefeliciteerd! Je hebt de kubus voltooid!');
      }, 500);
    } else {
      const filledCount = placeholders.filter((p) => p.filled).length;
      debugLog(`📊 Progress: ${filledCount}/8 hoeken gevuld`);
    }
  }

  // Functie om geplaatste shapes op hun juiste positie te houden
  function maintainPlacedShapesPositions() {
    cubeGroup.traverse((obj) => {
      if (obj.userData && obj.userData.positionLocked && obj.userData.lockedPosition) {
        // Reset positie naar locked positie als deze is veranderd
        const currentPos = obj.position;
        const lockedPos = obj.userData.lockedPosition;

        const dx = Math.abs(currentPos.x - lockedPos.x);
        const dy = Math.abs(currentPos.y - lockedPos.y);
        const dz = Math.abs(currentPos.z - lockedPos.z);

        // Als positie meer dan 0.1 units afwijkt, reset het
        if (dx > 0.1 || dy > 0.1 || dz > 0.1) {
          console.warn(
            `🔒 Reset positie van shape op hoek ${obj.userData.cornerIndex} - was:`,
            currentPos.x.toFixed(1),
            currentPos.y.toFixed(1),
            currentPos.z.toFixed(1),
            `-> wordt:`,
            lockedPos.x.toFixed(1),
            lockedPos.y.toFixed(1),
            lockedPos.z.toFixed(1),
          );
          obj.position.copy(lockedPos);
        }
      }
    });
  }

  function createShapeChoices() {
    console.log('🔧 createShapeChoices() wordt aangeroepen!');

    // Verwijder oude dragShapes eerst
    dragShapes.forEach((shape) => {
      if (shape.parent) shape.parent.remove(shape);
      else scene.remove(shape);
    });
    dragShapes = [];

    // Positie links met padding (2x4 grid)
    const viewSize = 4000; // Zelfde als camera viewSize
    const aspect = window.innerWidth / window.innerHeight;
    const halfWidth = (viewSize / 2) * aspect;
    const padding = 200; // Padding vanaf linkerrand
    const startX = -halfWidth + padding; // Links met padding
    const startY = -400; // Onder instructiebox
    const horizontalGap = 180; // Ruimte tussen kolommen
    const verticalGap = 200; // Ruimte tussen rijen

    // Maak een groep voor de shape choices box
    const shapesBoxGroup = new THREE.Group();

    // 8 IDENTIEKE GROENE BLOKJES (allemaal kubussen) in 2x4 GRID
    const shapeSize = 120; // Grootte van de blokjes
    const blockColor = 0x00ff00; // GROEN voor alle blokjes

    // Maak 8 identieke groene kubussen in 2x4 grid (2 breed, 4 hoog)
    for (let i = 0; i < 8; i++) {
      const col = i % 2; // 0 of 1 (2 kolommen)
      const row = Math.floor(i / 2); // 0-3 (4 rijen)

      // Allemaal identieke kubussen - DUidelijk 3D met rotatie
      const geometry = new THREE.BoxGeometry(shapeSize, shapeSize, shapeSize);
      const material = new THREE.MeshBasicMaterial({
        color: blockColor,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.isDraggable = true;
      mesh.userData.shape = 'kubus'; // Allemaal kubussen
      mesh.userData.index = i; // Unieke index voor elk blokje
      // Grid positie: X voor kolommen, Y voor rijen
      mesh.position.set(startX + col * horizontalGap, startY - row * verticalGap, 0);

      // Rotatie toevoegen zodat het duidelijk 3D is (niet plat)
      mesh.rotation.x = Math.PI / 6; // 30 graden
      mesh.rotation.y = Math.PI / 4; // 45 graden

      dragShapes.push(mesh);
      shapesBoxGroup.add(mesh);
      console.log(
        `✅ Groen blokje ${i + 1} toegevoegd in grid (kolom ${col}, rij ${row}) op positie:`,
        mesh.position,
      );
    }

    // Maak OUTLINE BOX rond de shape choices (alleen outline, geen vulling)
    const boxWidth = 2 * horizontalGap + shapeSize + 50; // Breedte voor 2 kolommen
    const boxHeight = 4 * verticalGap + shapeSize + 50; // Hoogte voor 4 rijen
    const boxDepth = 10; // Diepte voor 3D effect

    // Maak wireframe box (alleen edges, geen vlakken)
    const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    const boxEdges = new THREE.EdgesGeometry(boxGeometry);
    const boxLineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00, // Groene outline
      linewidth: 3,
    });
    const boxWireframe = new THREE.LineSegments(boxEdges, boxLineMaterial);

    // Centreer de box rond de blokjes
    const boxCenterX = startX + horizontalGap / 2; // Midden tussen de 2 kolommen
    const boxCenterY = startY - (3 * verticalGap) / 2; // Midden tussen de 4 rijen
    boxWireframe.position.set(boxCenterX, boxCenterY, 0);

    shapesBoxGroup.add(boxWireframe);
    shapesBoxGroup.position.z = 0; // Op voorgrond

    // Voeg de hele groep toe aan de scene
    scene.add(shapesBoxGroup);

    console.log(
      `🎯 Totaal ${dragShapes.length} groene blokjes gemaakt in 2x4 grid met outline box!`,
    );
  }

  function positionHolder() {
    // Geen holder meer - blokjes staan direct op vaste posities
  }

  // === Drag & Drop ===
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onPointerDown(e) {
    e.preventDefault();
    updateMouse(e);
    raycaster.setFromCamera(mouse, camera);

    // Raycaster met recursive: true om door groepen heen te kijken
    const intersects = raycaster.intersectObjects(scene.children, true);

    // Filter op draggable objecten (maar NIET locked shapes)
    const draggableHits = intersects.filter(
      (hit) =>
        hit.object &&
        hit.object.userData &&
        (hit.object.userData.isDraggable || hit.object.userData.isPlacedBlock) &&
        !hit.object.userData.positionLocked, // Skip locked shapes
    );

    console.log(`🎯 Draggable hits: ${draggableHits.length}`);

    if (draggableHits.length > 0) {
      // Neem het eerste draggable object
      const hit = draggableHits[0];

      if (hit && hit.object) {
        dragged = hit.object;
        const pt = hit.point;

        // Bereken offset correct (wereldpositie gebruiken)
        const worldPos = new THREE.Vector3();
        dragged.getWorldPosition(worldPos);
        offset.copy(worldPos).sub(pt);
        isDragging = true;

        // Visuele feedback tijdens drag
        dragged.position.z = 100;
        if (dragged.material) {
          dragged.material.opacity = 0.6;
        }
        dragged.scale.multiplyScalar(1.1); // Maak iets groter tijdens drag

        // Cursor aanpassen
        renderer.domElement.style.cursor = 'grabbing';
        console.log('🖱️ Drag gestart:', dragged.userData, 'op positie:', dragged.position);
      } else {
        console.log('⚠️ Hit object heeft geen draggable userData:', hit.object);
      }
    } else {
      console.log('⚠️ Geen draggable intersects gevonden');
    }
  }
  function onPointerMove(e) {
    if (!isDragging || !dragged) return;
    e.preventDefault();
    updateMouse(e);
    raycaster.setFromCamera(mouse, camera);

    // Projecteer muispositie op Z=100 vlak (waar dragged object is)
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), -100);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeZ, intersect);

    if (intersect) {
      // Gebruik lokale positie (niet wereldpositie) omdat object in groep kan zitten
      dragged.position.set(intersect.x + offset.x, intersect.y + offset.y, 100);
      console.log('🖱️ Drag beweging:', dragged.position);
    }
  }
  function onPointerUp() {
    if (isDragging && dragged) {
      // Reset visuele feedback
      dragged.position.z = 1;
      dragged.material.opacity = 0.8;
      dragged.scale.divideScalar(1.1);
      renderer.domElement.style.cursor = 'default';

      // Check of we een geplaatst blokje wegslepen (terug naar holder)
      // Maar alleen als het NIET locked is
      if (dragged.userData && dragged.userData.isPlacedBlock && !dragged.userData.positionLocked) {
        // Wegslepen van kubus - verwijder het blokje en maak placeholder weer beschikbaar
        const cornerIndex = dragged.userData.cornerIndex;
        placeholders[cornerIndex].filled = false;
        scene.remove(dragged);
        checkCompletion();
      } else {
        // Normale drag van holder naar kubus
        let hit = null;

        // ============================================================
        // ⭐ RAYCASTING - Detecteer welke paarse bol je ECHT raakt!
        // ============================================================
        // In plaats van "dichtstbijzijnde hoek" berekenen (wat vaak fout gaat),
        // kijken we met raycasting welke 3D object onder de muis zit.
        // Dit is de ENIGE correcte manier om dit te doen in 3D!
        // ============================================================

        // Update raycaster met huidige muis positie
        raycaster.setFromCamera(mouse, camera);

        // Doe raycasting om ALLE objecten onder de muis te vinden
        const intersects = raycaster.intersectObjects(scene.children, true);

        // Zoek de EERSTE placeholder (paarse bol) die geraakt wordt
        for (const intersect of intersects) {
          const obj = intersect.object;

          // Check of dit een placeholder is EN niet gevuld
          if (obj.userData && obj.userData.isPlaceholder) {
            const placeholder = placeholders.find((p) => p.mesh === obj);
            if (placeholder && !placeholder.filled) {
              hit = placeholder;
              break; // Stop zodra we de eerste (dichtste) hebben
            }
          }
        }

        // FALLBACK: Als raycaster niks vond, zoek dichtstbijzijnde hoek
        if (!hit) {
          let minDist = Infinity;
          const snapThreshold = 200;

          placeholders.forEach((p) => {
            if (p.filled) return;
            const worldPos = new THREE.Vector3();
            p.mesh.getWorldPosition(worldPos);

            const dx = worldPos.x - dragged.position.x;
            const dy = worldPos.y - dragged.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < snapThreshold && dist < minDist) {
              minDist = dist;
              hit = p;
            }
          });
        }

        if (hit) {
          // Snap naar kubus hoek met animatie
          const worldPos = new THREE.Vector3();
          hit.mesh.getWorldPosition(worldPos);

          // Maak nieuwe mesh met juiste geometry en kleur voor op kubus
          const shapeType = dragged.userData.shape || 'kubus';
          const geometry = createGeometry(shapeType);
          const material = new THREE.MeshBasicMaterial({
            color: dragged.material.color,
            transparent: true,
            opacity: 1.0,
            side: THREE.DoubleSide,
          });

          const placedShape = new THREE.Mesh(geometry, material);
          placedShape.position.copy(worldPos);
          placedShape.position.z = 0;
          placedShape.userData.isPlacedBlock = true;
          placedShape.userData.cornerIndex = hit.mesh.userData.cornerIndex;
          placedShape.userData.shape = shapeType;

          // Visuele feedback bij plaatsing
          placedShape.scale.multiplyScalar(1.2);
          scene.add(placedShape);

          // Kleine "pop" animatie
          setTimeout(() => {
            placedShape.scale.divideScalar(1.2);
          }, 150);

          hit.filled = true;
          dragged.visible = false;
          checkCompletion();
        } else {
          // Niet op een hoekpunt - spring terug naar originele positie
          dragged.visible = true;
        }
      }
    }
    isDragging = false;
    dragged = null;
  }

  function updateMouse(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function showCompletionMessage() {
    const msg = document.createElement('div');
    msg.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #8A2BE2, #4B0082); color: white;
      padding: 30px 50px; border-radius: 15px; font-size: 24px; font-weight: bold;
      z-index: 10001; text-align: center; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      border: 3px solid #9370DB; font-family: 'Open Sans', sans-serif;
    `;
    msg.innerHTML = '🎉 HOOFDSTUK 2 VOLTOOID! 🎉<br><br>De Cubus is compleet!';
    document.body.appendChild(msg);

    setTimeout(() => {
      if (msg.parentNode) msg.remove();
    }, 3000);
  }
})();
