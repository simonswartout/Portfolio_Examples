// gameportfolio app.js — modularized from provided template
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// --- CONFIGURATION ---
const config = {
    runSpeed: 0.08,
    turnSpeed: 0.08,
    friction: 0.9,
    worldSize: 600
};

let scene, camera, renderer, clock;
let player, playerVelocity = new THREE.Vector3();
let particles = [], crates = [], npcs = [], traffic = [];
let collectibles = [];
let obstacleBoxes = [];
let dynamicObjects = [];

let hasPackage = false;
let currentPackageId = null;
let isModalOpen = false;

let keys = { w: false, a: false, s: false, d: false };

const portfolioData = [
    { id:1, color:0xe74c3c, title:"HELLO, I'M ALEX", content:"I'm a creative developer who loves cozy games and interactive web experiences. I build worlds with Three.js and scalable backends with Node." },
    { id:2, color:0x3498db, title:"PROJECTS", content:"1. <strong>Forest API:</strong> A procedural tree generator.<br>2. <strong>Leafy:</strong> Social network for gardeners.<br>3. <strong>Drift:</strong> WebGL racing experiment." },
    { id:3, color:0x9b59b6, title:"HIRE ME", content:"Looking for a unique web presence? I'm available for freelance work.<br><br>Contact: alex@cozydelivery.com" }
];

function init(){
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a1f3d);
    scene.fog = new THREE.FogExp2(0x2a1f3d, 0.015);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0,10,15);

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.HemisphereLight(0x6a4c93, 0x2a1f3d, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffaa00, 1);
    sunLight.position.set(-50,30,-50);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const warmLight = new THREE.PointLight(0xff6b6b, 0.5, 50);
    warmLight.position.set(0,10,0);
    scene.add(warmLight);

    createEnvironment();
    createVillage();
    createPlayer();
    createCollectibles();
    createDynamicCrates();
    createTraffic();

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', (e)=> handleKey(e,true));
    document.addEventListener('keyup', (e)=> handleKey(e,false));

    setTimeout(()=>{
        const loader = document.getElementById('loader');
        if(loader){ loader.style.opacity = 0; setTimeout(()=> loader.remove(), 500); }
    }, 1000);

    animate();
}

function createEnvironment(){
    const planeGeo = new THREE.PlaneGeometry(config.worldSize, config.worldSize, 64, 64);
    const planeMat = new THREE.MeshStandardMaterial({ color:0x5d4037, roughness:1 });
    const floor = new THREE.Mesh(planeGeo, planeMat);
    floor.rotation.x = -Math.PI/2;
    floor.receiveShadow = true;
    scene.add(floor);

    const roadGeo = new THREE.PlaneGeometry(12, config.worldSize);
    const roadMat = new THREE.MeshStandardMaterial({ color:0x555555, roughness:0.9 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI/2;
    road.position.y = 0.02;
    scene.add(road);

    const colors = [0xd35400,0xc0392b,0xf1c40f,0xe67e22];
    for(let i=0;i<120;i++){
        const angle = Math.random()*Math.PI*2; const rad = 20 + Math.random()*120;
        let x = Math.cos(angle)*rad; let z = Math.sin(angle)*rad;
        if(Math.abs(x)<8) x += 15 * Math.sign(x||1);
        const treeGroup = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.5,1.5,6), new THREE.MeshStandardMaterial({color:0x3e2723}));
        trunk.position.y = 0.75; treeGroup.add(trunk);
        const leafColor = colors[Math.floor(Math.random()*colors.length)];
        const leafMat = new THREE.MeshStandardMaterial({ color:leafColor, flatShading:true });
        const l1 = new THREE.Mesh(new THREE.ConeGeometry(1.5,2,6), leafMat); l1.position.y = 2; treeGroup.add(l1);
        const l2 = new THREE.Mesh(new THREE.ConeGeometry(1.2,2,6), leafMat); l2.position.y = 3; treeGroup.add(l2);
        treeGroup.position.set(x,0,z);
        const box = new THREE.Box3(); box.setFromCenterAndSize(treeGroup.position.clone().add(new THREE.Vector3(0,2,0)), new THREE.Vector3(1,10,1));
        obstacleBoxes.push(box);
        scene.add(treeGroup);
    }

    // particles
    const particleGeo = new THREE.BufferGeometry(); const pCount = 300; const pPos = new Float32Array(pCount*3); const pVel = [];
    for(let i=0;i<pCount;i++){ pPos[i*3]=(Math.random()-0.5)*200; pPos[i*3+1]=Math.random()*20; pPos[i*3+2]=(Math.random()-0.5)*200; pVel.push({y:-0.02-Math.random()*0.05,x:(Math.random()-0.5)*0.02,z:(Math.random()-0.5)*0.02}); }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos,3));
    const particleMat = new THREE.PointsMaterial({ color:0xffaa00, size:0.3, transparent:true, opacity:0.8 });
    const leafSystem = new THREE.Points(particleGeo, particleMat); leafSystem.userData = { velocities: pVel }; scene.add(leafSystem); particles.push(leafSystem);
}

