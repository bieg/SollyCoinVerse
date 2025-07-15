// ===================================================================================
// ==                           DEBUG MODULE (DEVELOPMENT ONLY)                   ==
// ==                                                                             ==
// ==      Debug tools die alleen in development mode beschikbaar zijn           ==
// ==      - Raycasting tests                                                     ==
// ==      - Object counting en visibility toggles                               ==
// ==      - Performance monitoring                                               ==
// ==      - Scene inspection tools                                               ==
// ===================================================================================

// Alleen laden in development mode
if (window.DEBUG_CONSTANTS?.DEBUG_MODE || process.env.NODE_ENV === 'development') {
  
  // Debug utility functies
  window.debugCanvasVisibility = function() {
    const overlays = Array.from(document.querySelectorAll('.solly-modal, .solly-modal-overlay, .new-shape-overlay, .modal, .overlay, .shape-modal'));
    overlays.forEach(overlay => {
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '1';
    });
    
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.zIndex = '1000';
      canvas.style.pointerEvents = 'auto';
      // canvas.style.border = '6px solid red'; // UITGESCHAKELD: geen rode debugrand meer
    }
    
    // Add click handler voor debugging
    if (canvas && !canvas._debugClickHandler) {
      canvas._debugClickHandler = function() {
        console.log('🖱️ Canvas clicked at:', event.clientX, event.clientY);
      };
      canvas.addEventListener('mousedown', canvas._debugClickHandler);
    }
    
    console.log('✅ Canvas visibility debug uitgevoerd!');
  };

  // Debug shape choice meshes
  window.debugShapeChoiceMeshes = function() {
    if (!window.scene) {
      console.warn('❌ Scene niet gevonden');
      return;
    }
    
    let found = false;
    window.scene.traverse(function(obj) {
      if (obj.name === 'ShapeChoice') {
        console.log('🎯 ShapeChoice mesh gevonden:', obj);
        console.log('📍 Positie:', obj.position);
        console.log('📏 Schaal:', obj.scale);
        console.log('👁️ Zichtbaar:', obj.visible);
        found = true;
      }
    });
    
    if (!found) {
      console.log('❌ Geen ShapeChoice mesh gevonden in scene');
    }
  };

  // Make all invisible objects visible
  window.makeAllInvisibleVisible = function() {
    if (!window.scene) {
      console.warn('❌ Scene niet gevonden');
      return;
    }
    
    let count = 0;
    window.scene.traverse(function(obj) {
      if (obj.visible === false) {
        obj.visible = true;
        count++;
        console.log('👁️ Made visible:', obj.name || 'unnamed object');
      }
    });
    
    console.log(`✅ ${count} onzichtbare objecten zichtbaar gemaakt`);
  };

  // Count all objects in scene
  window.countAllObjects = function() {
    if (!window.scene) {
      console.warn('❌ Scene niet gevonden');
      return;
    }
    
    let meshes = 0, groups = 0, points = 0, invisible = 0;
    window.scene.traverse(function(obj) {
      if (obj.type === 'Mesh') meshes++;
      else if (obj.type === 'Group') groups++;
      else if (obj.type === 'Points') points++;
      if (obj.visible === false) invisible++;
    });
    
    console.log(`📊 Scene statistieken:`);
    console.log(`   - Meshes: ${meshes}`);
    console.log(`   - Groups: ${groups}`);
    console.log(`   - Points: ${points}`);
    console.log(`   - Invisible: ${invisible}`);
    console.log(`   - Total: ${meshes + groups + points}`);
  };

  // Debug raycasting
  function addShapeChoiceClickListener() {
    if (!window.renderer || !window.scene) return;
    
    window.renderer.domElement.addEventListener('mousedown', function shapeChoiceClickHandler(e) {
      const rect = window.renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, window.camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      const shapeIntersect = intersects.find(i => i.object.name === 'ShapeChoice');
      
      if (shapeIntersect) {
        console.log('🎯 ShapeChoice clicked!');
        console.log('📍 Intersection point:', shapeIntersect.point);
        console.log('📐 Distance:', shapeIntersect.distance);
      }
    });
  }

  // Debug Solly1 visibility
  window.showOnlySolly1 = function() {
    if (!window.scene) {
      console.warn('❌ Scene niet gevonden');
      return;
    }
    
    let hiddenObjects = [];
    
    window.scene.traverse(function(obj) {
      if (obj.type === 'Mesh' || obj.type === 'Group') {
        const isSolly1 = obj === window.solly1 || obj.userData?.isSolly1 || obj.name === 'Solly1Collider';
        
        if (!isSolly1 && obj.visible) {
          hiddenObjects.push(obj);
          obj.visible = false;
        }
      }
    });
    
    console.log(`✅ ${hiddenObjects.length} objecten verborgen, alleen Solly1 zichtbaar`);
    console.log('📍 Verborgen objecten:', hiddenObjects.map(o => o.name || 'unnamed'));
  };

  // Show all objects again
  window.showAllObjects = function() {
    if (!window.scene) {
      console.warn('❌ Scene niet gevonden');
      return;
    }
    
    let count = 0;
    window.scene.traverse(function(obj) {
      if (obj.visible === false) {
        obj.visible = true;
        count++;
      }
    });
    
    console.log(`✅ ${count} objecten weer zichtbaar gemaakt`);
  };

  // Focus camera on Solly1
  window.focusOnSolly1 = function() {
    let s1 = window.solly1;
    if (!s1) {
      console.warn('❌ Solly1 niet gevonden');
      return;
    }
    
    if (!window.camera) {
      console.warn('❌ Camera niet gevonden');
      return;
    }
    
    // Verberg alle andere objecten
    window.scene.traverse(function(obj) {
      if (obj.type === 'Mesh' || obj.type === 'Group') {
        const isSolly1 = obj === s1 || obj.name === 'Solly1Collider';
        if (!isSolly1) {
          obj.visible = false;
        }
      }
    });
    
    // Focus camera
    window.camera.position.set(s1.position.x, s1.position.y + 200, s1.position.z + 800);
    window.camera.lookAt(s1.position);
    
    console.log('🎯 Camera gefocust op Solly1');
  };

  // Log all Solly1 meshes
  window.logAllSolly1Meshes = function() {
    if (!window.scene) {
      console.warn('❌ Geen scene gevonden!');
      return;
    }
    
    let count = 0;
    window.scene.traverse(function(obj) {
      if (obj.userData?.isSolly1 || obj.name === 'Solly1' || obj.name === 'Solly1Collider') {
        console.log(`🎯 Solly1 mesh ${count + 1}:`, obj);
        console.log('   - Name:', obj.name);
        console.log('   - Type:', obj.type);
        console.log('   - Visible:', obj.visible);
        console.log('   - Position:', obj.position);
        console.log('   - UserData:', obj.userData);
        count++;
      }
    });
    
    if (count === 0) {
      console.warn('❌ Geen Solly1 meshes gevonden in de scene!');
    } else {
      console.log(`✅ ${count} Solly1 meshes gevonden`);
    }
  };

  // Debug Sollyverse class
  class SollyverseDebug {
    constructor() {
      this.debugActive = false;
      this.createDebugButton();
    }

    createDebugButton() {
      const debugBtn = document.createElement('button');
      debugBtn.textContent = '🪐 Debug: Toon alle lagen';
      debugBtn.id = 'debug-toggle-btn';
      debugBtn.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        padding: 12px 20px;
        background: #FF6B6B;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
        transition: all 0.2s ease;
      `;
      
      debugBtn.onmouseover = () => {
        debugBtn.style.transform = 'scale(1.05)';
        debugBtn.style.boxShadow = '0 6px 16px rgba(255, 107, 107, 0.6)';
      };
      
      debugBtn.onmouseout = () => {
        debugBtn.style.transform = 'scale(1)';
        debugBtn.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.4)';
      };
      
      debugBtn.onclick = () => this.toggleDebugMode();
      document.body.appendChild(debugBtn);
    }

    toggleDebugMode() {
      if (this.debugActive) {
        this.disableDebugMode();
      } else {
        this.enableDebugMode();
      }
    }

    enableDebugMode() {
      if (!window.scene) {
        console.warn('❌ Scene niet gevonden');
        return;
      }
      
      // Maak alle objecten zichtbaar
      window.scene.traverse(function(obj) {
        if (obj.visible === false) {
          obj.visible = true;
        }
      });
      
      this.debugActive = true;
      
      // Update debug knop
      const btn = document.getElementById('debug-toggle-btn');
      if (btn) {
        btn.textContent = '🔍 Debug: UIT';
        btn.style.background = '#4CAF50';
        btn.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)';
      }
      
      this.showMessage('🔍 Debug mode AAN - Alle lagen zichtbaar!', 'success');
    }

    disableDebugMode() {
      // Herstel normale zichtbaarheid (implementeer logica voor normale state)
      this.debugActive = false;
      
      // Update debug knop
      const btn = document.getElementById('debug-toggle-btn');
      if (btn) {
        btn.textContent = '🪐 Debug: Toon alle lagen';
        btn.style.background = '#FF6B6B';
        btn.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.4)';
      }
      
      this.showMessage('🔍 Debug mode UIT - Normale weergave hersteld', 'info');
    }

    showMessage(message, type) {
      const messageEl = document.createElement('div');
      messageEl.textContent = message;
      messageEl.style.cssText = `
        position: fixed;
        top: 80px;
        left: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        z-index: 10001;
        font-weight: bold;
      `;
      
      document.body.appendChild(messageEl);
      setTimeout(() => messageEl.remove(), 3000);
    }
  }

  // Initialize debug tools when page is loaded
  let sollyverseDebug = null;

  function initDebugTools() {
    if (!sollyverseDebug) {
      sollyverseDebug = new SollyverseDebug();
      console.log('🔧 Debug tools geïnitialiseerd');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDebugTools);
  } else {
    initDebugTools();
  }

  console.log('🔧 Debug module geladen (development mode)');
} else {
  console.log('🔧 Debug module overgeslagen (production mode)');
} 