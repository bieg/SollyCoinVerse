// ===================================================================================
// ==                           SOLLYVERSE PERFORMANCE MANAGER                     ==
// ==                                                                             ==
// ==      Performance optimalisaties en monitoring:                             ==
// ==      - Object pooling                                                      ==
// ==      - Level of Detail (LOD) system                                       ==
// ==      - Frustum culling                                                    ==
// ==      - Geometry instancing                                                ==
// ==      - Memory management                                                  ==
// ===================================================================================

export class PerformanceManager {
  constructor() {
    this.stats = {
      fps: 0,
      frameTime: 0,
      objectCount: 0,
      drawCalls: 0,
      memoryUsage: 0,
      lastFrameTime: 0
    };
    
    this.settings = {
      enableLOD: true,
      enableFrustumCulling: true,
      enableObjectPooling: true,
      enableInstancing: true,
      maxVisibleObjects: 2000,
      cullDistance: 15000,
      lodDistance: 8000
    };
    
    this.objectPools = new Map();
    this.visibleObjects = new Set();
    this.lodLevels = new Map();
    
    this.initPerformanceMonitoring();
    console.log('⚡ PerformanceManager initialized');
  }

  // Performance monitoring
  initPerformanceMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const updateStats = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      this.stats.frameTime = deltaTime;
      this.stats.fps = Math.round(1000 / deltaTime);
      this.stats.lastFrameTime = currentTime;
      
      // Update object count
      try {
        if (window.scene) {
          let count = 0;
          window.scene.traverse(obj => {
            if (obj.isMesh) count++;
          });
          this.stats.objectCount = count;
        } else if (this.universeManager) {
          const scene = this.universeManager.getScene();
          if (scene) {
            let count = 0;
            scene.traverse(obj => {
              if (obj.isMesh) count++;
            });
            this.stats.objectCount = count;
          }
        }
      } catch (error) {
        console.warn("⚠️ Error counting objects:", error);
        this.stats.objectCount = 0;
      }
      
      // Update draw calls (approximation)
      if (window.renderer) {
        this.stats.drawCalls = this.stats.objectCount; // Simplified
      } else if (this.universeManager) {
        const renderer = this.universeManager.getRenderer();
        if (renderer) {
          this.stats.drawCalls = this.stats.objectCount; // Simplified
        }
      }
      
      lastTime = currentTime;
      frameCount++;
      
      // Log performance every 60 frames
      if (frameCount % 60 === 0) {
        this.logPerformanceStats();
      }
      