function createCharacter(shirtColor){
    const group = new THREE.Group();
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.5), new THREE.MeshStandardMaterial({color:0xffccaa})); head.position.y = 1.6; group.add(head);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.7,0.3), new THREE.MeshStandardMaterial({ color:shirtColor })); body.position.y=1; group.add(body);
    const legGeo = new THREE.BoxGeometry(0.2,0.7,0.2); const legMat = new THREE.MeshStandardMaterial({color:0x34495e}); const legL = new THREE.Mesh(legGeo, legMat); legL.position.set(-0.15,0.35,0); group.add(legL); group.userData.legL = legL; const legR = new THREE.Mesh(legGeo, legMat); legR.position.set(0.15,0.35,0); group.add(legR); group.userData.legR = legR; return group;
}

function createPlayer(){ player = createCharacter(0xe74c3c); const bag = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.4), new THREE.MeshStandardMaterial({color:0x8e44ad})); bag.position.set(0,1.1,-0.35); bag.visible=false; player.add(bag); player.userData.bag = bag; player.position.y = -0.1; scene.add(player); }

function createTraffic(){ for(let i=0;i<4;i++){ const cartGroup = new THREE.Group(); const horseGroup = new THREE.Group(); const horseBody = new THREE.Mesh(new THREE.BoxGeometry(0.8,0.8,1.5), new THREE.MeshStandardMaterial({color:0x8d6e63})); horseBody.position.y = 0.8; horseGroup.add(horseBody); const horseNeck = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.8,0.5), new THREE.MeshStandardMaterial({color:0x8d6e63})); horseNeck.position.set(0,1.4,-0.8); horseNeck.rotation.x=-0.5; horseGroup.add(horseNeck); const horseHead = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.4,0.7), new THREE.MeshStandardMaterial({color:0x8d6e63})); horseHead.position.set(0,1.8,-1.0); horseGroup.add(horseHead); horseGroup.position.z = -1.5; cartGroup.add(horseGroup); const wagon = new THREE.Group(); const wBody = new THREE.Mesh(new THREE.BoxGeometry(1.8,0.5,2.5), new THREE.MeshStandardMaterial({color:0x5d4037})); wBody.position.y = 0.8; wagon.add(wBody); const wGeo = new THREE.CylinderGeometry(0.4,0.4,0.2,12); const wMat = new THREE.MeshStandardMaterial({color:0x222222}); const w1 = new THREE.Mesh(wGeo,wMat); w1.rotation.z=Math.PI/2; w1.position.set(1,0.4,0.5); wagon.add(w1); const w2 = w1.clone(); w2.position.set(-1,0.4,0.5); wagon.add(w2); const w3 = w1.clone(); w3.position.set(1,0.4,-0.5); wagon.add(w3); const w4 = w1.clone(); w4.position.set(-1,0.4,-0.5); wagon.add(w4); wagon.position.z = 1.5; cartGroup.add(wagon); cartGroup.position.x = 0; cartGroup.position.z = -150 + (i*80); cartGroup.rotation.y = Math.PI; const hay = new THREE.Mesh(new THREE.BoxGeometry(1.4,0.4,2), new THREE.MeshStandardMaterial({color:0xffd54f})); hay.position.set(0,1.1,1.5); cartGroup.add(hay); cartGroup.castShadow = true; scene.add(cartGroup); traffic.push({mesh:cartGroup, speed:0.05 + Math.random()*0.03}); dynamicObjects.push({mesh:cartGroup, velocity:new THREE.Vector3(0,0,0), mass:100, radius:2, isTraffic:true}); }
}

