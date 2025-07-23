// Portal and UI functions

function createSoftParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 200, 255, 1.0)');
    gradient.addColorStop(0.2, 'rgba(255, 150, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(200, 100, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(150, 50, 255, 0.0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    return new THREE.CanvasTexture(canvas);
}

function createPortal(sollyObject) {
    const boundingBox = new THREE.Box3().setFromObject(sollyObject);
    const sollyShape = sollyObject.userData.shape;
    const sollyScale = sollyObject.userData.scale || 1.0;

    const portalGroup = new THREE.Group();
    const particleCloud = new THREE.Group();
    const particleCount = 3000;
    const particleTexture = createSoftParticleTexture();
    const particleMaterial = new THREE.MeshBasicMaterial({
        map: particleTexture,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
    });

    switch (sollyShape) {
        case 'piramide':
            {
                console.log(`🔮 Mystieke portal wordt op maat gemaakt voor VORM: ${sollyShape}`);
                const boxSize = boundingBox.getSize(new THREE.Vector3());
                const innerSizeX = boxSize.x * 1.25;
                const innerSizeZ = boxSize.z * 1.25;
                const thickness = boxSize.x * 1.5;
                const outerSizeX = innerSizeX + thickness;
                const outerSizeZ = innerSizeZ + thickness;

                // MYSTIEKE PORTAL MET DRIEHOEKIGE BINNENKANT
                // Buitenste ring (mystieke energie)
                const outerRingGeometry = new THREE.RingGeometry(outerSizeX * 0.4, outerSizeX * 0.8, 32);
                const outerRingMaterial = new THREE.MeshBasicMaterial({
                    color: 0x8A2BE2, // Donkerpaars
                    transparent: true,
                    opacity: 0.6,
                    side: THREE.DoubleSide
                });
                const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
                outerRing.rotation.x = -Math.PI / 2;
                outerRing.userData.isPortalRing = true;
                portalGroup.add(outerRing);

                // Binnenste ring (mystieke energie) - DRIEHOEKIGE VORM
                // Gebruik een custom driehoekige vorm in plaats van RingGeometry
                const triangleShape = new THREE.Shape();
                const triangleSize = innerSizeX * 0.4;
                triangleShape.moveTo(0, -triangleSize);
                triangleShape.lineTo(-triangleSize * 0.866, triangleSize * 0.5);
                triangleShape.lineTo(triangleSize * 0.866, triangleSize * 0.5);
                triangleShape.closePath();
                
                const innerRingGeometry = new THREE.ShapeGeometry(triangleShape);
                const innerRingMaterial = new THREE.MeshBasicMaterial({
                    color: 0x9370DB, // Lichter paars
                    transparent: true,
                    opacity: 0.8,
                    side: THREE.DoubleSide
                });
                const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
                innerRing.rotation.x = -Math.PI / 2;
                innerRing.userData.isPortalRing = true;
                portalGroup.add(innerRing);

                // LEEG GAT IN HET MIDDEN - DRIEHOEKIGE VORM
                // Click target voor interactie (driehoek)
                const clickTargetGeometry = new THREE.ShapeGeometry(triangleShape);
                const clickTargetMaterial = new THREE.MeshBasicMaterial({ 
                    transparent: true, 
                    opacity: 0, 
                    side: THREE.DoubleSide 
                });
                const clickTarget = new THREE.Mesh(clickTargetGeometry, clickTargetMaterial);
                clickTarget.rotation.x = -Math.PI / 2;
                clickTarget.userData.isClickTarget = true;
                portalGroup.add(clickTarget);

                // Particle effect rond de portal
                for (let i = 0; i < particleCount; i++) {
                    const planeSize = (Math.random() * 2 + 1) * sollyScale * 0.5;
                    const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
                    const plane = new THREE.Mesh(planeGeometry, particleMaterial.clone());

                    let x, z;
                    do {
                        x = THREE.MathUtils.randFloat(-outerSizeX / 2, outerSizeX / 2);
                        z = THREE.MathUtils.randFloat(-outerSizeZ / 2, outerSizeZ / 2);
                    } while (Math.abs(x) < innerSizeX / 2 && Math.abs(z) < innerSizeZ / 2);

                    const yOffset = (Math.random() - 0.5) * 20 * sollyScale;
                    plane.position.set(x, yOffset, z);

                    plane.userData.animationSpeed = Math.random() * 0.5 + 0.5;
                    plane.userData.yPhase = Math.random() * Math.PI;
                    particleCloud.add(plane);
                }

                portalGroup.add(particleCloud);
            }
            break;

        case 'kubus':
            {
                console.log(`🔮 Mystieke portal wordt op maat gemaakt voor VORM: ${sollyShape}`);
                const boxSize = boundingBox.getSize(new THREE.Vector3());
                const innerSizeX = boxSize.x * 1.25;
                const innerSizeZ = boxSize.z * 1.25;
                const thickness = boxSize.x * 1.5;
                const outerSizeX = innerSizeX + thickness;
                const outerSizeZ = innerSizeZ + thickness;

                // MYSTIEKE PORTAL MET VIERKANTE BINNENKANT
                // Buitenste ring (mystieke energie)
                const outerRingGeometry = new THREE.RingGeometry(outerSizeX * 0.4, outerSizeX * 0.8, 32);
                const outerRingMaterial = new THREE.MeshBasicMaterial({
                    color: 0x8A2BE2, // Donkerpaars
                    transparent: true,
                    opacity: 0.6,
                    side: THREE.DoubleSide
                });
                const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
                outerRing.rotation.x = -Math.PI / 2;
                outerRing.userData.isPortalRing = true;
                portalGroup.add(outerRing);

                // Binnenste ring (mystieke energie) - VIERKANTE VORM
                // Gebruik een custom vierkante vorm in plaats van RingGeometry
                const squareShape = new THREE.Shape();
                const squareSize = innerSizeX * 0.4;
                squareShape.moveTo(-squareSize, -squareSize);
                squareShape.lineTo(squareSize, -squareSize);
                squareShape.lineTo(squareSize, squareSize);
                squareShape.lineTo(-squareSize, squareSize);
                squareShape.closePath();
                
                const innerRingGeometry = new THREE.ShapeGeometry(squareShape);
                const innerRingMaterial = new THREE.MeshBasicMaterial({
                    color: 0x9370DB, // Lichter paars
                    transparent: true,
                    opacity: 0.8,
                    side: THREE.DoubleSide
                });
                const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
                innerRing.rotation.x = -Math.PI / 2;
                innerRing.userData.isPortalRing = true;
                portalGroup.add(innerRing);

                // LEEG GAT IN HET MIDDEN - VIERKANTE VORM
                // Click target voor interactie (vierkant)
                const clickTargetGeometry = new THREE.ShapeGeometry(squareShape);
                const clickTargetMaterial = new THREE.MeshBasicMaterial({ 
                    transparent: true, 
                    opacity: 0, 
                    side: THREE.DoubleSide 
                });
                const clickTarget = new THREE.Mesh(clickTargetGeometry, clickTargetMaterial);
                clickTarget.rotation.x = -Math.PI / 2;
                clickTarget.userData.isClickTarget = true;
                portalGroup.add(clickTarget);

                // Particle effect rond de portal
                for (let i = 0; i < particleCount; i++) {
                    const planeSize = (Math.random() * 2 + 1) * sollyScale * 0.5;
                    const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
                    const plane = new THREE.Mesh(planeGeometry, particleMaterial.clone());

                    let x, z;
                    do {
                        x = THREE.MathUtils.randFloat(-outerSizeX / 2, outerSizeX / 2);
                        z = THREE.MathUtils.randFloat(-outerSizeZ / 2, outerSizeZ / 2);
                    } while (Math.abs(x) < innerSizeX / 2 && Math.abs(z) < innerSizeZ / 2);

                    const yOffset = (Math.random() - 0.5) * 20 * sollyScale;
                    plane.position.set(x, yOffset, z);

                    plane.userData.animationSpeed = Math.random() * 0.5 + 0.5;
                    plane.userData.yPhase = Math.random() * Math.PI;
                    particleCloud.add(plane);
                }

                portalGroup.add(particleCloud);
            }
            break;

        case 'zandloper':
            {
                console.log(`🔮 Mystieke portal wordt op maat gemaakt voor VORM: ${sollyShape}`);
                const boxSize = boundingBox.getSize(new THREE.Vector3());
                const innerSizeX = boxSize.x * 1.25;
                const innerSizeZ = boxSize.z * 1.25;
                const thickness = boxSize.x * 1.5;
                const outerSizeX = innerSizeX + thickness;
                const outerSizeZ = innerSizeZ + thickness;

                // MYSTIEKE PORTAL MET ZANDLOPER BINNENKANT
                // Buitenste ring (mystieke energie)
                const outerRingGeometry = new THREE.RingGeometry(outerSizeX * 0.4, outerSizeX * 0.8, 32);
                const outerRingMaterial = new THREE.MeshBasicMaterial({
                    color: 0x8A2BE2, // Donkerpaars
                    transparent: true,
                    opacity: 0.6,
                    side: THREE.DoubleSide
                });
                const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
                outerRing.rotation.x = -Math.PI / 2;
                outerRing.userData.isPortalRing = true;
                portalGroup.add(outerRing);

                // ZANDLOPER VORM - twee piramides op elkaar
                const zandloperGroup = new THREE.Group();
                
                // Bovenste piramide (punt naar boven)
                const topPyramid = new THREE.Mesh(
                    new THREE.ConeGeometry(innerSizeX * 0.3, innerSizeX * 0.4, 3),
                    new THREE.MeshBasicMaterial({
                        color: 0x9370DB, // Lichter paars
                        transparent: true,
                        opacity: 0.8,
                        side: THREE.DoubleSide
                    })
                );
                topPyramid.position.y = innerSizeX * 0.2;
                topPyramid.rotation.x = Math.PI; // Draai om zodat punt naar boven wijst
                zandloperGroup.add(topPyramid);
                
                // Onderste piramide (punt naar beneden)
                const bottomPyramid = new THREE.Mesh(
                    new THREE.ConeGeometry(innerSizeX * 0.3, innerSizeX * 0.4, 3),
                    new THREE.MeshBasicMaterial({
                        color: 0x9370DB, // Lichter paars
                        transparent: true,
                        opacity: 0.8,
                        side: THREE.DoubleSide
                    })
                );
                bottomPyramid.position.y = -innerSizeX * 0.2;
                zandloperGroup.add(bottomPyramid);
                
                zandloperGroup.rotation.x = -Math.PI / 2;
                zandloperGroup.userData.isPortalRing = true;
                portalGroup.add(zandloperGroup);
                
                // Click target als combinatie van beide piramides
                const clickTargetGroup = new THREE.Group();
                
                const topClickTarget = new THREE.Mesh(
                    new THREE.ConeGeometry(innerSizeX * 0.3, innerSizeX * 0.4, 3),
                    new THREE.MeshBasicMaterial({ 
                        transparent: true, 
                        opacity: 0, 
                        side: THREE.DoubleSide 
                    })
                );
                topClickTarget.position.y = innerSizeX * 0.2;
                topClickTarget.rotation.x = Math.PI;
                clickTargetGroup.add(topClickTarget);
                
                const bottomClickTarget = new THREE.Mesh(
                    new THREE.ConeGeometry(innerSizeX * 0.3, innerSizeX * 0.4, 3),
                    new THREE.MeshBasicMaterial({ 
                        transparent: true, 
                        opacity: 0, 
                        side: THREE.DoubleSide 
                    })
                );
                bottomClickTarget.position.y = -innerSizeX * 0.2;
                clickTargetGroup.add(bottomClickTarget);
                
                clickTargetGroup.rotation.x = -Math.PI / 2;
                clickTargetGroup.userData.isClickTarget = true;
                portalGroup.add(clickTargetGroup);

                // Particle effect rond de portal
                for (let i = 0; i < particleCount; i++) {
                    const planeSize = (Math.random() * 2 + 1) * sollyScale * 0.5;
                    const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
                    const plane = new THREE.Mesh(planeGeometry, particleMaterial.clone());

                    let x, z;
                    do {
                        x = THREE.MathUtils.randFloat(-outerSizeX / 2, outerSizeX / 2);
                        z = THREE.MathUtils.randFloat(-outerSizeZ / 2, outerSizeZ / 2);
                    } while (Math.abs(x) < innerSizeX / 2 && Math.abs(z) < innerSizeZ / 2);

                    const yOffset = (Math.random() - 0.5) * 20 * sollyScale;
                    plane.position.set(x, yOffset, z);

                    plane.userData.animationSpeed = Math.random() * 0.5 + 0.5;
                    plane.userData.yPhase = Math.random() * Math.PI;
                    particleCloud.add(plane);
                }

                portalGroup.add(particleCloud);
            }
            break;

        case 'bol':
        default:
            {
                const boundingSphere = new THREE.Sphere();
                boundingBox.getBoundingSphere(boundingSphere);
                const coreRadius = boundingSphere.radius;
                console.log(`🔮 Mystieke portal wordt op maat gemaakt voor VORM: bol. Kern-radius: ${coreRadius.toFixed(2)}`);

                const innerRadius = coreRadius * 1.25;
                const outerRadius = innerRadius + (coreRadius * 1.5);

                // MYSTIEKE PORTAL MET RONDE BINNENKANT
                // Buitenste ring (mystieke energie)
                const outerRingGeometry = new THREE.RingGeometry(outerRadius * 0.6, outerRadius * 1.2, 32);
                const outerRingMaterial = new THREE.MeshBasicMaterial({
                    color: 0x8A2BE2, // Donkerpaars
                    transparent: true,
                    opacity: 0.6,
                    side: THREE.DoubleSide
                });
                const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
                outerRing.rotation.x = -Math.PI / 2;
                outerRing.userData.isPortalRing = true;
                portalGroup.add(outerRing);

                // Binnenste ring (mystieke energie) - RONDE VORM
                const innerRingGeometry = new THREE.RingGeometry(innerRadius * 0.8, innerRadius * 0.6, 32);
                const innerRingMaterial = new THREE.MeshBasicMaterial({
                    color: 0x9370DB, // Lichter paars
                    transparent: true,
                    opacity: 0.8,
                    side: THREE.DoubleSide
                });
                const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
                innerRing.rotation.x = -Math.PI / 2;
                innerRing.userData.isPortalRing = true;
                portalGroup.add(innerRing);

                // LEEG GAT IN HET MIDDEN - RONDE VORM
                // Click target voor interactie (rond)
                const clickTargetGeometry = new THREE.CircleGeometry(innerRadius * 0.4, 32);
                const clickTargetMaterial = new THREE.MeshBasicMaterial({ 
                    transparent: true, 
                    opacity: 0, 
                    side: THREE.DoubleSide 
                });
                const clickTarget = new THREE.Mesh(clickTargetGeometry, clickTargetMaterial);
                clickTarget.rotation.x = -Math.PI / 2;
                clickTarget.userData.isClickTarget = true;
                portalGroup.add(clickTarget);

                // Particle effect rond de portal
                for (let i = 0; i < particleCount; i++) {
                    const planeSize = (Math.random() * 2 + 1) * sollyScale * 0.5;
                    const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
                    const plane = new THREE.Mesh(planeGeometry, particleMaterial.clone());
                    const radius = innerRadius + Math.pow(Math.random(), 3) * (outerRadius - innerRadius);
                    const angle = (i / particleCount) * Math.PI * 2;
                    const yOffset = (Math.random() - 0.5) * 20 * sollyScale * (radius / outerRadius);
                    plane.position.set(Math.cos(angle) * radius, yOffset, Math.sin(angle) * radius);
                    plane.userData.baseRadius = radius;
                    plane.userData.baseAngle = angle;
                    plane.userData.animationSpeed = Math.random() * 0.5 + 0.5;
                    plane.userData.yPhase = Math.random() * Math.PI;
                    particleCloud.add(plane);
                }
                
                portalGroup.add(particleCloud);
            }
            break;
    }

    portalGroup.userData.isPortal = true;
    portalGroup.userData.scale = sollyScale;
    portalGroup.userData.time = 0;
    
    return portalGroup;
}

