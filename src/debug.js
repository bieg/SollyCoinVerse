// Debug and utility functions

window.debugCanvasVisibility = function() {
    const overlays = Array.from(document.querySelectorAll('.solly-modal, .solly-modal-overlay, .new-shape-overlay, .modal, .overlay, .shape-modal'));
    overlays.forEach(el => {
        el.dataset._originalDisplay = el.style.display;
        el.style.display = 'none';
    });
    console.log('🔎 Alle overlays tijdelijk verborgen:', overlays);

    const canvas = document.querySelector('canvas');
    if (canvas) {
        canvas.style.zIndex = '99999';
        canvas.style.position = 'relative';
        // canvas.style.border = '6px solid red'; // UITGESCHAKELD: geen rode debugrand meer
        canvas.style.boxSizing = 'border-box';
        console.log('🟥 Knalrode rand en hoge z-index toegevoegd aan canvas!');
        
        canvas._debugClickHandler = function() {
            console.log('🟥 Je klikt nu op het canvas met het rode randje');
        };
        canvas.addEventListener('mousedown', canvas._debugClickHandler);
    } else {
        console.log('❌ Geen canvas gevonden!');
    }

    setTimeout(() => {
        overlays.forEach(el => {
            el.style.display = el.dataset._originalDisplay || '';
        });
        if (canvas) {
            canvas.style.border = '';
            canvas.style.zIndex = '';
            canvas.style.position = '';
            canvas.style.boxSizing = '';
            if (canvas._debugClickHandler) {
                canvas.removeEventListener('mousedown', canvas._debugClickHandler);
                delete canvas._debugClickHandler;
            }
        }
        console.log('⏪ Alles teruggezet naar origineel.');
    }, 10000);

    console.log('✅ debugCanvasVisibility uitgevoerd!');
};

window.debugShapeChoiceMeshes = function() {
    if (!window.scene) {
        console.log('❌ Geen scene gevonden!');
        return;
    }
    let found = false;
    scene.traverse(obj => {
        if (obj.name === 'ShapeChoice') {
            found = true;
            console.log('🔎 ShapeChoice gevonden:', {
                type: obj.type,
                isMesh: obj.isMesh,
                isGroup: obj.type === 'Group',
                visible: obj.visible,
                material: obj.material,
                position: obj.position,
                userData: obj.userData
            });
        }
    });
    if (!found) {
        console.log('❌ Geen object met naam ShapeChoice gevonden in de scene!');
    }
};

window.makeAllInvisibleVisible = function() {
    if (!window.scene) {
        console.log('❌ Geen scene gevonden!');
        return;
    }
    
    console.log('🔍 Zoek naar onzichtbare elementen...');
    let count = 0;
    
    scene.traverse(obj => {
        if (obj.type === 'Mesh' || obj.type === 'Group' || obj.type === 'Points') {
            if (!obj.visible) {
                obj.visible = true;
                count++;
                console.log('👁️ Zichtbaar gemaakt:', obj.name || 'Unnamed', '(', obj.type, ')');
            }
            
            if (obj.material) {
                if (obj.material.opacity !== undefined && obj.material.opacity < 1) {
                    obj.material.opacity = 1;
                    obj.material.transparent = false;
                    console.log('🎨 Opacity hersteld voor:', obj.name || 'Unnamed');
                }
            }
        }
    });
    
    console.log(`✅ ${count} onzichtbare elementen zichtbaar gemaakt!`);
    
    if (window.solly1) {
        window.solly1.visible = true;
        window.solly1.scale.set(3, 3, 3);
        window.solly1.material.color.setHex(0xFF0000);
        console.log('🔴 Solly1 extra opvallend gemaakt!');
    }
    
    return count;
};

window.countAllObjects = function() {
    if (!window.scene) {
        console.log('❌ Geen scene gevonden!');
        return;
    }
    
    let meshes = 0, groups = 0, points = 0, invisible = 0;
    
    scene.traverse(obj => {
        if (obj.type === 'Mesh') meshes++;
        if (obj.type === 'Group') groups++;
        if (obj.type === 'Points') points++;
        if (!obj.visible) invisible++;
    });
    
    console.log('📊 Object telling:');
    console.log(`  - Meshes: ${meshes}`);
    console.log(`  - Groups: ${groups}`);
    console.log(`  - Points: ${points}`);
    console.log(`  - Onzichtbaar: ${invisible}`);
    console.log(`  - Totaal: ${meshes + groups + points}`);
    
    return { meshes, groups, points, invisible };
};

