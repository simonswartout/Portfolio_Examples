// Lightweight network abstraction. If `window.__firebase_config` is provided
// this module will attempt to initialize FirebaseRealtime usage (Firestore).
// If no config is present, a local no-op/dummy network will be used so the
// game can run without an actual backend.

export async function createNetworkLayer() {
    // Simplified local stub: no multiplayer. Keeps the engine running without
    // external dependencies. This intentionally removes Firebase/Socket.IO logic.
    const callbacks = new Set();
    setInterval(() => {
        const now = Date.now();
        callbacks.forEach(cb => cb({}));
    }, 1000);

    return {
        sendState: async () => {},
        onPlayersUpdate: (cb) => { callbacks.add(cb); return () => callbacks.delete(cb); },
        getId: () => null
    };
}

function createLocalNetwork(){
    // Simple local network simulation: provides an empty remote players map
    const callbacks = new Set();
    setInterval(() => {
        const now = Date.now();
        const fake = {}; // could populate sample remote for demo
        callbacks.forEach(cb => cb(fake));
    }, 1000);

    return {
        sendState: async () => {},
        onPlayersUpdate: (cb) => { callbacks.add(cb); return () => callbacks.delete(cb); },
        getId: () => null
    };
}
