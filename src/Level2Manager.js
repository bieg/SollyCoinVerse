// Level2Manager.js - Level 2: De Cubus (Wireframe Kubus Puzzle)
class Level2Manager {
    constructor() {
        this.isActive = false;
        this.isInitialized = false;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Wireframe kubus properties
        this.wireframeCube = null;
        this.cornerPoints = [];
        this.shapeChoices = [];
        this.isDragging = false;
        this.draggedShape = null;
        this.dragOffset = new THREE.Vector3();
        this.placedShapes = 0;
        this.totalCorners = 8;
        this.levelCompleted = false;
        
        // Raycaster voor drag & drop
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        console.log('🎯 Level2Manager: De Cubus - Initialized');
    }

    // Start Level 2
    startLevel() {
        if (this.isActive) return;
        
        console.log('🚀 Starting Level 2: De Cubus');
        this.isActive = true;
        
        // Get globals from main game
        this.scene = window.scene;
        this.camera = window.camera;
        this.renderer = window.renderer;
        this.controls = window.controls;
        
        if (!this.scene || !this.camera || !this.renderer) {
            console.error('❌ Scene, camera or renderer not available');
            return;
        }

        // Setup Level 2
        this.setupLevel2();
        
        console.log('✅ Level 2: De Cubus started successfully');
    }

    // Setup Level 2 environment
    setupLevel2() {
        // Cleanup old UI and objects
        this.cleanupOldUI();
        this.cleanupOldObjects();
        
        // Setup camera for wireframe cube
        this.setupCamera();
        
        // Create Level 2 UI
        this.createLevel2UI();
        
        // Create wireframe cube
        this.createWireframeCube();
        
        // Create shape choices panel
        this.createShapeChoicesPanel();
        
        // Setup event listeners
        this.setupEventListeners();
        
        this.isInitialized = true;
    }

