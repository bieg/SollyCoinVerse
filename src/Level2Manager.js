// Level2Manager.js - Level 2: De Cubus (Wireframe Kubus Puzzle)

// @ts-check

// Global THREE.js declaration
/** @type {any} */
// @ts-ignore - THREE is loaded globally in browser
const THREE = globalThis.THREE;

/**
 * @typedef {Object} PanelConfig
 * @property {number} baseX - Base X position
 * @property {number} baseY - Base Y position
 * @property {number} shapeSize - Size of shapes
 * @property {number} gapX - X gap between shapes
 * @property {number} gapY - Y gap between shapes
 * @property {number} columns - Number of columns
 * @property {number} rows - Number of rows
 */

/**
 * @typedef {Object} GameManagerType
 * @property {Function} getCurrentShape - Get current shape function
 */

/**
 * @typedef {Object} GlobalWindow
 * @property {any} scene
 * @property {any} camera  
 * @property {any} renderer
 * @property {any} controls
 * @property {GameManagerType} gameManager
 * @property {Function} Level2Manager
 */

/** @type {GlobalWindow & Window} */
const globalWindow = /** @type {any} */ (window);

class Level2Manager {
    constructor() {
        this.isActive = false;
        this.isInitialized = false;
        /** @type {any} */
        this.scene = null;
        /** @type {any} */
        this.camera = null;
        /** @type {any} */
        this.renderer = null;
        /** @type {any} */
        this.controls = null;
        
        // Wireframe kubus properties
        /** @type {any} */
        this.wireframeCube = null;
        /** @type {any[]} */
        this.cornerPoints = [];
        /** @type {any[]} */
        this.shapeChoices = [];
        this.isDragging = false;
        /** @type {any} */
        this.draggedShape = null;
        /** @type {any} */
        this.dragOffset = null;
        this.placedShapes = 0;
        this.totalCorners = 8;
        this.levelCompleted = false;
        
        // Raycaster voor drag & drop
        /** @type {any} */
        this.raycaster = null;
        /** @type {any} */
        this.mouse = null;
        
        // Performance tracking
        /** @type {number|null} */
        this.animationFrameId = null;
        this.lastFrameTime = 0;
        
        // Event listener bindings voor proper cleanup
        this.boundPointerDown = this.onPointerDown.bind(this);
        this.boundPointerMove = this.onPointerMove.bind(this);
        this.boundPointerUp = this.onPointerUp.bind(this);
        
        console.log('🎯 Level2Manager: De Cubus - Initialized');
    }

    // Start Level 2
    startLevel() {
        if (this.isActive) {
            console.log('⚠️ Level 2 is al actief');
            return;
        }
        
        try {
            console.log('🚀 Starting Level 2: De Cubus');
            this.isActive = true;
            
            // Initialize THREE objects safely
            this.initializeTHREE();
            
            // Get globals from main game
            this.scene = globalWindow.scene || null;
            this.camera = globalWindow.camera || null;
            this.renderer = globalWindow.renderer || null;
            this.controls = globalWindow.controls || null;
            
            if (!this.scene || !this.camera || !this.renderer) {
                throw new Error('Scene, camera or renderer not available');
            }

            // Setup Level 2
            this.setupLevel2();
            
            console.log('✅ Level 2: De Cubus started successfully');
        } catch (error) {
            console.error('❌ Error starting Level 2:', error);
            this.isActive = false;
            throw error;
        }
    }
    
    // Initialize THREE objects safely
    initializeTHREE() {
        try {
            if (typeof THREE !== 'undefined') {
                this.dragOffset = new THREE.Vector3();
                this.raycaster = new THREE.Raycaster();
                this.mouse = new THREE.Vector2();
                console.log('✅ THREE objects initialized');
            } else {
                throw new Error('THREE.js not available');
            }
        } catch (error) {
            console.error('❌ Error initializing THREE objects:', error);
            throw error;
        }
    }

    // Setup Level 2 environment
    setupLevel2() {
        try {
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
        } catch (error) {
            console.error('❌ Error in setupLevel2:', error);
            throw error;
        }
    }

