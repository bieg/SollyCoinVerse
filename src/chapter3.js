// ===================================================================================
// ==                            CHAPTER 3: NEON CYBERPUNK                       ==
// ==                                                                             ==
// ==      Geïnspireerd door Arcane en Into the Spider-Verse                     ==
// ==      - Neon lijnen en glitch effects                                       ==
// ==      - Fel roze, cyan, geel, paars (hoog contrast)                         ==
// ==      - Comic book style shading                                            ==
// ==      - Data streams en energetic movement                                  ==
// ===================================================================================

(function() {
  'use strict';

  // Debug toggle
  const DEBUG = false;
  function debugLog(...args) {
    if (DEBUG) {
      console.log('[Chapter3]', ...args);
    }
  }

  // Three.js references
  let scene, camera, renderer, controls;
  
  // Chapter 3 specific variables
  let neonCube;
  let dataStreams = [];
  let glitchEffects = [];
  let comicShading = null;
  
  // Neon color palette (Arcane/Spider-Verse inspired)
  const NEON_COLORS = {
    pink: 0xFF006E,
    cyan: 0x00F5FF,
    yellow: 0xFFFF00,
    purple: 0xB300FF,
    white: 0xFFFFFF,
    black: 0x000000
  };

  // ===================================================================================
  // ⭐ INITIALIZATION
  // ===================================================================================

  function initChapter3() {
    debugLog('🎨 Initializing Chapter 3: Neon Cyberpunk');
    
    // Get Three.js globals
    scene = window.scene;
    renderer = window.renderer;
    controls = window.controls;
    
    if (!scene || !renderer) {
      console.warn('⚠️ Scene not available, retrying...');
      setTimeout(() => {
        if (window.scene && window.renderer) {
          initChapter3();
        }
      }, 500);
      return;
    }

    // Mark chapter 3 as active
    window.level3Active = true;
    
    // Update chapter in ChapterManager
    if (window.chapterManager) {
      window.chapterManager.setCurrentChapter(3);
      console.log('📚 Chapter 3 active in ChapterManager');
    }

    // Setup camera for neon cyberpunk view
    setupCamera();
    
    // Clear previous chapter elements
    clearPreviousChapter();
    
    // Setup neon environment
    setupNeonEnvironment();
    
    // Setup neon cube with glitch effect
    setupNeonCube();
    
    // Setup data streams
    setupDataStreams();
    
    // Setup comic book shading
    setupComicShading();
    
    // Setup UI
    setupChapter3UI();
    
    // Start animation loop
    animateChapter3();
    
    console.log('✅ Chapter 3 initialized successfully');
  }

  // ===================================================================================
  // ⭐ CAMERA SETUP
  // ===================================================================================

  function setupCamera() {
    // Dynamic camera with perspective for more dramatic effect
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);
    
    // Position camera for cyberpunk angle
    camera.position.set(0, 800, 2000);
    camera.lookAt(0, 0, 0);
    
    window.camera = camera;
    debugLog('📷 Camera setup complete');
  }

  // ===================================================================================
  // ⭐ CLEAR PREVIOUS CHAPTER
  // ===================================================================================

  function clearPreviousChapter() {
    // Remove all meshes from previous chapters
    const objectsToRemove = [];
    scene.traverse((object) => {
      if (object.isMesh && object.userData.chapter !== 3) {
        objectsToRemove.push(object);
      }
    });
    
    objectsToRemove.forEach(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
      scene.remove(object);
    });
    
    debugLog('🧹 Previous chapter elements cleared');
  }

  // ===================================================================================
  // ⭐ NEON ENVIRONMENT
  // ===================================================================================

  function setupNeonEnvironment() {
    // Dark background for neon to pop
    scene.background = new THREE.Color(NEON_COLORS.black);
    scene.fog = new THREE.FogExp2(NEON_COLORS.purple, 0.0005);
    
    // Neon grid floor (Tron style)
    createNeonGrid();
    
    // Neon lights
    createNeonLights();
    
    debugLog('🌃 Neon environment setup complete');
  }

  function createNeonGrid() {
    const gridSize = 5000;
    const divisions = 50;
    
    // Create grid with neon cyan lines
    const gridHelper = new THREE.GridHelper(gridSize, divisions, NEON_COLORS.cyan, NEON_COLORS.pink);
    gridHelper.position.y = -500;
    gridHelper.material.opacity = 0.5;
    gridHelper.material.transparent = true;
    gridHelper.userData.chapter = 3;
    scene.add(gridHelper);
    
    // Add glow effect to grid
    const gridGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(NEON_COLORS.cyan) },
        color2: { value: new THREE.Color(NEON_COLORS.pink) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec2 vUv;
        
        void main() {
          float wave = sin(vUv.x * 10.0 + time) * 0.5 + 0.5;
          vec3 color = mix(color1, color2, wave);
          gl_FragColor = vec4(color, 0.3);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    const gridGlowGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const gridGlow = new THREE.Mesh(gridGlowGeometry, gridGlowMaterial);
    gridGlow.rotation.x = -Math.PI / 2;
    gridGlow.position.y = -499;
    gridGlow.userData.chapter = 3;
    gridGlow.userData.isAnimated = true;
    scene.add(gridGlow);
  }

  function createNeonLights() {
    // Neon pink point light
    const pinkLight = new THREE.PointLight(NEON_COLORS.pink, 2, 3000);
    pinkLight.position.set(-1000, 500, 500);
    pinkLight.userData.chapter = 3;
    scene.add(pinkLight);
    
    // Neon cyan point light
    const cyanLight = new THREE.PointLight(NEON_COLORS.cyan, 2, 3000);
    cyanLight.position.set(1000, 500, -500);
    cyanLight.userData.chapter = 3;
    scene.add(cyanLight);
    
    // Neon purple ambient light
    const ambientLight = new THREE.AmbientLight(NEON_COLORS.purple, 0.3);
    ambientLight.userData.chapter = 3;
    scene.add(ambientLight);
    
    debugLog('💡 Neon lights added');
  }

  // ===================================================================================
  // ⭐ NEON CUBE WITH GLITCH EFFECT
  // ===================================================================================

  function setupNeonCube() {
    // Create cube with neon edges
    const cubeSize = 600;
    const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    
    // Transparent material for cube faces
    const faceMaterial = new THREE.MeshStandardMaterial({
      color: NEON_COLORS.purple,
      transparent: true,
      opacity: 0.1,
      metalness: 0.8,
      roughness: 0.2,
      emissive: NEON_COLORS.purple,
      emissiveIntensity: 0.5
    });
    
    neonCube = new THREE.Mesh(geometry, faceMaterial);
    neonCube.userData.chapter = 3;
    neonCube.userData.isGlitching = true;
    scene.add(neonCube);
    
    // Add neon edges
    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: NEON_COLORS.cyan,
      linewidth: 3
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    edges.userData.chapter = 3;
    neonCube.add(edges);
    
    // Add corner spheres with glow
    addNeonCorners(neonCube, cubeSize);
    
    debugLog('🔷 Neon cube created');
  }

  function addNeonCorners(cube, size) {
    const cornerPositions = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
    ];
    
    const colors = [
      NEON_COLORS.pink, NEON_COLORS.cyan, NEON_COLORS.yellow, NEON_COLORS.purple,
      NEON_COLORS.cyan, NEON_COLORS.pink, NEON_COLORS.purple, NEON_COLORS.yellow
    ];
    
    cornerPositions.forEach((pos, i) => {
      const sphereGeometry = new THREE.SphereGeometry(30, 32, 32);
      const sphereMaterial = new THREE.MeshStandardMaterial({
        color: colors[i],
        emissive: colors[i],
        emissiveIntensity: 1,
        metalness: 0.9,
        roughness: 0.1
      });
      
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(pos[0] * size / 2, pos[1] * size / 2, pos[2] * size / 2);
      sphere.userData.chapter = 3;
      sphere.userData.cornerIndex = i;
      sphere.userData.isPulsing = true;
      cube.add(sphere);
      
      // Add glow
      const glowGeometry = new THREE.SphereGeometry(40, 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: colors[i],
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      sphere.add(glow);
    });
  }

  // ===================================================================================
  // ⭐ DATA STREAMS
  // ===================================================================================

  function setupDataStreams() {
    // Create 20 data streams flowing around the cube
    for (let i = 0; i < 20; i++) {
      createDataStream(i);
    }
    
    debugLog('📊 Data streams created');
  }

  function createDataStream(index) {
    const particles = [];
    const particleCount = 50;
    const radius = 800 + Math.random() * 200;
    
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.BoxGeometry(5, 5, 5);
      const color = index % 2 === 0 ? NEON_COLORS.cyan : NEON_COLORS.pink;
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8
      });
      
      const particle = new THREE.Mesh(geometry, material);
      particle.userData.chapter = 3;
      particle.userData.streamIndex = index;
      particle.userData.particleIndex = i;
      particle.userData.angle = (i / particleCount) * Math.PI * 2;
      particle.userData.radius = radius;
      particle.userData.height = Math.random() * 1000 - 500;
      
      scene.add(particle);
      particles.push(particle);
    }
    
    dataStreams.push(particles);
  }

  // ===================================================================================
  // ⭐ COMIC BOOK SHADING (POST-PROCESSING)
  // ===================================================================================

  function setupComicShading() {
    // This would typically use THREE.EffectComposer with custom shaders
    // For now, we'll apply it to individual objects
    debugLog('🎭 Comic shading setup (placeholder)');
  }

  // ===================================================================================
  // ⭐ UI SETUP
  // ===================================================================================

  function setupChapter3UI() {
    // Remove old UI
    const oldUI = document.getElementById('chapter3-ui');
    if (oldUI) oldUI.remove();
    
    // Create neon cyberpunk UI
    const ui = document.createElement('div');
    ui.id = 'chapter3-ui';
    ui.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 40px;
      background: linear-gradient(135deg, rgba(255,0,110,0.1), rgba(0,245,255,0.1));
      border: 3px solid #00F5FF;
      border-radius: 0;
      color: #00F5FF;
      font-family: 'Courier New', monospace;
      font-size: 24px;
      text-align: center;
      z-index: 1000;
      box-shadow: 0 0 30px rgba(0,245,255,0.8), inset 0 0 30px rgba(255,0,110,0.3);
      text-shadow: 0 0 10px #00F5FF, 0 0 20px #FF006E;
      animation: glitch 0.3s infinite;
    `;
    
    ui.innerHTML = `
      <h1 style="margin: 0 0 20px 0; font-size: 48px; color: #FF006E;">
        ⚡ CHAPTER 3: NEON CYBERPUNK ⚡
      </h1>
      <p style="margin: 10px 0; color: #FFD700;">Enter the digital realm...</p>
      <p style="margin: 10px 0; font-size: 16px; color: #B300FF;">
        Inspired by Arcane & Into the Spider-Verse
      </p>
      <button id="chapter3-start-btn" style="
        margin-top: 30px;
        padding: 15px 40px;
        background: linear-gradient(135deg, #FF006E, #B300FF);
        border: 2px solid #00F5FF;
        color: white;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        text-transform: uppercase;
        box-shadow: 0 0 20px #FF006E;
        transition: all 0.3s;
      ">
        🚀 Start Mission
      </button>
    `;
    
    // Add glitch animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes glitch {
        0%, 100% { clip-path: inset(0 0 0 0); }
        25% { clip-path: inset(2px 0 0 0); transform: translate(-2px, 2px); }
        50% { clip-path: inset(0 0 2px 0); transform: translate(2px, -2px); }
        75% { clip-path: inset(0 2px 0 0); transform: translate(-2px, -2px); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(ui);
    
    // Start button handler
    document.getElementById('chapter3-start-btn').addEventListener('click', () => {
      ui.remove();
      console.log('🎮 Chapter 3 mission started!');
    });
    
    debugLog('🖥️ UI setup complete');
  }

  // ===================================================================================
  // ⭐ ANIMATION LOOP
  // ===================================================================================

  function animateChapter3() {
    if (!window.level3Active) return;
    
    requestAnimationFrame(animateChapter3);
    
    const time = Date.now() * 0.001;
    
    // Animate neon cube (slow rotation + glitch)
    if (neonCube) {
      neonCube.rotation.y += 0.005;
      neonCube.rotation.x += 0.002;
      
      // Random glitch effect
      if (Math.random() < 0.02) {
        neonCube.position.x = (Math.random() - 0.5) * 10;
        neonCube.position.y = (Math.random() - 0.5) * 10;
        setTimeout(() => {
          if (neonCube) {
            neonCube.position.x = 0;
            neonCube.position.y = 0;
          }
        }, 50);
      }
      
      // Pulse corner spheres
      neonCube.children.forEach(child => {
        if (child.userData.isPulsing) {
          const scale = 1 + Math.sin(time * 3 + child.userData.cornerIndex) * 0.2;
          child.scale.set(scale, scale, scale);
        }
      });
    }
    
    // Animate data streams
    dataStreams.forEach((stream, streamIndex) => {
      stream.forEach(particle => {
        particle.userData.angle += 0.02;
        const angle = particle.userData.angle;
        const radius = particle.userData.radius;
        
        particle.position.x = Math.cos(angle) * radius;
        particle.position.z = Math.sin(angle) * radius;
        particle.position.y = particle.userData.height + Math.sin(time + particle.userData.particleIndex) * 50;
        
        particle.rotation.y += 0.1;
      });
    });
    
    // Animate grid glow
    scene.traverse(object => {
      if (object.userData.isAnimated && object.material && object.material.uniforms) {
        object.material.uniforms.time.value = time;
      }
    });
    
    // Render
    if (renderer) {
      renderer.render(scene, camera);
    }
  }

  // ===================================================================================
  // ⭐ EXPORT
  // ===================================================================================

  // Make initChapter3 globally available
  window.initChapter3 = initChapter3;
  
  debugLog('✅ Chapter 3 module loaded');

})();

