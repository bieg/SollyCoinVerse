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

    // Zet camera dichterbij voor groot beeld, maar iets naar rechts zodat panel links zichtbaar blijft
    camera.position.set(1200,600,1200);
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
    const term = document.createElement('div');
    term.id = 'brutal-terminal';
    term.style.cssText='position:fixed;top:20px;right:20px;padding:20px;border:3px solid #0f0;background:#000;font-family:monospace;color:#f00;text-transform:uppercase;z-index:10000;';
    term.innerHTML='<b>SOLLYVERSE TERMINAL</b><br>SYSTEM: brutalist mode active<br>STATUS: ready';
    document.body.appendChild(term);
  }

  function createCube(){
    cubeGroup = new THREE.Group();
    const size = 800; // 200% groter
    // Wireframe via EdgesGeometry – altijd alle 12 randen
    const boxGeo = new THREE.BoxGeometry(size,size,size);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color:0xffffff}));
    cubeGroup.add(line);

    // Corner placeholders
    const placeholderGeo = new THREE.BoxGeometry(80,80,80);
    const placeholderMat = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    const corners = [
      [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
      [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]
    ];
    corners.forEach((c,i)=>{
      const m = placeholderMat.clone();
      const mesh = new THREE.Mesh(placeholderGeo,m);
      mesh.position.set(c[0]*size/2,c[1]*size/2,c[2]*size/2);
      mesh.userData.cornerIndex=i;
      cubeGroup.add(mesh);
      placeholders.push({mesh,filled:false});
    });

    scene.add(cubeGroup);
  }

  function createShapeChoices(){
    const shape = (window.gameManager && window.gameManager.getCurrentShape) ? window.gameManager.getCurrentShape() : 'piramide';
    const shapes = Array(8).fill(shape);
    // Positioneer in linkerhoek-box naast kubus (2 kolommen x 4 rijen)
    const shapeW=100, shapeH=100;
    const baseX = -900; // links van kubus
    const baseY = 400;
    const colGap = 140;
    const rowGap = 140;
    shapes.forEach((s,idx)=>{
      const geo = createGeometry(s);
      const mat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
      const mesh = new THREE.Mesh(geo,mat);
      const col = idx % 2;
      const row = Math.floor(idx/2);
      mesh.position.set(baseX + col*colGap, baseY - row*rowGap, -70);
      mesh.userData.shape=s;
      dragShapes.push(mesh);
      scene.add(mesh);
    });

    // Frame rond panel
    const panelW = colGap + shapeW;
    const panelH = rowGap*3 + shapeH;
    const frameGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-panelW/2,  panelH/2, -80),
      new THREE.Vector3( panelW/2,  panelH/2, -80),
      new THREE.Vector3( panelW/2, -panelH/2, -80),
      new THREE.Vector3(-panelW/2, -panelH/2, -80),
      new THREE.Vector3(-panelW/2,  panelH/2, -80)
    ]);
    const frame = new THREE.Line(frameGeo, new THREE.LineBasicMaterial({color:0xffffff}));
    frame.position.set(baseX + colGap/2 - shapeW/2, baseY - rowGap, 0);
    scene.add(frame);
  }

  function createGeometry(shape){
    // Voor hoofdstuk 2 gebruiken we platte vierkanten ongeacht shape
    return new THREE.BoxGeometry(100,100,20);
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
    dragged.position.copy(intersect.sub(offset));
  }
  function onPointerUp(){
    if(isDragging&&dragged){
      // Check collision met placeholders
      const hit=placeholders.find(p=>!p.filled&&p.mesh.position.distanceTo(dragged.position)<40);
      if(hit){
        // Snap & clone
        const clone=dragged.clone();
        clone.position.copy(hit.mesh.position);
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
      spinAndDisappear();
    }
  }

  function spinAndDisappear(){
    const start=performance.now();
    const duration=3000;
    const animate=()=>{
      const t=(performance.now()-start)/duration;
      cubeGroup.rotation.x=t*Math.PI*2;
      cubeGroup.rotation.y=t*Math.PI*2;
      if(t<1){requestAnimationFrame(animate);}else{
        scene.remove(cubeGroup);
      }
    };
    animate();
  }
})(); 