// ===================================================================================
// ==                        COLLISION MANAGER MODULE                              ==
// ==                                                                             ==
// ==      Bevat alle collision en explosie functionaliteit:                     ==
// ==      - Collision detection tussen Sollys                                   ==
// ==      - Explosie effecten en animaties                                      ==
// ==      - Particle systemen                                                   ==
// ==      - Screen shake en camera effecten                                     ==
// ===================================================================================

class CollisionManager {
  constructor() {
    this.collisionDetected = false;
    this.explosionParticles = [];
    this.screenShakeActive = false;
    this.DEBUG = window.DEBUG || false;
  }

  debugLog(...args) {
    if (this.DEBUG) {
      console.log(...args);
    }
  }

  // Hoofdfunctie voor collision trigger
  triggerCollision() {
    if (this.collisionDetected) return;
    
    this.debugLog('💥 Collision triggered!');
    this.collisionDetected = true;
    
    // Pauzeer beweging
    if (window.sollyCore) {
      window.sollyCore.setCanMove(false);
    }
    
    // Start explosie animatie
    this.createCollisionExplosion();
    
    // Start camera animatie naar collision
    this.startCameraAnimationToCollision();
    
    // Update game state
    this.updateGameState();
  }

  createCollisionExplosion() {
    this.debugLog('💥 Starting collision explosion animation!');
    
    const solly1 = window.solly1;
    if (!solly1) return;
    
    // Bereken explosie positie
    const explosionPos = solly1.position.clone();
    
    // Maak meerdere explosie lagen voor spectaculair effect
    this.createExplosionLayer(explosionPos, 0xFFD700, 50, 800, 800); // Gouden kern
    this.createExplosionLayer(explosionPos, 0xFF4500, 100, 1200, 600); // Oranje explosie
    this.createExplosionLayer(explosionPos, 0xFF0000, 150, 1600, 400); // Rode schokgolf
    
    // Voeg particle effect toe
    this.createExplosionParticles(explosionPos);
    
    // Voeg screen shake effect toe
    this.createScreenShake();
  }

  createExplosionLayer(position, color, delay, maxScale, duration) {
    setTimeout(() => {
      const geo = new THREE.SphereGeometry(1, 32, 32);
      const mat = new THREE.MeshBasicMaterial({ 
        color: color, 
        transparent: true, 
        opacity: 0.9, 
        blending: THREE.AdditiveBlending 
      });
      const explosion = new THREE.Mesh(geo, mat);
      explosion.position.copy(position);
      window.scene.add(explosion);

      const start = performance.now();
      const startScale = 10;
      const endScale = maxScale;
      
      const animate = () => {
        const t = (performance.now() - start) / duration;
        if (t >= 1) {
          window.scene.remove(explosion);
          return;
        }
        
        // Easing functie voor natuurlijke explosie
        const ease = 1 - Math.pow(1 - t, 2);
        const scale = THREE.MathUtils.lerp(startScale, endScale, ease);
        explosion.scale.setScalar(scale);
        explosion.material.opacity = 0.9 * (1 - ease);
        
        requestAnimationFrame(animate);
      };
      animate();
    }, delay);
  }

  createExplosionParticles(position) {
    const particleCount = 50;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const geo = new THREE.SphereGeometry(0.5, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ 
        color: Math.random() > 0.5 ? 0xFFD700 : 0xFF4500, 
        transparent: true, 
        opacity: 1.0 
      });
      const particle = new THREE.Mesh(geo, mat);
      
      // Willekeurige richting en snelheid
      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();
      
      const speed = 50 + Math.random() * 100;
      particle.velocity = direction.multiplyScalar(speed);
      particle.position.copy(position);
      
