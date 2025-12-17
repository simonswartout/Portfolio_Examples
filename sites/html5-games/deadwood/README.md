# Deadwood Drifter — Modular Multiplayer Demo

This folder contains a modularized version of the Deadwood Drifter demo.

Files:
- `index.html` — entry page (expects `window.__firebase_config` optionally)
- `css/styles.css` — UI & game styling
- `js/main.js` — boot/entry module
- `js/network.js` — network abstraction (Firebase when configured, otherwise a local stub)
- `js/engine.js` — game loop and core logic
- `js/render.js` — rendering helpers
- `js/entities.js` — procedural generation & helpers
- `js/ui.js` — minimal UI binding & shop helpers

Quick start (local):
1. Open `sites/html5-games/deadwood/index.html` in a static host (or via your existing Express server at `/html5-games/deadwood/`).
2. To enable real multiplayer, set `window.__firebase_config` to your Firebase config object and (optionally) `window.__initial_auth_token`.

Socket.IO local server (prototype)
- A minimal authoritative Socket.IO server is included at `server/multiplayer.js`.
- To run it locally:

```bash
npm run start:game-server
```

- To make the client use Socket.IO instead of Firebase, set these globals before the page loads (edit `index.html` or inject from your server):

```html
<script>
	window.__use_socket = true;
	window.__socket_server_url = 'http://localhost:4000';
	window.__roomId = 'lobby';
</script>
```

The Socket.IO layer is a prototype convenience for fast testing. It accepts `state` events from clients for quick prototyping and broadcasts `snapshot` messages at 20 Hz. For production you should switch to an authoritative input-based protocol (clients send inputs, server simulates and validates).

Next steps and recommendations are in the top-level project notes.
