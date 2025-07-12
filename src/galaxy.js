// ===================================================================================
// ==                           SOLLYVERSE GALAXY.JS                              ==
// ==                                                                             ==
// ==      Galaxy shells, sterren, planeten en Sollys                           ==
// ==      Bevat alle object creatie en positioning                             ==
// ===================================================================================

// Global arrays for tracking objects
let miniSollys = [];
let redPlanets = [];
let blueSollys = [];
let whiteStars = [];

function addGalaxyShells(scene) {
    // Create multiple shell layers
    const shellCount = 5; // meer schillen
    const baseRadius = 8000;
    const radiusStep = 4000; // grotere afstand tussen schillen
    for (let i = 0; i < shellCount; i++) {
        const shellGeometry = new THREE.SphereGeometry(baseRadius + i * radiusStep, 64, 64);
        const shellMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x3949ab,        // helderder blauw
            transparent: true, 
            opacity: 0.25 - i * 0.04, // duidelijker zichtbaar
            wireframe: true
        });
        const shell = new THREE.Mesh(shellGeometry, shellMaterial);
        scene.add(shell);
    }
}

function addGalaxyStars(scene) {
    const starCount = 2000;
    const starGeometry = new THREE.SphereGeometry(4, 8, 8);
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    // Use instanced mesh for better performance
    if (typeof THREE.InstancedMesh !== 'undefined') {
        const instancedMesh = new THREE.InstancedMesh(starGeometry, starMaterial, starCount);
        const matrix = new THREE.Matrix4();
        
        for (let i = 0; i < starCount; i++) {
            const radius = 5000 + Math.random() * 15000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            matrix.setPosition(x, y, z);
            instancedMesh.setMatrixAt(i, matrix);
        }
        
        scene.add(instancedMesh);
    } else {
        // Fallback to individual meshes
        for (let i = 0; i < starCount; i++) {
            const star = new THREE.Mesh(starGeometry, starMaterial);
            const radius = 5000 + Math.random() * 15000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            star.position.x = radius * Math.sin(phi) * Math.cos(theta);
            star.position.y = radius * Math.sin(phi) * Math.sin(theta);
            star.position.z = radius * Math.cos(phi);
            
            scene.add(star);
        }
    }
}

function addSollySun(scene) {
    // Gladde ronde bol met zachte gloed
    const sunGeometry = new THREE.SphereGeometry(220, 64, 64);
    const sunMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFB200,          // warm oranje-geel
        emissive: 0xFF8C00,      // zachte oranje gloed
        emissiveIntensity: 0.7,
        roughness: 0.3,
        metalness: 0.0,
        flatShading: false
    });
    const sollySun = new THREE.Mesh(sunGeometry, sunMaterial);
    sollySun.position.set(0, 0, 0);
    scene.add(sollySun);
    
    const glowGeometry = new THREE.SphereGeometry(260, 64, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xFF8C00, transparent: true, opacity: 0.22 });
    const sollySunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    sollySunGlow.position.set(0, 0, 0);
    scene.add(sollySunGlow);
    
    // Make globals available
    window.sollySun = sollySun;
    window.sollySunGlow = sollySunGlow;
}

function addPlanets(scene) {
    const currentUser = gameManager.getCurrentUser();
    
    if (!currentUser || !currentUser.planeten) {
        console.warn('⚠️ currentUser of currentUser.planeten is null, gebruik default waarden');
        const rood = 1000;
        const groen = 1000;
        
        // Gebruik grootte direct uit JSON – geen multiplier meer
        const baseSize = 48;
        const scaledSize = baseSize;

        function addPlanetToScene(count, isRed, color, array) {
            console.log(`Adding ${count} planets with color ${color}`);
            for (let i = 0; i < count; i++) {
                const planet = createPlanet(scaledSize, isRed, color);
                const radius = 3000 + Math.random() * 12000;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                
                planet.position.x = radius * Math.sin(phi) * Math.cos(theta);
                planet.position.y = radius * Math.sin(phi) * Math.sin(theta);
                planet.position.z = radius * Math.cos(phi);
                
                scene.add(planet);
                array.push(planet);
            }
            console.log(`Added ${count} planets to scene`);
        }

        addPlanetToScene(rood, true, 0xFF0000, redPlanets);
        addPlanetToScene(groen, false, 0x00FF00, redPlanets);
        return;
    }
    
    const rood = currentUser.planeten.rood || 1000;
    const groen = currentUser.planeten.groen || 1000;

    console.log('🔴 Rode planeten:', rood);
    console.log('🟢 Groene planeten:', groen);

    // Haal size multiplier op voor scaling
    const baseSize = 48;
    const scaledSize = baseSize;

    function addPlanetToScene(count, isRed, color, array) {
        console.log(`Adding ${count} planets with color ${color}`);
        for (let i = 0; i < count; i++) {
            const planet = createPlanet(scaledSize, isRed, color);
            const radius = 3000 + Math.random() * 12000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            planet.position.x = radius * Math.sin(phi) * Math.cos(theta);
            planet.position.y = radius * Math.sin(phi) * Math.sin(theta);
            planet.position.z = radius * Math.cos(phi);
            
            scene.add(planet);
            array.push(planet);
        }
        console.log(`Added ${count} planets to scene`);
    }

    addPlanetToScene(rood, true, 0xFF0000, redPlanets);
    addPlanetToScene(groen, false, 0x00FF00, redPlanets);
}

