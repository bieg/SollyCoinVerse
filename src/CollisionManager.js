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

    // Toon direct de ShapeChoice modal na collision
    this.showShapeChoiceModal();
  }

  createCollisionExplosion() {
    this.debugLog('💥 Starting collision explosion animation!');
    
    const solly1 = window.solly1;
    if (!solly1) return;
    
    // Bereken explosie positie - gebruik de EXACTE positie van Solly1
    const explosionPos = solly1.position.clone();
    this.debugLog('💥 Explosie positie:', explosionPos);
    
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
    // Skip collision check als er een drag actief is
    if (window.solly1DragActive || window.isDragging) {
      return;
    }
    
    if (!window.miniSollys || !window.solly1) return;
    
    for (let i = 0; i < window.miniSollys.length; i++) {
      const miniSolly = window.miniSollys[i];
      if (!miniSolly) continue;
      
      // Bereken afstand tussen Solly1 en mini-Solly
      const distance = window.solly1.position.distanceTo(miniSolly.position);
      const collisionThreshold = 100; // Collision afstand
      
      if (distance < collisionThreshold) {
        this.handleMiniSollyCollision(miniSolly, i);
        break;
      }
    }
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
      
      // Na 5 collisions: activeer portal
      if (kaboomCount >= 5 && window.activatePortal) {
        window.activatePortal();
      }
    }
  }

  showShapeChoiceModal() {
    this.debugLog('🎨 Showing ShapeChoice modal after 4 collisions');
    
    // Verwijder bestaande modal als die er is
    const existingModal = document.querySelector('.shape-choice-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Maak modal HTML (zonder onclick handlers)
    const modalHTML = `
      <div class="shape-choice-modal">
        <div class="shape-choice-content">
          <h2>🎨 Kies je nieuwe vorm!</h2>
          <p>Je hebt 4 collisions bereikt! Kies hoe je verder wilt:</p>
          
          <div class="shape-options">
            <div class="shape-option" data-shape="piramide">
              <div class="shape-preview piramide-preview">🔺</div>
              <h3>Piramide</h3>
              <p>Klassieke vorm, perfecte balans</p>
            </div>
            
            <div class="shape-option" data-shape="vierkant">
              <div class="shape-preview vierkant-preview">⬜</div>
              <h3>Vierkant</h3>
              <p>Stabiel en betrouwbaar</p>
            </div>
            
            <div class="shape-option" data-shape="zandloper">
              <div class="shape-preview zandloper-preview">⏳</div>
              <h3>Zandloper</h3>
              <p>Dynamisch en snel</p>
            </div>
            
            <div class="shape-option" data-shape="ruit">
              <div class="shape-preview ruit-preview">💎</div>
              <h3>Ruit</h3>
              <p>Elegant en precies</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Voeg CSS toe als het nog niet bestaat
    if (!document.getElementById('shape-choice-styles')) {
      const style = document.createElement('style');
      style.id = 'shape-choice-styles';
      style.textContent = `
        .shape-choice-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          animation: fadeIn 0.3s ease-out;
        }
        
        .shape-choice-content {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border: 2px solid #8A2BE2;
          border-radius: 20px;
          padding: 40px;
          max-width: 600px;
          text-align: center;
          color: white;
          box-shadow: 0 20px 40px rgba(138, 43, 226, 0.3);
          animation: slideUp 0.4s ease-out;
        }
        
        .shape-choice-content h2 {
          color: #FFD700;
          font-size: 2.5em;
          margin-bottom: 20px;
          text-shadow: 0 2px 8px rgba(255, 215, 0, 0.5);
        }
        
        .shape-choice-content p {
          font-size: 1.2em;
          margin-bottom: 30px;
          color: #E0E0E0;
        }
        
        .shape-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        
        .shape-option {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid transparent;
          border-radius: 15px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .shape-option:hover {
          border-color: #FFD700;
          background: rgba(255, 215, 0, 0.1);
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(255, 215, 0, 0.2);
        }
        
        .shape-option:active {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
        }
        
        .shape-preview {
          font-size: 3em;
          margin-bottom: 10px;
        }
        
        .shape-option h3 {
          color: #FFD700;
          margin-bottom: 10px;
          font-size: 1.3em;
        }
        
        .shape-option p {
          font-size: 0.9em;
          color: #B0B0B0;
          margin: 0;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(50px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Voeg modal toe aan DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    const modal = modalContainer.firstElementChild;
    document.body.appendChild(modal);
    
    // Voeg event listeners toe aan shape options
    const shapeOptions = modal.querySelectorAll('.shape-option');
    shapeOptions.forEach(option => {
      option.addEventListener('click', (event) => {
        const shape = option.getAttribute('data-shape');
        if (shape) {
          this.handleShapeChoice(shape);
        }
      });
    });
    
    // Maak collisionManager globaal beschikbaar
    window.collisionManager = this;
  }

  handleShapeChoice(shape) {
    this.debugLog(`🎨 Shape chosen: ${shape}`);
    
    // Voorkom dubbele clicks door modal direct te verwijderen
    const modal = document.querySelector('.shape-choice-modal');
    if (modal) {
      modal.remove();
    }
    
    // Update game state
    if (window.gameManager) {
      window.gameManager.changeShape(shape);
    }
    
    // Update Solly1 vorm
    this.updateSolly1Shape(shape);
    
    // Toon success message direct
    this.showShapeChangeMessage(shape);
  }

  updateSolly1Shape(shape) {
    if (!window.solly1) return;
    
    this.debugLog(`🎨 Updating Solly1 shape to: ${shape}`);
    
    // Verwijder oude children (voor zandloper)
    while (window.solly1.children.length > 0) {
      const child = window.solly1.children[0];
      window.solly1.remove(child);
      if (window.scene) {
        window.scene.remove(child);
      }
    }
    
    // Verwijder oude geometrie
    if (window.solly1.geometry) {
      window.solly1.geometry.dispose();
    }
    
    // Maak nieuwe geometrie op basis van shape
    let newGeometry;
    let material;
    
    switch (shape) {
      case 'vierkant':
        newGeometry = new THREE.BoxGeometry(120, 120, 120);
        material = new THREE.MeshLambertMaterial({ 
          color: 0x8A2BE2,
          transparent: true,
          opacity: 0.9
        });
        break;
        
      case 'zandloper':
        // Zandloper = twee Sollies met de punt op elkaar
        newGeometry = new THREE.Group();
        
        // Bovenste Solly (piramide naar beneden)
        const topSolly = new THREE.Mesh(
          new THREE.ConeGeometry(60, 120, 4),
          new THREE.MeshLambertMaterial({ 
            color: 0x8A2BE2,
            transparent: true,
            opacity: 0.9
          })
        );
        topSolly.position.y = 60; // Plaats bovenste punt op y=60
        topSolly.rotation.z = Math.PI; // Draai om zodat punt naar beneden wijst
        
        // Onderste Solly (piramide naar boven)
        const bottomSolly = new THREE.Mesh(
          new THREE.ConeGeometry(60, 120, 4),
          new THREE.MeshLambertMaterial({ 
            color: 0x8A2BE2,
            transparent: true,
            opacity: 0.9
          })
        );
        bottomSolly.position.y = -60; // Plaats onderste punt op y=-60
        
        // Voeg beide toe aan group
        newGeometry.add(topSolly);
        newGeometry.add(bottomSolly);
        break;
        
      case 'ruit':
        newGeometry = new THREE.OctahedronGeometry(80);
        material = new THREE.MeshLambertMaterial({ 
          color: 0x8A2BE2,
          transparent: true,
          opacity: 0.9
        });
        break;
        
      case 'piramide':
      default:
        newGeometry = new THREE.ConeGeometry(60, 120, 4);
        material = new THREE.MeshLambertMaterial({ 
          color: 0x8A2BE2,
          transparent: true,
          opacity: 0.9
        });
        break;
    }
    
    if (shape === 'zandloper') {
      // Voor zandloper: vervang de hele solly1 met de group
      const oldSolly1 = window.solly1;
      window.solly1 = newGeometry;
      window.solly1.position.copy(oldSolly1.position);
      window.solly1.rotation.copy(oldSolly1.rotation);
      window.solly1.scale.copy(oldSolly1.scale);
      window.solly1.userData = oldSolly1.userData;
      window.solly1.userData.shape = shape;
      
      // Verwijder oude en voeg nieuwe toe aan scene
      if (window.scene) {
        window.scene.remove(oldSolly1);
        window.scene.add(window.solly1);
      }
    } else {
      // Voor andere vormen: update alleen geometrie en material
      window.solly1.geometry = newGeometry;
      window.solly1.material = material;
      window.solly1.userData.shape = shape;
    }
    
    // Positioneer Solly1 in het midden van de scene
    window.solly1.position.set(0, 0, 0);
    
    // Herstel raycasting na vorm verandering
    if (typeof window.enableSolly1DragOnly === 'function') {
      setTimeout(() => {
        window.enableSolly1DragOnly();
      }, 100);
    }
    
    this.debugLog(`🎨 Solly1 shape updated to: ${shape} and positioned in center`);
  }

  hideShapeChoiceModal(callback) {
    const modal = document.querySelector('.shape-choice-modal');
    if (modal) {
      // Verwijder modal direct zonder animatie om overlap te voorkomen
      modal.remove();
      if (callback) {
        callback();
      }
    } else if (callback) {
      // Als er geen modal is, roep callback direct aan
      callback();
    }
  }

  showShapeChangeMessage(shape) {
    const messageEl = document.createElement('div');
    messageEl.textContent = `🎨 Je bent nu een ${shape}!`;
    messageEl.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(45deg, #4CAF50, #45a049);
      color: white;
      padding: 20px 30px;
      border-radius: 15px;
      font-size: 1.3em;
      font-weight: bold;
      z-index: 10001;
      box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
      animation: shapeChangePulse 2s ease-out;
    `;
    
    // Voeg animatie CSS toe
    if (!document.getElementById('shape-change-animations')) {
      const style = document.createElement('style');
      style.id = 'shape-change-animations';
      style.textContent = `
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes shapeChangePulse {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(messageEl);
    setTimeout(() => messageEl.remove(), 2000);
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