function createVillage(){ const houseColors = [0xecf0f1,0x95a5a6,0xffeebb]; const positions = [{x:-30,z:-30,r:0.5},{x:40,z:-20,r:-0.2},{x:-20,z:40,r:2.5},{x:30,z:30,r:3.5},{x:15,z:-50,r:0},{x:-50,z:10,r:1.5}]; positions.forEach((pos,idx)=>{ const group = new THREE.Group(); const body = new THREE.Mesh(new THREE.BoxGeometry(6,4,6), new THREE.MeshStandardMaterial({color: houseColors[idx%3]})); body.position.y = 2; group.add(body); const roof = new THREE.Mesh(new THREE.ConeGeometry(5,3,4), new THREE.MeshStandardMaterial({color:0x5d4037})); roof.position.y = 5.5; roof.rotation.y = Math.PI/4; group.add(roof); const door = new THREE.Mesh(new THREE.BoxGeometry(1.5,2.5,0.2), new THREE.MeshStandardMaterial({color:0x3e2723})); door.position.set(0,1.25,3); group.add(door); const winMat = new THREE.MeshBasicMaterial({color:0xffeb3b}); const winL = new THREE.Mesh(new THREE.BoxGeometry(1,1,0.2), winMat); winL.position.set(-1.5,2.5,3); group.add(winL); const winR = new THREE.Mesh(new THREE.BoxGeometry(1,1,0.2), winMat); winR.position.set(1.5,2.5,3); group.add(winR); const porchLight = new THREE.PointLight(0xffcc00,1,10); porchLight.position.set(0,3,4); group.add(porchLight); group.position.set(pos.x,0,pos.z); group.rotation.y = pos.r; scene.add(group); group.updateMatrixWorld(); const box = new THREE.Box3(); box.setFromCenterAndSize(new THREE.Vector3(pos.x,2,pos.z), new THREE.Vector3(6.5,10,6.5)); obstacleBoxes.push(box); const doorWorldPos = new THREE.Vector3(0,0,4).applyMatrix4(group.matrixWorld); npcs.push({triggerPos:doorWorldPos, housePos:group.position.clone(), active:false}); }); }

function createCollectibles(){ const geo = new THREE.BoxGeometry(0.8,0.8,0.8); const positions = [{x:12,z:-15,id:1},{x:-20,z:10,id:2},{x:20,z:10,id:3}]; positions.forEach(pos=>{ const data = portfolioData.find(d=>d.id===pos.id); const mat = new THREE.MeshStandardMaterial({ color:data.color, emissive:data.color, emissiveIntensity:0.2 }); const mesh = new THREE.Mesh(geo, mat); mesh.position.set(pos.x,1,pos.z); mesh.castShadow = true; const tape = new THREE.Mesh(new THREE.BoxGeometry(0.82,0.1,0.82), new THREE.MeshBasicMaterial({color:0xffffff})); mesh.add(tape); mesh.userData = { id: pos.id, active:true, baseY:1 }; collectibles.push(mesh); scene.add(mesh); }); }

function createDynamicCrates(){ const geo = new THREE.BoxGeometry(1,1,1); const mat = new THREE.MeshStandardMaterial({color:0xd35400}); for(let i=0;i<10;i++){ const mesh = new THREE.Mesh(geo, mat); const x=(Math.random()-0.5)*60; const z=(Math.random()-0.5)*60; if(Math.abs(x)<8) continue; mesh.position.set(x,0.5,z); mesh.castShadow=true; mesh.receiveShadow=true; scene.add(mesh); dynamicObjects.push({mesh:mesh, velocity:new THREE.Vector3(0,0,0), mass:1, radius:0.7}); } }

