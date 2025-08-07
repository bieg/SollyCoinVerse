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
    // Create multiple shell layers voor Level 1 - subtielere shells
    const shellCount = 3; // Minder schillen voor subtielere achtergrond
    const baseRadius = 12000;
    const radiusStep = 8000; // Grotere afstand tussen schillen
    for (let i = 0; i < shellCount; i++) {
        const shellGeometry = new THREE.SphereGeometry(baseRadius + i * radiusStep, 64, 64);
        const shellMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x1a1a2e,        // Donkerblauw-grijs voor subtiele achtergrond
            transparent: true, 
            opacity: 0.05 - i * 0.015, // Zeer subtiele opacity
            wireframe: true
        });
        const shell = new THREE.Mesh(shellGeometry, shellMaterial);
        scene.add(shell);
    }
}

function addGalaxyStars(scene) {
    const starCount = 4000; // Meer sterren voor Level 1
    const starGeometry = new THREE.SphereGeometry(3, 8, 8); // Iets kleinere sterren
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Witte sterren
    
    // Use instanced mesh for better performance
    if (typeof THREE.InstancedMesh !== 'undefined') {
        const instancedMesh = new THREE.InstancedMesh(starGeometry, starMaterial, starCount);
        const matrix = new THREE.Matrix4();
        
        for (let i = 0; i < starCount; i++) {
            // Verspreid sterren over een grotere ruimte voor mooiere zwarte achtergrond
            const radius = 3000 + Math.random() * 25000;
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
            // Verspreid sterren over een grotere ruimte voor mooiere zwarte achtergrond
            const radius = 3000 + Math.random() * 25000;
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
                // Random size tussen 0.5x en 2.5x van de base size
                const randomSizeMultiplier = 0.5 + Math.random() * 2.0;
                const solly = createSolly(scaledSize * randomSizeMultiplier, isYellow, color);
                // VERGROTE VERSpreiding: van 6000-26000 naar 8000-35000
                const radius = 8000 + Math.random() * 27000;
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
            // Random size tussen 1.0x en 3.5x van de base size (iets groter bereik voor user data)
            const randomSizeMultiplier = 1.0 + Math.random() * 2.5;
            const solly = createSolly(scaledSize * randomSizeMultiplier, isYellow, color);
            // VERGROTE VERSpreiding: van 4000-12000 naar 6000-20000
            const radius = 6000 + Math.random() * 14000;
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

    // Maak arrays globaal beschikbaar zodat andere modules (sollys.js) ze kunnen gebruiken
    window.miniSollys = miniSollys;
    window.blueSollys = blueSollys;
    window.redPlanets = redPlanets;
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
            // VERGROTE VERSpreiding: van 1500-7500 naar 3000-15000
            const radius = 3000 + Math.random() * 12000;
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