(function(){
    const neonState = {
        playerX: 300,
        playerY: 250,
        obstacles: [],
        score: 0,
        speed: 5,
        keys: {}
    };

    let listenersAttached = false;

    function spawnObstacle(canvas){
        const width = Math.random() * 100 + 40;
        const x = Math.random() * (canvas.width - width);
        neonState.obstacles.push({ x, y: -50, width, height: 20 });
    }

    function startNeonRacer(){
        const canvas = document.getElementById('neon-canvas');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');

        // Reset state
        neonState.playerX = canvas.width / 2 - 20;
        neonState.obstacles = [];
        neonState.score = 0;
        neonState.speed = 4;
        window.GM.activeGame = 'neon';

        // Attach listeners once
        if(!listenersAttached){
            window.addEventListener('keydown', (e) => {
                if(window.GM.activeGame !== 'neon') return;
                neonState.keys[e.code] = true;
                if(['ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
            });
            window.addEventListener('keyup', (e) => {
                if(window.GM.activeGame !== 'neon') return;
                neonState.keys[e.code] = false;
            });
            listenersAttached = true;
        }

        function loop(){
            if(window.GM.activeGame !== 'neon') return;

            // Update
            if (neonState.keys['ArrowLeft']) neonState.playerX -= 5;
            if (neonState.keys['ArrowRight']) neonState.playerX += 5;
            
            // Boundaries
            if(neonState.playerX < 0) neonState.playerX = 0;
            if(neonState.playerX > canvas.width - 40) neonState.playerX = canvas.width - 40;

            // Spawn obstacles
            if (Math.random() < 0.02) spawnObstacle(canvas);

            // Draw
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Grid Effect
            ctx.strokeStyle = '#333';
            ctx.beginPath();
            for(let i=0; i<canvas.width; i+=40) { ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); }
            ctx.stroke();

            // Draw Player
            ctx.fillStyle = '#00ffff';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ffff';
            ctx.fillRect(neonState.playerX, neonState.playerY, 40, 40);
            ctx.shadowBlur = 0;

            // Draw Obstacles & Collision
            ctx.fillStyle = '#ff0055';
            for (let i = 0; i < neonState.obstacles.length; i++) {
                let obs = neonState.obstacles[i];
                obs.y += neonState.speed;
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

                // Collision
                if (
                    neonState.playerX < obs.x + obs.width &&
                    neonState.playerX + 40 > obs.x &&
                    neonState.playerY < obs.y + obs.height &&
                    neonState.playerY + 40 > obs.y
                ) {
                    // Reset on hit
                    neonState.score = 0;
                    neonState.obstacles = [];
                    obs.y = canvas.height + 100; // move away
                }
            }
            
            // Cleanup off-screen
            neonState.obstacles = neonState.obstacles.filter(o => o.y < canvas.height);

            // Score
            ctx.fillStyle = '#33ff00';
            ctx.font = '20px "VT323"';
            ctx.fillText(`SCORE: ${neonState.score++}`, 10, 25);

            window.GM.gameInterval = requestAnimationFrame(loop);
        }
        loop();
    }

    // expose
    window.startNeonRacer = startNeonRacer;
})();