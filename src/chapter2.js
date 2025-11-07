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

    // Verwijder ook eventuele groene objecten die per ongeluk op (0,0,0) staan
    scene.children.forEach((child) => {
      if (child.material && child.material.color) {
        const color = child.material.color;
        const isGreen = color.getHex() === 0x00ff00 || color.getHex() === 0x00ffaa;
        if (
          isGreen &&
          child.position &&
          Math.abs(child.position.x) < 50 &&
          Math.abs(child.position.y) < 50 &&
          Math.abs(child.position.z) < 50 &&
          !child.userData.isDraggable
        ) {
          scene.remove(child);
        }
      }
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
    // createShapeChoices(); // UITGESCHAKELD - geen gekleurde shapes meer

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

    // ZICHTBARE paarse placeholders op hoekpunten (zoals in screenshot)
    points.forEach((p, i) => {
      // Maak zichtbare paarse bol als placeholder
      const placeholderSphere = new THREE.SphereGeometry(50, 16, 16);
      const placeholderMaterial = new THREE.MeshBasicMaterial({
        color: 0x8a2be2, // Paars, matching kubus
        transparent: true,
        opacity: 0.3, // Semi-transparant zoals in screenshot
      });
      const placeholderMesh = new THREE.Mesh(placeholderSphere, placeholderMaterial);
      placeholderMesh.position.set(p.x, p.y, p.z);
      placeholderMesh.userData.cornerIndex = i;
      placeholderMesh.userData.isPlaceholder = true;
      cubeGroup.add(placeholderMesh);
      placeholders.push({ mesh: placeholderMesh, filled: false });
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

    // Maak een aparte groep voor alle shapes
    const shapesGroup = new THREE.Group();

    // Positie links onder instructiebox (2x4 grid zoals in screenshot)
    const startX = -1800; // Links van scherm
    const startY = -600; // Onder instructiebox

    // 8 VERSCHILLENDE SHAPES zoals in het screenshot
    const shapeTypes = [
      'kubus', // Rood - Box
      'piramide', // Turquoise - Cone
      'bol', // Geel - Sphere
      'oktaeder', // Lichtblauw - Octahedron
      'torus', // Roze - Torus
      'cylinder', // Lichtpaars - Cylinder
      'tetraeder', // Lichtpaars-blauw - Tetrahedron
      'icosaeder', // Goud-geel - Icosahedron
    ];

    const colors = [
      0xff6b6b, // Rood
      0x4ecdc4, // Turquoise
      0xffe66d, // Geel
      0x95e1d3, // Lichtblauw
      0xf38181, // Roze
      0xaa96da, // Lichtpaars
      0xc7ceea, // Lichtpaars-blauw
      0xffd93d, // Goud-geel
    ];

    const shapeSize = 120; // Grotere shapes voor duidelijkheid
    const gridGap = 180; // Ruimte tussen shapes

    // Maak 8 verschillende shapes in 2x4 grid
    for (let i = 0; i < 8; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);

      let geometry;

      switch (shapeTypes[i]) {
        case 'kubus':
          geometry = new THREE.BoxGeometry(shapeSize, shapeSize, shapeSize);
          break;
        case 'piramide':
          geometry = new THREE.ConeGeometry(shapeSize / 2, shapeSize, 4);
          break;
        case 'bol':
          geometry = new THREE.SphereGeometry(shapeSize / 2, 16, 16);
          break;
        case 'oktaeder':
          geometry = new THREE.OctahedronGeometry(shapeSize / 2);
          break;
        case 'torus':
          geometry = new THREE.TorusGeometry(shapeSize / 3, shapeSize / 6, 8, 16);
          break;
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(shapeSize / 3, shapeSize / 3, shapeSize, 16);
          break;
        case 'tetraeder':
          geometry = new THREE.TetrahedronGeometry(shapeSize / 2);
          break;
        case 'icosaeder':
          geometry = new THREE.IcosahedronGeometry(shapeSize / 2);
          break;
        default:
          geometry = new THREE.BoxGeometry(shapeSize, shapeSize, shapeSize);
      }

      const material = new THREE.MeshBasicMaterial({
        color: colors[i],
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.isDraggable = true;
      mesh.userData.shape = shapeTypes[i];
      mesh.position.set(startX + col * gridGap, startY - row * gridGap, 0);

      dragShapes.push(mesh);
      shapesGroup.add(mesh);
      console.log(`✅ ${shapeTypes[i]} toegevoegd op positie:`, mesh.position);
    }

    // Voeg de hele shapes groep toe aan de scene
    shapesGroup.position.z = 0; // Zorg dat shapes op voorgrond blijven
    scene.add(shapesGroup);

    console.log(`🎯 Totaal ${dragShapes.length} groene driehoeken gemaakt onder instructiebox!`);
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
    updateMouse(e);
    raycaster.setFromCamera(mouse, camera);

    // Zoek eerst naar geplaatste blokjes op de kubus (die kunnen we wegslepen)
    const placedBlocks = scene.children.filter((obj) => obj.userData && obj.userData.isPlacedBlock);
    const allDraggable = [...dragShapes, ...placedBlocks];

    const intersects = raycaster.intersectObjects(allDraggable, false);
    if (intersects.length) {
      dragged = intersects[0].object;
      const pt = intersects[0].point;
      offset.copy(dragged.position).sub(pt);
      isDragging = true;

      // Visuele feedback tijdens drag
      dragged.position.z = 100;
      dragged.material.opacity = 0.6;
      dragged.scale.multiplyScalar(1.1); // Maak iets groter tijdens drag

      // Cursor aanpassen
      renderer.domElement.style.cursor = 'grabbing';
    }
  }
  function onPointerMove(e) {
    if (!isDragging || !dragged) return;
    updateMouse(e);
    raycaster.setFromCamera(mouse, camera);
    // Projecteer muispositie op Z=100 vlak (waar dragged object is)
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), -100);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeZ, intersect);
    if (intersect) {
      dragged.position.set(intersect.x + offset.x, intersect.y + offset.y, 100);
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