      window.scene.add(particle);
      particles.push(particle);
    }
    
    // Animeer particles
    const start = performance.now();
    const duration = 2000;
    
    const animateParticles = () => {
      const t = (performance.now() - start) / duration;
      if (t >= 1) {
        particles.forEach(p => window.scene.remove(p));
        return;
      }
      
      particles.forEach(particle => {
        particle.position.add(particle.velocity.clone().multiplyScalar(0.016));
        particle.material.opacity = 1.0 * (1 - t);
        particle.scale.setScalar(1 - t * 0.5);
      });
      
      requestAnimationFrame(animateParticles);
    };
    animateParticles();
  }

  createScreenShake() {
    if (this.screenShakeActive) return;
    
    this.screenShakeActive = true;
    const originalPosition = window.camera.position.clone();
    const shakeIntensity = 50;
    const shakeDuration = 1000;
    const startTime = performance.now();
    
    const shake = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / shakeDuration;
      
      if (progress >= 1) {
        window.camera.position.copy(originalPosition);
        this.screenShakeActive = false;
        return;
      }
      
      const intensity = shakeIntensity * (1 - progress);
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity
      );
      
      window.camera.position.copy(originalPosition).add(offset);
      requestAnimationFrame(shake);
    };
    
    shake();
  }

  startCameraAnimationToCollision() {
    if (!window.camera || !window.solly1) return;
    
    const startPosition = window.camera.position.clone();
    const targetPosition = window.solly1.position.clone().add(new THREE.Vector3(0, 200, 800));
    const duration = 1500;
    const startTime = performance.now();
    
    const animateCamera = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        window.camera.position.copy(targetPosition);
        window.camera.lookAt(window.solly1.position);
        return;
      }
      
      // Smooth easing
      const ease = 1 - Math.pow(1 - progress, 3);
      window.camera.position.lerpVectors(startPosition, targetPosition, ease);
      window.camera.lookAt(window.solly1.position);
      
      requestAnimationFrame(animateCamera);
    };
    
    animateCamera();
  }

  // Mini Solly collision detection
  checkMiniSollyCollision() {
    if (!window.solly1 || !window.miniSollys) return;
    
    const solly1Position = window.solly1.position;
    const collisionDistance = 300;
    
    window.miniSollys.forEach((miniSolly, index) => {
      if (!miniSolly || !miniSolly.visible) return;
      
      const distance = solly1Position.distanceTo(miniSolly.position);
      
      if (distance < collisionDistance) {
        this.handleMiniSollyCollision(miniSolly, index);
      }
    });
  }

  handleMiniSollyCollision(miniSolly, index) {
    this.debugLog(`💥 Mini Solly collision detected at index ${index}`);
    
    // Verberg de mini Solly
    miniSolly.visible = false;
    
    // Maak explosie effect
    this.createMiniExplosion(miniSolly.position);
    
    // Update game state
    this.updateGameState();
    
    // Trigger portal activatie na meerdere collisions
    this.checkPortalActivation();
  }

  createMiniExplosion(position) {
    const particleCount = 20;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const geo = new THREE.SphereGeometry(0.3, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ 
        color: 0xFFD700, 
        transparent: true, 
        opacity: 1.0 
      });
      const particle = new THREE.Mesh(geo, mat);
      
      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();
      
      const speed = 30 + Math.random() * 50;
      particle.velocity = direction.multiplyScalar(speed);
      particle.position.copy(position);
      
      window.scene.add(particle);
      particles.push(particle);
    }
    
    const start = performance.now();
    const duration = 1500;
    
    const animateParticles = () => {
      const t = (performance.now() - start) / duration;
      if (t >= 1) {
        particles.forEach(p => window.scene.remove(p));
        return;
      }
      
      particles.forEach(particle => {
        particle.position.add(particle.velocity.clone().multiplyScalar(0.016));
        particle.material.opacity = 1.0 * (1 - t);
        particle.scale.setScalar(1 - t * 0.3);
      });
      
      requestAnimationFrame(animateParticles);
    };
    animateParticles();
  }

  updateGameState() {
    // Update kaboom count
    if (window.gameManager) {
      window.gameManager.incrementKaboomCount();
    }
    
    // Update sollys count (geel)
    if (window.gameManager) {
      const currentGeel = window.gameManager.getSollysValue('geel');
      window.gameManager.updateGameValue('sollys', 'geel', currentGeel + 1);
    }
  }

  checkPortalActivation() {
    // Check of er genoeg collisions zijn voor portal activatie
    if (window.gameManager) {
      const kaboomCount = window.gameManager.getKaboomCount();
      if (kaboomCount >= 5 && window.activatePortal) {
        window.activatePortal();
      }
    }
  }

  // Public methods
  resetCollision() {
    this.collisionDetected = false;
  }

  isCollisionActive() {
    return this.collisionDetected;
  }

  // Cleanup
  cleanup() {
    this.explosionParticles.forEach(particle => {
      if (particle && window.scene) {
        window.scene.remove(particle);
      }
    });
    this.explosionParticles = [];
  }
}

// Maak globaal beschikbaar
window.CollisionManager = CollisionManager; 