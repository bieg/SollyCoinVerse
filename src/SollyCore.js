// ===================================================================================
// ==                           SOLLY CORE MODULE                                  ==
// ==                                                                             ==
// ==      Bevat de basis Solly functionaliteit:                                 ==
// ==      - Solly creatie en configuratie                                       ==
// ==      - Basis beweging en animatie                                          ==
// ==      - Camera interacties                                                   ==
// ==      - Drag & drop functionaliteit                                         ==
// ===================================================================================

class SollyCore {
  constructor() {
    this.solly1 = null;
    this.solly2 = null;
    this.isDragging = false;
    this.dragStartPosition = null;
    this.dragStartMousePosition = null;
    this.canSollyMove = false;
    this.isPaused = false;
    
    // Debug configuratie
    this.DEBUG = window.DEBUG || false;
  }

  debugLog(...args) {
    if (this.DEBUG) {
      console.log(...args);
    }
  }

  // Hoofdfunctie voor Solly creatie
  createSollys(scene) {
    this.debugLog('🌟 Creating Sollys...');
    
    // Solly1 (Wit) - hoofdspeler
    this.solly1 = this.createSolly1(scene);
    
    // Maak globaal beschikbaar
    window.solly1 = this.solly1;
    window.sollyCore = this;
    
    // Setup camera en drag listeners
    this.setupCamera();
    this.setupDragListeners();
    
    this.debugLog('✅ Sollys created successfully');
  }

  createSolly1(scene) {
    const solly1 = this.createSolly(60, false, 0xFFFFFF);
    
    // Warm wit materiaal met maximale helderheid
    const whiteMat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      toneMapped: false
    });
    
    // Cleanup oude materialen
    if (Array.isArray(solly1.material)) {
      solly1.material.forEach(m => m.dispose());
    } else if (solly1.material) {
      solly1.material.dispose();
    }
    
    solly1.material = whiteMat;
    solly1.castShadow = false;
    solly1.receiveShadow = false;
    
    // User data en metadata
    solly1.userData.isSolly1 = true;
    solly1.userData.shape = 'piramide';
    solly1.name = 'Solly1';
    solly1.scale.set(3.4, 3.4, 3.4);
    solly1.visible = true;
    
    // Collider voor interactie
    this.addSollyCollider(solly1);
    
    scene.add(solly1);
    return solly1;
  }

  addSollyCollider(solly) {
    if (!solly.getObjectByName('Solly1Collider')) {
      const pickGeom = new THREE.SphereGeometry(600, 24, 24);
      const pickMat = new THREE.MeshBasicMaterial({ visible: false });
      const collider = new THREE.Mesh(pickGeom, pickMat);
      collider.name = 'Solly1Collider';
      collider.userData.isSolly1Collider = true;
      solly.add(collider);
      window.solly1Collider = collider;
    }
  }

  createSolly(size, isSpecial, color) {
    const geometry = new THREE.ConeGeometry(size, size * 2, 4);
    const material = new THREE.MeshBasicMaterial({ color: color });
    return new THREE.Mesh(geometry, material);
  }

  setupCamera() {
    if (window.camera) {
      window.camera.position.set(0, 0, 2000);
      window.camera.lookAt(0, 0, 0);
    }
  }

  setupDragListeners() {
    if (window.renderer && this.solly1) {
      this.addDragListeners();
    }
  }

  addDragListeners() {
    const canvas = window.renderer.domElement;
    
    canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
    
    this.debugLog('🖱️ Drag listeners added');
  }

  onPointerDown(event) {
    if (!this.solly1 || this.isPaused) return;
    
    const rect = window.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, window.camera);
    
    const intersects = raycaster.intersectObject(this.solly1, true);
    
    if (intersects.length > 0) {
      this.startDrag(event);
    }
  }

  onPointerMove(event) {
    if (this.isDragging) {
      this.onDragMove(event);
    }
  }

  onPointerUp(event) {
    if (this.isDragging) {
      this.onDragEnd(event);
    }
  }

  startDrag(event) {
    this.isDragging = true;
    this.dragStartPosition = this.solly1.position.clone();
    this.dragStartMousePosition = new THREE.Vector2(event.clientX, event.clientY);
    
    // Visual feedback
    this.solly1.material.color.setHex(0xFFFF00);
    
    this.debugLog('🎯 Drag started');
  }

  onDragMove(event) {
    if (!this.isDragging || !this.solly1) return;
    
    const rect = window.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    // Bereken nieuwe positie
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, window.camera);
    
    // Project op een vlak op z=0
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    
    // Beperk beweging tot redelijke grenzen
    const maxDistance = 5000;
    const distance = this.dragStartPosition.distanceTo(intersection);
    
    if (distance < maxDistance) {
      this.solly1.position.copy(intersection);
    }
  }

  onDragEnd(event) {
    this.isDragging = false;
    
    // Reset materiaal
    this.solly1.material.color.setHex(0xFFFFFF);
    
    // Trigger collision check
    this.checkForCollisions();
    
    this.debugLog('🎯 Drag ended');
  }

  checkForCollisions() {
    // Implementatie voor collision detection
    // Wordt uitgebreid in CollisionManager
  }

  // Public methods
  getSolly1() {
    return this.solly1;
  }

  setPaused(paused) {
    this.isPaused = paused;
  }

  setCanMove(canMove) {
    this.canSollyMove = canMove;
  }

  // Cleanup
  cleanup() {
    if (this.solly1) {
      // Remove event listeners
      const canvas = window.renderer?.domElement;
      if (canvas) {
        canvas.removeEventListener('pointerdown', this.onPointerDown);
        canvas.removeEventListener('pointermove', this.onPointerMove);
        canvas.removeEventListener('pointerup', this.onPointerUp);
      }
    }
  }
}

// Maak globaal beschikbaar
window.SollyCore = SollyCore; 