function handleKey(e,isDown){ const k = e.key.toLowerCase(); if(k==='w' || k==='arrowup') keys.w = isDown; if(k==='s' || k==='arrowdown') keys.s = isDown; if(k==='a' || k==='arrowleft') keys.a = isDown; if(k==='d' || k==='arrowright') keys.d = isDown; }

function update(){ if(isModalOpen) return; const delta = clock.getDelta(); const time = clock.getElapsedTime(); const forward = new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0), player.rotation.y); if(keys.w) playerVelocity.add(forward.multiplyScalar(config.runSpeed)); if(keys.s) playerVelocity.add(forward.multiplyScalar(-config.runSpeed)); if(keys.a) player.rotation.y += config.turnSpeed; if(keys.d) player.rotation.y -= config.turnSpeed; player.position.add(playerVelocity); playerVelocity.multiplyScalar(config.friction); const speed = playerVelocity.length(); if(speed>0.01){ player.userData.legL.rotation.x = Math.sin(time*10)*0.6; player.userData.legR.rotation.x = Math.sin(time*10+Math.PI)*0.6; player.position.y = -0.1 + Math.abs(Math.sin(time*10))*0.05; } else { player.userData.legL.rotation.x=0; player.userData.legR.rotation.x=0; player.position.y=-0.1; }

    const targetPos = player.position.clone().add(new THREE.Vector3(0,8,12).applyAxisAngle(new THREE.Vector3(0,1,0), player.rotation.y));
    camera.position.lerp(targetPos, 0.1);
    camera.lookAt(player.position.clone().add(new THREE.Vector3(0,1,0)));

    const playerBox = new THREE.Box3().setFromCenterAndSize(player.position.clone().add(new THREE.Vector3(0,1,0)), new THREE.Vector3(0.5,2,0.5));
    obstacleBoxes.forEach(box=>{ if(playerBox.intersectsBox(box)){ const direction = player.position.clone().sub(box.getCenter(new THREE.Vector3())).normalize(); playerVelocity.add(direction.multiplyScalar(0.5)); player.position.add(direction.multiplyScalar(0.2)); } });

    dynamicObjects.forEach(obj=>{ if(obj.isTraffic) return; const dist = player.position.distanceTo(obj.mesh.position); const minDist = 0.5 + obj.radius; if(dist < minDist){ const pushDir = obj.mesh.position.clone().sub(player.position).normalize(); obj.velocity.add(pushDir.multiplyScalar(0.2)); playerVelocity.multiplyScalar(0.5); obj.mesh.rotation.x += (Math.random()-0.5); obj.mesh.rotation.z += (Math.random()-0.5); } obj.mesh.position.add(obj.velocity); obj.velocity.multiplyScalar(0.9); obj.mesh.position.y = 0.5; obj.mesh.rotation.x *= 0.9; obj.mesh.rotation.z *= 0.9; });

    traffic.forEach(t=>{ t.mesh.position.z += t.speed; if(t.mesh.position.z > 300) t.mesh.position.z = -300; const dist = player.position.distanceTo(t.mesh.position); if(dist < 3){ const push = player.position.clone().sub(t.mesh.position).normalize(); playerVelocity.add(push.multiplyScalar(0.1)); } t.mesh.children[0].rotation.x = Math.sin(time * 10) * 0.1; });

    collectibles.forEach(c=>{ if(!c.userData.active) return; c.position.y = c.userData.baseY + Math.sin(time*3) * 0.2; c.rotation.y += 0.02; if(player.position.distanceTo(c.position) < 1.5){ collectPackage(c); } });

    if(hasPackage){ npcs.forEach(npc=>{ if(npc.active) return; if(player.position.distanceTo(npc.triggerPos) < 5){ deliverPackage(npc); } }); }

    const pPositions = particles[0].geometry.attributes.position.array; const pVels = particles[0].userData.velocities; for(let i=0;i<pVels.length;i++){ pPositions[i*3] += pVels[i].x; pPositions[i*3+1] += pVels[i].y; pPositions[i*3+2] += pVels[i].z; if(pPositions[i*3+1] < 0) pPositions[i*3+1] = 20; } particles[0].geometry.attributes.position.needsUpdate = true;
}

