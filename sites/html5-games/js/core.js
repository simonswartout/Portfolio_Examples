/* Modularized Neon Core Defense (extracted from inline HTML)
   Placed under sites/html5-games/js/core.js
*/
(function(){
  // Query DOM
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score-display');
  const weaponEl = document.getElementById('weapon-display');
  const healthFill = document.getElementById('health-fill');
  const menuOverlay = document.getElementById('menu-overlay');
  const startBtn = document.getElementById('start-btn');
  const finalScoreEl = document.getElementById('final-score');
  const gameTitle = document.getElementById('game-title');
  const statsEl = document.getElementById('stats');
  const fpsEl = document.getElementById('fps-display');

  // Game State
  let gameState = 'MENU';
  let animationId;
  let score = 0;
  let frameCount = 0;

  // Screen Dimensions
  let width, height;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Input
  const keys = { w: false, a: false, s: false, d: false };
  const mouse = { x: width / 2, y: height / 2, down: false };

  window.addEventListener('keydown', e => {
    if (e.key === 'w' || e.key === 'W') keys.w = true;
    if (e.key === 'a' || e.key === 'A') keys.a = true;
    if (e.key === 's' || e.key === 'S') keys.s = true;
    if (e.key === 'd' || e.key === 'D') keys.d = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'w' || e.key === 'W') keys.w = false;
    if (e.key === 'a' || e.key === 'A') keys.a = false;
    if (e.key === 's' || e.key === 'S') keys.s = false;
    if (e.key === 'd' || e.key === 'D') keys.d = false;
  });

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mousedown', () => mouse.down = true);
  window.addEventListener('mouseup', () => mouse.down = false);

  // Utility: Squared Distance for collision optimization
  const distSq = (x1, y1, x2, y2) => (x1 - x2) ** 2 + (y1 - y2) ** 2;

  // --- POOLS ---
  const projectilePool = [];
  const particlePool = [];
  const enemyPool = [];
  const enemyProjectilePool = [];

  // Factories (kept minimal, same design as original)
  function getProjectile(x, y, velocity, color, pierce, widthMultiplier) {
    let p = projectilePool.length ? projectilePool.pop() : new Projectile();
    p.init(x, y, velocity, color, pierce, widthMultiplier);
    return p;
  }
  function getParticle(x, y, radius, color, velocity) {
    let p = particlePool.length ? particlePool.pop() : new Particle();
    p.init(x, y, radius, color, velocity);
    return p;
  }
  function getEnemy(x, y, type) {
    let e = enemyPool.length ? enemyPool.pop() : new Enemy();
    e.init(x, y, type);
    return e;
  }
  function getEnemyProjectile(x, y, velocity) {
    let ep = enemyProjectilePool.length ? enemyProjectilePool.pop() : new EnemyProjectile();
    ep.init(x, y, velocity);
    return ep;
  }

  // --- Classes (copied/trimmed from original, preserved behavior) ---
  class Player { /* implementation copied from template */
    constructor() {
      this.x = width / 2; this.y = height / 2; this.radius = 15; this.color = '#0ff'; this.velocity = { x:0, y:0 }; this.speed = 5; this.friction = 0.92; this.health = 100; this.maxHealth = 100; this.lastShot = 0; this.angle = 0; this.weaponType = 'normal'; this.powerUpTimer = 0; this.spiralAngle = 0;
    }
    update() {
      if (keys.w) this.velocity.y -= 1; if (keys.s) this.velocity.y += 1; if (keys.a) this.velocity.x -= 1; if (keys.d) this.velocity.x += 1;
      this.velocity.x *= this.friction; this.velocity.y *= this.friction;
      const currentSpeedSq = this.velocity.x**2 + this.velocity.y**2;
      if (currentSpeedSq > this.speed**2) { const currentSpeed = Math.sqrt(currentSpeedSq); this.velocity.x = (this.velocity.x / currentSpeed) * this.speed; this.velocity.y = (this.velocity.y / currentSpeed) * this.speed; }
      this.x += this.velocity.x; this.y += this.velocity.y;
      if (this.x < this.radius) this.x = this.radius; if (this.x > width - this.radius) this.x = width - this.radius; if (this.y < this.radius) this.y = this.radius; if (this.y > height - this.radius) this.y = height - this.radius;
      const dx = mouse.x - this.x; const dy = mouse.y - this.y; this.angle = Math.atan2(dy, dx);
      if (this.powerUpTimer > 0) { this.powerUpTimer--; if (this.powerUpTimer <= 0) this.setWeapon('normal'); }
      let fireRate = 8; if (this.weaponType === 'rapid') fireRate = 3; if (this.weaponType === 'laser') fireRate = 20; if (this.weaponType === 'radial') fireRate = 2;
      if (mouse.down && frameCount - this.lastShot > fireRate) { this.shoot(); this.lastShot = frameCount; }
    }
    setWeapon(type) { this.weaponType = type; if (type === 'normal') { weaponEl.innerText = 'SYSTEM: NORMAL'; weaponEl.style.color = '#fff'; } else { this.powerUpTimer = 600; let color = '#fff'; if (type === 'rapid') color = '#ff0'; if (type === 'laser') color = '#f00'; if (type === 'radial') color = '#00f'; weaponEl.innerText = `SYSTEM: ${type.toUpperCase()}`; weaponEl.style.color = color; } }
    shoot() {
      const recoilForce = 2; this.velocity.x -= Math.cos(this.angle) * recoilForce * 0.5; this.velocity.y -= Math.sin(this.angle) * recoilForce * 0.5; const muzzleX = this.x + Math.cos(this.angle) * 20; const muzzleY = this.y + Math.sin(this.angle) * 20;
      if (this.weaponType === 'normal') { const vel = { x: Math.cos(this.angle) * 12, y: Math.sin(this.angle) * 12 }; projectiles.push(getProjectile(muzzleX, muzzleY, vel, this.color, 1, 1)); }
      else if (this.weaponType === 'rapid') { const spread = (Math.random() - 0.5) * 0.2; const finalAngle = this.angle + spread; const vel = { x: Math.cos(finalAngle) * 15, y: Math.sin(finalAngle) * 15 }; projectiles.push(getProjectile(muzzleX, muzzleY, vel, '#ff0', 1, 1)); }
      else if (this.weaponType === 'laser') { const vel = { x: Math.cos(this.angle) * 25, y: Math.sin(this.angle) * 25 }; projectiles.push(getProjectile(muzzleX, muzzleY, vel, '#f00', 5, 3)); }
      else if (this.weaponType === 'radial') { this.spiralAngle += 0.3; for(let i=0;i<3;i++){ const baseAngle = this.spiralAngle + (i * (Math.PI*2/3)); const vel = { x: Math.cos(baseAngle) * 10, y: Math.sin(baseAngle) * 10 }; projectiles.push(getProjectile(this.x, this.y, vel, '#00f', 1, 1)); } }
      particles.push(getParticle(muzzleX, muzzleY, Math.random()*3 + 2, '#fff', {x:0,y:0}));
    }
    draw() {
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); let activeColor = this.color; if(this.weaponType === 'rapid') activeColor = '#ff0'; if(this.weaponType === 'laser') activeColor = '#f00'; if(this.weaponType === 'radial') activeColor = '#00f'; ctx.strokeStyle = activeColor; ctx.beginPath(); ctx.moveTo(20,0); ctx.lineTo(-15,-12); ctx.lineTo(-10,0); ctx.lineTo(-15,12); ctx.closePath(); ctx.lineWidth = 6; ctx.globalAlpha = 0.3; ctx.stroke(); ctx.lineWidth = 2; ctx.globalAlpha = 1.0; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-5,0,4,0,Math.PI*2); ctx.fill(); ctx.restore();
    }
  }

  class Projectile { init(x,y,velocity,color,pierce=1,widthMultiplier=1){ this.x=x;this.y=y;this.velocity=velocity;this.color=color;this.pierce=pierce;this.radius=4*widthMultiplier;this.markedForDeletion=false;} update(){ this.x += this.velocity.x; this.y += this.velocity.y; if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) this.markedForDeletion = true; } draw(){ ctx.save(); ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x,this.y,this.radius,0,Math.PI*2); ctx.fill(); ctx.restore(); } }
  class EnemyProjectile { init(x,y,velocity){ this.x=x;this.y=y;this.velocity=velocity;this.radius=6;this.color='#fa0';this.markedForDeletion=false;} update(){ this.x += this.velocity.x; this.y += this.velocity.y; if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) this.markedForDeletion = true; } draw(){ ctx.save(); ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x,this.y,this.radius,0,Math.PI*2); ctx.fill(); ctx.restore(); } }
  class PowerUp { constructor(){ this.radius = 15; this.x = Math.random() * (width - 100) + 50; this.y = Math.random() * (height - 100) + 50; const r = Math.random(); if (r < 0.6) { this.type = 'rapid'; this.color = '#ff0'; } else if (r < 0.8) { this.type = 'laser'; this.color = '#f00'; } else { this.type = 'radial'; this.color = '#00f'; } this.markedForDeletion=false; this.timer=0; } update(){ this.timer++; this.radius = 15 + Math.sin(this.timer * 0.1) * 3; if (this.timer>900) this.markedForDeletion=true; } draw(){ ctx.save(); ctx.strokeStyle = this.color; ctx.translate(this.x,this.y); ctx.rotate(this.timer*0.05); ctx.strokeRect(-10,-10,20,20); ctx.lineWidth=4; ctx.globalAlpha=0.3; ctx.strokeRect(-12,-12,24,24); ctx.globalAlpha=1.0; ctx.fillStyle='#fff'; ctx.font='bold 12px Courier'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.rotate(-this.timer*0.05); ctx.fillText(this.type[0].toUpperCase(),0,0); ctx.restore(); } }
  class Enemy { init(x,y,type){ this.x=x;this.y=y;this.type=type;this.markedForDeletion=false;this.angle=0;this.rotationSpeed=0.05;this.velocity={x:0,y:0};this.reloadTimer=0; if(type==='grunt'){this.radius=15;this.color='#f0f';this.speed=2.5;this.health=1;this.score=100;} else if(type==='tank'){this.radius=25;this.color='#0f0';this.speed=0.8;this.health=6;this.score=300;} else if(type==='dasher'){this.radius=12;this.color='#ff0';this.speed=5;this.health=1;this.score=200;} else if(type==='shooter'){this.radius=20;this.color='#f80';this.speed=1.5;this.health=3;this.score=400;} else if(type==='splitter'){this.radius=35;this.color='#fff';this.speed=1;this.health=5;this.score=500;} } update(){ const dx = player.x - this.x; const dy = player.y - this.y; const angleToPlayer = Math.atan2(dy,dx); if(this.type==='shooter'){ const distSqToPlayer = dx*dx + dy*dy; if(distSqToPlayer > 90000){ this.velocity.x = Math.cos(angleToPlayer)*this.speed; this.velocity.y = Math.sin(angleToPlayer)*this.speed; } else { this.velocity.x *= 0.9; this.velocity.y *= 0.9; } this.reloadTimer++; if(this.reloadTimer>120){ const pVel = { x: Math.cos(angleToPlayer)*5, y: Math.sin(angleToPlayer)*5 }; const ep = getEnemyProjectile(this.x, this.y, pVel); enemyProjectiles.push(ep); this.reloadTimer = 0; } } else { this.velocity.x = Math.cos(angleToPlayer)*this.speed; this.velocity.y = Math.sin(angleToPlayer)*this.speed; } this.x += this.velocity.x; this.y += this.velocity.y; this.angle += this.rotationSpeed; } draw(){ ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(this.angle); ctx.strokeStyle = this.color; ctx.beginPath(); if(this.type==='grunt'){ ctx.moveTo(0,-this.radius); ctx.lineTo(this.radius,0); ctx.lineTo(0,this.radius); ctx.lineTo(-this.radius,0); } else if(this.type==='tank'){ ctx.rect(-this.radius+5,-this.radius+5,this.radius*2-10,this.radius*2-10); ctx.moveTo(-this.radius+5,-this.radius+5); ctx.lineTo(this.radius-5,this.radius-5); ctx.moveTo(this.radius-5,-this.radius+5); ctx.lineTo(-this.radius+5,this.radius-5); } else if(this.type==='dasher'){ ctx.moveTo(this.radius,0); ctx.lineTo(-this.radius,-this.radius/2); ctx.lineTo(-this.radius,this.radius/2); } else if(this.type==='shooter'){ ctx.moveTo(this.radius,0); ctx.lineTo(-this.radius/2,this.radius); ctx.lineTo(-this.radius/2,-this.radius); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill(); } else if(this.type==='splitter'){ for(let i=0;i<6;i++){ ctx.lineTo(this.radius*Math.cos(i*Math.PI/3), this.radius*Math.sin(i*Math.PI/3)); } } ctx.closePath(); ctx.lineWidth = 6; ctx.globalAlpha = 0.3; ctx.stroke(); ctx.lineWidth = 2; ctx.globalAlpha = 1.0; ctx.stroke(); ctx.restore(); } }
  class Particle { init(x,y,radius,color,velocity){ this.x=x;this.y=y;this.radius=radius;this.color=color;this.velocity=velocity;this.alpha=1;this.friction=0.95;this.decay=Math.random()*0.03+0.01;this.markedForDeletion=false;} update(){ this.velocity.x *= this.friction; this.velocity.y *= this.friction; this.x += this.velocity.x; this.y += this.velocity.y; this.alpha -= this.decay; if(this.alpha<=0) this.markedForDeletion=true;} draw(){ ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x,this.y,this.radius,0,Math.PI*2); ctx.fill(); ctx.restore(); } }

  // --- LOGIC ---
  let player = new Player();
  let projectiles = [];
  let enemyProjectiles = [];
  let enemies = [];
  let particles = [];
  let powerUps = [];
  let spawnTimer = 0;
  let powerUpSpawnTimer = 0;

  function init() {
    projectiles.forEach(p=>projectilePool.push(p)); enemies.forEach(e=>enemyPool.push(e)); particles.forEach(p=>particlePool.push(p)); enemyProjectiles.forEach(ep=>enemyProjectilePool.push(ep));
    projectiles = []; enemyProjectiles = []; enemies = []; particles = []; powerUps = [];
    player = new Player(); score = 0; frameCount = 0; scoreEl.innerText = 'SCORE: 0'; updateHealthUI(); gameState = 'PLAYING'; menuOverlay.classList.add('hidden'); animate();
  }

  function spawnEnemies(){ spawnTimer--; if(spawnTimer<=0){ const radius = 40; let x,y; if(Math.random() < 0.5){ x = Math.random() < 0.5 ? 0 - radius : width + radius; y = Math.random()*height; } else { x = Math.random() * width; y = Math.random() < 0.5 ? 0 - radius : height + radius; } let type='grunt'; const r=Math.random(); if(score>1000){ if(r<0.1) type='splitter'; else if(r<0.3) type='shooter'; else if(r<0.5) type='dasher'; else if(r<0.7) type='tank'; } else if(score>500){ if(r<0.2) type='shooter'; else if(r<0.4) type='dasher'; else if(r<0.6) type='tank'; } else if(score>200){ if(r<0.3) type='tank'; } enemies.push(getEnemy(x,y,type)); spawnTimer = Math.max(25, 60 - Math.floor(score/200)); } }

  function spawnPowerUps(){ powerUpSpawnTimer++; if(powerUpSpawnTimer>300){ if(Math.random()<0.7) powerUps.push(new PowerUp()); powerUpSpawnTimer=0; } }

  function createExplosion(x,y,color,size){ for(let i=0;i<8*size;i++){ const angle=Math.random()*Math.PI*2; const speed=Math.random()*4+1; const vel={x:Math.cos(angle)*speed, y:Math.sin(angle)*speed}; particles.push(getParticle(x,y,Math.random()*2+1,color,vel)); } }

  function updateHealthUI(){ const pct = Math.max(0,(player.health / player.maxHealth) * 100); healthFill.style.width = `${pct}%`; healthFill.style.backgroundColor = pct < 30 ? '#f00' : '#f0f'; healthFill.style.boxShadow = pct < 30 ? '0 0 10px #f00' : '0 0 10px #f0f'; }

  function gameOver(){ gameState = 'GAME_OVER'; cancelAnimationFrame(animationId); gameTitle.innerText = 'CRITICAL FAILURE'; startBtn.innerText = 'Reboot System'; finalScoreEl.innerText = `FINAL SCORE: ${score}`; finalScoreEl.classList.remove('hidden'); menuOverlay.classList.remove('hidden'); }

  // FPS counters
  let lastFpsTime = 0; let fpsFrames = 0;

  function animate(timeStamp){ if(gameState !== 'PLAYING') return; animationId = requestAnimationFrame(animate); frameCount++; if(!lastFpsTime) lastFpsTime = timeStamp; const elapsed = timeStamp - lastFpsTime; fpsFrames++; if(elapsed >= 1000){ fpsEl.innerText = `FPS: ${fpsFrames}`; fpsFrames = 0; lastFpsTime = timeStamp; }
    ctx.fillStyle = 'rgba(5,5,5,0.3)'; ctx.fillRect(0,0,width,height); ctx.globalCompositeOperation = 'lighter'; player.update(); player.draw(); spawnEnemies(); spawnPowerUps();

    for(let i=0;i<powerUps.length;i++){ const pu = powerUps[i]; pu.update(); pu.draw(); const radiiSum = player.radius + pu.radius; if(distSq(player.x, player.y, pu.x, pu.y) < radiiSum * radiiSum){ player.setWeapon(pu.type); createExplosion(pu.x, pu.y, pu.color, 2); pu.markedForDeletion = true; score += 50; } if(pu.markedForDeletion){ powerUps[i] = powerUps[powerUps.length - 1]; powerUps.pop(); i--; } }

    for(let i=0;i<projectiles.length;i++){ const p = projectiles[i]; p.update(); p.draw(); if(p.markedForDeletion){ projectilePool.push(p); projectiles[i] = projectiles[projectiles.length - 1]; projectiles.pop(); i--; } }

    for(let i=0;i<enemyProjectiles.length;i++){ const ep = enemyProjectiles[i]; ep.update(); ep.draw(); let hit = false; const radiiSum = player.radius + ep.radius; if(distSq(ep.x, ep.y, player.x, player.y) < radiiSum * radiiSum){ player.health -= 10; updateHealthUI(); createExplosion(player.x, player.y, '#f00', 2); hit = true; if(player.health <= 0) gameOver(); } if(ep.markedForDeletion || hit){ enemyProjectilePool.push(ep); enemyProjectiles[i] = enemyProjectiles[enemyProjectiles.length - 1]; enemyProjectiles.pop(); i--; } }

    for(let i=0;i<enemies.length;i++){ const enemy = enemies[i]; enemy.update(); enemy.draw(); for(let j=0;j<projectiles.length;j++){ const p = projectiles[j]; const radiiSum = enemy.radius + p.radius; if(distSq(p.x, p.y, enemy.x, enemy.y) < radiiSum * radiiSum){ enemy.health--; createExplosion(p.x, p.y, p.color, 1); p.pierce--; if(p.pierce <= 0){ p.markedForDeletion = true; } if(enemy.health <= 0 && !enemy.markedForDeletion){ enemy.markedForDeletion = true; createExplosion(enemy.x, enemy.y, enemy.color, 3); score += enemy.score; scoreEl.innerText = `SCORE: ${score}`; if(enemy.type === 'splitter'){ for(let k=0;k<3;k++){ const mini = getEnemy(enemy.x, enemy.y, 'grunt'); mini.velocity = { x: Math.random()*4 - 2, y: Math.random()*4 - 2 }; enemies.push(mini); } } } } }
      const pRadiiSum = enemy.radius + player.radius; if(!enemy.markedForDeletion && distSq(player.x, player.y, enemy.x, enemy.y) < pRadiiSum * pRadiiSum){ player.health -= 20; updateHealthUI(); enemy.markedForDeletion = true; createExplosion(enemy.x, enemy.y, enemy.color, 4); createExplosion(player.x, player.y, '#fff', 3); if(player.health <= 0) gameOver(); }
      if(enemy.markedForDeletion){ enemyPool.push(enemy); enemies[i] = enemies[enemies.length - 1]; enemies.pop(); i--; } }

    for(let i=0;i<particles.length;i++){ const p = particles[i]; p.update(); p.draw(); if(p.markedForDeletion){ particlePool.push(p); particles[i] = particles[particles.length - 1]; particles.pop(); i--; } }

    ctx.globalCompositeOperation = 'source-over'; if(frameCount % 60 === 0){ statsEl.innerText = `Entities: ${projectiles.length + enemies.length + particles.length} | Pool Reserves: ${projectilePool.length + enemyPool.length + particlePool.length}`; }
  }

  startBtn.addEventListener('click', init);

  // Export minimal control to window for optional debugging
  window.NeonCore = { start: init, getScore: ()=>score };
})();