// Click event handlers for debugging
function addShapeChoiceClickListener() {
    if (!window.scene || !window.renderer || !window.renderer.domElement) return;
    window.renderer.domElement.addEventListener('mousedown', function shapeChoiceClickHandler(e) {
        const rect = window.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        const shapeIntersect = intersects.find(i => i.object.name === 'ShapeChoice');
        if (shapeIntersect) {
            console.log('🟣 CLICK op ShapeChoice!');
            e.preventDefault();
            e.stopPropagation();
            startDrag(shapeIntersect.object, e);
        }
    });
}
window.addShapeChoiceClickListener = addShapeChoiceClickListener;

// Debug raycast logging
// DEBUG: Tijdelijk uitgeschakeld voor debug-scene
// document.addEventListener('mousedown', function(e) {
//     if (!window.renderer || !window.camera || !window.scene) return;
//     const rect = window.renderer.domElement.getBoundingClientRect();
//     const mouse = new THREE.Vector2(
//         ((e.clientX - rect.left) / rect.width) * 2 - 1,
//         -((e.clientY - rect.top) / rect.height) * 2 + 1
//     );
//     const raycaster = new THREE.Raycaster();
//     raycaster.setFromCamera(mouse, camera);
//     const intersects = raycaster.intersectObjects(scene.children, true);
//     console.log('== Alle raycast hits bij click ==');
//     intersects.forEach((i, idx) => {
//         console.log(`#${idx}:`, {
//             name: i.object.name,
//             type: i.object.type,
//             visible: i.object.visible,
//             opacity: i.object.material?.opacity,
//             transparent: i.object.material?.transparent,
//             parent: i.object.parent?.name
//         });
//     });
//     if (intersects.length === 0) {
//         console.log('Niets geraakt!');
//     }
// });

// DEBUG: Canvas click debugging tijdelijk uitgeschakeld voor debug-scene
// if (window.renderer && window.renderer.domElement) {
//     window.renderer.domElement.addEventListener('mousedown', function(e) {
//         console.log('🖱️ [DEBUG] mousedown op canvas!');
//         console.log('📍 Event:', e);
//         if (!window.renderer || !window.camera || !window.scene) {
//             console.log('❌ renderer/camera/scene niet beschikbaar!');
//             return;
//         }
//         const rect = window.renderer.domElement.getBoundingClientRect();
//         const mouse = new THREE.Vector2(
//             ((e.clientX - rect.left) / rect.width) * 2 - 1,
//             -((e.clientY - rect.top) / rect.height) * 2 + 1
//         );
//         console.log('📍 Mouse coördinaten (NDC):', mouse);
//         const raycaster = new THREE.Raycaster();
//         raycaster.setFromCamera(mouse, camera);
//         const intersects = raycaster.intersectObjects(scene.children, true);
//         if (intersects.length === 0) {
//             console.log('Niets geraakt!');
//         } else {
//             console.log('== Alle raycast hits bij click ==');
//             intersects.forEach((i, idx) => {
//                 console.log(`#${idx}:`, {
//                     name: i.object.name,
//                     type: i.object.type,
//                     visible: i.object.visible,
//                     opacity: i.object.material?.opacity,
//                     transparent: i.object.material?.transparent,
//                     parent: i.object.parent?.name,
//                     userData: i.object.userData
//                 });
//             });
//         }
//         console.log('📍 Event target:', e.target);
//         if (e.target !== window.renderer.domElement) {
//             console.log('⚠️ Click was NIET op het canvas zelf!');
//         }
//     });
// }

// Test functions
function testRaycastingWithFrozenSolly1() {
    if (!solly1) {
        console.log('❌ Solly1 bestaat niet');
        return;
    }
    
    freezeSolly1Completely();
    
    setTimeout(() => {
        console.log('🎯 Testing raycasting met bevroren Solly1...');
        
        const raycaster = new THREE.Raycaster();
        const center = new THREE.Vector2(0, 0);
        raycaster.setFromCamera(center, window.camera);
        
        window.scene.updateMatrixWorld(true);
        
        const intersects = raycaster.intersectObject(window.solly1, true);
        console.log('🎯 Raycasting resultaten:', {
            intersects: intersects.length,
            solly1Position: window.solly1.position,
            solly1Visible: window.solly1.visible,
            cameraPosition: window.camera.position,
            rayDirection: raycaster.ray.direction
        });
        
        if (intersects.length > 0) {
            console.log('✅ SUCCESS! Solly1 wordt gedetecteerd door raycasting!');
            console.log('📍 Intersect distance:', intersects[0].distance);
        } else {
            console.log('❌ Solly1 wordt nog steeds niet gedetecteerd');
            
            const allIntersects = raycaster.intersectObjects(scene.children, true);
            console.log('🎯 Alle objecten in scene:', allIntersects.length);
            
            const solly1Intersect = allIntersects.find(intersect => 
                intersect.object === window.solly1 || 
                intersect.object.userData.isSolly1 ||
                intersect.object.name === 'solly1'
            );
            
            if (solly1Intersect) {
                console.log('✅ Solly1 gevonden in alle objecten!');
            } else {
                console.log('❌ Solly1 niet gevonden in alle objecten');
            }
        }
    }, 1000);
}