    // Cleanup old UI elements
    cleanupOldUI() {
        // Hide KABOOM counter
        const kaboomEl = document.getElementById('kaboom-counter');
        if (kaboomEl) kaboomEl.style.display = 'none';

        // Remove old terminal if exists
        const oldTerminal = document.getElementById('brutal-terminal');
        if (oldTerminal) oldTerminal.remove();
        
        // Remove any existing Level 2 UI
        const existingUI = ['level2-indicator', 'wireframe-counter', 'wireframe-instructions'];
        existingUI.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });
    }

    // Cleanup old game objects
    cleanupOldObjects() {
        if (!this.scene) return;
        
        // Remove all objects except camera and lights
        const objectsToRemove = [];
        this.scene.traverse(obj => {
            if (!obj.isCamera && !obj.isLight && obj !== this.scene) {
                objectsToRemove.push(obj);
            }
        });
        
        objectsToRemove.forEach(obj => {
            if (obj.parent) obj.parent.remove(obj);
        });
    }

    // Setup camera for wireframe cube
    setupCamera() {
        if (!this.camera) return;
        
        // Position camera for wireframe cube view with shape choices visible
        this.camera.position.set(200, 0, 2000);
        this.camera.lookAt(0, 0, 0);
        
        // Enable camera controls for interactive puzzle
        if (this.controls) {
            this.controls.enabled = true;
            this.controls.enableZoom = true;
            this.controls.enablePan = true;
            this.controls.enableRotate = true;
        }
    }

    // Create Level 2 UI
    createLevel2UI() {
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
        levelIndicator.innerHTML = '🎯 LEVEL 2: De Cubus';
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
        counter.innerHTML = `🔗 Geplaatst: ${this.placedShapes}/${this.totalCorners}`;
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

    // Create wireframe cube
    createWireframeCube() {
        this.wireframeCube = new THREE.Group();
        
        // Cube size
        const cubeSize = 600;
        
        // Create wireframe cube
        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const edges = new THREE.EdgesGeometry(geometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({ 
            color: 0x8A2BE2, 
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });
        const wireframe = new THREE.LineSegments(edges, wireframeMaterial);
        this.wireframeCube.add(wireframe);

        // Create corner points (8 corners of a cube)
        const cornerPositions = [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],  // Bottom face
            [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]        // Top face
        ];

        cornerPositions.forEach((pos, index) => {
            const cornerPoint = this.createCornerPoint(index, pos, cubeSize);
            this.cornerPoints.push(cornerPoint);
            this.wireframeCube.add(cornerPoint);
        });

        // Rotate cube: 45 degrees around Y-axis, then 20 degrees up (10 more)
        this.wireframeCube.rotation.y = Math.PI / 4; // 45 degrees
        this.wireframeCube.rotation.x = Math.PI / 9; // 20 degrees up (was 10)

        this.scene.add(this.wireframeCube);
    }

    // Create corner point
    createCornerPoint(index, position, cubeSize) {
        const cornerGroup = new THREE.Group();
        
        // Corner indicator (small sphere)
        const sphereGeometry = new THREE.SphereGeometry(15, 8, 6);
        const sphereMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFD700,
            transparent: true,
            opacity: 0.7
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        
        // Calculate position
        const x = position[0] * cubeSize / 2;
        const y = position[1] * cubeSize / 2;
        const z = position[2] * cubeSize / 2;
        
        cornerGroup.position.set(x, y, z);
        cornerGroup.add(sphere);
        
        // User data for identification
        cornerGroup.userData = {
            cornerIndex: index,
            isCorner: true,
            isOccupied: false,
            position: position
        };
        
        return cornerGroup;
    }

    // Create shape choices panel
    createShapeChoicesPanel() {
        // Determine current shape from GameManager
        const currentShape = (window.gameManager && window.gameManager.getCurrentShape) ? 
            window.gameManager.getCurrentShape() : 'piramide';
        
        // Create 8 shape choices
        const shapes = Array(8).fill(currentShape);
        
        // Panel configuration - Block with border and margin from edge
        const panelConfig = {
            baseX: -1600,  // Left with margin from edge
            baseY: 400,
            shapeSize: 80,
            gapX: 120,
            gapY: 120,
            columns: 2,
            rows: 4
        };

        shapes.forEach((shapeType, index) => {
            const shapeChoice = this.createShapeChoice(shapeType, index, panelConfig);
            this.shapeChoices.push(shapeChoice);
            this.scene.add(shapeChoice);
        });

        // Create panel frame
        this.createPanelFrame(panelConfig);
    }

    // Create shape choice
    createShapeChoice(shapeType, index, config) {
        const shapeGroup = new THREE.Group();
        
        // Create geometry based on shape type
        let geometry;
        switch(shapeType) {
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
        
        // Material with glow effect
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00FF88,
            transparent: true,
            opacity: 0.9
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        shapeGroup.add(mesh);
        
        // Calculate position
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

    // Create panel frame
    createPanelFrame(config) {
        const frameGroup = new THREE.Group();
        
        // Frame dimensions with border padding
        const borderPadding = 40;
        const frameWidth = config.gapX * (config.columns - 1) + config.shapeSize + borderPadding * 2;
        const frameHeight = config.gapY * (config.rows - 1) + config.shapeSize + borderPadding * 2;
        
        // Create frame lines with thicker border
        const frameGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-frameWidth/2, frameHeight/2, -110),
            new THREE.Vector3(frameWidth/2, frameHeight/2, -110),
            new THREE.Vector3(frameWidth/2, -frameHeight/2, -110),
            new THREE.Vector3(-frameWidth/2, -frameHeight/2, -110),
            new THREE.Vector3(-frameWidth/2, frameHeight/2, -110)
        ]);
        
        const frameMaterial = new THREE.LineBasicMaterial({ 
            color: 0xFF6B6B, // Orange border to match UI
            linewidth: 4 // Thicker border
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
        
        this.scene.add(frameGroup);
    }

    // Setup event listeners
    setupEventListeners() {
        if (!this.renderer) return;
        
        // Pointer events for drag & drop
        this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
        this.renderer.domElement.addEventListener('pointermove', this.onPointerMove.bind(this));
        this.renderer.domElement.addEventListener('pointerup', this.onPointerUp.bind(this));
    }



    // Pointer down event
    onPointerDown(event) {
        this.updateMousePosition(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Check for shape choices
        const shapeIntersects = this.raycaster.intersectObjects(this.shapeChoices, true);
        if (shapeIntersects.length > 0) {
            const intersectedObject = shapeIntersects[0].object;
            const shapeChoice = this.findShapeChoiceParent(intersectedObject);
            
            if (shapeChoice && !shapeChoice.userData.isPlaced) {
                this.startDragging(shapeChoice, shapeIntersects[0].point);
            }
        }
    }

    // Pointer move event
    onPointerMove(event) {
        if (!this.isDragging || !this.draggedShape) return;
        
        this.updateMousePosition(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Project onto a plane for smooth movement
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const intersection = new THREE.Vector3();
        
        if (this.raycaster.ray.intersectPlane(plane, intersection)) {
            this.draggedShape.position.copy(intersection.sub(this.dragOffset));
        }
    }

    // Pointer up event
    onPointerUp(event) {
        if (!this.isDragging || !this.draggedShape) return;
        
        // Check for collision with corner points
        const hitCorner = this.findNearestCorner(this.draggedShape.position);
        
        if (hitCorner && !hitCorner.userData.isOccupied) {
            this.placeShapeOnCorner(this.draggedShape, hitCorner);
        } else {
            // Return to original position
            this.returnShapeToOriginal(this.draggedShape);
        }
        
        this.stopDragging();
    }

    // Update mouse position
    updateMousePosition(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    // Find shape choice parent
    findShapeChoiceParent(object) {
        let parent = object;
        while (parent && !parent.userData.isShapeChoice) {
            parent = parent.parent;
        }
        return parent;
    }

    // Start dragging
    startDragging(shapeChoice, hitPoint) {
        this.draggedShape = shapeChoice;
        this.isDragging = true;
        
        // Calculate offset
        this.dragOffset.copy(hitPoint).sub(shapeChoice.position);
        
        // Visual feedback
        shapeChoice.scale.setScalar(1.2);
    }

    // Stop dragging
    stopDragging() {
        if (this.draggedShape) {
            this.draggedShape.scale.setScalar(1.0);
        }
        
        this.isDragging = false;
        this.draggedShape = null;
    }

    // Find nearest corner
    findNearestCorner(position) {
        let nearestCorner = null;
        let minDistance = Infinity;
        
        this.cornerPoints.forEach(corner => {
            if (!corner.userData.isOccupied) {
                const distance = position.distanceTo(corner.position);
                if (distance < minDistance && distance < 100) { // Snap distance
                    minDistance = distance;
                    nearestCorner = corner;
                }
            }
        });
        
        return nearestCorner;
    }

    // Place shape on corner
    placeShapeOnCorner(shapeChoice, corner) {
        // Clone shape for placement
        const placedShape = shapeChoice.clone();
        placedShape.position.copy(corner.position);
        placedShape.userData.isPlaced = true;
        placedShape.userData.cornerIndex = corner.userData.cornerIndex;
        
        // Add to scene
        this.scene.add(placedShape);
        
        // Mark corner as occupied
        corner.userData.isOccupied = true;
        corner.visible = false; // Hide corner indicator
        
        // Hide original shape choice
        shapeChoice.visible = false;
        
        // Update counter
        this.placedShapes++;
        this.updateCounter();
        
        // Check completion
        if (this.placedShapes >= this.totalCorners) {
            this.completeLevel();
        }
        
        console.log(`✅ Shape geplaatst op corner ${corner.userData.cornerIndex}. ${this.placedShapes}/${this.totalCorners} voltooid`);
    }

    // Return shape to original position
    returnShapeToOriginal(shapeChoice) {
        shapeChoice.position.copy(shapeChoice.userData.originalPosition);
    }

    // Update counter
    updateCounter() {
        const counter = document.getElementById('wireframe-counter');
        if (counter) {
            counter.innerHTML = `🔗 Geplaatst: ${this.placedShapes}/${this.totalCorners}`;
        }
    }

    // Complete level
    completeLevel() {
        if (this.levelCompleted) return;
        this.levelCompleted = true;
        
        console.log('🎉 Level 2 voltooid! Start whirl effect...');
        
        // Start whirl effect
        this.startWhirlEffect();
    }

    // Start whirl effect
    startWhirlEffect() {
        const startTime = performance.now();
        const duration = 3000; // 3 seconds
        
        const animateWhirl = () => {
            const elapsed = performance.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Rotation effect
                this.wireframeCube.rotation.x = progress * Math.PI * 4;
                this.wireframeCube.rotation.y = progress * Math.PI * 4;
                this.wireframeCube.rotation.z = progress * Math.PI * 2;
                
                // Scale effect
                const scale = 1 + Math.sin(progress * Math.PI * 8) * 0.3;
                this.wireframeCube.scale.setScalar(scale);
                
                // Color pulse effect
                this.wireframeCube.children.forEach(child => {
                    if (child.material && child.material.color) {
                        const hue = (progress * 360) % 360;
                        child.material.color.setHSL(hue / 360, 1, 0.5);
                    }
                });
                
                requestAnimationFrame(animateWhirl);
            } else {
                // Level completed - remove cube
                this.finishLevel();
            }
        };
        
        animateWhirl();
    }

    // Finish level
    finishLevel() {
        // Remove cube
        if (this.wireframeCube && this.scene) {
            this.scene.remove(this.wireframeCube);
        }
        
        // Remove shape choices
        this.shapeChoices.forEach(shape => {
            if (shape.parent) {
                shape.parent.remove(shape);
            }
        });
        
        // Remove UI
        const elements = ['level2-indicator', 'wireframe-counter', 'wireframe-instructions'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });
        
        // Show completion message
        this.showCompletionMessage();
        
        console.log('✅ Level 2 afgerond!');
        
        // Return to main game
        this.returnToMainGame();
    }

    // Show completion message
    showCompletionMessage() {
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
        message.innerHTML = '🎉 LEVEL 2 VOLTOOID! 🎉<br><br>De Cubus is compleet!';
        document.body.appendChild(message);
        
        // Remove after 3 seconds
        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    // Return to main game
    returnToMainGame() {
        // Re-enable camera controls
        if (this.controls) {
            this.controls.enabled = true;
            this.controls.enableZoom = true;
            this.controls.enablePan = true;
            this.controls.enableRotate = true;
        }
        
        // Show KABOOM counter again
        const kaboomCounter = document.getElementById('kaboom-counter');
        if (kaboomCounter) {
            kaboomCounter.style.display = 'block';
        }
        
        // Reset camera to main game position
        if (this.camera) {
            this.camera.position.set(0, 1000, 4000);
            this.camera.lookAt(0, 0, 0);
        }
        
        // GEEN RESTART - gewoon terug naar hoofdgame
        this.restoreMainGameObjects();
        
        this.isActive = false;
        this.isInitialized = false;
    }

    // Restore main game objects (geen restart)
    restoreMainGameObjects() {
        if (!this.scene) return;
        
        console.log('🔄 Restoring main game objects (no restart)');
        
        // Maak bestaande objecten weer zichtbaar
        if (window.solly1) {
            window.solly1.visible = true;
        }
        
        if (window.solly2) {
            window.solly2.visible = true;
        }
        
        // Maak planeten weer zichtbaar
        if (window.planets) {
            window.planets.forEach(planet => {
                if (planet) planet.visible = true;
            });
        }
        
        // Maak sterren weer zichtbaar
        if (window.whiteStars) {
            window.whiteStars.forEach(star => {
                if (star) star.visible = true;
            });
        }
        
        console.log('✅ Main game objects restored (no restart)');
    }

    // Cleanup Level 2
    cleanup() {
        // Remove event listeners
        if (this.renderer) {
            this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown.bind(this));
            this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove.bind(this));
            this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp.bind(this));
        }
        
        // Remove objects
        if (this.wireframeCube && this.scene) {
            this.scene.remove(this.wireframeCube);
        }
        
        this.shapeChoices.forEach(shape => {
            if (shape.parent) {
                shape.parent.remove(shape);
            }
        });
        
        // Remove UI
        const elements = ['level2-indicator', 'wireframe-counter', 'wireframe-instructions'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });
        
        this.isActive = false;
        this.isInitialized = false;
    }
}

// Make Level2Manager globally available
window.Level2Manager = Level2Manager; 