    // Cleanup old UI elements
    cleanupOldUI() {
        const elementsToRemove = [
            'kaboom-counter',
            'brutal-terminal',
            'level2-indicator', 
            'wireframe-counter', 
            'wireframe-instructions'
        ];
        
        elementsToRemove.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (id === 'kaboom-counter') {
                    element.style.display = 'none';
                } else {
                    element.remove();
                }
            }
        });
    }

    // Cleanup old game objects
    cleanupOldObjects() {
        if (!this.scene) return;
        
        /** @type {any[]} */
        const objectsToRemove = [];
        this.scene.traverse(/** @param {any} obj */ obj => {
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
        const uiElements = [
            {
                id: 'level2-indicator',
                content: '🎯 LEVEL 2: De Cubus',
                style: {
                    top: '20px',
                    left: '20px',
                    background: 'linear-gradient(135deg, #8A2BE2, #4B0082)',
                    border: '2px solid #9370DB'
                }
            },
            {
                id: 'wireframe-counter',
                content: `🔗 Geplaatst: ${this.placedShapes}/${this.totalCorners}`,
                style: {
                    top: '20px',
                    right: '20px',
                    background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                    border: '2px solid #FF8E53'
                }
            },
            {
                id: 'wireframe-instructions',
                content: '🎯 Sleep de shapes naar de hoekpunten van de kubus!',
                style: {
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0, 0, 0, 0.8)',
                    border: '2px solid #8A2BE2'
                }
            }
        ];

        uiElements.forEach(element => {
            this.createUIElement(element);
        });
    }

    // Create individual UI element
    /**
     * @param {Object} config - UI element configuration
     * @param {string} config.id - Element ID
     * @param {string} config.content - Element content
     * @param {Object} config.style - Style object
     */
    createUIElement(config) {
        const element = document.createElement('div');
        element.id = config.id;
        
        const baseStyle = `
            position: fixed;
            padding: 15px 25px;
            color: white;
            border-radius: 10px;
            font-family: 'Open Sans', sans-serif;
            font-weight: bold;
            font-size: 18px;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        `;
        
        element.style.cssText = baseStyle + this.styleObjectToString(config.style);
        element.innerHTML = config.content;
        
        document.body.appendChild(element);
    }

    // Convert style object to CSS string
    /**
     * @param {Object} styleObj - Style object with CSS properties
     * @returns {string} CSS string
     */
    styleObjectToString(styleObj) {
        return Object.entries(styleObj)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ');
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

        // Rotate cube: 45 degrees around Y-axis, then 20 degrees up
        this.wireframeCube.rotation.y = Math.PI / 4; // 45 degrees
        this.wireframeCube.rotation.x = Math.PI / 9; // 20 degrees up

        this.scene.add(this.wireframeCube);
    }

    // Create corner point
    /**
     * @param {number} index - Corner index
     * @param {number[]} position - Position array [x, y, z]
     * @param {number} cubeSize - Size of the cube
     * @returns {any} Corner point group
     */
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
        const currentShape = (globalWindow.gameManager && globalWindow.gameManager.getCurrentShape) ? 
            globalWindow.gameManager.getCurrentShape() : 'piramide';
        
        // Create 8 shape choices
        const shapes = Array(8).fill(currentShape);
        
        // Panel configuration
        const panelConfig = {
            baseX: -1600,
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
    /**
     * @param {string} shapeType - Type of shape
     * @param {number} index - Shape index
     * @param {PanelConfig} config - Configuration object
     * @returns {any} Shape choice group
     */
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
    /**
     * @param {PanelConfig} config - Panel configuration
     */
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
            color: 0xFF6B6B,
            linewidth: 4
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
        this.renderer.domElement.addEventListener('pointerdown', this.boundPointerDown);
        this.renderer.domElement.addEventListener('pointermove', this.boundPointerMove);
        this.renderer.domElement.addEventListener('pointerup', this.boundPointerUp);
    }

    // Pointer down event
    /**
     * @param {PointerEvent} event - Pointer event
     */
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
    /**
     * @param {PointerEvent} event - Pointer event
     */
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
    /**
     * @param {PointerEvent} event - Pointer event
     */
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
    /**
     * @param {PointerEvent} event - Pointer event
     */
    updateMousePosition(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    // Find shape choice parent
    /**
     * @param {any} object - THREE.js object
     * @returns {any} Shape choice parent or null
     */
    findShapeChoiceParent(object) {
        let parent = object;
        while (parent && !parent.userData.isShapeChoice) {
            parent = parent.parent;
        }
        return parent;
    }

    // Start dragging
    /**
     * @param {any} shapeChoice - Shape choice object
     * @param {any} hitPoint - Hit point
     */
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
    /**
     * @param {any} position - Position to check
     * @returns {any} Nearest corner or null
     */
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
    /**
     * @param {any} shapeChoice - Shape choice object
     * @param {any} corner - Corner object
     */
    placeShapeOnCorner(shapeChoice, corner) {
        try {
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
        } catch (error) {
            console.error('❌ Error placing shape:', error);
        }
    }

    // Return shape to original position
    /**
     * @param {any} shapeChoice - Shape choice object
     */
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

    // Start whirl effect - OPTIMIZED VERSION
    startWhirlEffect() {
        const startTime = performance.now();
        const duration = 3000; // 3 seconds
        
        // Cancel any existing animation
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        const animateWhirl = (/** @type {number} */ currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 1) {
                // Optimized rotation effect
                const rotationSpeed = progress * Math.PI * 4;
                this.wireframeCube.rotation.x = rotationSpeed;
                this.wireframeCube.rotation.y = rotationSpeed;
                this.wireframeCube.rotation.z = rotationSpeed * 0.5;
                
                // Optimized scale effect
                const scale = 1 + Math.sin(progress * Math.PI * 8) * 0.3;
                this.wireframeCube.scale.setScalar(scale);
                
                // Optimized color pulse effect - only update every few frames
                if (currentTime - this.lastFrameTime > 16) { // ~60fps
                    this.wireframeCube.children.forEach(/** @param {any} child */ child => {
                        if (child.material && child.material.color) {
                            const hue = (progress * 360) % 360;
                            child.material.color.setHSL(hue / 360, 1, 0.5);
                        }
                    });
                    this.lastFrameTime = currentTime;
                }
                
                this.animationFrameId = requestAnimationFrame(animateWhirl);
            } else {
                // Level completed - remove cube
                this.finishLevel();
            }
        };
        
        this.animationFrameId = requestAnimationFrame(animateWhirl);
    }

    // Finish level
    finishLevel() {
        try {
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
        } catch (error) {
            console.error('❌ Error finishing level:', error);
        }
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
            if (message.parentNode) {
                message.remove();
            }
        }, 3000);
    }

    // Return to main game
    returnToMainGame() {
        try {
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
            
            // Restart main game objects
            this.restartMainGame();
            
            this.isActive = false;
            this.isInitialized = false;
        } catch (error) {
            console.error('❌ Error returning to main game:', error);
        }
    }

    // Restart main game objects
    restartMainGame() {
        if (!this.scene) return;
        
        try {
            // Re-add galaxy components
            if (typeof addGalaxyShells === 'function') addGalaxyShells(this.scene);
            if (typeof addGalaxyStars === 'function') addGalaxyStars(this.scene);
            if (typeof addSollySun === 'function') addSollySun(this.scene);
            
            // Re-add game objects
            if (typeof addPlanets === 'function') addPlanets(this.scene);
            if (typeof addSollys === 'function') addSollys(this.scene);
            if (typeof addWhiteStars === 'function') addWhiteStars(this.scene);
            if (typeof addSolly1AndSolly2 === 'function') addSolly1AndSolly2(this.scene);
        } catch (error) {
            console.error('❌ Error restarting main game:', error);
        }
    }

    // Cleanup Level 2 - IMPROVED VERSION
    cleanup() {
        try {
            // Cancel any running animations
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            
            // Remove event listeners using bound functions
            if (this.renderer) {
                this.renderer.domElement.removeEventListener('pointerdown', this.boundPointerDown);
                this.renderer.domElement.removeEventListener('pointermove', this.boundPointerMove);
                this.renderer.domElement.removeEventListener('pointerup', this.boundPointerUp);
            }
            
            // Remove objects
            if (this.wireframeCube && this.scene) {
                this.scene.remove(this.wireframeCube);
                this.wireframeCube = null;
            }
            
            // Clear arrays
            this.shapeChoices.forEach(shape => {
                if (shape.parent) {
                    shape.parent.remove(shape);
                }
            });
            this.shapeChoices = [];
            this.cornerPoints = [];
            
            // Remove UI
            const elements = ['level2-indicator', 'wireframe-counter', 'wireframe-instructions'];
            elements.forEach(id => {
                const element = document.getElementById(id);
                if (element) element.remove();
            });
            
            // Reset state
            this.isActive = false;
            this.isInitialized = false;
            this.isDragging = false;
            this.draggedShape = null;
            this.placedShapes = 0;
            this.levelCompleted = false;
            
            console.log('🧹 Level2Manager cleanup completed');
        } catch (error) {
            console.error('❌ Error during cleanup:', error);
        }
    }
}

// Make Level2Manager globally available
globalWindow.Level2Manager = Level2Manager; 