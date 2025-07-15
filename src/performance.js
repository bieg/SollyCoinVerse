// ===================================================================================
// ==                        PERFORMANCE MANAGER MODULE                           ==
// ==                                                                             ==
// ==      Bevat alle performance optimalisaties:                                ==
// ==      - Object pooling voor particles                                       ==
// ==      - Level of Detail (LOD) system                                        ==
// ==      - Frustum culling                                                     ==
// ==      - Memory management                                                   ==
// ===================================================================================

class PerformanceManager {
  constructor() {
    this.objectPools = {};
    this.lodLevels = {};
    this.frustumCuller = null;
    this.memoryMonitor = null;
    this.isActive = false;
    this.DEBUG = window.DEBUG || false;
  }

  debugLog(...args) {
    if (this.DEBUG) {
      console.log('[PerformanceManager]', ...args);
    }
  }

  // Initialize performance manager
  initialize() {
    try {
      this.debugLog('⚡ Initializing PerformanceManager...');
      
      this.setupObjectPools();
      this.setupLODSystem();
      this.setupFrustumCulling();
      this.setupMemoryMonitoring();
      
      this.isActive = true;
      this.debugLog('✅ PerformanceManager initialized successfully');
      
      return true;
    } catch (error) {
      this.debugLog('❌ PerformanceManager initialization failed:', error);
      return false;
    }
  }

  // Setup object pools for frequently created/destroyed objects
  setupObjectPools() {
    this.debugLog('🏊 Setting up object pools...');
    
    // Particle pool
    this.objectPools.particles = {
      active: [],
      inactive: [],
      maxSize: 100,
      create: () => {
        const geo = new THREE.SphereGeometry(0.5, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ 
          color: 0xFFD700, 
          transparent: true, 
          opacity: 1.0 
        });
        return new THREE.Mesh(geo, mat);
      },
      reset: (particle) => {
        particle.position.set(0, 0, 0);
        particle.scale.setScalar(1);
        particle.material.opacity = 1.0;
        particle.velocity = null;
      }
    };
    
    // Explosion pool
    this.objectPools.explosions = {
      active: [],
      inactive: [],
      maxSize: 20,
      create: () => {
        const geo = new THREE.SphereGeometry(1, 32, 32);
        const mat = new THREE.MeshBasicMaterial({ 
          color: 0xFF4500, 
          transparent: true, 
          opacity: 0.9, 
          blending: THREE.AdditiveBlending 
        });
        return new THREE.Mesh(geo, mat);
      },
      reset: (explosion) => {
        explosion.position.set(0, 0, 0);
        explosion.scale.setScalar(1);
        explosion.material.opacity = 0.9;
      }
    };
    