window.testRaycastingWithFrozenSolly1 = testRaycastingWithFrozenSolly1;

// === Solly debug helpers ===
let _hiddenObjectsBackup = [];
window.hideAllExceptSolly1 = function() {
    if (!window.scene) {
        console.warn('❌ Scene niet gevonden');
        return;
    }
    _hiddenObjectsBackup = [];
    scene.traverse(obj => {
        if (obj.visible) {
            const isSolly1 = obj === window.solly1 || obj.userData?.isSolly1 || obj.name === 'Solly1Collider';
            if (!isSolly1) {
                _hiddenObjectsBackup.push(obj);
                obj.visible = false;
            }
        }
    });
    console.log('👁️ Alle objecten behalve Solly1 verborgen. Gebruik showAllObjects() om terug te zetten.');
};

window.showAllObjects = function() {
    if (!_hiddenObjectsBackup.length) {
        console.warn('ℹ️ Geen verborgen objecten om te tonen.');
        return;
    }
    _hiddenObjectsBackup.forEach(obj => obj.visible = true);
    _hiddenObjectsBackup = [];
    console.log('👁️ Alle objecten weer zichtbaar.');
};

// Zet Solly1 in het midden, maak hem groot en fel rood, zet camera goed en render
window.focusOnSolly1 = function() {
    let s1 = window.solly1;
    if (!s1 && window.scene) {
        window.scene.traverse(obj => {
            if (obj.isMesh && obj.userData && obj.userData.isSolly1) s1 = obj;
        });
    }
    if (s1) {
        // Zet Solly1 altijd in het midden en op normale grootte
        s1.visible = true;
        s1.position.set(0, 0, 0);
        s1.scale.set(2, 2, 2);
        if (s1.material) s1.material.color.setHex(0xFF0000);
        // Alles behalve Solly1 (en zijn collider) onzichtbaar maken
        window.scene.traverse(obj => {
            const isSolly1 = obj === s1 || obj.name === 'Solly1Collider';
            if (!isSolly1 && obj.visible) obj.visible = false;
        });
        if (window.camera) {
            window.camera.position.set(0, 0, 800);
            window.camera.lookAt(0, 0, 0);
        }
        if (window.renderer && window.scene && window.camera) {
            window.renderer.render(window.scene, window.camera);
        }
        const canvas = document.querySelector('canvas');
        if (canvas) {
            canvas.style.display = 'block';
            canvas.style.visibility = 'visible';
        }
        console.log('🎯 Alleen Solly1 zichtbaar, gecentreerd, normaal groot, rood en camera goed gezet!');
    } else {
        console.warn('❌ Solly1 niet gevonden in de scene!');
    }
};

// Debug: log en forceer zichtbaarheid van alle Solly1's
window.logAllSolly1Meshes = function() {
    if (!window.scene) {
        console.warn('❌ Geen scene gevonden!');
        return;
    }
    let count = 0;
    window.scene.traverse(obj => {
        if (obj.isMesh && obj.userData && obj.userData.isSolly1) {
            count++;
            obj.visible = true;
            obj.position.set(0,0,0);
            obj.scale.set(2,2,2);
            if (obj.material) {
                obj.material.color.setHex(0xFF0000);
                obj.material.opacity = 1;
                obj.material.transparent = false;
            }
            console.log(`🔴 Solly1 #${count}:`, obj, 'Pos:', obj.position, 'Scale:', obj.scale, 'Visible:', obj.visible);
        }
    });
    if (count === 0) {
        console.warn('❌ Geen Solly1 meshes gevonden in de scene!');
    } else {
        console.log(`✅ ${count} Solly1 mesh(es) zichtbaar en rood gemaakt.`);
    }
    if (window.camera) {
        window.camera.position.set(0,0,800);
        window.camera.lookAt(0,0,0);
    }
    if (window.renderer && window.scene && window.camera) {
        window.renderer.render(window.scene, window.camera);
    }
};