function onPortalClick(event) {
    if (!portal || portalClicked || !portalActive || isDragging) {
        return;
    }

    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const clickTarget = portal.children.find(child => child.userData.isClickTarget);
    if (clickTarget) {
        const intersects = raycaster.intersectObject(clickTarget);

        if (intersects.length > 0) {
            event.stopImmediatePropagation();
            
            portalClicked = true;
            animatePortalAndCameraToCenter();
        }
    }
}

function animatePortalAndCameraToCenter() {
    document.removeEventListener('click', onPortalClick, false);

    if (sollySun) {
        sollySun.scale.set(2, 2, 2);
        sollySun.material.color.setHex(0xFFA500);
    }
    if (sollySunGlow) {
        sollySunGlow.scale.set(2, 2, 2);
        sollySunGlow.material.opacity = 0.4;
    }

    controls.enabled = false;

    const duration = 2250;

    const startTime = Date.now();

    const cameraStartPos = camera.position.clone();
    const portalPos = portal.position.clone();
    const cameraEndPos = new THREE.Vector3(
        portalPos.x, 
        portalPos.y + 400, 
        portalPos.z + 800
    ); 

    function animate() {
        const elapsed = Date.now() - startTime;
        let progress = Math.min(elapsed / duration, 1);

        const ease = 0.5 * (1 - Math.cos(Math.PI * progress));

        camera.position.lerpVectors(cameraStartPos, cameraEndPos, ease);
        camera.lookAt(portal.position);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            console.log("✅ Reis voltooid. Camera bij de vortex.");
            console.log("💡 Klik op de vergrote zon (Core 1) om terug te gaan naar originele grootte");
            controls.enabled = true;
            controls.target.copy(portal.position);
            controls.update();
        }
    }
    animate();
}

