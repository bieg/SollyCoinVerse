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
    this.vortexActive = false; // Nieuwe variabele voor vortex animatie
  }

  // Hoofdfunctie voor collision trigger
  triggerCollision() {
    if (this.collisionDetected) return;
    
    console.log('💥 Collision triggered!');
    this.collisionDetected = true;
    
    // Pauzeer beweging
    if (window.sollyCore) {
      window.sollyCore.setCanMove(false);
    }
    
    // Start explosie animatie
    this.createCollisionExplosion();
    
    // Camera animatie uitgeschakeld voor statische camera
    // this.startCameraAnimationToCollision();
    
    // Update game state
    this.updateGameState();

    // ShapeChoice modal wordt nu automatisch getoond bij 4 collisions
    // this.showShapeChoiceModal();
  }

  createCollisionExplosion() {
    console.log('💥 Starting collision explosion animation!');
    
    const solly1 = window.solly1;
    if (!solly1) return;
    
    // Bereken explosie positie - gebruik de EXACTE positie van Solly1
    const explosionPos = solly1.position.clone();
    console.log('💥 Explosie positie:', explosionPos);
    
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

  // Mini Solly collision detection - 2D overlap van minimaal 60%
  checkMiniSollyCollision() {
    // Skip collision check tijdens drag
    if (window.solly1DragActive || window.isDragging) {
      return;
    }
    
    // Skip als ShapeChoice modal open is
    if (window.shapeChoiceModalOpen || document.querySelector('.shape-choice-modal')) {
      return;
    }
    
    // Skip als er al een collision is gedetecteerd (globaal of lokaal)
    if (window.collisionDetected || this.collisionDetected) return;
    
    // Stop bij 4 collisions
            if (window.gameManager && window.gameManager.getKaboomCount() >= 5) {
      return;
    }
    
    if (!window.miniSollys || !window.solly1) return;
    
    // === DUIDELIJKE 2D OVERLAP COLLISION DETECTION ===
    const solly1Pos = window.solly1.position;
    const solly1Radius = this._getMeshRadius(window.solly1);
    
    console.log(`🔍 Checking collision - Solly1 pos: (${solly1Pos.x.toFixed(1)}, ${solly1Pos.z.toFixed(1)}), radius: ${solly1Radius.toFixed(1)}`);
    
    let bestCollision = null;
    let bestOverlapPct = 0;
    
    for (let i = 0; i < window.miniSollys.length; i++) {
      const mini = window.miniSollys[i];
      if (!mini || !mini.visible) continue;
      
      const miniPos = mini.position;
      const miniRadius = this._getMeshRadius(mini);
      
      // 2D afstand berekenen (X en Z as)
      const dx = solly1Pos.x - miniPos.x;
      const dz = solly1Pos.z - miniPos.z;
      const distance2D = Math.sqrt(dx * dx + dz * dz);
      
      // Som van radii
      const sumRadii = solly1Radius + miniRadius;
      
      console.log(`🔍 Mini ${i}: pos (${miniPos.x.toFixed(1)}, ${miniPos.z.toFixed(1)}), radius: ${miniRadius.toFixed(1)}, distance: ${distance2D.toFixed(1)}, sum radii: ${sumRadii.toFixed(1)}`);
      
      // Check of er overlap is
      if (distance2D < sumRadii) {
        // === Nauwkeurige overlap percentage op basis van cirkel-oppervlakte ===
        let overlapPct = 0;
        if (distance2D <= Math.abs(solly1Radius - miniRadius)) {
          // Kleinere cirkel zit volledig in de grotere
          overlapPct = 100;
        } else {
          // Formule voor intersectie-oppervlak van twee cirkels
          const r1 = solly1Radius;
          const r2 = miniRadius;
          const d = distance2D;
          const part1 = r1 * r1 * Math.acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1));
          const part2 = r2 * r2 * Math.acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2));
          const part3 = 0.5 * Math.sqrt(Math.max(0, (-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2)));
          const intersectionArea = part1 + part2 - part3;
          const minArea = Math.PI * Math.min(r1, r2) * Math.min(r1, r2);
          overlapPct = (intersectionArea / minArea) * 100;
        }
        
        console.log(`💥 OVERLAP DETECTED! Mini ${i}: overlap%: ${overlapPct.toFixed(1)}%`);
        
        // Alleen collision als overlap >= 60%
        if (overlapPct >= 60) {
          if (overlapPct > bestOverlapPct) {
            bestOverlapPct = overlapPct;
            bestCollision = { 
              mini, 
              index: i, 
              overlapPct, 
              distance2D,
              solly1Radius,
              miniRadius
            };
          }
        } else {
          console.log(`❌ Overlap ${overlapPct.toFixed(1)}% < 60% - GEEN COLLISION`);
        }
      } else {
        console.log(`❌ Geen overlap - distance ${distance2D.toFixed(1)} >= sum radii ${sumRadii.toFixed(1)}`);
      }
    }
    
    // Trigger collision als er een geldige overlap is
    if (bestCollision) {
      console.log(`🎯 COLLISION TRIGGERED! Mini ${bestCollision.index}: ${bestCollision.overlapPct.toFixed(1)}% overlap`);
      console.log(`📊 Details: distance=${bestCollision.distance2D.toFixed(1)}, overlap%=${bestCollision.overlapPct.toFixed(1)}%, solly1Radius=${bestCollision.solly1Radius.toFixed(1)}, miniRadius=${bestCollision.miniRadius.toFixed(1)}`);
      
      this.handleMiniSollyCollision(bestCollision.mini, bestCollision.index);
      
      // Zet globale flag zodat main.js stopt met herhaald checken
      window.collisionDetected = true;
    }
  }
  
  // Helper om effectieve radius te krijgen voor collision detection
  _getMeshRadius(mesh) {
    if (!mesh || !mesh.geometry) {
      console.log(`❌ Mesh of geometry ontbreekt voor radius berekening`);
      return 50; // Fallback radius
    }
    
    // Zorg dat bounding sphere is berekend
    if (!mesh.geometry.boundingSphere) {
      mesh.geometry.computeBoundingSphere();
    }
    
    // Gebruik de grootste schaal voor radius (voor niet-uniforme schaling)
    const maxScale = Math.max(mesh.scale.x, mesh.scale.y, mesh.scale.z);
    const radius = mesh.geometry.boundingSphere.radius * maxScale;
    
    console.log(`📏 Mesh radius: ${radius.toFixed(1)} (scale: ${maxScale.toFixed(1)}, base radius: ${mesh.geometry.boundingSphere.radius.toFixed(1)})`);
    
    return radius;
  }

  handleMiniSollyCollision(miniSolly, index) {
    console.log(`💥 Mini Solly collision detected at index ${index}`);
    
    // Verberg de mini Solly
    miniSolly.visible = false;
    
    // Bepaal het exacte midden van de botsing voor de explosie
    let kaboomPos = miniSolly.position.clone();
    if (window.solly1) {
      kaboomPos = new THREE.Vector3().addVectors(window.solly1.position, miniSolly.position).multiplyScalar(0.5);
    }
    // Maak KABOOM explosie effect
    this.createKaboomExplosion(kaboomPos);
    
    // Update game state
    this.updateGameState();
    
    // Trigger portal activatie na meerdere collisions
    this.checkPortalActivation();
  }

  createKaboomExplosion(position) {
    // Grote KABOOM explosie met meerdere lagen
    console.log('💥 KABOOM explosie gestart!');
    
    // Laag 1: Grote explosie ring
    this.createExplosionLayer(position, 0xFFD700, 0, 400, 800);
    
    // Laag 2: Paarse explosie ring
    this.createExplosionLayer(position, 0x8A2BE2, 100, 600, 600);
    
    // Laag 3: Rode explosie ring
    this.createExplosionLayer(position, 0xFF4500, 200, 800, 400);
    
    // Screen shake voor extra effect
    this.createScreenShake();
    
    // Particle explosie
    this.createKaboomParticles(position);
    
    // Toon "KABOOM!" tekst
    this.showKaboomText(position);
  }
  
  createKaboomParticles(position) {
    const particleCount = 50;
    const particles = [];
    const colors = [0xFFD700, 0xFF4500, 0x8A2BE2, 0x00FF00, 0xFF69B4];
    
    for (let i = 0; i < particleCount; i++) {
      const geo = new THREE.SphereGeometry(0.5, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ 
        color: colors[i % colors.length], 
        transparent: true, 
        opacity: 1.0 
      });
      const particle = new THREE.Mesh(geo, mat);
      
      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      ).normalize();
      
      const speed = 50 + Math.random() * 100;
      particle.velocity = direction.multiplyScalar(speed);
      particle.position.copy(position);
      
      window.scene.add(particle);
      particles.push(particle);
    }
    
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
  
  showKaboomText(position) {
    // Projecteer 3D positie naar 2D scherm coördinaten
    const vector = position.clone();
    vector.project(window.camera);
    
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
    
    const kaboomEl = document.createElement('div');
    kaboomEl.textContent = '💥 KABOOM! 💥';
    kaboomEl.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      transform: translate(-50%, -50%);
      background: linear-gradient(45deg, #FFD700, #FF4500);
      color: white;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 1.2em;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(255, 215, 0, 0.6);
      animation: kaboomPulse 1s ease-out;
      pointer-events: none;
    `;
    
    // Voeg animatie CSS toe
    if (!document.getElementById('kaboom-animations')) {
      const style = document.createElement('style');
      style.id = 'kaboom-animations';
      style.textContent = `
        @keyframes kaboomPulse {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(kaboomEl);
    setTimeout(() => kaboomEl.remove(), 1000);
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
                      // Record kaboom with position and shape data
                const position = solly1.position.clone();
                const shape = window.gameManager.getCurrentShape();
                window.gameManager.incrementKaboomCount(1, position, shape);
      
      // Update KABOOM counter in UI
      const kaboomCounter = document.getElementById('kaboom-counter');
      const kaboomNumber = document.getElementById('kaboom-number');
      if (kaboomCounter && kaboomNumber) {
        const totalCollisions = window.gameManager.getKaboomCount();
        kaboomNumber.textContent = totalCollisions;
        kaboomCounter.style.display = 'block'; // Altijd zichtbaar
        
        console.log('💥 KABOOM counter bijgewerkt naar:', totalCollisions);
        
        // Voeg een kleine animatie toe
        kaboomCounter.style.transform = 'scale(1.2)';
        setTimeout(() => {
          kaboomCounter.style.transform = 'scale(1)';
        }, 200);
        
        // Stop bij 5 collisions
        if (totalCollisions >= 4) {
          console.log('🎯 4 collisions bereikt - collision detection gestopt');
          window.collisionDetected = true; // Stop verdere collisions
          
          // Toon automatisch de ShapeChoice modal
          setTimeout(() => {
            this.showShapeChoiceModal();
          }, 1000); // Wacht 1 seconde na de laatste collision
        }
      } else {
        console.error('❌ KABOOM counter elementen niet gevonden in updateGameState!');
      }
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
      
              // Na 5 collisions: toon ShapeChoice modal
              if (kaboomCount % 5 === 0) {
        this.showShapeChoiceModal();
      }
      // Na 5 collisions: activeer portal
      else if (kaboomCount >= 5 && window.activatePortal) {
        window.activatePortal();
      }
    }
  }

  // FORCEER SHAPECHOICE MODAL - voor testing
  forceShowShapeChoiceModal() {
    console.log('🎨 FORCING ShapeChoice modal to show');
    this.showShapeChoiceModal();
  }

  showShapeChoiceModal() {
    console.log('🎨 Showing ShapeChoice modal after 4 collisions');
    
    // Zet flag om collisions te blokkeren
    window.shapeChoiceModalOpen = true;
    
    // BEWAAR DE PORTAL - verwijder deze NIET
    // De portal moet blijven bestaan tijdens de shape choice
    console.log('🔮 Portal wordt bewaard tijdens shape choice');
    
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
          pointer-events: auto;
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
    console.log(`🎨 Shape chosen: ${shape}`);
    console.log(`🔍 DEBUG: Shape parameter type: ${typeof shape}`);
    console.log(`🔍 DEBUG: Shape parameter value: "${shape}"`);
    
    // Verwijder flag om collisions weer toe te staan
    window.shapeChoiceModalOpen = false;
    
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
    
    // Toon bericht
    this.showShapeChangeMessage(shape);
    
    // MAAK EEN SHAPECHOICE OBJECT DAT JE KUNT SLEPEN
    this.createDraggableShapeChoice(shape);
    
    // MAAK PORTAL AAN NA SHAPE CHOICE
    console.log(`🔮 Creating portal after shape choice with shape: "${shape}"`);
    this.createShapePortal(shape);
    
    // EXTRA: Maak ook een eenvoudige test portal die gegarandeerd zichtbaar is
    this.createSimpleTestPortal(shape);
    
    // DEBUG: Check of portal echt bestaat
    setTimeout(() => {
      console.log('🔍 DEBUG: Checking portal existence...');
      if (window.portal) {
        console.log(`✅ Portal exists: ${window.portal.name}`);
        console.log(`📍 Portal position: ${window.portal.position.x}, ${window.portal.position.y}, ${window.portal.position.z}`);
        console.log(`👁️ Portal visible: ${window.portal.visible}`);
      } else {
        console.log('❌ Portal does not exist!');
      }
      
      // Check scene objects
      if (window.scene) {
        const portalObjects = window.scene.children.filter(child => 
          child.name && child.name.includes('Portal')
        );
        console.log(`🔍 Portal objects in scene: ${portalObjects.length}`);
        portalObjects.forEach(obj => {
          console.log(`  - ${obj.name}: ${obj.position.x}, ${obj.position.y}, ${obj.position.z}`);
        });
      }
    }, 500); // Check na 0.5 seconde
    
    // START VORTEX ANIMATIE VOOR LEVEL 2
    setTimeout(() => {
      console.log('🌀 Starting vortex animation before Level 2');
      if (window.scene) {
        const centerPosition = new THREE.Vector3(0, 0, 0);
        this.startVortexAnimation(centerPosition, null);
      }
    }, 1000); // Start vortex na 1 seconde
    
    // START LEVEL 2 NA VORTEX
    setTimeout(() => {
      console.log('🚀 Starting Level 2 after vortex animation');
      this.startLevel2AfterShapeChoice(shape);
    }, 6000); // Wacht 6 seconden (vortex duurt 5 seconden)
  }



  updateSolly1Shape(shape) {
    if (!window.solly1) return;
    
    console.log(`🎨 Updating Solly1 shape to: ${shape}`);
    
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
        // Zandloper = gebruik een octahedron als basis en maak het hoger
        newGeometry = new THREE.OctahedronGeometry(80, 0);
        material = new THREE.MeshBasicMaterial({ 
          color: 0xFFFFFF, // Wit zoals Solly1
          transparent: false,
          opacity: 1.0
        });
        // Schaal om zandloper vorm te krijgen
        newGeometry.scale(1, 2, 1);
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
    
    // Voor alle vormen: update geometrie en material
    window.solly1.geometry = newGeometry;
    window.solly1.material = material;
    window.solly1.userData.shape = shape;
    
    // Positioneer Solly1 op de juiste hoogte
    window.solly1.position.set(0, 200, 0);
    
    // Herstel raycasting direct na vorm verandering
    if (typeof window.enableSolly1DragOnly === 'function') {
      window.enableSolly1DragOnly();
    }
    
    // Zorg ervoor dat Solly1 zichtbaar en klikbaar is
    if (window.solly1) {
      window.solly1.visible = true;
      if (window.solly1.material) {
        window.solly1.material.visible = true;
        window.solly1.material.opacity = 1;
        window.solly1.material.transparent = false;
      }
      window.solly1.raycast = THREE.Mesh.prototype.raycast;
      
      // Voor alle vormen: zorg dat raycasting werkt
      window.solly1.raycast = THREE.Mesh.prototype.raycast;
    }
    
    console.log(`🎨 Solly1 shape updated to: ${shape} and positioned in center`);
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

  createShapePortal(shape) {
    console.log(`🌀 Creating mystieke portal for: ${shape}`);
    
    if (!window.scene) return;
    
    // Check of er al een actieve portal is
    if (window.portal && window.portalActive) {
      console.log('🔮 Portal is al actief - geen nieuwe portal aangemaakt');
      return;
    }
    
    // Verwijder bestaande portal als die er is (alleen als niet actief)
    const existingPortal = window.scene.getObjectByName('ShapePortal');
    if (existingPortal) {
      window.scene.remove(existingPortal);
    }
    
    // Verwijder bestaande PortalShape als die er is
    const existingShape = window.scene.getObjectByName('PortalShape');
    if (existingShape) {
      window.scene.remove(existingShape);
    }
    
    // Verwijder bestaande PortalInnerFill als die er is
    const existingFill = window.scene.getObjectByName('PortalInnerFill');
    if (existingFill) {
      window.scene.remove(existingFill);
    }
    
    // Verwijder bestaande PortalInnerRing als die er is
    const existingInnerRing = window.scene.getObjectByName('PortalInnerRing');
    if (existingInnerRing) {
      window.scene.remove(existingInnerRing);
    }
    
    // Verwijder bestaande PortalClickTarget als die er is
    const existingClickTarget = window.scene.getObjectByName('PortalClickTarget');
    if (existingClickTarget) {
      window.scene.remove(existingClickTarget);
    }
    
    // MYSTIEKE PORTAL MET VORM-SPECIFIEKE BINNENKANT
    let outerRing, innerRing, clickTarget;
    
    console.log(`🔍 DEBUG: Switch statement - shape parameter: "${shape}"`);
    switch (shape) {
      case 'vierkant':
        console.log(`🔍 DEBUG: Creating VIERKANTE portal`);
        // VIERKANTE PORTAL
        outerRing = new THREE.Mesh(
          new THREE.RingGeometry(400, 600, 32),
          new THREE.MeshBasicMaterial({
            color: 0x8A2BE2,
            transparent: true,
            opacity: 1.0, // Volledig zichtbaar
            side: THREE.DoubleSide
          })
        );
        
        innerRing = new THREE.Mesh(
          new THREE.RingGeometry(200, 400, 4), // 4 segments = vierkant
          new THREE.MeshBasicMaterial({
            color: 0x9370DB,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
          })
        );
        
        clickTarget = new THREE.Mesh(
          new THREE.PlaneGeometry(300, 300), // Vierkant
          new THREE.MeshBasicMaterial({ 
            transparent: true, 
            opacity: 0, 
            side: THREE.DoubleSide 
          })
        );
        break;
        
      case 'zandloper':
        console.log(`🔍 DEBUG: Creating ZANDLOPER portal`);
        // ZANDLOPER PORTAL (twee piramides op elkaar)
        outerRing = new THREE.Mesh(
          new THREE.RingGeometry(400, 600, 32),
          new THREE.MeshBasicMaterial({
            color: 0x8A2BE2,
            transparent: true,
            opacity: 1.0, // Volledig zichtbaar
            side: THREE.DoubleSide
          })
        );
        
        // Maak een groep voor de zandloper vorm
        const zandloperGroup = new THREE.Group();
        zandloperGroup.name = 'ZandloperShape';
        
        // Bovenste piramide (punt naar boven)
        const topPyramid = new THREE.Mesh(
          new THREE.ConeGeometry(150, 200, 3),
          new THREE.MeshBasicMaterial({
            color: 0x9370DB,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
          })
        );
        topPyramid.position.y = 100;
        topPyramid.rotation.x = Math.PI; // Draai om zodat punt naar boven wijst
        zandloperGroup.add(topPyramid);
        
        // Onderste piramide (punt naar beneden)
        const bottomPyramid = new THREE.Mesh(
          new THREE.ConeGeometry(150, 200, 3),
          new THREE.MeshBasicMaterial({
            color: 0x9370DB,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
          })
        );
        bottomPyramid.position.y = -100;
        zandloperGroup.add(bottomPyramid);
        
        // Gebruik de groep als innerRing
        innerRing = zandloperGroup;
        
        // Click target als combinatie van beide piramides
        const clickTargetGroup = new THREE.Group();
        clickTargetGroup.name = 'ZandloperClickTarget';
        
        const topClickTarget = new THREE.Mesh(
          new THREE.ConeGeometry(150, 200, 3),
          new THREE.MeshBasicMaterial({ 
            transparent: true, 
            opacity: 0, 
            side: THREE.DoubleSide 
          })
        );
        topClickTarget.position.y = 100;
        topClickTarget.rotation.x = Math.PI;
        clickTargetGroup.add(topClickTarget);
        
        const bottomClickTarget = new THREE.Mesh(
          new THREE.ConeGeometry(150, 200, 3),
          new THREE.MeshBasicMaterial({ 
            transparent: true, 
            opacity: 0, 
            side: THREE.DoubleSide 
          })
        );
        bottomClickTarget.position.y = -100;
        clickTargetGroup.add(bottomClickTarget);
        
        clickTarget = clickTargetGroup;
        break;
        
      case 'ruit':
        console.log(`🔍 DEBUG: Creating RUIT portal`);
        // RUIT PORTAL (diamant vorm)
        outerRing = new THREE.Mesh(
          new THREE.RingGeometry(400, 600, 32),
          new THREE.MeshBasicMaterial({
            color: 0x8A2BE2,
            transparent: true,
            opacity: 1.0, // Volledig zichtbaar
            side: THREE.DoubleSide
          })
        );
        
        innerRing = new THREE.Mesh(
          new THREE.RingGeometry(200, 400, 4), // 4 segments = vierkant (gedraaid)
          new THREE.MeshBasicMaterial({
            color: 0x9370DB,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
          })
        );
        innerRing.rotation.z = Math.PI / 4; // Draai 45 graden voor diamant vorm
        
        clickTarget = new THREE.Mesh(
          new THREE.PlaneGeometry(300, 300), // Vierkant
          new THREE.MeshBasicMaterial({ 
            transparent: true, 
            opacity: 0, 
            side: THREE.DoubleSide 
          })
        );
        clickTarget.rotation.z = Math.PI / 4; // Draai 45 graden voor diamant vorm
        break;
        
      case 'piramide':
      default:
        console.log(`🔍 DEBUG: Creating PIRAMIDE portal (default case)`);
        // PIRAMIDE PORTAL (driehoekige vorm)
        outerRing = new THREE.Mesh(
          new THREE.RingGeometry(400, 600, 32),
          new THREE.MeshBasicMaterial({
            color: 0x8A2BE2,
            transparent: true,
            opacity: 1.0, // Volledig zichtbaar
            side: THREE.DoubleSide
          })
        );
        
        innerRing = new THREE.Mesh(
          new THREE.RingGeometry(200, 400, 3), // 3 segments = driehoek
          new THREE.MeshBasicMaterial({
            color: 0x9370DB,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
          })
        );
        
        clickTarget = new THREE.Mesh(
          new THREE.ConeGeometry(150, 300, 3), // Driehoekige basis
          new THREE.MeshBasicMaterial({ 
            transparent: true, 
            opacity: 0, 
            side: THREE.DoubleSide 
          })
        );
        break;
    }
    
    // Positie en rotatie instellen - DUidelijk zichtbaar en vast
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.name = 'ShapePortal';
    outerRing.position.set(-400, 200, -200); // Dichterbij positie, makkelijker te bereiken
    
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.copy(outerRing.position);
    innerRing.name = 'PortalInnerRing';
    
    clickTarget.rotation.x = -Math.PI / 2;
    clickTarget.position.copy(outerRing.position);
    clickTarget.userData.isClickTarget = true;
    clickTarget.name = 'PortalClickTarget';
    
    // Voeg portal elementen toe aan scene
    window.scene.add(outerRing);
    window.scene.add(innerRing);
    window.scene.add(clickTarget);
    
    // Maak portal extra zichtbaar
    outerRing.visible = true;
    innerRing.visible = true;
    clickTarget.visible = true;
    
    // Zorg ervoor dat portal bovenop andere objecten staat
    outerRing.renderOrder = 1000;
    innerRing.renderOrder = 1001;
    clickTarget.renderOrder = 1002;
    
    // Markeer innerRing als ShapeMesh voor latere pulses
    innerRing.userData.isShapeMesh = true;
    
    // Maak portal dropable (grotere drop zone voor simpele drag-and-drop)
    this.makePortalDropable(outerRing, innerRing);
    
    // Voeg een grote, felgekleurde indicator toe om de portal positie te markeren
    let indicatorColor = 0xFF0000; // Default rood
    
    // Pas kleur aan op basis van shape
    switch (shape) {
      case 'vierkant':
        indicatorColor = 0x00FF00; // Groen voor vierkant
        break;
      case 'zandloper':
        indicatorColor = 0xFF8800; // Oranje voor zandloper
        break;
      case 'ruit':
        indicatorColor = 0x0088FF; // Blauw voor ruit
        break;
      case 'piramide':
      default:
        indicatorColor = 0xFF0000; // Rood voor piramide
        break;
    }
    
    const portalIndicator = new THREE.Mesh(
      new THREE.SphereGeometry(200, 16, 16),
      new THREE.MeshBasicMaterial({
        color: indicatorColor,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      })
    );
    portalIndicator.position.copy(outerRing.position);
    portalIndicator.position.y += 300; // Boven de portal
    portalIndicator.name = 'PortalIndicator';
    window.scene.add(portalIndicator);
    
    // Maak de indicator pulseren
    const pulseIndicator = () => {
      if (portalIndicator && portalIndicator.parent) {
        const scale = 1 + Math.sin(Date.now() * 0.005) * 0.3;
        portalIndicator.scale.set(scale, scale, scale);
        requestAnimationFrame(pulseIndicator);
      }
    };
    pulseIndicator();
    
    // GEEN ANIMATIES - portal blijft statisch
    // this.animatePortal(outerRing, null);
    
    // Zet portal als globale variabele
    window.portal = outerRing;
    window.portalActive = true;
    
    console.log(`🌀 Mystieke portal created met ${shape} vorm, positioned at vaste locatie (-400, 200, -200)`);
    console.log(`🔮 Portal toegevoegd aan scene: ${window.scene.children.length} objecten`);
    console.log(`🎯 Portal positie: ${outerRing.position.x}, ${outerRing.position.y}, ${outerRing.position.z}`);
  }
  
  createSimpleTestPortal(shape) {
    console.log(`🔮 Creating SIMPLE TEST portal for: ${shape}`);
    
    if (!window.scene) {
      console.log('❌ No scene available for simple test portal');
      return;
    }
    
    // Maak een eenvoudige, grote, felgekleurde portal die onmogelijk te missen is
    const simplePortal = new THREE.Mesh(
      new THREE.RingGeometry(500, 800, 32),
      new THREE.MeshBasicMaterial({
        color: 0xFF00FF, // Fel magenta
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide
      })
    );
    
    // Positie in het midden van het scherm
    simplePortal.position.set(0, 0, 0);
    simplePortal.rotation.x = -Math.PI / 2;
    simplePortal.name = 'SimpleTestPortal';
    
    // Voeg toe aan scene
    window.scene.add(simplePortal);
    
    // Maak een grote indicator bol
    const indicator = new THREE.Mesh(
      new THREE.SphereGeometry(300, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0x00FFFF, // Fel cyaan
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      })
    );
    indicator.position.set(0, 400, 0);
    indicator.name = 'SimpleTestIndicator';
    window.scene.add(indicator);
    
    // Maak de indicator pulseren
    const pulseSimple = () => {
      if (indicator && indicator.parent) {
        const scale = 1 + Math.sin(Date.now() * 0.01) * 0.5;
        indicator.scale.set(scale, scale, scale);
        requestAnimationFrame(pulseSimple);
      }
    };
    pulseSimple();
    
    // Maak een drop zone
    const dropZone = new THREE.Mesh(
      new THREE.CircleGeometry(1000, 32),
      new THREE.MeshBasicMaterial({
        color: 0xFFFF00, // Fel geel
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      })
    );
    dropZone.position.copy(simplePortal.position);
    dropZone.rotation.x = -Math.PI / 2;
    dropZone.name = 'SimpleTestDropZone';
    window.scene.add(dropZone);
    
    // Simpele drop detection
    const checkSimpleDrop = () => {
      if (window.solly1 && window.solly1.position && dropZone.parent) {
        const distance = window.solly1.position.distanceTo(dropZone.position);
        
        if (distance < 1000) {
          console.log('🎯 Solly1 gedropt op SIMPLE TEST portal!');
          this.handlePortalDrop(simplePortal, null);
          window.scene.remove(dropZone);
          return;
        }
      }
      if (dropZone.parent) {
        requestAnimationFrame(checkSimpleDrop);
      }
    };
    checkSimpleDrop();
    
    console.log(`🔮 Simple test portal created at center (0, 0, 0)`);
  }
  
  createDraggableShapeChoice(shape) {
    console.log(`🎨 Creating draggable shape choice for: ${shape}`);
    
    if (!window.scene) {
      console.log('❌ No scene available for draggable shape choice');
      return;
    }
    
    // Maak een 3D object van de gekozen shape
    let geometry;
    switch(shape) {
      case 'vierkant':
        geometry = new THREE.BoxGeometry(100, 100, 100);
        break;
      case 'zandloper':
        geometry = new THREE.ConeGeometry(50, 150, 4);
        break;
      case 'ruit':
        geometry = new THREE.OctahedronGeometry(70);
        break;
      case 'piramide':
      default:
        geometry = new THREE.ConeGeometry(60, 120, 4);
        break;
    }
    
    // Material met glow effect
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00FF88,
      transparent: true,
      opacity: 0.9
    });
    
    const shapeChoice = new THREE.Mesh(geometry, material);
    
    // Positie rechts van het scherm
    shapeChoice.position.set(800, 200, 0);
    shapeChoice.name = 'DraggableShapeChoice';
    
    // User data voor identificatie
    shapeChoice.userData = {
      shapeType: shape,
      isDraggableShapeChoice: true,
      originalPosition: new THREE.Vector3(800, 200, 0)
    };
    
    // Voeg toe aan scene
    window.scene.add(shapeChoice);
    
    // Maak het object draggable
    this.makeShapeChoiceDraggable(shapeChoice);
    
    console.log(`🎨 Draggable shape choice created: ${shape} at position (800, 200, 0)`);
  }
  
  makeShapeChoiceDraggable(shapeChoice) {
    let isDragging = false;
    let dragStartPos = new THREE.Vector3();
    let originalPos = new THREE.Vector3();
    
    // Mouse down event
    const onMouseDown = (event) => {
      if (!window.camera || !window.renderer) return;
      
      const rect = window.renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, window.camera);
      
      const intersects = raycaster.intersectObject(shapeChoice, true);
      
      if (intersects.length > 0) {
        isDragging = true;
        dragStartPos.copy(intersects[0].point);
        originalPos.copy(shapeChoice.position);
        
        // Disable camera controls during drag
        if (window.controls) {
          window.controls.enabled = false;
        }
        
        event.preventDefault();
      }
    };
    
    // Mouse move event
    const onMouseMove = (event) => {
      if (!isDragging || !window.camera || !window.renderer) return;
      
      const rect = window.renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, window.camera);
      
      // Project op een vlak voor smooth movement
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const intersection = new THREE.Vector3();
      
      if (raycaster.ray.intersectPlane(plane, intersection)) {
        shapeChoice.position.copy(intersection);
      }
    };
    
    // Mouse up event
    const onMouseUp = (event) => {
      if (!isDragging) return;
      
      isDragging = false;
      
      // Re-enable camera controls
      if (window.controls) {
        window.controls.enabled = true;
      }
      
      // Check of het object op de portal is gedropt
      this.checkShapeChoiceDropOnPortal(shapeChoice);
    };
    
    // Add event listeners
    window.renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.renderer.domElement.addEventListener('mousemove', onMouseMove);
    window.renderer.domElement.addEventListener('mouseup', onMouseUp);
    
    console.log(`🎨 Shape choice made draggable`);
  }
  
  checkShapeChoiceDropOnPortal(shapeChoice) {
    // Check alle portal objecten in de scene
    const portalObjects = window.scene.children.filter(child => 
      child.name && (child.name.includes('Portal') || child.name.includes('portal'))
    );
    
    for (const portal of portalObjects) {
      const distance = shapeChoice.position.distanceTo(portal.position);
      
      if (distance < 300) { // Drop threshold
        console.log(`🎯 Shape choice dropped on portal: ${portal.name}`);
        this.handleShapeChoicePortalDrop(shapeChoice, portal);
        return;
      }
    }
    
    // Als niet op portal gedropt, terug naar originele positie
    shapeChoice.position.copy(shapeChoice.userData.originalPosition);
    console.log(`🎨 Shape choice returned to original position`);
  }
  
  handleShapeChoicePortalDrop(shapeChoice, portal) {
    console.log(`🎯 Shape choice dropped on portal - starting portal animation!`);
    
    // Verberg het shape choice object
    shapeChoice.visible = false;
    
    // Start portal animatie
    this.startPortalAnimation(portal);
  }
  
  startPortalAnimation(portal) {
    console.log(`🌀 Starting portal animation!`);
    
    // Maak portal pulseren
    const pulsePortal = () => {
      if (portal && portal.parent) {
        const scale = 1 + Math.sin(Date.now() * 0.01) * 0.3;
        portal.scale.set(scale, scale, scale);
        
        // Stop na 3 seconden
        if (Date.now() - this.portalAnimationStart < 3000) {
          requestAnimationFrame(pulsePortal);
        } else {
          this.completePortalAnimation();
        }
      }
    };
    
    this.portalAnimationStart = Date.now();
    pulsePortal();
  }
  
  completePortalAnimation() {
    console.log(`✅ Portal animation completed - starting Level 2!`);
    
    // Start Level 2
    if (window.level2Manager) {
      window.level2Manager.startLevel();
    } else {
      console.log(`❌ Level2Manager not available`);
    }
  }
  
  makePortalDropable(portalRing, shapeMesh) {
    // Voeg drop zone toe (groot voor simpele drag-and-drop)
    const dropZone = new THREE.Mesh(
      new THREE.CircleGeometry(1200, 32), // Grotere drop zone voor makkelijker drop
      new THREE.MeshBasicMaterial({
        color: 0x00FF00,
        transparent: true,
        opacity: 0.8, // Veel zichtbaarder voor debug
        side: THREE.DoubleSide
      })
    );
    dropZone.name = 'PortalDropZone';
    dropZone.position.copy(portalRing.position);
    dropZone.rotation.x = -Math.PI / 2;
    dropZone.userData.isDropZone = true;
    dropZone.userData.portalRing = portalRing;
    dropZone.userData.shapeMesh = shapeMesh;
    
    window.scene.add(dropZone);
    
    console.log('🎯 Portal drop zone aangemaakt voor simpele drag-and-drop');
    
    // Simpele drop detection - check elke frame
    const checkDrop = () => {
      if (window.solly1 && window.solly1.position && dropZone.parent) {
        const distance = window.solly1.position.distanceTo(dropZone.position);
        
        // Debug logging
        if (distance < 1500) {
          console.log('🌍 Afstand tot portal:', Math.round(distance), 'threshold: 1200');
        }
        
        // Simpele drop detection: dichtbij (ook tijdens drag)
        if (distance < 1200) {
          console.log('🎯 Solly1 gedropt op portal!');
          this.handlePortalDrop(portalRing, shapeMesh);
          // Verwijder drop zone na succesvolle drop
          window.scene.remove(dropZone);
          return;
        }
      }
      // Blijf checken totdat de drop zone wordt verwijderd
      if (dropZone.parent) {
        requestAnimationFrame(checkDrop);
      }
    };
    checkDrop();
  }
  
  handlePortalDrop(portalRing, shapeMesh) {
    console.log('🎯 Solly1 dropped on mystieke portal!');

    // Speciale effecten bij drop
    this.createPortalDropEffect(portalRing.position);

    // TOON BERICHT "JE HEBT DE PORTAL GEACTIVEERD" - VERTRAAGD
    setTimeout(() => {
      const messageEl = document.createElement('div');
      messageEl.textContent = 'JE HEBT DE PORTAL GEACTIVEERD';
      messageEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(45deg, #8A2BE2, #9370DB);
        color: white;
        padding: 20px 30px;
        border-radius: 15px;
        font-size: 1.5em;
        font-weight: bold;
        z-index: 10001;
        box-shadow: 0 8px 24px rgba(138, 43, 226, 0.4);
        animation: portalActivatedPulse 3s ease-out;
      `;
      
      // Voeg animatie CSS toe
      if (!document.getElementById('portal-animations')) {
        const style = document.createElement('style');
        style.id = 'portal-animations';
        style.textContent = `
          @keyframes portalActivatedPulse {
            0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
            20% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
            80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(messageEl);
      setTimeout(() => messageEl.remove(), 3000);
    }, 1000);

    // Start vortex animatie om het universum op te zuigen
    this.startVortexAnimation(portalRing.position.clone(), shapeMesh);

    // PORTAL BLIJFT STAAN - verwijder deze NIET
    console.log('🔮 Portal blijft staan na drop - klaar voor volgende drag-and-drop');

    // Reset Solly1 positie voor nieuwe poging (verberg ondertussen)
    if (window.solly1) {
      window.solly1.visible = false;
    }
  }
  
  createPortalDropEffect(position) {
    // Maak explosie effect op portal positie
    this.createExplosionLayer(position, 0x8A2BE2, 0, 800, 800);
    this.createExplosionLayer(position, 0xFFD700, 100, 1000, 600);
    
    // Screen shake
    this.createScreenShake();
    
    // Toon success message
    const messageEl = document.createElement('div');
    messageEl.textContent = '🎯 Mystieke portal geactiveerd!';
    messageEl.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(45deg, #8A2BE2, #9370DB);
      color: white;
      padding: 20px 30px;
      border-radius: 15px;
      font-size: 1.3em;
      font-weight: bold;
      z-index: 10001;
      box-shadow: 0 8px 24px rgba(138, 43, 226, 0.4);
      animation: portalActivatedPulse 2s ease-out;
    `;
    
    // Voeg animatie CSS toe
    if (!document.getElementById('portal-animations')) {
      const style = document.createElement('style');
      style.id = 'portal-animations';
      style.textContent = `
        @keyframes portalActivatedPulse {
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
  
  animatePortal(portalRing, shapeMesh) {
    const startTime = performance.now();
    
    function animate() {
      const elapsed = performance.now() - startTime;
      const rotationSpeed = 0.001;
      
      // Draai portal ring
      portalRing.rotation.z += rotationSpeed;
      
      // Draai ook de innerRing
      const innerRing = window.scene.getObjectByName('PortalInnerRing');
      if (innerRing) {
        innerRing.rotation.z -= rotationSpeed * 0.5; // Tegenovergestelde richting
        
        // Veilige material check voor innerRing
        if (innerRing.material && innerRing.material.opacity !== undefined) {
          innerRing.material.opacity = Math.sin(elapsed * 0.003) * 0.2 + 0.8;
        } else if (innerRing.children && innerRing.children.length > 0) {
          // Voor zandloper group: animeer alle children
          innerRing.children.forEach(child => {
            if (child.material && child.material.opacity !== undefined) {
              child.material.opacity = Math.sin(elapsed * 0.003) * 0.2 + 0.8;
            }
          });
        }
      }
      
      // Veilige material check voor portalRing
      if (portalRing.material && portalRing.material.opacity !== undefined) {
        const pulse = Math.sin(elapsed * 0.002) * 0.3 + 0.7;
        portalRing.material.opacity = pulse;
      }
      
      // Als er een shapeMesh is, animeer die ook
      if (shapeMesh) {
        shapeMesh.rotation.y += rotationSpeed * 2;
        shapeMesh.rotation.x += rotationSpeed * 1.5;
        
        // Pulseer opacity van de vorm
        const shapePulse = Math.sin(elapsed * 0.003) * 0.2 + 0.8;
        if (shapeMesh.material && shapeMesh.material.opacity !== undefined) {
          shapeMesh.material.opacity = shapePulse;
        } else if (shapeMesh.children && shapeMesh.children.length > 0) {
          // Voor zandloper group
          shapeMesh.children.forEach(child => {
            if (child.material && child.material.opacity !== undefined) {
              child.material.opacity = shapePulse;
            }
          });
        }
      }
      
      requestAnimationFrame(animate);
    }
    
    animate();
  }

  // ===================== VORTEX / TWIRL ANIMATIE =====================
  startVortexAnimation(targetPos, shapeMesh) {
    if (this.vortexActive) return; // voorkom dubbele
    this.vortexActive = true;

    const scene = window.scene;
    if (!scene) return;

    // ===== 1. Spawn nieuwe sterren (200% van huidige count) =====
    const currentStarCount = (window.whiteStars && window.whiteStars.length) ? window.whiteStars.length : 1000;
    const extraStarCount = Math.round(currentStarCount * 2); // +200 %
    const newStars = [];
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    for (let i = 0; i < extraStarCount; i++) {
      const geo = new THREE.SphereGeometry(4, 6, 6);
      const star = new THREE.Mesh(geo, starMaterial.clone());
      // Spawn in een bol van 10.000 radius rondom centrum
      const radius = 2000 + Math.random() * 8000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      star.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
      star.scale.setScalar(0.5 + Math.random());
      scene.add(star);
      newStars.push(star);
    }

    // Verzamel alle objecten die we willen weg-twirlen
    const objectsToTwirl = [...newStars];
    scene.traverse(obj => {
      if (obj === shapeMesh) return; // shape blijft staan
      if (obj.userData && obj.userData.isPortal) {
        // Neem de portal ook mee in de twirl --> wordt weggehaald
        objectsToTwirl.push(obj);
        return;
      }
      if (obj.userData && (obj.userData.isClickTarget || obj.userData.isPortalRing)) return;
      if (obj.name && obj.name.startsWith('Zandloper')) return;
      if (obj.type === 'Scene') return;
      // Camera, lights, etc. overslaan
      if (obj.isCamera || obj.isLight) return;
      if (!newStars.includes(obj)) objectsToTwirl.push(obj);
    });

    // Animatie parameters
    const duration = 5000; // ms
    const startTime = performance.now();

    // Sla begininformatie op per object
    objectsToTwirl.forEach(o => {
      o.userData.__twirlStartPos = o.position.clone();
      o.userData.__twirlStartScale = o.scale.clone();
      // Willekeurige beginhoek voor swirl
      o.userData.__twirlAngle = Math.random() * Math.PI * 2;
    });

    const animateTwirl = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);

      objectsToTwirl.forEach(o => {
        const startPos = o.userData.__twirlStartPos;
        // Straal neemt af kwadratisch zodat pad naar binnen kromt
        const radius = startPos.clone().sub(targetPos).length() * (1 - t);
        const angle = o.userData.__twirlAngle + t * 10; // Meerdere omwentelingen
        // Project op horizontale (XZ) vlak voor swirl rond verticale as
        const y = THREE.MathUtils.lerp(startPos.y, targetPos.y, t);
        const x = targetPos.x + Math.cos(angle) * radius;
        const z = targetPos.z + Math.sin(angle) * radius;
        o.position.set(x, y, z);

        // Rotatie toevoegen
        o.rotation.y += 0.4;
        o.rotation.x += 0.2;

        // Schaal laten afnemen
        const s = Math.max(0.001, 1 - t);
        o.scale.setScalar(s);

        // Fade uit (indien materiaal heeft opacity)
        if (o.material && o.material.transparent) {
          o.material.opacity = Math.max(0, 1 - t);
        }
      });

      if (t < 1) {
        requestAnimationFrame(animateTwirl);
      } else {
        // Verwijder alle objecten uit de scene
        objectsToTwirl.forEach(o => {
          if (o.parent) o.parent.remove(o);
        });

        // Verwijder portal zelf indien nog aanwezig
        if (window.portal && window.portal.parent) {
          window.portal.parent.remove(window.portal);
          window.portal = null;
          window.portalActive = false;
        }

        this.vortexActive = false;
        console.log('🌀 Vortex animatie voltooid – alles verdwenen, alleen ShapeChoice over.');

        // Vorm centraliseren en zichtbaar maken
        if (shapeMesh) {
          shapeMesh.position.copy(targetPos);
          shapeMesh.visible = true;
          this.startShapePulseAndNextChapter(shapeMesh, targetPos);
        }
      }
    };

    animateTwirl();
  }

  // === Pulse 3× en start hoofdstuk 2 ===
  startShapePulseAndNextChapter(shapeMesh, centerPos) {
    if (!shapeMesh) return;
    let pulseCount = 0;
    const totalPulses = 3;
    const baseScale = shapeMesh.scale.x || 1;
    const pulseAmplitude = baseScale * 0.3;
    const pulseDuration = 400; // ms per halve cyclus (up of down)
    let pulseStart = performance.now();
    const animatePulse = () => {
      const now = performance.now();
      const t = (now - pulseStart) / (pulseDuration * 2); // volledige cyclus up+down
      if (t >= 1) {
        pulseCount++;
        pulseStart = now;
        if (pulseCount >= totalPulses) {
          // Klaar: vorm verwijderen en hoofdstuk 2 starten
          if (shapeMesh.parent) shapeMesh.parent.remove(shapeMesh);
          this.proceedToNextChapter();
          return;
        }
      }
      // Bereken scale (sinus tussen -1..1)
      const phase = ((now - pulseStart) % (pulseDuration * 2)) / (pulseDuration * 2);
      const scaleOffset = Math.sin(phase * Math.PI * 2) * pulseAmplitude;
      const newScale = baseScale + scaleOffset;
      shapeMesh.scale.set(newScale, newScale, newScale);
      requestAnimationFrame(animatePulse);
    };
    animatePulse();
  }

  proceedToNextChapter() {
    console.log('➡️ Automatisch doorgaan naar hoofdstuk 2');
    if (window.chapterManager && typeof window.chapterManager.completeLevel === 'function') {
      const currentLevel = window.chapterManager.getCurrentLevel ? window.chapterManager.getCurrentLevel() : 1;
      window.chapterManager.completeLevel(currentLevel);
    } else {
      // Placeholder: herlaad pagina of toon bericht
      const msg = document.createElement('div');
      msg.textContent = 'Hoofdstuk 2 (Brutalism style) laad...';
      msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#000;color:#fff;padding:24px 40px;font-size:1.6em;z-index:10002;';
      document.body.appendChild(msg);
      setTimeout(()=>{ location.reload(); }, 1500);
    }
  }

  // Voeg click listener toe op shape om volgend hoofdstuk te starten
  setupShapeClickForNextChapter(shapeMesh) {
    if (!shapeMesh) return;
    const renderer = window.renderer;
    const camera = window.camera;
    const scene = window.scene;
    if (!renderer || !camera || !scene) return;

    const clickHandler = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(shapeMesh, true);
      if (intersects.length > 0) {
        console.log('▶️ ShapeChoice aangeklikt – volgend hoofdstuk!');
        renderer.domElement.removeEventListener('click', clickHandler);
        // Trigger volgend hoofdstuk via ChapterManager indien aanwezig
        if (window.chapterManager && typeof window.chapterManager.completeLevel === 'function') {
          const currentLevel = window.chapterManager.getCurrentLevel ? window.chapterManager.getCurrentLevel() : 1;
          window.chapterManager.completeLevel(currentLevel);
        }
        // Fallback: reload of placeholder boodschap
        else {
          const msg = document.createElement('div');
          msg.textContent = 'Volgend hoofdstuk start (placeholder)';
          msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#000;color:#fff;padding:20px 30px;font-size:1.4em;z-index:10002;';
          document.body.appendChild(msg);
        }
      }
    };

    renderer.domElement.addEventListener('click', clickHandler);
  }

  // Public methods
  resetCollision() {
    console.log('🔄 Collision state gereset');
    this.collisionDetected = false;
    window.collisionDetected = false;
    
    // Reset ook de globale flag in main.js
    if (window.sollyCore) {
      window.sollyCore.setCanMove(true);
    }
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

  // Start Level 2 after shape choice
  startLevel2AfterShapeChoice(shape) {
    console.log(`🚀 Starting Level 2 after shape choice: ${shape}`);
    
    // Cleanup current game state AFTER vortex animation
    this.cleanupCurrentGameState();
    
    // Start Level 2
    if (window.level2Manager) {
      window.level2Manager.startLevel();
    } else if (window.Level2Manager) {
      // Fallback: maak nieuwe instantie als die nog niet bestaat
      console.log('🔄 Creating new Level2Manager instance');
      window.level2Manager = new Level2Manager();
      window.level2Manager.startLevel();
    } else {
      console.error('❌ Level2Manager not available - falling back to main game');
      // Fallback: toon bericht en ga terug naar hoofdgame
      this.showLevel2UnavailableMessage();
    }
  }

  // Show message when Level 2 is unavailable
  showLevel2UnavailableMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #8A2BE2, #4B0082);
      color: white;
      padding: 30px 40px;
      border-radius: 15px;
      font-family: 'Open Sans', sans-serif;
      font-size: 18px;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 8px 25px rgba(138, 43, 226, 0.4);
      text-align: center;
      border: 2px solid #9370DB;
    `;
    message.innerHTML = `
      🎯 Level 2: De Cubus<br>
      <span style="font-size: 14px; opacity: 0.9;">Wordt geladen...</span>
    `;
    document.body.appendChild(message);
    
    // Remove message after 3 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.remove();
      }
    }, 3000);
  }

  // Cleanup current game state before starting Level 2
  cleanupCurrentGameState() {
    console.log('🧹 Cleaning up current game state for Level 2');
    
    // Reset collision detection
    this.resetCollision();
    
    // Hide Solly1 (but don't remove - vortex needs it)
    if (window.solly1) {
      window.solly1.visible = false;
    }
    
    // Hide Solly2 (but don't remove - vortex needs it)
    if (window.solly2) {
      window.solly2.visible = false;
    }
    
    // Hide planets (but don't remove - vortex needs them)
    if (window.planets) {
      window.planets.forEach(planet => {
        if (planet) planet.visible = false;
      });
    }
    
    // Hide stars (but don't remove - vortex needs them)
    if (window.whiteStars) {
      window.whiteStars.forEach(star => {
        if (star) star.visible = false;
      });
    }
    
    // Remove portal if exists
    if (window.portal && window.scene) {
      window.scene.remove(window.portal);
      window.portal = null;
      window.portalActive = false;
    }
    
    // Remove any existing portals from scene
    const portalElements = ['ShapePortal', 'PortalInnerRing', 'PortalClickTarget', 'PortalDropZone'];
    portalElements.forEach(name => {
      const element = window.scene.getObjectByName(name);
      if (element) {
        window.scene.remove(element);
      }
    });
    
    // Reset portal state
    window.portalClicked = false;
    
    console.log('✅ Game state cleaned up for Level 2 (objects hidden, not removed)');
  }
}

// Maak globaal beschikbaar
window.CollisionManager = CollisionManager; 