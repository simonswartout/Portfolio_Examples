import { toScreen } from './entities.js';

export function drawIsoBox(ctx, x, y, w, h, depth, color, topColor, width, height, camera) {
    const scr = toScreen(x, y, 0, width, height, camera);
    const isoH = h/2;
    const topY = scr.y - depth;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(scr.x, scr.y, w/2 + 5, isoH/2 + 5, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(scr.x, scr.y + isoH/2);
    ctx.lineTo(scr.x - w/2, scr.y);
    ctx.lineTo(scr.x - w/2, topY);
    ctx.lineTo(scr.x, topY + isoH/2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.moveTo(scr.x, scr.y + isoH/2);
    ctx.lineTo(scr.x + w/2, scr.y);
    ctx.lineTo(scr.x + w/2, topY);
    ctx.lineTo(scr.x, topY + isoH/2);
    ctx.fill();

    ctx.fillStyle = topColor || color;
    ctx.beginPath();
    ctx.moveTo(scr.x, topY + isoH/2);
    ctx.lineTo(scr.x - w/2, topY);
    ctx.lineTo(scr.x, topY - isoH/2);
    ctx.lineTo(scr.x + w/2, topY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fill();
}

export function drawSprite(ctx, e, width, height, camera) {
    let col = '#fff'; let h = 20; let w = 20;
    if (e.type === 'player' || e.type === 'remote_player') { col = e.type === 'remote_player' ? '#f57c00' : '#1565c0'; h = 35; w = 20; }
    else if (e.type === 'zombie') { col = '#2e7d32'; h = 35; w = 20; }
    else if (e.type === 'cactus') { col = '#1b5e20'; h = e.h; w = 15; }
    else if (e.type === 'rock') { col = '#795548'; h = 10; w = 30; }
    else if (e.type === 'loot') { col = '#ffd700'; h = 5; w = 10; }

    drawIsoBox(ctx, e.x, e.y, w, w, h, col, null, width, height, camera);
    if ((e.type || '').includes('player') || e.type === 'zombie') {
        const scr = toScreen(e.x, e.y, 0, width, height, camera);
        const topY = scr.y - h;
        ctx.fillStyle = e.type === 'zombie' ? 'red' : 'white';
        ctx.fillRect(scr.x - 5, topY + 5, 3, 3);
        ctx.fillRect(scr.x + 2, topY + 5, 3, 3);
        if (e.type === 'remote_player') {
            ctx.fillStyle = 'white'; ctx.font = '10px Courier'; ctx.fillText('PLAYER', scr.x-15, topY - 5);
        }
    }
}