function addSollys(scene) {
    const currentUser = gameManager.getCurrentUser();
    
    if (!currentUser || !currentUser.sollys) {
        console.warn('⚠️ currentUser of currentUser.sollys is null, gebruik default waarden');
        const geel = 1750;
        const blauw = 1750;
        const pink = 0;
        const rood = 1500;
        
        // Haal size multiplier op voor scaling
        const baseSize = 24;
        const scaledSize = baseSize;

        function addSollyToScene(count, isYellow, color, array) {
            console.log(`Adding ${count} Sollys with color ${color}`);
            for (let i = 0; i < count; i++) {
                const solly = createSolly(scaledSize, isYellow, color);
                const radius = 3000 + Math.random() * 15000;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                
                solly.position.x = radius * Math.sin(phi) * Math.cos(theta);
                solly.position.y = radius * Math.sin(phi) * Math.sin(theta);
                solly.position.z = radius * Math.cos(phi);
                
                scene.add(solly);
                array.push(solly);
            }
            console.log(`Added ${count} Sollys to scene`);
        }

        addSollyToScene(geel, true, 0xFFD700, miniSollys);
        addSollyToScene(blauw, false, 0x2196F3, blueSollys);
        addSollyToScene(pink, false, 0xFF69B4, blueSollys);
        addSollyToScene(rood, false, 0xFF0000, blueSollys);
        return;
    }
    
    const geel = currentUser.sollys.geel || 300;
    const blauw = currentUser.sollys.blauw || 3500;
    const pink = currentUser.sollys.pink || 0;
    const rood = currentUser.sollys.rood || 20;

    console.log('🟡 Gele Sollys:', geel);
    console.log('🔵 Blauwe Sollys:', blauw);
    console.log('🩷 Pink Sollys:', pink);
    console.log('🔴 Rode Sollys:', rood);
    console.log('📊 Volledige sollys data:', currentUser.sollys);

    // Haal size multiplier op voor scaling
    const baseSize = 24;
    const scaledSize = baseSize;

    function addSollyToScene(count, isYellow, color, array) {
        console.log(`Adding ${count} Sollys with color ${color}`);
        for (let i = 0; i < count; i++) {
            const solly = createSolly(scaledSize, isYellow, color);
            const radius = 3000 + Math.random() * 15000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            solly.position.x = radius * Math.sin(phi) * Math.cos(theta);
            solly.position.y = radius * Math.sin(phi) * Math.sin(theta);
            solly.position.z = radius * Math.cos(phi);
            
            scene.add(solly);
            array.push(solly);
        }
        console.log(`Added ${count} Sollys to scene`);
    }

    addSollyToScene(geel, true, 0xFFD700, miniSollys);
    addSollyToScene(blauw, false, 0x2196F3, blueSollys);
    addSollyToScene(pink, false, 0xFF69B4, blueSollys);
    addSollyToScene(rood, false, 0xFF0000, blueSollys);
}

function addWhiteStars(scene) {
    const currentUser = gameManager.getCurrentUser();
    
    if (!currentUser || !currentUser.sterren) {
        console.warn('⚠️ currentUser of currentUser.sterren is null, gebruik default waarden');
        const wit = 4000;
        addStarToScene(wit, 0xFFFFFF, whiteStars);
        return;
    }
    
    const wit = currentUser.sterren.wit || 4000;

    console.log('⭐ Witte sterren:', wit);

    // Haal size multiplier op voor scaling
    const baseSize = 8;
    const scaledSize = baseSize;

    function addStarToScene(count, color, array) {
        console.log(`Adding ${count} stars with color ${color}`);
        for (let i = 0; i < count; i++) {
            const star = createStar(scaledSize, color);
            const radius = 1500 + Math.random() * 6000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            star.position.x = radius * Math.sin(phi) * Math.cos(theta);
            star.position.y = radius * Math.sin(phi) * Math.sin(theta);
            star.position.z = radius * Math.cos(phi);
            
            scene.add(star);
            array.push(star);
        }
        console.log(`Added ${count} stars to scene`);
    }

    addStarToScene(wit, 0xFFFFFF, whiteStars);
}

function createSolly(size, isYellow, color) {
    const geometry = new THREE.TetrahedronGeometry(size);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const solly = new THREE.Mesh(geometry, material);
    solly.userData.isYellow = isYellow;
    return solly;
}

function createPlanet(size, isRed, color) {
    const geometry = new THREE.SphereGeometry(size, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const planet = new THREE.Mesh(geometry, material);
    planet.userData.isRed = isRed;
    planet.userData.isPlanet = true;
    return planet;
}

function createStar(size, color) {
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const star = new THREE.Mesh(geometry, material);
    star.userData.isStar = true;
    return star;
} 

window.addGalaxyShells = addGalaxyShells;
window.addGalaxyStars = addGalaxyStars;
window.addSollySun = addSollySun;
window.addPlanets = addPlanets;
window.addSollys = addSollys;
window.addWhiteStars = addWhiteStars; 