      requestAnimationFrame(updateStats);
    };
    
    requestAnimationFrame(updateStats);
  }

  logPerformanceStats() {
    // Performance stats logging disabled
  }

  // Object pooling voor herbruikbare objecten
  createObjectPool(type, createFunction, maxSize = 100) {
    const pool = {
      objects: [],
      active: new Set(),
      create: createFunction,
      maxSize: maxSize
    };
    
    this.objectPools.set(type, pool);
    return pool;
  }

  getFromPool(type) {
    const pool = this.objectPools.get(type);
    if (!pool) return null;
    
    let obj;
    if (pool.objects.length > 0) {
      obj = pool.objects.pop();
    } else {
      obj = pool.create();
    }
    
    pool.active.add(obj);
    return obj;
  }

  returnToPool(type, obj) {
    const pool = this.objectPools.get(type);
    if (!pool || !pool.active.has(obj)) return;
    
    pool.active.delete(obj);
    
    if (pool.objects.length < pool.maxSize) {
      // Reset object properties
      obj.position.set(0, 0, 0);
      obj.rotation.set(0, 0, 0);
      obj.scale.set(1, 1, 1);
      obj.visible = false;
      
      pool.objects.push(obj);
    } else {
      // Dispose if pool is full
      this.disposeObject(obj);
    }
  }

  // Level of Detail system
  createLODLevels(object, distances = [1000, 3000, 8000]) {
    const lod = {
      object: object,
      levels: [],
      currentLevel: 0
    };
    
    distances.forEach((distance, index) => {
      const level = {
        distance: distance,
        geometry: this.createSimplifiedGeometry(object.geometry, index),
        material: object.material.clone()
      };
      lod.levels.push(level);
    });
    
    this.lodLevels.set(object, lod);
    return lod;
  }

  createSimplifiedGeometry(originalGeometry, level) {
    // Simplified geometry based on level
    const reductionFactor = Math.pow(2, level + 1);
    
    if (originalGeometry.type === 'SphereGeometry') {
      const segments = Math.max(8, Math.floor(originalGeometry.parameters.widthSegments / reductionFactor));
      return new THREE.SphereGeometry(
        originalGeometry.parameters.radius,
        segments,
        segments
      );
    } else if (originalGeometry.type === 'TetrahedronGeometry') {
      return new THREE.TetrahedronGeometry(
        originalGeometry.parameters.radius,
        Math.max(0, level - 1)
      );
    }
    
    return originalGeometry;
  }

  updateLOD(camera) {
    if (!this.settings.enableLOD) return;
    
    this.lodLevels.forEach((lod, object) => {
      if (!object.visible) return;
      
      const distance = camera.position.distanceTo(object.position);
      let newLevel = 0;
      
      for (let i = 0; i < lod.levels.length; i++) {
        if (distance > lod.levels[i].distance) {
          newLevel = i;
        }
      }
      
      if (newLevel !== lod.currentLevel) {
        object.geometry = lod.levels[newLevel].geometry;
        lod.currentLevel = newLevel;
      }
    });
  }

  // Frustum culling
  updateFrustumCulling(camera) {
    if (!this.settings.enableFrustumCulling) return;
    
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(matrix);
    
    this.visibleObjects.clear();
    
    const scene = window.scene || (this.universeManager ? this.universeManager.getScene() : null);
    
    if (scene) {
      scene.traverse(obj => {
        if (obj.isMesh && obj.visible) {
          const distance = camera.position.distanceTo(obj.position);
          
          // Distance culling
          if (distance > this.settings.cullDistance) {
            obj.visible = false;
            return;
          }
          
          // Frustum culling
          if (frustum.containsPoint(obj.position)) {
            this.visibleObjects.add(obj);
            obj.visible = true;
          } else {
            obj.visible = false;
          }
        }
      });
    }
  }

  // Geometry instancing voor identieke objecten
  createInstancedMesh(geometry, material, count) {
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    instancedMesh.count = 0;
    return instancedMesh;
  }

  addInstance(instancedMesh, position, rotation, scale) {
    if (instancedMesh.count >= instancedMesh.instanceMatrix.count) return false;
    
    const matrix = new THREE.Matrix4();
    matrix.compose(position, rotation, scale);
    instancedMesh.setMatrixAt(instancedMesh.count, matrix);
    instancedMesh.count++;
    
    return true;
  }

  // Memory management
  disposeObject(obj) {
    if (obj.geometry) {
      obj.geometry.dispose();
    }
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(mat => mat.dispose());
      } else {
        obj.material.dispose();
      }
    }
  }

  cleanupUnusedObjects() {
    // Cleanup object pools
    this.objectPools.forEach((pool, type) => {
      pool.objects.forEach(obj => {
        this.disposeObject(obj);
      });
      pool.objects.length = 0;
    });
    
    // Cleanup LOD levels
    this.lodLevels.forEach((lod, object) => {
      lod.levels.forEach(level => {
        if (level.geometry !== object.geometry) {
          level.geometry.dispose();
        }
      });
    });
  }

  // Performance settings
  setPerformanceMode(mode) {
    switch (mode) {
      case 'low':
        this.settings.maxVisibleObjects = 500;
        this.settings.cullDistance = 8000;
        this.settings.lodDistance = 4000;
        break;
      case 'medium':
        this.settings.maxVisibleObjects = 1000;
        this.settings.cullDistance = 12000;
        this.settings.lodDistance = 6000;
        break;
      case 'high':
        this.settings.maxVisibleObjects = 2000;
        this.settings.cullDistance = 15000;
        this.settings.lodDistance = 8000;
        break;
    }
  }

  // Batch updates voor betere performance
  batchUpdate(updates) {
    const startTime = performance.now();
    
    updates.forEach(update => {
      if (typeof update === 'function') {
        update();
      }
    });
    
    const endTime = performance.now();
    console.log(`⚡ Batch update completed in ${(endTime - startTime).toFixed(2)}ms`);
  }

  // Initialize method for module compatibility
  async initialize() {
    console.log("⚡ PerformanceManager initialized");
    return Promise.resolve();
  }
}

// Export voor gebruik in andere modules
window.PerformanceManager = PerformanceManager; 