// src/chapter2.js
// Hoofdstuk 2 – Brutalist cube puzzle

(function(){
  const CHAPTER2 = {};
  window.initChapter2 = initChapter2;

  let scene, camera, renderer, controls;
  let cubeGroup, placeholders = [], dragShapes = [];
  let isDragging = false, dragged = null, offset = new THREE.Vector3();

  function initChapter2(){
    // Pak globals uit hoofdstuk 1
    scene = window.scene; camera = window.camera; renderer = window.renderer; controls = window.controls;
    if(!scene||!camera||!renderer){ console.error('Scene niet beschikbaar'); return; }

    // Verwijder oude CTA-buttons
    const cta=document.getElementById('cta-buttons');
    if(cta) cta.remove();

    // Maak camera & controls statisch
    if(controls){
      controls.enabled=false;
      controls.enableZoom=false;
      controls.enablePan=false;
      controls.enableRotate=false;
    }

    // Verberg KABOOM teller uit vorig hoofdstuk
    const kaboomEl=document.getElementById('kaboom-counter');
    if(kaboomEl) kaboomEl.style.display='none';

    // Zet camera volledig plat en frontaal - geen 3D perspectief
    camera.position.set(0,0,2000);
    camera.lookAt(0,0,0);

    cleanupChapter1Objects();

    createBrutalistUI();
    createCube();
    createShapeChoices();

    // Pointer events
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
  }

  function cleanupChapter1Objects(){
    // Verwijder alle kinderen behalve camera/lights uit scene
    const keep = new Set();
    scene.traverse(obj=>{ if(obj.isCamera||obj.isLight) keep.add(obj); });
    [...scene.children].forEach(o=>{ if(!keep.has(o)) scene.remove(o); });
  }

  function createBrutalistUI(){
    // Verwijder oude UI elementen
    const oldTerm = document.getElementById('brutal-terminal');
    if (oldTerm) oldTerm.remove();
    
    // Maak nieuwe 2D UI
    const levelIndicator = document.createElement('div');
    levelIndicator.id = 'level2-indicator';
    levelIndicator.style.cssText = `
      position: fixed; top: 20px; left: 20px; padding: 15px 25px;
      background: linear-gradient(135deg, #8A2BE2, #4B0082); color: white;
      border-radius: 10px; font-family: 'Open Sans', sans-serif;
      font-weight: bold; font-size: 18px; z-index: 10000;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    `;
    levelIndicator.innerHTML = '🎯 LEVEL 2: De Cubus (2D)';
    document.body.appendChild(levelIndicator);
    
    const progressCounter = document.createElement('div');
    progressCounter.id = 'wireframe-counter';
    progressCounter.style.cssText = `
      position: fixed; top: 20px; right: 20px; padding: 15px 25px;
      background: linear-gradient(135deg, #FF6B6B, #FF8E53); color: white;
      border-radius: 10px; font-family: 'Open Sans', sans-serif;
      font-weight: bold; font-size: 18px; z-index: 10000;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    `;
    progressCounter.innerHTML = '🔗 Geplaatst: 0/4';
    document.body.appendChild(progressCounter);
    
    const instructions = document.createElement('div');
    instructions.id = 'wireframe-instructions';
    instructions.style.cssText = `
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      padding: 15px 25px; background: rgba(0, 0, 0, 0.8); color: white;
      border-radius: 10px; font-family: 'Open Sans', sans-serif;
      font-weight: bold; font-size: 16px; z-index: 10000;
      border: 2px solid #8A2BE2; text-align: center;
    `;
    instructions.innerHTML = '🎯 Sleep de shapes naar de 4 hoeken van de kubus!';
    document.body.appendChild(instructions);
  }

  function createCube(){
    cubeGroup = new THREE.Group();
    const size = 600; // Kleinere kubus voor 2D weergave
    // Maak een platte 2D kubus - alleen de voorste randen zichtbaar
    const boxGeo = new THREE.BoxGeometry(size,size,size);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color:0xffffff, linewidth: 3}));
    cubeGroup.add(line);
    
    // Zet kubus op Z=0 voor platte weergave
    cubeGroup.position.z = 0;

    // Corner placeholders - alleen de voorste 4 hoeken voor 2D weergave
    const placeholderGeo = new THREE.BoxGeometry(60,60,20); // Platter voor 2D
    const placeholderMat = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    const corners = [
      [-1,-1,0],[1,-1,0],[1,1,0],[-1,1,0] // Alleen voorste hoeken
    ];
    corners.forEach((c,i)=>{
      const m = placeholderMat.clone();
      const mesh = new THREE.Mesh(placeholderGeo,m);
      mesh.position.set(c[0]*size/2,c[1]*size/2,0); // Z=0 voor platte weergave
      mesh.userData.cornerIndex=i;
      cubeGroup.add(mesh);
      placeholders.push({mesh,filled:false});
    });

    scene.add(cubeGroup);
  }

  function createShapeChoices(){
    const shape = (window.gameManager && window.gameManager.getCurrentShape) ? window.gameManager.getCurrentShape() : 'piramide';
    const shapes = Array(4).fill(shape); // Alleen 4 shapes voor 4 hoeken
    // Positioneer in linkerhoek-box naast kubus (2 kolommen x 2 rijen)
    const shapeW=80, shapeH=80;
    const baseX = -800; // links van kubus
    const baseY = 300;
    const colGap = 120;
    const rowGap = 120;
    shapes.forEach((s,idx)=>{
      const geo = createGeometry(s);
      const mat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
      const mesh = new THREE.Mesh(geo,mat);
      const col = idx % 2;
      const row = Math.floor(idx/2);
      mesh.position.set(baseX + col*colGap, baseY - row*rowGap, 0); // Z=0 voor platte weergave
      mesh.userData.shape=s;
      dragShapes.push(mesh);
      scene.add(mesh);
    });

    // Frame rond panel - aangepast voor 2x2 grid
    const panelW = colGap + shapeW;
    const panelH = rowGap + shapeH; // Alleen 1 rij minder
    const frameGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-panelW/2,  panelH/2, 0),
      new THREE.Vector3( panelW/2,  panelH/2, 0),
      new THREE.Vector3( panelW/2, -panelH/2, 0),
      new THREE.Vector3(-panelW/2, -panelH/2, 0),
      new THREE.Vector3(-panelW/2,  panelH/2, 0)
    ]);
    const frame = new THREE.Line(frameGeo, new THREE.LineBasicMaterial({color:0xffffff}));
    frame.position.set(baseX + colGap/2 - shapeW/2, baseY - rowGap/2, 0);
    scene.add(frame);
  }

  function createGeometry(shape){
    // Voor hoofdstuk 2 gebruiken we platte vierkanten ongeacht shape - nog platter voor 2D
    return new THREE.BoxGeometry(80,80,10);
  }

  // === Drag & Drop ===
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onPointerDown(e){
    updateMouse(e);
    raycaster.setFromCamera(mouse,camera);
    const intersects=raycaster.intersectObjects(dragShapes.filter(s=>s.visible));
    if(intersects.length){
      dragged=intersects[0].object;
      const pt=intersects[0].point;
      offset.copy(pt).sub(dragged.position);
      isDragging=true;
      // controls uitgeschakeld – geen camera beweging
    }
  }
  function onPointerMove(e){
    if(!isDragging||!dragged) return;
    updateMouse(e);
    raycaster.setFromCamera(mouse,camera);
    const planeZ=new THREE.Plane(new THREE.Vector3(0,0,1),0);
    const intersect=new THREE.Vector3();
    raycaster.ray.intersectPlane(planeZ,intersect);
    // Houd Z-positie op 0 voor platte 2D weergave
    dragged.position.set(intersect.x - offset.x, intersect.y - offset.y, 0);
  }
  function onPointerUp(){
    if(isDragging&&dragged){
      // Check collision met placeholders - alleen 2D afstand
      const hit=placeholders.find(p=>!p.filled&&Math.sqrt(
        Math.pow(p.mesh.position.x - dragged.position.x, 2) + 
        Math.pow(p.mesh.position.y - dragged.position.y, 2)
      ) < 50);
      if(hit){
        // Snap & clone - houd Z op 0
        const clone=dragged.clone();
        clone.position.set(hit.mesh.position.x, hit.mesh.position.y, 0);
        scene.add(clone);
        hit.filled=true;
        hit.mesh.visible=false;
        dragged.visible=false;
        checkCompletion();
      }
    }
    isDragging=false;dragged=null;
  }

  function updateMouse(e){
    const rect=renderer.domElement.getBoundingClientRect();
    mouse.x=((e.clientX-rect.left)/rect.width)*2-1;
    mouse.y=-( (e.clientY-rect.top)/rect.height)*2+1;
  }

  function checkCompletion(){
    if(placeholders.every(p=>p.filled)){
      // Update progress counter
      const counter = document.getElementById('wireframe-counter');
      if(counter) counter.innerHTML = '🔗 Geplaatst: 4/4 ✅';
      
      // Geen 3D rotatie - gewoon een simpele fade out voor 2D
      fadeOutAndComplete();
    }
  }

  function fadeOutAndComplete(){
    const start=performance.now();
    const duration=2000; // Kortere animatie
    const animate=()=>{
      const t=(performance.now()-start)/duration;
      const opacity = 1 - t;
      
      // Fade out alle objecten
      cubeGroup.children.forEach(child => {
        if(child.material) {
          child.material.opacity = opacity;
          child.material.transparent = true;
        }
      });
      
      if(t<1){
        requestAnimationFrame(animate);
      } else {
        scene.remove(cubeGroup);
        // Toon completion bericht
        showCompletionMessage();
      }
    };
    animate();
  }

  function showCompletionMessage(){
    const msg = document.createElement('div');
    msg.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #8A2BE2, #4B0082); color: white;
      padding: 30px 50px; border-radius: 15px; font-size: 24px; font-weight: bold;
      z-index: 10001; text-align: center; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      border: 3px solid #9370DB; font-family: 'Open Sans', sans-serif;
    `;
    msg.innerHTML = '🎉 HOOFDSTUK 2 VOLTOOID! 🎉<br><br>De Cubus is compleet!';
    document.body.appendChild(msg);
    
    setTimeout(() => {
      if(msg.parentNode) msg.remove();
    }, 3000);
  }
})(); 