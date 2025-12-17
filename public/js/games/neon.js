export function createNeonGame(canvas) {
  const ctx = canvas.getContext('2d');
  const state = {
    playerX: canvas.width / 2 - 20,
    playerY: 250,
    obstacles: [],
    score: 0,
    speed: 4,
    keys: {}
  };

  let rafId = null;

  function spawnObstacle() {
    const width = Math.random() * 100 + 40;
    const x = Math.random() * (canvas.width - width);
    state.obstacles.push({ x, y: -50, width, height: 20 });
  }

  function keyDown(e) { state.keys[e.code] = true; if (['ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault(); }
  function keyUp(e) { state.keys[e.code] = false; }

  function loop() {
    // Update
    if (state.keys['ArrowLeft']) state.playerX -= 5;
    if (state.keys['ArrowRight']) state.playerX += 5;

    // Boundaries
    if (state.playerX < 0) state.playerX = 0;
    if (state.playerX > canvas.width - 40) state.playerX = canvas.width - 40;

    if (Math.random() < 0.02) spawnObstacle();

    // Draw
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#333';
    ctx.beginPath();
    for(let i=0;i<canvas.width;i+=40){ ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); }
    ctx.stroke();

    // Player
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 15; ctx.shadowColor = '#00ffff';
    ctx.fillRect(state.playerX, state.playerY, 40, 40);
    ctx.shadowBlur = 0;

    // Obstacles & collision
    ctx.fillStyle = '#ff0055';
    for (let i = 0; i < state.obstacles.length; i++) {
      let obs = state.obstacles[i]; obs.y += state.speed; ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      if (state.playerX < obs.x + obs.width && state.playerX + 40 > obs.x && state.playerY < obs.y + obs.height && state.playerY + 40 > obs.y) {
        // Reset on hit
        state.score = 0; state.obstacles = []; obs.y = canvas.height + 100;
      }
    }

    state.obstacles = state.obstacles.filter(o => o.y < canvas.height);

    ctx.fillStyle = '#33ff00';
    ctx.font = '20px "VT323"';
    ctx.fillText(`SCORE: ${state.score++}`, 10, 25);

    rafId = requestAnimationFrame(loop);
  }

  function start() {
    // reset
    state.playerX = canvas.width / 2 - 20; state.obstacles = []; state.score = 0; state.speed = 4;
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    loop();
  }

  function stop() {
    if (rafId) cancelAnimationFrame(rafId); rafId = null;
    window.removeEventListener('keydown', keyDown);
    window.removeEventListener('keyup', keyUp);
  }

  return { start, stop };
}