    this.debugLog('✅ Object pools setup complete');
  }

  // Get object from pool
  getFromPool(poolName) {
    const pool = this.objectPools[poolName];
    if (!pool) {
      throw new Error(`Pool '${poolName}' not found`);
    }
    
    let object;
    if (pool.inactive.length > 0) {
      object = pool.inactive.pop();
      pool.reset(object);
    } else {
      object = pool.create();
    }
    
    pool.active.push(object);
    return object;
  }

  // Return object to pool
  returnToPool(poolName, object) {
    const pool = this.objectPools[poolName];
    if (!pool) {
      throw new Error(`Pool '${poolName}' not found`);
    }
    
    const index = pool.active.indexOf(object);
    if (index > -1) {
      pool.active.splice(index, 1);
    }
    
    if (pool.inactive.length < pool.maxSize) {
      pool.inactive.push(object);
    } else {
      // Dispose if pool is full
      if (object.geometry) object.geometry.dispose();
      if (object.material) object.material.dispose();
    }
  }

  // Setup Level of Detail system
  setupLODSystem() {
    this.debugLog('📊 Setting up LOD system...');
    
    this.lodLevels = {
      near: { distance: 1000, detail: 'high' },
      medium: { distance: 3000, detail: 'medium' },
      far: { distance: 8000, detail: 'low' }
    };
    
    this.debugLog('✅ LOD system setup complete');
  }

  // Get LOD level for distance
  getLODLevel(distance) {
    if (distance < this.lodLevels.near.distance) {
      return this.lodLevels.near.detail;
    } else if (distance < this.lodLevels.medium.distance) {
      return this.lodLevels.medium.detail;
    } else {
      return this.lodLevels.far.detail;
    }
  }

  // Apply LOD to object
  applyLOD(object, distance) {
    const lodLevel = this.getLODLevel(distance);
    
    switch (lodLevel) {
      case 'high':
        object.visible = true;
        if (object.geometry) {
          object.geometry.detail = 32;
        }
        break;
      case 'medium':
        object.visible = true;
        if (object.geometry) {
          object.geometry.detail = 16;
        }
        break;
      case 'low':
        object.visible = true;
        if (object.geometry) {
          object.geometry.detail = 8;
        }
        break;
    }
  }

  // Setup frustum culling
  setupFrustumCulling() {
    this.debugLog('👁️ Setting up frustum culling...');
    
    this.frustumCuller = new THREE.Frustum();
    this.debugLog('✅ Frustum culling setup complete');
  }

  // Update frustum culler
  updateFrustumCuller(camera) {
    if (!this.frustumCuller) return;
    
    this.frustumCuller.setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      )
    );
  }

  // Check if object is in frustum
  isInFrustum(object) {
    if (!this.frustumCuller) return true;
    
    const box = new THREE.Box3().setFromObject(object);
    return this.frustumCuller.intersectsBox(box);
  }

  // Setup memory monitoring
  setupMemoryMonitoring() {
    this.debugLog('💾 Setting up memory monitoring...');
    
    this.memoryMonitor = {
      lastCheck: Date.now(),
      checkInterval: 30000, // 30 seconds
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      cleanupThreshold: 0.8 // 80% of max
    };
    
    this.debugLog('✅ Memory monitoring setup complete');
  }

  // Check memory usage
  checkMemoryUsage() {
    if (!this.memoryMonitor) return;
    
    const now = Date.now();
    if (now - this.memoryMonitor.lastCheck < this.memoryMonitor.checkInterval) {
      return;
    }
    
    this.memoryMonitor.lastCheck = now;
    
    // Check if memory usage is available
    if (performance.memory) {
      const usedMemory = performance.memory.usedJSHeapSize;
      const maxMemory = performance.memory.jsHeapSizeLimit;
      const memoryUsage = usedMemory / maxMemory;
      
      this.debugLog('💾 Memory usage:', (usedMemory / 1024 / 1024).toFixed(2), 'MB /', (maxMemory / 1024 / 1024).toFixed(2), 'MB');
      
      if (memoryUsage > this.memoryMonitor.cleanupThreshold) {
        this.debugLog('⚠️ High memory usage detected, triggering cleanup');
        this.performCleanup();
      }
    }
  }

  // Perform memory cleanup
  performCleanup() {
    this.debugLog('🧹 Performing memory cleanup...');
    
    // Cleanup object pools
    Object.keys(this.objectPools).forEach(poolName => {
      const pool = this.objectPools[poolName];
      const excessObjects = pool.active.length - pool.maxSize;
      
      if (excessObjects > 0) {
        for (let i = 0; i < excessObjects; i++) {
          const object = pool.active.pop();
          if (object.geometry) object.geometry.dispose();
          if (object.material) object.material.dispose();
        }
        this.debugLog(`🧹 Cleaned up ${excessObjects} objects from ${poolName} pool`);
      }
    });
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
      this.debugLog('🗑️ Forced garbage collection');
    }
  }

  // Optimize scene rendering
  optimizeScene(scene, camera) {
    if (!this.isActive) return;
    
    // Update frustum culler
    this.updateFrustumCuller(camera);
    
    // Apply LOD and culling to all objects
    scene.traverse((object) => {
      if (object.isMesh) {
        const distance = camera.position.distanceTo(object.position);
        
        // Apply LOD
        this.applyLOD(object, distance);
        
        // Apply frustum culling
        if (!this.isInFrustum(object)) {
          object.visible = false;
        }
      }
    });
    
    // Check memory usage
    this.checkMemoryUsage();
  }

  // Get performance statistics
  getStats() {
    const stats = {
      isActive: this.isActive,
      objectPools: {},
      memory: null
    };
    
    // Object pool stats
    Object.keys(this.objectPools).forEach(poolName => {
      const pool = this.objectPools[poolName];
      stats.objectPools[poolName] = {
        active: pool.active.length,
        inactive: pool.inactive.length,
        maxSize: pool.maxSize
      };
    });
    
    // Memory stats
    if (performance.memory) {
      stats.memory = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    
    return stats;
  }

  // Enable/disable performance manager
  setActive(active) {
    this.isActive = active;
    this.debugLog(`⚡ PerformanceManager ${active ? 'enabled' : 'disabled'}`);
  }

  // Cleanup resources
  cleanup() {
    this.debugLog('🧹 Cleaning up PerformanceManager...');
    
    // Cleanup object pools
    Object.keys(this.objectPools).forEach(poolName => {
      const pool = this.objectPools[poolName];
      
      // Dispose active objects
      pool.active.forEach(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) object.material.dispose();
      });
      
      // Dispose inactive objects
      pool.inactive.forEach(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) object.material.dispose();
      });
      
      pool.active = [];
      pool.inactive = [];
    });
    
    this.objectPools = {};
    this.lodLevels = {};
    this.frustumCuller = null;
    this.memoryMonitor = null;
    this.isActive = false;
  }
}

// Maak PerformanceManager globaal beschikbaar
window.PerformanceManager = PerformanceManager;

// Export voor gebruik in andere modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceManager;
} 