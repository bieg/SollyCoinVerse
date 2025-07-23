// src/chapter2.js
// Hoofdstuk 2 – Wireframe Kubus Puzzle

(function(){
  const CHAPTER2 = {};
  window.initChapter2 = initChapter2;

  let scene, camera, renderer, controls;
  let wireframeCube, cornerPoints = [], shapeChoices = [];
  let isDragging = false, draggedShape = null, dragOffset = new THREE.Vector3();
  let placedShapes = 0;
  let totalCorners = 8;
  let levelCompleted = false;

  function initChapter2(){
    console.log('🚀 Initializing Chapter 2: Wireframe Kubus Puzzle');
    
    // Pak globals uit hoofdstuk 1
    scene = window.scene; 
    camera = window.camera; 
    renderer = window.renderer; 
    controls = window.controls;
    
    if(!scene || !camera || !renderer){ 
      console.error('Scene niet beschikbaar'); 
      return; 
    }

    // Verwijder oude UI elementen
    cleanupOldUI();

    // Setup camera voor wireframe kubus
    setupCamera();

    // Verwijder oude objecten
    cleanupChapter1Objects();

    // Maak UI
    createLevel2UI();
    
    // Maak wireframe kubus
    createWireframeCube();
    
    // Maak shape choices panel
    createShapeChoicesPanel();

    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Chapter 2 initialized successfully');
  }

  function cleanupOldUI(){
    // Verwijder oude CTA-buttons
    const cta = document.getElementById('cta-buttons');
    if(cta) cta.remove();

    // Verberg KABOOM teller
    const kaboomEl = document.getElementById('kaboom-counter');
    if(kaboomEl) kaboomEl.style.display = 'none';

    // Verwijder oude terminal
    const oldTerminal = document.getElementById('brutal-terminal');
    if(oldTerminal) oldTerminal.remove();
  }

  function setupCamera(){
    // Zet camera in positie voor wireframe kubus
    camera.position.set(0, 0, 2000);
    camera.lookAt(0, 0, 0);
    
    // Disable camera controls
    if(controls){
      controls.enabled = false;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableRotate = false;
    }
  }

  function cleanupChapter1Objects(){
    // Verwijder alle objecten behalve camera en lights
    const objectsToRemove = [];
    scene.traverse(obj => {
      if(!obj.isCamera && !obj.isLight && obj !== scene){
        objectsToRemove.push(obj);
      }
    });
    
    objectsToRemove.forEach(obj => {
      if(obj.parent) obj.parent.remove(obj);
    });
  }

  function createLevel2UI(){
    // Level indicator
    const levelIndicator = document.createElement('div');
    levelIndicator.id = 'level2-indicator';
    levelIndicator.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      padding: 15px 25px;
      background: linear-gradient(135deg, #8A2BE2, #4B0082);
      color: white;
      border-radius: 10px;
      font-family: 'Open Sans', sans-serif;
      font-weight: bold;
      font-size: 18px;
      z-index: 10000;
      box-shadow: 0 4px 15px rgba(138, 43, 226, 0.3);
      border: 2px solid #9370DB;
    `;
    levelIndicator.innerHTML = '🎯 LEVEL 2: Wireframe Kubus';
    document.body.appendChild(levelIndicator);

    // Counter
    const counter = document.createElement('div');
    counter.id = 'wireframe-counter';
    counter.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 25px;
      background: linear-gradient(135deg, #FF6B6B, #FF8E53);
      color: white;
      border-radius: 10px;
      font-family: 'Open Sans', sans-serif;
      font-weight: bold;
      font-size: 18px;
      z-index: 10000;
      box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
      border: 2px solid #FF8E53;
    `;
    counter.innerHTML = `🔗 Geplaatst: ${placedShapes}/${totalCorners}`;
    document.body.appendChild(counter);

    // Instructions
    const instructions = document.createElement('div');
    instructions.id = 'wireframe-instructions';
    instructions.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 15px 25px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border-radius: 10px;
      font-family: 'Open Sans', sans-serif;
      font-size: 16px;
      z-index: 10000;
      text-align: center;
      border: 2px solid #8A2BE2;
    `;
    instructions.innerHTML = '🎯 Sleep de shapes naar de hoekpunten van de kubus!';
    document.body.appendChild(instructions);
  }

  function createWireframeCube(){
    wireframeCube = new THREE.Group();
    
    // Kubus grootte
    const cubeSize = 600;
    
    // Maak wireframe kubus
    const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const edges = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ 
      color: 0x8A2BE2, 
      linewidth: 3,
      transparent: true,
      opacity: 0.8
    });
    const wireframe = new THREE.LineSegments(edges, wireframeMaterial);
    wireframeCube.add(wireframe);

    // Maak hoekpunten (8 hoeken van een kubus)
    const cornerPositions = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],  // Onderste vlak
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]        // Bovenste vlak
    ];

    cornerPositions.forEach((pos, index) => {
      const cornerPoint = createCornerPoint(index, pos, cubeSize);
      cornerPoints.push(cornerPoint);
      wireframeCube.add(cornerPoint);
    });

    scene.add(wireframeCube);
  }

  function createCornerPoint(index, position, cubeSize){
    const cornerGroup = new THREE.Group();
    
    // Hoekpunt indicator (kleine bol)
    const sphereGeometry = new THREE.SphereGeometry(15, 8, 6);
    const sphereMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xFFD700,
      transparent: true,
      opacity: 0.7
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    
    // Positie berekenen
    const x = position[0] * cubeSize / 2;
    const y = position[1] * cubeSize / 2;
    const z = position[2] * cubeSize / 2;
    
    cornerGroup.position.set(x, y, z);
    cornerGroup.add(sphere);
    
    // User data voor identificatie
    cornerGroup.userData = {
      cornerIndex: index,
      isCorner: true,
      isOccupied: false,
      position: position
    };
    
    return cornerGroup;
  }

  function createShapeChoicesPanel(){
    // Bepaal huidige shape
    const currentShape = (window.gameManager && window.gameManager.getCurrentShape) ? 
      window.gameManager.getCurrentShape() : 'piramide';
    
    // Maak 8 shape choices
    const shapes = Array(8).fill(currentShape);
    
    // Panel configuratie
    const panelConfig = {
      baseX: -1200,  // Links van kubus
      baseY: 400,
      shapeSize: 80,
      gapX: 120,
      gapY: 120,
      columns: 2,
      rows: 4
    };

    shapes.forEach((shapeType, index) => {
      const shapeChoice = createShapeChoice(shapeType, index, panelConfig);
      shapeChoices.push(shapeChoice);
      scene.add(shapeChoice);
    });

    // Maak panel frame
    createPanelFrame(panelConfig);
  }

  function createShapeChoice(shapeType, index, config){
    const shapeGroup = new THREE.Group();
    
    // Maak geometry gebaseerd op shape type
    let geometry;
    switch(shapeType){
      case 'kubus':
        geometry = new THREE.BoxGeometry(config.shapeSize, config.shapeSize, config.shapeSize);
        break;
      case 'piramide':
        geometry = new THREE.ConeGeometry(config.shapeSize/2, config.shapeSize, 4);
        break;
      case 'bol':
        geometry = new THREE.SphereGeometry(config.shapeSize/2, 8, 6);
        break;
      default:
        geometry = new THREE.BoxGeometry(config.shapeSize, config.shapeSize, config.shapeSize);
    }
    
    // Material met glow effect
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00FF88,
      transparent: true,
      opacity: 0.9
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    shapeGroup.add(mesh);
    
    // Positie berekenen
    const col = index % config.columns;
    const row = Math.floor(index / config.columns);
    const x = config.baseX + col * config.gapX;
    const y = config.baseY - row * config.gapY;
    const z = -100;
    
    shapeGroup.position.set(x, y, z);
    
    // User data
    shapeGroup.userData = {
      shapeType: shapeType,
      isShapeChoice: true,
      originalPosition: new THREE.Vector3(x, y, z),
      index: index
    };
    
    return shapeGroup;
  }

  function createPanelFrame(config){
    const frameGroup = new THREE.Group();
    
    // Frame afmetingen
    const frameWidth = config.gapX * (config.columns - 1) + config.shapeSize;
    const frameHeight = config.gapY * (config.rows - 1) + config.shapeSize;
    
    // Maak frame lijnen
    const frameGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-frameWidth/2, frameHeight/2, -110),
      new THREE.Vector3(frameWidth/2, frameHeight/2, -110),
      new THREE.Vector3(frameWidth/2, -frameHeight/2, -110),
      new THREE.Vector3(-frameWidth/2, -frameHeight/2, -110),
      new THREE.Vector3(-frameWidth/2, frameHeight/2, -110)
    ]);
    
    const frameMaterial = new THREE.LineBasicMaterial({ 
      color: 0x8A2BE2,
      linewidth: 2
    });
    
    const frame = new THREE.Line(frameGeometry, frameMaterial);
    frame.position.set(config.baseX + config.gapX/2, config.baseY - config.gapY, 0);
    frameGroup.add(frame);
    
    // Panel label
    const labelGeometry = new THREE.PlaneGeometry(200, 50);
    const labelMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x8A2BE2,
      transparent: true,
      opacity: 0.8
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(0, frameHeight/2 + 50, -110);
    frameGroup.add(label);
    
    scene.add(frameGroup);
  }

  function setupEventListeners(){
    // Pointer events voor drag & drop
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
  }

  // === Drag & Drop System ===
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onPointerDown(event){
    updateMousePosition(event);
    raycaster.setFromCamera(mouse, camera);
    
    // Check voor shape choices
    const shapeIntersects = raycaster.intersectObjects(shapeChoices, true);
    if(shapeIntersects.length > 0){
      const intersectedObject = shapeIntersects[0].object;
      const shapeChoice = findShapeChoiceParent(intersectedObject);
      
      if(shapeChoice && !shapeChoice.userData.isPlaced){
        startDragging(shapeChoice, shapeIntersects[0].point);
      }
    }
  }

  function onPointerMove(event){
    if(!isDragging || !draggedShape) return;
    
    updateMousePosition(event);
    raycaster.setFromCamera(mouse, camera);
    
    // Project op een vlak voor smooth movement
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersection = new THREE.Vector3();
    
    if(raycaster.ray.intersectPlane(plane, intersection)){
      draggedShape.position.copy(intersection.sub(dragOffset));
    }
  }

  function onPointerUp(event){
    if(!isDragging || !draggedShape) return;
    
    // Check voor collision met corner points
    const hitCorner = findNearestCorner(draggedShape.position);
    
    if(hitCorner && !hitCorner.userData.isOccupied){
      placeShapeOnCorner(draggedShape, hitCorner);
    } else {
      // Return to original position
      returnShapeToOriginal(draggedShape);
    }
    
    stopDragging();
  }

  function updateMousePosition(event){
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function findShapeChoiceParent(object){
    let parent = object;
    while(parent && !parent.userData.isShapeChoice){
      parent = parent.parent;
    }
    return parent;
  }

  function startDragging(shapeChoice, hitPoint){
    draggedShape = shapeChoice;
    isDragging = true;
    
    // Bereken offset
    dragOffset.copy(hitPoint).sub(shapeChoice.position);
    
    // Visual feedback
    shapeChoice.scale.setScalar(1.2);
  }

  function stopDragging(){
    if(draggedShape){
      draggedShape.scale.setScalar(1.0);
    }
    
    isDragging = false;
    draggedShape = null;
  }

  function findNearestCorner(position){
    let nearestCorner = null;
    let minDistance = Infinity;
    
    cornerPoints.forEach(corner => {
      if(!corner.userData.isOccupied){
        const distance = position.distanceTo(corner.position);
        if(distance < minDistance && distance < 100){ // Snap distance
          minDistance = distance;
          nearestCorner = corner;
        }
      }
    });
    
    return nearestCorner;
  }

  function placeShapeOnCorner(shapeChoice, corner){
    // Clone shape voor placement
    const placedShape = shapeChoice.clone();
    placedShape.position.copy(corner.position);
    placedShape.userData.isPlaced = true;
    placedShape.userData.cornerIndex = corner.userData.cornerIndex;
    
    // Voeg toe aan scene
    scene.add(placedShape);
    
    // Mark corner as occupied
    corner.userData.isOccupied = true;
    corner.visible = false; // Hide corner indicator
    
    // Hide original shape choice
    shapeChoice.visible = false;
    
    // Update counter
    placedShapes++;
    updateCounter();
    
    // Check completion
    if(placedShapes >= totalCorners){
      completeLevel();
    }
    
    console.log(`✅ Shape geplaatst op corner ${corner.userData.cornerIndex}. ${placedShapes}/${totalCorners} voltooid`);
  }

  function returnShapeToOriginal(shapeChoice){
    shapeChoice.position.copy(shapeChoice.userData.originalPosition);
  }

  function updateCounter(){
    const counter = document.getElementById('wireframe-counter');
    if(counter){
      counter.innerHTML = `🔗 Geplaatst: ${placedShapes}/${totalCorners}`;
    }
  }

  function completeLevel(){
    if(levelCompleted) return;
    levelCompleted = true;
    
    console.log('🎉 Level 2 voltooid! Start whirl effect...');
    
    // Start whirl effect
    startWhirlEffect();
  }

  function startWhirlEffect(){
    const startTime = performance.now();
    const duration = 3000; // 3 seconden
    
    function animateWhirl(){
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;
      
      if(progress < 1){
        // Rotatie effect
        wireframeCube.rotation.x = progress * Math.PI * 4;
        wireframeCube.rotation.y = progress * Math.PI * 4;
        wireframeCube.rotation.z = progress * Math.PI * 2;
        
        // Scale effect
        const scale = 1 + Math.sin(progress * Math.PI * 8) * 0.3;
        wireframeCube.scale.setScalar(scale);
        
        // Color pulse effect
        wireframeCube.children.forEach(child => {
          if(child.material && child.material.color){
            const hue = (progress * 360) % 360;
            child.material.color.setHSL(hue / 360, 1, 0.5);
          }
        });
        
        requestAnimationFrame(animateWhirl);
      } else {
        // Level voltooid - verwijder kubus
        finishLevel();
      }
    }
    
    animateWhirl();
  }

  function finishLevel(){
    // Verwijder kubus
    scene.remove(wireframeCube);
    
    // Verwijder shape choices
    shapeChoices.forEach(shape => {
      scene.remove(shape);
    });
    
    // Verwijder UI
    const levelIndicator = document.getElementById('level2-indicator');
    const counter = document.getElementById('wireframe-counter');
    const instructions = document.getElementById('wireframe-instructions');
    
    if(levelIndicator) levelIndicator.remove();
    if(counter) counter.remove();
    if(instructions) instructions.remove();
    
    // Toon completion message
    showCompletionMessage();
    
    console.log('✅ Level 2 afgerond!');
  }

  function showCompletionMessage(){
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 30px 50px;
      background: linear-gradient(135deg, #8A2BE2, #4B0082);
      color: white;
      border-radius: 15px;
      font-family: 'Open Sans', sans-serif;
      font-size: 24px;
      font-weight: bold;
      z-index: 10001;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      border: 3px solid #9370DB;
    `;
    message.innerHTML = '🎉 LEVEL 2 VOLTOOID! 🎉<br><br>De wireframe kubus is compleet!';
    document.body.appendChild(message);
    
    // Verwijder na 3 seconden
    setTimeout(() => {
      message.remove();
      // Hier kun je naar het volgende level gaan
      console.log('🚀 Ready voor volgende level!');
    }, 3000);
  }

  // Cleanup functie
  function cleanup(){
    // Verwijder event listeners
    renderer.domElement.removeEventListener('pointerdown', onPointerDown);
    renderer.domElement.removeEventListener('pointermove', onPointerMove);
    renderer.domElement.removeEventListener('pointerup', onPointerUp);
    
    // Verwijder objecten
    if(wireframeCube) scene.remove(wireframeCube);
    shapeChoices.forEach(shape => {
      if(shape.parent) shape.parent.remove(shape);
    });
    
    // Verwijder UI
    const elements = ['level2-indicator', 'wireframe-counter', 'wireframe-instructions'];
    elements.forEach(id => {
      const element = document.getElementById(id);
      if(element) element.remove();
    });
  }

  // Expose cleanup
  window.cleanupChapter2 = cleanup;

})(); 