// UI functions
function showUniverseModal(html, title = '') {
    document.querySelectorAll('.solly-modal, .solly-modal-overlay').forEach(m => m.remove());
    
    const overlay = document.createElement('div');
    overlay.className = 'solly-modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(3px);
        z-index: 99998;
        display: grid;
        place-items: center;
    `;
    document.body.appendChild(overlay);
    
    const modal = document.createElement('div');
    modal.className = 'solly-modal';
    modal.style.cssText = `
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        background: transparent;
        border: 2px solid rgba(255, 215, 0, 0.6);
        border-radius: 12px;
        padding: 32px 36px;
        width: 90vw;
        max-width: 420px; /* portrait smaller */
        max-height: 80vh;
        overflow-y: auto;
        backdrop-filter: blur(10px);
        box-shadow: 
            0 0 30px rgba(255, 215, 0, 0.3),
            0 0 60px rgba(138, 43, 226, 0.2),
            inset 0 0 20px rgba(255, 255, 255, 0.1);
    `;
    
    modal.innerHTML = `
        <button class="solly-modal-close" style="
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 2em;
            background: none;
            border: none;
            color: #FFD700;
            cursor: pointer;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
            transition: all 0.3s ease;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        ">&times;</button>
        <div style="
            color: #FFD700;
            text-align: center;
            font-family: 'Open Sans', sans-serif;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
        ">
            ${title ? `<h2 style="margin: 0 0 20px 0; font-size: 2em;">${title}</h2>` : ''}
            ${html}
        </div>
    `;
    
    overlay.appendChild(modal);
    
    const closeBtn = modal.querySelector('.solly-modal-close');
    const closeModal = () => {
        overlay.remove();
        modal.remove();
    };
    
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    
    return { modal, overlay, closeModal };
}

function addPointerListener() {
    document.removeEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousemove', handleMouseMove);
    console.log('🎯 Pointer listeners toegevoegd (zonder drag & drop)');
}

function handleMouseMove(e) {
    if (!renderer) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    let pointer = false;
    
    if (miniSollys.length) {
        const intersects = raycaster.intersectObjects(miniSollys, false);
        if (intersects.length > 0) pointer = true;
    }
    if (redPlanets.length) {
        const intersects = raycaster.intersectObjects(redPlanets, false);
        if (intersects.length > 0) pointer = true;
    }
    if (solly1 && solly1.visible) {
        scene.updateMatrixWorld(true);
        const allIntersects = raycaster.intersectObjects(scene.children, true);
        const solly1Intersect = allIntersects.find(intersect => intersect.object === solly1 || intersect.object.userData.isSolly1);
        if (solly1Intersect) {
            pointer = true;
            console.log('👆 Hover over Solly1 (Shape Choice)');
        }
    }
    if (portal && portalActive && !portalClicked) {
        const clickTarget = portal.children[2];
        if (clickTarget) {
            const intersects = raycaster.intersectObject(clickTarget);
            if (intersects.length > 0) {
                pointer = true;
            }
        }
    }
    document.body.style.cursor = pointer ? 'pointer' : 'default';
} 