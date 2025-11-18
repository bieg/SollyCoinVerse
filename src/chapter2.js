// @ts-nocheck
/* eslint-env browser */
/* global THREE */
// src/chapter2.js
// Hoofdstuk 2 – Brutalist cube puzzle

(function () {
  const CHAPTER2 = {};
  window.initChapter2 = initChapter2;

  let scene, camera, renderer, controls;
  let cubeGroup,
    placeholders = [],
    dragShapes = [];
  let holderFrame = null;
  let isDragging = false,
    dragged = null,
    offset = new THREE.Vector3();
  let loadingScene, loadingCamera;

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

    // ============================================================
    // ⭐ DEFINITIEVE CAMERA CONFIGURATIE - FOREVER BEHOUDEN ⭐
    // ============================================================
    // Camera setup: ORTHOGRAPHIC camera voor geometrisch perfecte isometrische kubus
    // Orthographic camera heeft geen perspectief vervorming - perfect voor isometrisch
    // Deze configuratie zorgt voor een geometrisch correcte kubus zonder vervorming
    // ============================================================
    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = 4000; // View size voor kubus van 2500 units (met wat ruimte)
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
      const viewSize = 4000;
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
    createShapeChoices(); // ✅ GEACTIVEERD - drag & drop shapes beschikbaar

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
      // Maak zichtbare hotspot bol voor elke hoek
      const placeholderSphere = new THREE.SphereGeometry(80, 16, 16);
      const placeholderMaterial = new THREE.MeshBasicMaterial({
        color: 0x8a2be2, // Paars, matching kubus
        transparent: true,
        opacity: 0.5, // Semi-transparant
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
      console.log(`📍 Hotspot ${i} geplaatst op hoek:`, p);
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

  function createGeometry(shape) {
    // Maak de juiste geometry voor elk shape type wanneer geplaatst op kubus
    const size = 90; // Kleinere versie voor op kubus
    switch (shape) {
      case 'kubus':
        return new THREE.BoxGeometry(size, size, size);
      case 'piramide':
        return new THREE.ConeGeometry(size / 2, size, 4);
      case 'bol':
        return new THREE.SphereGeometry(size / 2, 16, 16);
      case 'oktaeder':
        return new THREE.OctahedronGeometry(size / 2);
      case 'torus':
        return new THREE.TorusGeometry(size / 3, size / 6, 8, 16);
      case 'cylinder':
        return new THREE.CylinderGeometry(size / 3, size / 3, size, 16);
      case 'tetraeder':
        return new THREE.TetrahedronGeometry(size / 2);
      case 'icosaeder':
        return new THREE.IcosahedronGeometry(size / 2);
      default:
        return new THREE.BoxGeometry(size, size, size);
    }
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

    // Filter op draggable objecten
    const draggableHits = intersects.filter(
      (hit) =>
        hit.object &&
        hit.object.userData &&
        (hit.object.userData.isDraggable || hit.object.userData.isPlacedBlock),
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
      if (dragged.userData && dragged.userData.isPlacedBlock) {
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

  function checkCompletion() {
    const filled = placeholders.filter((p) => p.filled).length;
    const counter = document.getElementById('wireframe-counter');
    if (counter)
      counter.innerHTML = `<strong>Geplaatst:</strong><br><span style="font-weight: normal">Blokjes [${filled}/8]</span>`;

    if (placeholders.every((p) => p.filled)) {
      // Alle 8 hoeken gevuld!
      // Geen 3D rotatie - gewoon een simpele fade out voor 2D
      fadeOutAndComplete();
    }
  }

  function fadeOutAndComplete() {
    const start = performance.now();
    const duration = 2000; // Kortere animatie
    const animate = () => {
      const t = (performance.now() - start) / duration;
      const opacity = 1 - t;

      // Fade out alle objecten
      cubeGroup.children.forEach((child) => {
        if (child.material) {
          child.material.opacity = opacity;
          child.material.transparent = true;
        }
      });

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        scene.remove(cubeGroup);
        // Toon completion bericht
        showCompletionMessage();
      }
    };
    animate();
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