// ===================================================================================
// ==                                                                             ==
// ==                             DEBUG TOOLS                                     ==
// ==                                                                             ==
// ==      Hulpmiddelen voor het debuggen van de Sollyverse                      ==
// ==                                                                             ==
// ===================================================================================

class SollyverseDebug {
    constructor() {
        this.debugActive = false;
        this.originalMaterials = new Map();
        this.createDebugButton();
    }

    // Maak debug knop aan
    createDebugButton() {
        const debugBtn = document.createElement('button');
        debugBtn.textContent = '🪐 Debug: Toon alle lagen';
        debugBtn.id = 'debug-toggle-btn';
        debugBtn.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 200001;
            background: #ff00ff;
            color: #fff;
            border: none;
            border-radius: 10px;
            padding: 14px 28px;
            font-size: 1.1em;
            font-weight: bold;
            box-shadow: 0 2px 12px #ff00ff88;
            cursor: pointer;
            opacity: 0.85;
            transition: all 0.3s ease;
        `;
        
        debugBtn.onclick = () => this.toggleDebugMode();
        document.body.appendChild(debugBtn);
    }

    // Toggle debug mode aan/uit
    toggleDebugMode() {
        if (this.debugActive) {
            this.disableDebugMode();
        } else {
            this.enableDebugMode();
        }
    }

    // Zet debug mode aan
    enableDebugMode() {
        if (!window.scene) {
            this.showMessage('❌ Scene niet beschikbaar!', 'error');
            return;
        }

        this.debugActive = true;
        this.originalMaterials.clear();

        // Loop door alle objecten in de scene
        window.scene.traverse(obj => {
            if (obj.isMesh && !obj.userData.isOutline) {
                // Bewaar originele material
                this.originalMaterials.set(obj.uuid, obj.material.clone());
                
                // Maak zichtbaar
                obj.visible = true;
                
                // Maak wireframe en magenta
                obj.material = obj.material.clone();
                obj.material.wireframe = true;
                obj.material.opacity = 1.0;
                obj.material.transparent = false;
                obj.material.color.set(0xff00ff); // Magenta
                
                // Voeg outline toe
                this.addOutline(obj);
            }
        });

        // Update debug knop
        const btn = document.getElementById('debug-toggle-btn');
        if (btn) {
            btn.textContent = '🔍 Debug: UIT';
            btn.style.background = '#00ff00';
        }

        this.showMessage('🔍 Debug mode AAN - Alle lagen zichtbaar!', 'success');
        this.showMeshInfo();
    }

    // Zet debug mode uit
    disableDebugMode() {
        if (!window.scene) return;

        this.debugActive = false;

        // Herstel originele materials
        window.scene.traverse(obj => {
            if (obj.isMesh && !obj.userData.isOutline && this.originalMaterials.has(obj.uuid)) {
                obj.material = this.originalMaterials.get(obj.uuid);
                this.removeOutline(obj);
            }
        });

        // Update debug knop
        const btn = document.getElementById('debug-toggle-btn');
        if (btn) {
            btn.textContent = '🪐 Debug: Toon alle lagen';
            btn.style.background = '#ff00ff';
        }

        this.showMessage('🔍 Debug mode UIT - Normale weergave hersteld', 'info');
        this.hideMeshInfo();
    }

    // Voeg outline toe aan mesh
    addOutline(mesh) {
        if (!mesh.userData.outline) {
            const outlineGeometry = mesh.geometry.clone();
            const outlineMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                side: THREE.BackSide,
                transparent: true,
                opacity: 0.3
            });
            mesh.userData.outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
            mesh.userData.outline.scale.multiplyScalar(1.1);
            mesh.userData.outline.userData.isOutline = true;
            mesh.add(mesh.userData.outline);
        }
    }

    // Verwijder outline van mesh
    removeOutline(mesh) {
        if (mesh.userData.outline) {
            mesh.remove(mesh.userData.outline);
            delete mesh.userData.outline;
        }
    }

    // Toon informatie over alle meshes
    showMeshInfo() {
        const meshInfo = document.createElement('div');
        meshInfo.id = 'mesh-info-panel';
        meshInfo.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 20px;
            border-radius: 10px;
            font-family: monospace;
            font-size: 12px;
            max-width: 300px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 200002;
            border: 2px solid #ff00ff;
        `;

        let info = '<h3>🔍 Mesh Informatie:</h3>';
        let meshCount = 0;

        window.scene.traverse(obj => {
            if (obj.isMesh && !obj.userData.isOutline) {
                meshCount++;
                info += `<div style="margin: 10px 0; padding: 8px; background: rgba(255,0,255,0.2); border-radius: 5px;">
                    <strong>Mesh ${meshCount}:</strong><br>
                    Naam: ${obj.name || 'Geen naam'}<br>
                    Type: ${obj.geometry.type}<br>
                    Positie: (${obj.position.x.toFixed(0)}, ${obj.position.y.toFixed(0)}, ${obj.position.z.toFixed(0)})<br>
                    Zichtbaar: ${obj.visible}<br>
                    UUID: ${obj.uuid.substring(0, 8)}...
                </div>`;
                // Voeg 3D label toe als er een naam is
                if (obj.name && !obj.userData._labelElement) {
                    const label = document.createElement('div');
                    label.textContent = obj.name;
                    label.style.cssText = `
                        position: absolute;
                        color: #FFD700;
                        background: rgba(0,0,0,0.7);
                        padding: 2px 8px;
                        border-radius: 6px;
                        font-size: 1.1em;
                        font-weight: bold;
                        pointer-events: none;
                        z-index: 300000;
                        border: 1px solid #FFD700;
                        text-shadow: 0 2px 8px #000, 0 0 2px #FFD700;
                    `;
                    label.className = 'mesh-3d-label';
                    document.body.appendChild(label);
                    obj.userData._labelElement = label;
                }
            }
        });
        meshInfo.innerHTML = info;
        document.body.appendChild(meshInfo);
        // Start label update loop
        this.updateLabels();
    }

