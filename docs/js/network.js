// Lightweight network abstraction. If `window.__firebase_config` is provided
// this module will attempt to initialize FirebaseRealtime usage (Firestore).
// If no config is present, a local no-op/dummy network will be used so the
// game can run without an actual backend.

export async function createNetworkLayer(appId, initialToken) {
    // Prefer Socket.IO if flagged. Set `window.__use_socket = true` and
    // optionally `window.__socket_server_url = 'http://localhost:4000'` before loading.
    if (window.__use_socket) {
        try {
            const url = window.__socket_server_url || (location.protocol + '//' + location.hostname + ':4000');
            const ioModule = await import('https://cdn.socket.io/4.7.2/socket.io.esm.min.js');
            const socket = ioModule.io(url, { transports: ['websocket'] });
            const callbacks = new Set();

            socket.on('connect', () => {
                socket.emit('join', { roomId: window.__roomId || 'lobby', token: window.__socket_token || null });
            });

            socket.on('snapshot', (snap) => {
                // convert snapshot players to the same shape expected by engine
                const now = Date.now();
                const result = {};
                if (snap && snap.players) {
                    for (const id in snap.players) {
                        result[id] = { ...snap.players[id], lastUpdate: now };
                    }
                }
                callbacks.forEach(cb => cb(result));
            });

            return {
                sendState: async (state) => {
                    socket.emit('state', state);
                },
                onPlayersUpdate: (cb) => { callbacks.add(cb); return () => callbacks.delete(cb); },
                getId: () => socket.id
            };
        } catch (e) {
            console.error('SocketIO init failed, falling back to local network.', e);
            return createLocalNetwork();
        }
    }

    const config = window.__firebase_config || null;
    if (!config) {
        console.warn('No firebase config found. Running in local/demo mode.');
        return createLocalNetwork();
    }

    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js');
        const { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');
        const { getFirestore, collection, doc, setDoc, onSnapshot, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');

        const app = initializeApp(config);
        const auth = getAuth(app);
        const db = getFirestore(app);

        if (initialToken) {
            try { await signInWithCustomToken(auth, initialToken); } catch(e){ console.warn('custom token sign-in failed', e); }
        } else {
            await signInAnonymously(auth);
        }

        let myId = null;
        const callbacks = new Set();

        onAuthStateChanged(auth, user => {
            if (!user) return;
            myId = user.uid;
            const playersRef = collection(db, 'artifacts', appId, 'public', 'data', 'players');
            onSnapshot(playersRef, snap => {
                const now = Date.now();
                const result = {};
                snap.forEach(d => {
                    result[d.id] = { ...(d.data()), lastUpdate: now };
                });
                callbacks.forEach(cb => cb(result));
            });
        });

        return {
            sendState: async (state) => {
                if (!myId) return;
                const playerRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', myId);
                try {
                    await setDoc(playerRef, { x: Math.round(state.x), y: Math.round(state.y), angle: parseFloat(state.angle.toFixed(2)), wep: state.weapon, ts: serverTimestamp() });
                } catch(e){ console.error(e); }
            },
            onPlayersUpdate: (cb) => { callbacks.add(cb); return () => callbacks.delete(cb); },
            getId: () => myId
        };

    } catch (e) {
        console.error('Firebase import/init failed, falling back to local network.', e);
        return createLocalNetwork();
    }
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
