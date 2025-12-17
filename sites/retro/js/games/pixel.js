(function(){
    const pixelState = {
        player: { x: 50, y: 200, w: 20, h: 20, dx: 0, dy: 0, grounded: false },
        platforms: [
            {x: 0, y: 280, w: 600, h: 20}, // floor
            {x: 200, y: 220, w: 100, h: 20},
            {x: 400, y: 160, w: 100, h: 20},
            {x: 100, y: 120, w: 80, h: 20},
            {x: 350, y: 80, w: 80, h: 20}
        ],
        keys: {}
    };

    let listenersAttached = false;

    function startPixelRoyale(){
        const canvas = document.getElementById('pixel-canvas');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        window.GM.activeGame = 'pixel';

        // Reset player
        pixelState.player = { x: 50, y: 200, w: 20, h: 20, dx: 0, dy: 0, grounded: false };

        if(!listenersAttached){
            window.addEventListener('keydown', (e) => {
                if(window.GM.activeGame !== 'pixel') return;
                pixelState.keys[e.code] = true;
                if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();

                if(e.code === 'Space') {
                    pixelState.player.x = 50;
                    pixelState.player.y = 50;
                    pixelState.player.dy = 0;
                }
            });
            window.addEventListener('keyup', (e) => {
                if(window.GM.activeGame !== 'pixel') return;
                pixelState.keys[e.code] = false;
            });
            listenersAttached = true;
        }

        function loop(){
            if(window.GM.activeGame !== 'pixel') return;
            const p = pixelState.player;

            // Physics
            if (pixelState.keys['ArrowLeft']) p.dx = -4;
            else if (pixelState.keys['ArrowRight']) p.dx = 4;
            else p.dx *= 0.8; // friction

            if (pixelState.keys['ArrowUp'] && p.grounded) {
                p.dy = -10;
                p.grounded = false;
            }

            p.dy += 0.5; // gravity
            p.x += p.dx;
            p.y += p.dy;
            p.grounded = false;

            // Draw
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#33ff00'; // Platforms
            pixelState.platforms.forEach(plat => {
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                
                // Simple AABB Collision
                if (p.x < plat.x + plat.w &&
                    p.x + p.w > plat.x &&
                    p.y < plat.y + plat.h &&
                    p.y + p.h > plat.y) {
                        
                        // Check if landing on top
                        if(p.dy > 0 && p.y + p.h - p.dy <= plat.y) {
                            p.y = plat.y - p.h;
                            p.dy = 0;
                            p.grounded = true;
                        }
                }
            });

            // Screen boundaries
            if(p.y > canvas.height) { p.y = 0; p.dy = 0; } // wrap/respawn fall

            // Draw Player
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(p.x, p.y, p.w, p.h);

            window.GM.gameInterval = requestAnimationFrame(loop);
        }
        loop();
    }

    window.startPixelRoyale = startPixelRoyale;
})();