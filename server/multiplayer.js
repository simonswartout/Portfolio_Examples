// Minimal authoritative Socket.IO game server (single-process)
// Run with: node server/multiplayer.js

const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const TICK_RATE = 20; // server simulation ticks per second
const PORT = process.env.PORT || process.env.GAME_PORT || 4000;

// Simple in-memory room state. For production use Redis/pubsub and sharding.
const rooms = new Map();

function makeRoom(id) {
  return {
    id,
    players: {}, // socketId -> { x,y,angle,health, lastInputSeq }
    bullets: [],
    lastTick: Date.now()
  };
}

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('join', ({ roomId, playerId } = {}) => {
    const rId = roomId || 'lobby';
    if (!rooms.has(rId)) rooms.set(rId, makeRoom(rId));
    const room = rooms.get(rId);

    // Add player with default state
    room.players[socket.id] = { id: socket.id, x: 0, y: 0, angle: 0, health: 100, lastInputSeq: 0 };
    socket.join(rId);
    socket.roomId = rId;
    socket.emit('joined', { id: socket.id });
    console.log(`socket ${socket.id} joined ${rId}`);
  });

  socket.on('input', (data) => {
    // data: { seq, dx, dy, shoot }
    const room = rooms.get(socket.roomId);
    if (!room) return;
    const p = room.players[socket.id];
    if (!p) return;
    // Very simple authoritative application of movement
    if (data.dx || data.dy) {
      const len = Math.hypot(data.dx, data.dy) || 1;
      p.x += (data.dx/len) * 6; p.y += (data.dy/len) * 6;
    }
    if (data.angle !== undefined) p.angle = data.angle;
    if (data.shoot) {
      room.bullets.push({ x: p.x, y: p.y, vx: Math.cos(p.angle)*12, vy: Math.sin(p.angle)*12, life: 60, owner: socket.id });
    }
    p.lastInputSeq = data.seq || p.lastInputSeq;
  });

  // Accept raw state updates (useful for prototyping; server will apply them)
  socket.on('state', (data) => {
    const room = rooms.get(socket.roomId);
    if (!room) return;
    const p = room.players[socket.id];
    if (!p) return;
    if (typeof data.x === 'number') p.x = data.x;
    if (typeof data.y === 'number') p.y = data.y;
    if (typeof data.angle === 'number') p.angle = data.angle;
  });

  socket.on('disconnect', () => {
    const room = rooms.get(socket.roomId);
    if (room) {
      delete room.players[socket.id];
    }
    console.log('socket disconnected', socket.id);
  });
});

// Authoritative tick loop
setInterval(() => {
  for (const [id, room] of rooms.entries()) {
    // update bullets
    for (let i = room.bullets.length - 1; i >= 0; i--) {
      const b = room.bullets[i];
      b.x += b.vx; b.y += b.vy; b.life -= 1;
      // simple collision with players
      for (const sid in room.players) {
        if (sid === b.owner) continue; // no friendly fire for now
        const pl = room.players[sid];
        const dx = b.x - pl.x; const dy = b.y - pl.y;
        if ((dx*dx + dy*dy) < 400) {
          pl.health -= 10;
          room.bullets.splice(i, 1);
          break;
        }
      }
      if (b.life <= 0) room.bullets.splice(i, 1);
    }

    // Prepare snapshot
    const snapshot = { players: {}, bullets: room.bullets };
    for (const sid in room.players) {
      const p = room.players[sid];
      snapshot.players[sid] = { x: p.x, y: p.y, angle: p.angle, health: p.health };
    }

    // Broadcast to room
    io.to(id).emit('snapshot', snapshot);
  }
}, 1000 / TICK_RATE);

server.listen(PORT, () => console.log('Game server listening on', PORT));
