import { getChunkData, toWorld } from './entities.js';
import { drawSprite, drawIsoBox } from './render.js';

export function createEngine(canvas, uiLayer, network, config = {}) {
    const ctx = canvas.getContext('2d', { alpha: false });
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    window.addEventListener('resize', () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; });

    const ui = uiLayer;

    const state = {
        gameState: 'ROAM',
        player: { x:0, y:0, z:0, speed:6, gold:0, health:100, maxHealth:100, weapon:'pistol', lastShot:0, angle:0 },
        camera: { x:0, y:0 },
        remotePlayers: {},
        projectiles: [],
        particles: [],
        collectedCoins: new Set(),
        deadEnemies: new Set(),
        nearbySaloons: []
    };

    // Input
    const keys = { w:false, a:false, s:false, d:false, e:false };
    const mouse = { x: width/2, y: height/2, down:false };
    window.addEventListener('keydown', ev => { if (ev.key.toLowerCase() in keys) keys[ev.key.toLowerCase()] = true; if (ev.key.toLowerCase() === 'e') checkInteraction(); });
    window.addEventListener('keyup', ev => { if (ev.key.toLowerCase() in keys) keys[ev.key.toLowerCase()] = false; });
    window.addEventListener('mousemove', ev => { mouse.x = ev.clientX; mouse.y = ev.clientY; });
    window.addEventListener('mousedown', () => mouse.down = true);
    window.addEventListener('mouseup', () => mouse.down = false);

    let lastNetworkUpdate = 0;

    function updateNetwork() {
        if (!network) return;
        const now = Date.now();
        if (now - lastNetworkUpdate > 100) {
            lastNetworkUpdate = now;
            network.sendState({ x: state.player.x, y: state.player.y, angle: state.player.angle, weapon: state.player.weapon }).catch(()=>{});
        }
    }

    function checkInteraction(){
        if(state.gameState==='ROAM'){
            const nearest = state.nearbySaloons.find(b => { const d = (state.player.x - b.x)**2 + (state.player.y - b.y)**2; return d < 22500; });
            if (nearest) { openShop(nearest.subtype); }
        } else if (state.gameState==='SHOP') { closeShop(); }
    }

    function openShop(type){ state.gameState='SHOP'; ui.shopOverlay.style.display='flex'; document.getElementById('shop-title').innerText = type==='saloon' ? 'SALOON BAR' : type==='bank' ? 'BANK VAULT' : 'SAFEHOUSE'; }
    function closeShop(){ state.gameState='ROAM'; ui.shopOverlay.style.display='none'; }

    function updatePlayer(){
        let dx=0, dy=0;
        if(keys.w){dx-=1; dy-=1;} if(keys.s){dx+=1; dy+=1;} if(keys.a){dx-=1; dy+=1;} if(keys.d){dx+=1; dy-=1;}
        if(dx!==0 || dy!==0){ const len = Math.hypot(dx,dy); dx/=len; dy/=len; }
        state.player.x += dx * state.player.speed; state.player.y += dy * state.player.speed;
        const targetCamX = (state.player.x - state.player.y);
        const targetCamY = (state.player.x + state.player.y)/2;
        state.camera.x += (targetCamX - state.camera.x) * 0.1; state.camera.y += (targetCamY - state.camera.y) * 0.1;
        const wMouse = toWorld(mouse.x, mouse.y, width, height, state.camera);
        state.player.angle = Math.atan2(wMouse.y - state.player.y, wMouse.x - state.player.x);
        if (mouse.down) shoot();
        updateNetwork();
    }

    function shoot(){
        const now = Date.now();
        const wep = { pistol:{damage:1, rate:20, speed:12, spread:0.1}, shotgun:{damage:2, rate:50, speed:10, spread:.4, count:6} }[state.player.weapon] || {damage:1, rate:20, speed:12, spread:0.1};
        if(now - state.player.lastShot > wep.rate * 16){ state.player.lastShot = now; const count = wep.count || 1; for(let i=0;i<count;i++){ const spread = (Math.random()-0.5) * wep.spread; const angle = state.player.angle + spread; state.projectiles.push({ x: state.player.x, y: state.player.y, z:15, vx: Math.cos(angle)*wep.speed, vy: Math.sin(angle)*wep.speed, dmg: wep.damage, life:60, color:'#fff' }); } }
    }

    function updateProjectiles(){ for(let i=state.projectiles.length-1;i>=0;i--){ const p = state.projectiles[i]; p.x += p.vx; p.y += p.vy; p.life--; if(p.life<=0) state.projectiles.splice(i,1);} }

    function drawGame(){
        ctx.fillStyle = '#4e342e'; ctx.fillRect(0,0,width,height);
        const renderList = [];
        renderList.push({ ...state.player, type:'player', sortY: state.player.x + state.player.y });
        for(let id in state.remotePlayers) renderList.push({ ...state.remotePlayers[id], type:'remote_player', sortY: state.remotePlayers[id].x + state.remotePlayers[id].y });
        const chunkRad = 1; const cx = Math.floor(state.player.x / 1200); const cy = Math.floor(state.player.y / 1200);
        const now = Date.now();
        for(let xx = cx - chunkRad; xx <= cx + chunkRad; xx++){
            for(let yy = cy - chunkRad; yy <= cy + chunkRad; yy++){
                const ents = getChunkData(xx, yy);
                for(let i=0;i<ents.length;i++){
                    const e = ents[i];
                    if (Math.abs(e.x - state.player.x) > 1000 || Math.abs(e.y - state.player.y) > 1000) continue;
                    if (e.type === 'zombie'){
                        if (state.deadEnemies.has(e.id)) continue;
                        const dx = state.player.x - e.x; const dy = state.player.y - e.y; const distSq = dx*dx + dy*dy;
                        const uniqueOffset = e.uniqueId || 0; const wobbleX = Math.sin(now/300 + uniqueOffset) * 0.8; const wobbleY = Math.cos(now/450 + uniqueOffset) * 0.8;
                        if (distSq < 640000){ const d = Math.sqrt(distSq); e.x += ((dx/d) + wobbleX) * e.speed; e.y += ((dy/d) + wobbleY) * e.speed; }
                        if (distSq < 400){ state.player.health -= 0.5; if (state.player.health <= 0){ state.player.health = 100; state.player.gold = 0; state.player.x = 0; state.player.y = 0; ui.deathMsg.style.display='block'; setTimeout(()=> ui.deathMsg.style.display='none', 2000); } }
                        for(let j=state.projectiles.length-1;j>=0;j--){ const p = state.projectiles[j]; if((p.x - e.x)**2 + (p.y - e.y)**2 < 400){ e.hp -= p.dmg; state.projectiles.splice(j,1); state.particles.push({x:e.x,y:e.y,life:10,col:'#0f0'}); if(e.hp<=0){ state.deadEnemies.add(e.id); if(Math.random() > 0.5){ state.collectedCoins.delete(e.id+'_loot'); state.player.gold += 15; } } } }
                    }
                    if (e.type === 'loot'){
                        if (state.collectedCoins.has(e.id)) continue;
                        if ((state.player.x - e.x)**2 + (state.player.y - e.y)**2 < 900){ state.collectedCoins.add(e.id); state.player.gold += e.val; continue; }
                    }
                    renderList.push({ ...e, sortY: e.x + e.y });
                }
            }
        }
        renderList.sort((a,b) => a.sortY - b.sortY);
        state.nearbySaloons = []; ui.promptEl.style.display='none';
        for(let i=0;i<renderList.length;i++){ const e = renderList[i]; if(e.type === 'building'){ drawIsoBox(ctx, e.x, e.y, e.w/2, e.h/2, e.depth, e.color, '#3e2723', width, height, state.camera); const scrX = (e.x - e.y) + width/2 - state.camera.x; const topY = (e.x + e.y)/2 - e.depth + height/2 - state.camera.y; ctx.fillStyle='#000'; ctx.font='12px Courier'; ctx.textAlign='center'; ctx.fillText(e.subtype.toUpperCase(), scrX, topY - 10); if (Math.abs(state.player.x - e.x) < 150 && Math.abs(state.player.y - e.y) < 150){ state.nearbySaloons.push(e); ui.promptEl.style.display='block'; } }
            else drawSprite(ctx, e, width, height, state.camera);
        }
        ctx.lineWidth = 2; for(let i=0;i<state.projectiles.length;i++){ const p = state.projectiles[i]; const sX = (p.x - p.y) + width/2 - state.camera.x; const sY = (p.x + p.y)/2 - p.z + height/2 - state.camera.y; const tailX = (p.x - p.vx*2 - (p.y - p.vy*2)) + width/2 - state.camera.x; const tailY = (p.x - p.vx*2 + p.y - p.vy*2)/2 - p.z + height/2 - state.camera.y; ctx.strokeStyle = p.color; ctx.beginPath(); ctx.moveTo(sX, sY); ctx.lineTo(tailX, tailY); ctx.stroke(); }
        for(let i=state.particles.length-1;i>=0;i--){ const p = state.particles[i]; p.life--; const sX = (p.x - p.y) + width/2 - state.camera.x; const sY = (p.x + p.y)/2 - 20 + height/2 - state.camera.y; ctx.fillStyle = p.col || '#fff'; ctx.fillRect(sX, sY, 4, 4); if(p.life<=0) state.particles.splice(i,1); }
    }

    function gameLoop(){ if (state.gameState === 'ROAM'){ updatePlayer(); updateProjectiles(); } drawGame(); requestAnimationFrame(gameLoop); }

    // connect network updates
    if (network) network.onPlayersUpdate((players) => { state.remotePlayers = players || {}; });

    return { start: () => { gameLoop(); }, state, ui, canvas };
}