function collectPackage(mesh){ if(hasPackage) return; createPoof(mesh.position); mesh.visible=false; mesh.userData.active=false; player.userData.bag.visible=true; player.userData.bag.material.color = mesh.material.color; hasPackage = true; currentPackageId = mesh.userData.id; document.getElementById('status-text').innerHTML = "STATUS: DELIVERY PENDING!"; document.getElementById('status-text').style.color = "#e74c3c"; showInfo(mesh.userData.id); }

function deliverPackage(npc){ npc.active = true; player.userData.bag.visible=false; hasPackage=false; currentPackageId=null; const randomColor = Math.random()*0xffffff; const villager = createCharacter(randomColor); villager.position.copy(npc.triggerPos); villager.scale.set(0,0,0); scene.add(villager); let frame=0; const anim = setInterval(()=>{ frame++; const scale = Math.min(1, frame/10); villager.scale.set(scale,scale,scale); if(frame>10) villager.position.y = -0.1 + Math.sin(frame)*0.1; if(frame>20){ clearInterval(anim); showSpeechBubble(npc.triggerPos); setTimeout(()=>{ scene.remove(villager); npc.active=false; },3000); } },30); document.getElementById('status-text').innerHTML = "STATUS: LOOKING FOR PACKAGES"; document.getElementById('status-text').style.color = "#ffcc00"; }

function showInfo(id){ const data = portfolioData.find(d=>d.id===id); document.getElementById('modal-title').innerText = data.title; document.getElementById('modal-title').style.color = '#' + data.color.toString(16); document.getElementById('modal-content').innerHTML = `<p>${data.content}</p>`; const modal = document.getElementById('modal'); modal.classList.add('active'); isModalOpen = true; }

function closeModal(){ document.getElementById('modal').classList.remove('active'); setTimeout(()=>{ isModalOpen = false; },500); }

function createPoof(pos){ const pCount = 10; const geo = new THREE.BoxGeometry(0.2,0.2,0.2); const mat = new THREE.MeshBasicMaterial({ color:0xffffff }); for(let i=0;i<pCount;i++){ const p = new THREE.Mesh(geo,mat); p.position.copy(pos); p.position.x += (Math.random()-0.5); p.position.z += (Math.random()-0.5); scene.add(p); const dir = new THREE.Vector3(Math.random()-0.5, Math.random(), Math.random()-0.5).normalize(); let f=0; const anim = setInterval(()=>{ p.position.add(dir.multiplyScalar(0.2)); p.scale.multiplyScalar(0.9); f++; if(f>20){ clearInterval(anim); scene.remove(p); } },30); } }

function showSpeechBubble(worldPos){ const texts = ["Thanks!","Warble!","Wahoo!","Great!","Pizza?","♥"]; const text = texts[Math.floor(Math.random()*texts.length)]; const bubble = document.getElementById('bubble'); bubble.innerText = text; bubble.style.opacity = 1; bubble.style.transform = "translateY(0px)"; const vector = worldPos.clone(); vector.project(camera); const x = (vector.x * .5 + .5) * window.innerWidth; const y = (-(vector.y * .5) + .5) * window.innerHeight; bubble.style.left = x + 'px'; bubble.style.top = (y - 50) + 'px'; setTimeout(()=>{ bubble.style.opacity = 0; bubble.style.transform = "translateY(10px)"; },2000); }

function animate(){ requestAnimationFrame(animate); update(); renderer.render(scene, camera); }

function onWindowResize(){ camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }

window.closeModal = closeModal;
document.getElementById('modal-close').addEventListener('click', (e)=>{ e.preventDefault(); closeModal(); });

init();
