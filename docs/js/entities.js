// Procedural generation and coordinate helpers
export function toScreen(x, y, z = 0, width, height, camera) {
    return {
        x: (x - y) + width/2 - camera.x,
        y: (x + y)/2 - z + height/2 - camera.y
    };
}

export function toWorld(sx, sy, width, height, camera) {
    const adjX = sx - width/2 + camera.x;
    const adjY = sy - height/2 + camera.y;
    return { x: (adjX + 2*adjY)/2, y: (2*adjY - adjX)/2 };
}

const CHUNK_SIZE = 1200;
const TOWN_CHANCE = 0.15;
const chunkCache = new Map();

function rnd(x,y){ const s = Math.sin(x*12.9898 + y*78.233); return (s*43758.5453) % 1; }

export function getChunkData(cx, cy) {
    const key = `${cx},${cy}`;
    if (chunkCache.has(key)) return chunkCache.get(key);
    const entities = [];
    const seed = cx*1000 + cy;
    const isTown = Math.abs(rnd(cx,cy)) < TOWN_CHANCE;

    if (isTown) {
        const buildings = [
            { type:'saloon', w:140, h:120, col:'#5d4037' },
            { type:'bank', w:120, h:100, col:'#3e2723' },
            { type:'sheriff', w:100, h:100, col:'#4e342e' },
            { type:'store', w:130, h:130, col:'#6d4c41' }
        ];
        const count = 2 + Math.floor(Math.abs(rnd(seed,0))*3);
        for(let i=0;i<count;i++){
            const b = buildings[i % buildings.length];
            const ox = (i%2===0?1:-1)*150;
            const oy = (i>1?1:-1)*150;
            entities.push({ type:'building', subtype:b.type, x:cx*CHUNK_SIZE + CHUNK_SIZE/2 + ox, y:cy*CHUNK_SIZE + CHUNK_SIZE/2 + oy, w:b.w, h:b.h, depth:80 + (Math.abs(rnd(i,i))*40), color:b.col, id:`bld_${cx}_${cy}_${i}` });
        }
    } else {
        for(let i=0;i<15;i++){
            const rx = Math.abs(rnd(seed,i))*CHUNK_SIZE;
            const ry = Math.abs(rnd(seed+1,i))*CHUNK_SIZE;
            const type = rnd(seed,i+2) > 0.3 ? 'cactus' : 'rock';
            entities.push({ type, x:cx*CHUNK_SIZE+rx, y:cy*CHUNK_SIZE+ry, r:type==='cactus'?10:15, h:type==='cactus'?40:15, id:`prop_${cx}_${cy}_${i}` });
        }
    }

    const zCount = isTown ? 10 : 3;
    for(let i=0;i<zCount;i++){
        const rx = Math.abs(rnd(seed+10,i))*CHUNK_SIZE;
        const ry = Math.abs(rnd(seed+11,i))*CHUNK_SIZE;
        entities.push({ type:'zombie', x:cx*CHUNK_SIZE+rx, y:cy*CHUNK_SIZE+ry, r:12, id:`z_${cx}_${cy}_${i}`, hp:3, speed:1.5 + Math.abs(rnd(i,seed)), uniqueId:(Math.abs(rnd(i,seed))*1000) });
    }

    for(let i=0;i<3;i++){
        const rx = Math.abs(rnd(seed+5,i))*CHUNK_SIZE;
        const ry = Math.abs(rnd(seed+6,i))*CHUNK_SIZE;
        entities.push({ type:'loot', x:cx*CHUNK_SIZE+rx, y:cy*CHUNK_SIZE+ry, r:10, id:`l_${cx}_${cy}_${i}`, val:25 });
    }

    chunkCache.set(key, entities);
    return entities;
}
