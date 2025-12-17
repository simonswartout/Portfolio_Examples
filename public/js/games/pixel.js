export function createPixelGame(canvas) {
  const ctx = canvas.getContext('2d');
  const state = {
    player: { x: 50, y: 200, w: 20, h: 20, dx: 0, dy: 0, grounded: false },
    platforms: [
      {x:0,y:280,w:600,h:20},
      {x:200,y:220,w:100,h:20},
      {x:400,y:160,w:100,h:20},
      {x:100,y:120,w:80,h:20},
      {x:350,y:80,w:80,h:20}
    ],
    keys: {}
  };

  let rafId = null;

  function keyDown(e){ state.keys[e.code]=true; if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault(); if(e.code==='Space'){ state.player.x=50; state.player.y=50; state.player.dy=0; } }
  function keyUp(e){ state.keys[e.code]=false }

  function loop(){
    const p = state.player;

    if (state.keys['ArrowLeft']) p.dx = -4;
    else if (state.keys['ArrowRight']) p.dx = 4;
    else p.dx *= 0.8;

    if (state.keys['ArrowUp'] && p.grounded){ p.dy = -10; p.grounded=false }

    p.dy += 0.5;
    p.x += p.dx;
    p.y += p.dy;
    p.grounded = false;

    ctx.fillStyle = '#000'; ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle = '#33ff00';
    state.platforms.forEach(plat => {
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      if (p.x < plat.x + plat.w && p.x + p.w > plat.x && p.y < plat.y + plat.h && p.y + p.h > plat.y) {
        if(p.dy > 0 && p.y + p.h - p.dy <= plat.y){ p.y = plat.y - p.h; p.dy = 0; p.grounded = true; }
      }
    });

    if (p.y > canvas.height) { p.y = 0; p.dy = 0; }

    ctx.fillStyle = '#ff00ff'; ctx.fillRect(p.x, p.y, p.w, p.h);

    rafId = requestAnimationFrame(loop);
  }

  function start(){
    state.player = { x:50,y:200,w:20,h:20,dx:0,dy:0,grounded:false };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    loop();
  }

  function stop(){ if (rafId) cancelAnimationFrame(rafId); rafId = null; window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); }

  return { start, stop };
}