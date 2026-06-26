/* global THREE, renderer, scene, camera, cameraFollowDuration, solly1, solly2, canSollyMove, solly1Movement, portal, portalActive, portalClicked, portalMovement */
/* global cameraFollowActive:true, cameraFollowStartTime:true, cameraFollowStart:true, cameraFollowTarget:true */
// Animation and rendering functions

function animate() {
  requestAnimationFrame(animate);
  if (!window.isPaused && !window.solly1DragActive) {
    updateSolly1Movement();
    updateSolly2Movement();
    updatePortalMovement();
  }
  updateCameraFollow();
  if (window.micAnalyser) window.micAnalyser.tick();
  renderer.render(scene, camera);
}

// Key controls for camera
let keyState = {};
document.addEventListener('keydown', (e) => {
  keyState[e.code] = true;
});
document.addEventListener('keyup', (e) => {
  keyState[e.code] = false;
});

function updateCameraControls() {
  if (!camera) return;
  let moved = false;
  const moveSpeed = 40;
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  const right = new THREE.Vector3();
  right.crossVectors(camera.up, forward).normalize();

  if (keyState['ArrowUp'] || keyState['KeyW']) {
    camera.position.addScaledVector(forward, moveSpeed);
    moved = true;
  }
  if (keyState['ArrowDown'] || keyState['KeyS']) {
    camera.position.addScaledVector(forward, -moveSpeed);
    moved = true;
  }
  if (keyState['ArrowLeft'] || keyState['KeyA']) {
    camera.position.addScaledVector(right, moveSpeed);
    moved = true;
  }
  if (keyState['ArrowRight'] || keyState['KeyD']) {
    camera.position.addScaledVector(right, -moveSpeed);
    moved = true;
  }
  if (moved) {
    camera.lookAt(0, 0, 0);
  }
}

function updateCameraFollow() {
  if (!cameraFollowActive) return;
  const now = Date.now();
  const elapsed = now - cameraFollowStartTime;
  const t = Math.min(elapsed / cameraFollowDuration, 1);
  const ease = 1 - Math.pow(1 - t, 3);
  camera.position.lerpVectors(cameraFollowStart, cameraFollowTarget, ease);
  const shape = scene.getObjectByName('ShapeChoice');
  if (shape) camera.lookAt(shape.position);

  if (t >= 1) {
    cameraFollowActive = false;
    camera.position.copy(cameraFollowTarget);
    if (shape) camera.lookAt(shape.position);
    console.log('Camera-follow animatie afgerond, camera staat nu vast.');
  }
}

function startCameraFollowToShapeChoice() {
  const shape = scene.getObjectByName('ShapeChoice');
  if (!shape) return;
  cameraFollowActive = true;
  cameraFollowTarget = shape.position.clone().add(new THREE.Vector3(0, 400, 1200));
  cameraFollowStart = camera.position.clone();
  cameraFollowStartTime = Date.now();
}

// Solly movement functions
function updateSolly1Movement() {
  if (window.solly1DragActive) return;
  if (window.solly1MovementPaused) return;
  if (!solly1 || !canSollyMove) return;

  solly1Movement.time += 0.016;
  const time = solly1Movement.time;
  const amplitude = solly1Movement.amplitude;
  const frequency = solly1Movement.frequency;

  const x = Math.sin(time * frequency) * amplitude;
  const y = Math.cos(time * frequency * 0.7) * amplitude * 0.3;
  const z = Math.sin(time * frequency * 0.5) * amplitude * 0.8;

  solly1.position.set(x, y, z);
}

function updateSolly2Movement() {
  if (!solly2 || !canSollyMove) return;

  // Solly2 jaagt op Solly1
  if (solly1) {
    const direction = new THREE.Vector3().subVectors(solly1.position, solly2.position);
    const distance = direction.length();

    if (distance > 100) {
      direction.normalize();
      const speed = 2;
      solly2.position.add(direction.multiplyScalar(speed));
    }
  }
}

// Portal movement
function updatePortalMovement() {
  if (!portal || !portalActive) return;

  if (!portalClicked) {
    portalMovement.time += 0.016;
    const time = portalMovement.time;
    const radius = 2000;
    const speed = 0.08;

    const theta = time * speed;
    const phi = Math.sin(time * speed * 0.3) * (Math.PI / 3);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta) * 0.8;
    const z = radius * Math.cos(phi);

    portal.position.set(x, y, z);
  }

  if (portal.userData && portal.userData.time !== undefined) {
    portal.userData.time += 0.02;
    const internalTime = portal.userData.time;

    const particleCloud = portal.children[0];
    if (particleCloud) {
      particleCloud.rotation.y += 0.001;

      particleCloud.children.forEach((plane) => {
        if (!plane || !plane.material) return;

        plane.lookAt(camera.position);

        const speed = plane.userData.animationSpeed || 1;
        plane.position.y += Math.sin(internalTime * speed + (plane.userData.yPhase || 0)) * 0.05;

        const pulse = Math.sin(internalTime * speed + (plane.userData.baseAngle || 0));
        plane.material.opacity = Math.max(0.8, 1.0 + pulse * 0.2);
      });
    }

    const glow = portal.children[1];
    if (glow && glow.material) {
      const pulse = 1 + Math.sin(internalTime * 2) * 0.05;
      glow.scale.set(pulse, pulse, pulse);
      glow.material.opacity = 0.25 + Math.sin(internalTime * 2.5) * 0.1;
    }
  }
}