    // Update de positie van alle 3D labels
    updateLabels() {
        if (!window.scene || !window.camera || !window.renderer) return;
        window.scene.traverse(obj => {
            if (obj.isMesh && obj.name && obj.userData._labelElement) {
                // Projecteer 3D positie naar 2D schermpositie
                const vector = obj.position.clone().project(window.camera);
                const x = (vector.x * 0.5 + 0.5) * window.renderer.domElement.clientWidth;
                const y = (-vector.y * 0.5 + 0.5) * window.renderer.domElement.clientHeight;
                obj.userData._labelElement.style.left = `${x}px`;
                obj.userData._labelElement.style.top = `${y - 30}px`;
                obj.userData._labelElement.style.display = obj.visible ? 'block' : 'none';
            }
        });
        // Blijf updaten zolang debug aan staat
        if (this.debugActive) {
            requestAnimationFrame(() => this.updateLabels());
        }
    }

    // Verberg mesh informatie en verwijder labels
    hideMeshInfo() {
        const panel = document.getElementById('mesh-info-panel');
        if (panel) panel.remove();
        // Verwijder alle 3D labels
        document.querySelectorAll('.mesh-3d-label').forEach(el => el.remove());
        // Verwijder referentie uit userData
        window.scene.traverse(obj => {
            if (obj.isMesh && obj.userData._labelElement) {
                delete obj.userData._labelElement;
            }
        });
    }

    // Toon bericht
    showMessage(text, type = 'info') {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
            color: #fff;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 1.3em;
            z-index: 200000;
            box-shadow: 0 2px 16px rgba(0,0,0,0.5);
            animation: slideDown 0.3s ease-out;
        `;
        overlay.textContent = text;
        
        // Voeg CSS animatie toe
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.remove();
            style.remove();
        }, 3000);
    }

    // Reset alle debug instellingen
    reset() {
        this.disableDebugMode();
        this.originalMaterials.clear();
    }
}

// Maak debug instance aan wanneer de pagina geladen is
let sollyverseDebug = null;

// Initialiseer debug tools
function initDebugTools() {
    if (!sollyverseDebug) {
        sollyverseDebug = new SollyverseDebug();
        console.log('🔧 Debug tools geïnitialiseerd');
    }
}

// Export voor gebruik in andere bestanden
window.SollyverseDebug = SollyverseDebug;
window.initDebugTools = initDebugTools; 

// Universele border-killer: verwijder altijd border bij mouseover op canvas
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('mouseover', () => {
        canvas.style.border = 'none';
      });
      // Ook bij mouseenter en pointerover voor zekerheid
      canvas.addEventListener('mouseenter', () => {
        canvas.style.border = 'none';
      });
      canvas.addEventListener('pointerover', () => {
        canvas.style.border = 'none';
      });
    }
  });
} 