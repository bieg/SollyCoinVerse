// @ts-nocheck
/* eslint-env browser */
/* global THREE */
// src/chapter2.js
// Hoofdstuk 2 – Isometrische kubus illusie met 8 dropzones

(function () {
  window.initChapter2 = initChapter2;

  // ============================================================
  // 🔧 CONFIGURATIE
  // ============================================================
  let scene, renderer;
  let placedCount = 0;
  let draggedBlock = null;
  let draggedShapeType = null;

  function initChapter2() {
    console.log('🎮 Chapter 2 gestart - Isometrische kubus met 8 dropzones');

    // Pak globals uit hoofdstuk 1
    scene = window.scene;
    renderer = window.renderer;

    if (!scene || !renderer) {
      console.warn('Scene niet beschikbaar, wacht nog even...');
      setTimeout(() => {
        if (window.scene && window.renderer) {
          initChapter2();
        }
      }, 500);
      return;
    }

    // Zet Level 2 modus aan
    window.level2Active = true;

    // Update chapter state in ChapterManager
    if (window.chapterManager) {
      window.chapterManager.setCurrentChapter(2);
      console.log('📚 Chapter 2 active in ChapterManager');
    }

    // Verwijder oude UI elementen
    const cta = document.getElementById('cta-buttons');
    if (cta) cta.remove();
    const walletBtn = document.getElementById('wallet-hub-btn');
    if (walletBtn) walletBtn.remove();
    const kaboomEl = document.getElementById('kaboom-counter');
    if (kaboomEl) kaboomEl.style.display = 'none';

    // Disable controls
    if (window.controls) {
      window.controls.enabled = false;
      window.controls = null;
    }

    // Cleanup en bouw UI
    cleanupChapter1Objects();
    createBrutalistUI();
    createIsometricCube();
    createShapeChoicesHolder();

    console.log('✅ Chapter 2 volledig geïnitialiseerd');
  }

  function cleanupChapter1Objects() {
    // Verwijder alle oude HTML elementen
    document
      .querySelectorAll('.drop-zone, .html-drop-zone, .corner-drop-zone, .corner-dropzone')
      .forEach((el) => el.remove());
    document.querySelectorAll('.debug-drop-dot').forEach((el) => el.remove());
    const oldCube = document.getElementById('isometric-cube-container');
    if (oldCube) oldCube.remove();
    const oldSquare = document.getElementById('flat-square-container');
    if (oldSquare) oldSquare.remove();

    // Verwijder alle kinderen uit scene behalve camera/lights
    if (scene) {
      const keep = new Set();
      scene.traverse((obj) => {
        if (obj.isCamera || obj.isLight) keep.add(obj);
      });
      [...scene.children].forEach((o) => {
        if (!keep.has(o)) scene.remove(o);
      });
      scene.background = new THREE.Color(0x0a0a0a);
    }

    placedCount = 0;
  }

  function createBrutalistUI() {
    const oldPanel = document.getElementById('chapter2-ui-panel');
    if (oldPanel) oldPanel.remove();

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
      width: 180px;
    `;

    const levelIndicator = document.createElement('div');
    levelIndicator.style.cssText = `font-size: 20px; padding-bottom: 10px; font-weight: bold;`;
    levelIndicator.innerHTML = '🎯 LEVEL 2:<br>De Kubus';

    const instructions = document.createElement('div');
    instructions.style.cssText = `font-size: 14px; line-height: 1.4; padding-bottom: 10px;`;
    instructions.innerHTML =
      '<strong>Doel:</strong><br><span style="font-weight: normal">Sleep de shapes naar de 8 hoeken!</span>';

    const progressCounter = document.createElement('div');
    progressCounter.id = 'progress-counter';
    progressCounter.style.cssText = `font-size: 16px; line-height: 1.4;`;
    progressCounter.innerHTML =
      '<strong>Geplaatst:</strong><br><span style="font-weight: normal">Shapes [0/8]</span>';

    uiPanel.appendChild(levelIndicator);
    uiPanel.appendChild(instructions);
    uiPanel.appendChild(progressCounter);
    document.body.appendChild(uiPanel);
  }

  // ============================================================
  // 🎯 ISOMETRISCHE KUBUS - PURE SVG VOOR EXACTE HOEKPUNTEN
  // ============================================================
  function createIsometricCube() {
    console.log('📐 Maak isometrische kubus met 8 dropzones...');

    const oldContainer = document.getElementById('isometric-cube-container');
    if (oldContainer) oldContainer.remove();

    // Container voor de hele kubus
    const container = document.createElement('div');
    container.id = 'isometric-cube-container';
    container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 500px;
      height: 600px;
      z-index: 9000;
    `;

    // ============================================================
    // ISOMETRISCHE KUBUS - ECHTE VIERKANTE KUBUS
    // ============================================================
    // De visuele hoogte moet gelijk zijn aan de visuele breedte

    const cx = 250; // Centrum X
    const cy = 320; // Centrum Y (iets lager voor meer ruimte)
    const s = 100; // Basis zijde

    // Isometrische projectie
    const ax = s * 0.866; // cos(30°) * s = horizontale component (~86.6)
    const ay = s * 0.5; // sin(30°) * s = verticale component van diepte (~50)
    // BELANGRIJKE FIX: hoogte moet gelijk zijn aan de breedte (2*ax)
    // Visuele breedte = 2 * ax = ~173 pixels
    // Dus hoogte moet ook ~173 pixels zijn
    const h = s * 1.73; // Hoogte van de kubus (sqrt(3) ≈ 1.73)

    const corners = [
      // BOVENVLAK (4 hoeken) - y offset = -h
      { x: cx - ax, y: cy - h - ay, label: '1' }, // Links achter boven
      { x: cx + ax, y: cy - h - ay, label: '2' }, // Rechts achter boven
      { x: cx + ax + ax, y: cy - h, label: '3' }, // Rechts voor boven
      { x: cx, y: cy - h, label: '4' }, // Links voor boven
      // ONDERVLAK (4 hoeken) - y offset = 0
      { x: cx - ax, y: cy - ay, label: '5' }, // Links achter onder
      { x: cx + ax, y: cy - ay, label: '6' }, // Rechts achter onder
      { x: cx + ax + ax, y: cy, label: '7' }, // Rechts voor onder
      { x: cx, y: cy, label: '8' }, // Links voor onder
    ];

    // SVG voor de hele kubus
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '500');
    svg.setAttribute('height', '600');
    svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 1;
    `;

    // Teken de 12 ribben van de kubus
    const edges = [
      // Bovenvlak (4 ribben)
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      // Ondervlak (4 ribben)
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      // Verticale ribben (4 ribben)
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ];

    edges.forEach(([from, to]) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', corners[from].x);
      line.setAttribute('y1', corners[from].y);
      line.setAttribute('x2', corners[to].x);
      line.setAttribute('y2', corners[to].y);
      line.setAttribute('stroke', '#8A2BE2');
      line.setAttribute('stroke-width', '4');
      svg.appendChild(line);
    });

    // Voeg subtiele fill toe voor bovenvlak
    const topFace = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    topFace.setAttribute(
      'points',
      `${corners[0].x},${corners[0].y} ${corners[1].x},${corners[1].y} ${corners[2].x},${corners[2].y} ${corners[3].x},${corners[3].y}`,
    );
    topFace.setAttribute('fill', 'rgba(138, 43, 226, 0.1)');
    topFace.setAttribute('stroke', 'none');
    svg.insertBefore(topFace, svg.firstChild);

    container.appendChild(svg);

    // Dropzone posities komen direct uit de corners array
    const dropzonePositions = corners;

    dropzonePositions.forEach((pos, index) => {
      const dropzone = document.createElement('div');
      dropzone.className = 'corner-dropzone';
      dropzone.dataset.cornerIndex = index;
      dropzone.dataset.filled = 'false';
      dropzone.style.cssText = `
        position: absolute;
        left: ${pos.x}px;
        top: ${pos.y}px;
        transform: translate(-50%, -50%);
        width: 60px;
        height: 60px;
        border: 3px dashed #00ff00;
        border-radius: 50%;
        background: rgba(0, 255, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: bold;
        color: #00ff00;
        cursor: crosshair;
        transition: all 0.2s ease;
        font-family: 'Open Sans', sans-serif;
        z-index: 100;
      `;
      dropzone.textContent = pos.label;

      // Drag events
      dropzone.addEventListener('dragenter', handleDragEnter);
      dropzone.addEventListener('dragover', handleDragOver);
      dropzone.addEventListener('dragleave', handleDragLeave);
      dropzone.addEventListener('drop', handleDrop);

      container.appendChild(dropzone);
    });

    document.body.appendChild(container);
    console.log('✅ Isometrische kubus met 8 dropzones gemaakt');
  }

  // ============================================================
  // 🎨 SHAPE CHOICES - 8 BLOKJES IN 2x4 GRID
  // ============================================================
  function createShapeChoicesHolder() {
    console.log('🎨 Maak shape choices holder met 8 blokjes...');

    let userShape = 'piramide';
    if (window.gameManager && window.gameManager.getCurrentShape) {
      userShape = window.gameManager.getCurrentShape();
    }
    console.log(`🎯 Gekozen shape: ${userShape}`);

    const oldHolder = document.getElementById('shape-choices-holder');
    if (oldHolder) oldHolder.remove();

    const uiPanel = document.getElementById('chapter2-ui-panel');
    let topPosition = 280;
    if (uiPanel) {
      const rect = uiPanel.getBoundingClientRect();
      topPosition = rect.bottom + 20;
    }

    const holder = document.createElement('div');
    holder.id = 'shape-choices-holder';
    holder.style.cssText = `
      position: fixed;
      top: ${topPosition}px;
      left: 20px;
      padding: 12px;
      background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
      border: 3px solid #00ff00;
      border-radius: 12px;
      display: grid;
      grid-template-columns: repeat(2, 50px);
      grid-template-rows: repeat(4, 50px);
      gap: 8px;
      z-index: 10001;
      box-shadow: 0 4px 20px rgba(0, 255, 0, 0.4);
    `;

    // 8 blokjes (2x4 grid)
    for (let i = 0; i < 8; i++) {
      const block = document.createElement('div');
      block.className = 'shape-choice-block';
      block.draggable = true;
      block.dataset.shapeType = userShape;
      block.dataset.blockIndex = i;
      block.dataset.used = 'false';
      block.style.cssText = `
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 255, 0, 0.3);
        border: 2px solid #00ff00;
        border-radius: 6px;
        cursor: grab;
        transition: all 0.2s ease;
      `;

      const shapeElement = document.createElement('div');
      shapeElement.style.cssText = getShapeStyle(userShape);
      shapeElement.style.pointerEvents = 'none';
      block.appendChild(shapeElement);

      block.addEventListener('dragstart', handleBlockDragStart);
      block.addEventListener('dragend', handleBlockDragEnd);

      block.addEventListener('mouseenter', () => {
        if (block.dataset.used !== 'true') {
          block.style.background = 'rgba(0, 255, 0, 0.5)';
          block.style.transform = 'scale(1.1)';
          block.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.6)';
        }
      });
      block.addEventListener('mouseleave', () => {
        if (block.dataset.used !== 'true') {
          block.style.background = 'rgba(0, 255, 0, 0.3)';
          block.style.transform = 'scale(1)';
          block.style.boxShadow = 'none';
        }
      });

      holder.appendChild(block);
    }

    document.body.appendChild(holder);
    console.log('✅ Shape choices holder met 8 blokjes gemaakt');
  }

  // ============================================================
  // 🎯 DRAG & DROP HANDLERS
  // ============================================================

  function handleBlockDragStart(e) {
    const block = e.target.closest('.shape-choice-block');
    if (!block || block.dataset.used === 'true') {
      e.preventDefault();
      return;
    }

    draggedBlock = block;
    draggedShapeType = block.dataset.shapeType;

    block.style.opacity = '0.5';
    block.style.cursor = 'grabbing';

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedShapeType);

    // Highlight beschikbare dropzones
    document.querySelectorAll('.corner-dropzone').forEach((zone) => {
      if (zone.dataset.filled !== 'true') {
        zone.style.border = '3px solid #ffff00';
        zone.style.boxShadow = '0 0 20px rgba(255, 255, 0, 0.6)';
      }
    });

    console.log(`🎯 Start drag: ${draggedShapeType}`);
  }

  function handleBlockDragEnd(e) {
    const block = e.target.closest('.shape-choice-block');

    // Reset dropzone highlights
    document.querySelectorAll('.corner-dropzone').forEach((zone) => {
      if (zone.dataset.filled !== 'true') {
        zone.style.border = '3px dashed #00ff00';
        zone.style.boxShadow = 'none';
      }
    });

    if (block && block.dataset.used !== 'true') {
      block.style.opacity = '1';
      block.style.cursor = 'grab';
    }
  }

  function handleDragEnter(e) {
    e.preventDefault();
    const zone = e.target.closest('.corner-dropzone');
    if (zone && zone.dataset.filled !== 'true') {
      zone.style.background = 'rgba(0, 255, 0, 0.4)';
      zone.style.transform = 'translate(-50%, -50%) scale(1.15)';
      zone.style.border = '3px solid #00ff00';
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDragLeave(e) {
    const zone = e.target.closest('.corner-dropzone');
    if (zone && zone.dataset.filled !== 'true') {
      zone.style.background = 'rgba(0, 255, 0, 0.15)';
      zone.style.transform = 'translate(-50%, -50%) scale(1)';
      zone.style.border = '3px dashed #00ff00';
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const zone = e.target.closest('.corner-dropzone');

    if (!zone || zone.dataset.filled === 'true') return;

    const shapeType = e.dataTransfer.getData('text/plain') || draggedShapeType;
    if (!shapeType) return;

    const cornerIndex = zone.dataset.cornerIndex;
    console.log(`✅ Drop op hoek ${cornerIndex}: ${shapeType}`);

    // Markeer dropzone als gevuld
    zone.dataset.filled = 'true';
    zone.style.background = 'rgba(0, 255, 0, 0.6)';
    zone.style.border = '3px solid #00ff00';
    zone.style.transform = 'translate(-50%, -50%) scale(1)';
    zone.style.cursor = 'default';
    zone.style.boxShadow = '0 0 25px rgba(0, 255, 0, 0.7)';
    zone.textContent = '✓';
    zone.style.fontSize = '28px';

    // Markeer blokje als gebruikt
    if (draggedBlock) {
      draggedBlock.dataset.used = 'true';
      draggedBlock.draggable = false;
      draggedBlock.style.opacity = '0.3';
      draggedBlock.style.background = 'rgba(100, 100, 100, 0.3)';
      draggedBlock.style.border = '2px solid #666';
      draggedBlock.style.cursor = 'not-allowed';
      draggedBlock.style.pointerEvents = 'none';
    }

    placedCount++;
    updateProgressCounter();

    if (placedCount >= 8) {
      setTimeout(showCompletionMessage, 500);
    }

    draggedBlock = null;
    draggedShapeType = null;
  }

  // ============================================================
  // 🔧 HELPER FUNCTIES
  // ============================================================

  function updateProgressCounter() {
    const counter = document.getElementById('progress-counter');
    if (counter) {
      counter.innerHTML = `<strong>Geplaatst:</strong><br><span style="font-weight: normal">Shapes [${placedCount}/8]</span>`;
    }
  }

  function getShapeStyle(shape) {
    const baseSize = 20;
    switch (shape) {
      case 'piramide':
        return `
          width: 0;
          height: 0;
          border-left: ${baseSize / 2}px solid transparent;
          border-right: ${baseSize / 2}px solid transparent;
          border-bottom: ${baseSize}px solid #00ff00;
        `;
      case 'kubus':
      case 'vierkant':
        return `
          width: ${baseSize}px;
          height: ${baseSize}px;
          background: #00ff00;
          border: 1px solid #00cc00;
        `;
      case 'bol':
        return `
          width: ${baseSize}px;
          height: ${baseSize}px;
          background: #00ff00;
          border-radius: 50%;
        `;
      case 'ruit':
      case 'oktaeder':
        return `
          width: ${baseSize - 4}px;
          height: ${baseSize - 4}px;
          background: #00ff00;
          transform: rotate(45deg);
        `;
      case 'zandloper':
        return `
          width: 0;
          height: 0;
          border-left: ${baseSize / 2.5}px solid transparent;
          border-right: ${baseSize / 2.5}px solid transparent;
          border-top: ${baseSize / 2.5}px solid #00ff00;
          border-bottom: ${baseSize / 2.5}px solid #00ff00;
        `;
      default:
        return `
          width: ${baseSize}px;
          height: ${baseSize}px;
          background: #00ff00;
        `;
    }
  }

  function showCompletionMessage() {
    console.log('🎉 ALLE 8 HOEKEN GEVULD! KUBUS COMPLEET!');

    const msg = document.createElement('div');
    msg.id = 'completion-message';
    msg.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #8A2BE2, #4B0082);
      color: white;
      padding: 40px 60px;
      border-radius: 20px;
      font-size: 28px;
      font-weight: bold;
      z-index: 20000;
      text-align: center;
      box-shadow: 0 10px 50px rgba(138, 43, 226, 0.6);
      border: 4px solid #9370DB;
      font-family: 'Open Sans', sans-serif;
      animation: celebrate 0.5s ease-out;
    `;
    msg.innerHTML = `
      🎉 LEVEL 2 VOLTOOID! 🎉
      <br><br>
      <span style="font-size: 20px; font-weight: normal;">
        De Kubus is compleet!
      </span>
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes celebrate {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.1); }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(msg);

    setTimeout(() => {
      if (msg.parentNode) msg.remove();
    }, 4000);
  }

  // Resize handler
  window.addEventListener('resize', () => {
    if (window.level2Active) {
      const uiPanel = document.getElementById('chapter2-ui-panel');
      const holder = document.getElementById('shape-choices-holder');
      if (uiPanel && holder) {
        const rect = uiPanel.getBoundingClientRect();
        holder.style.top = `${rect.bottom + 20}px`;
      }
    }
  });
})();
