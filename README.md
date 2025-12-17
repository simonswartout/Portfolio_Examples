# Portfolio Examples (Modular)

This project modularizes the retro portfolio HTML/CSS/JS into a simple Node.js application that serves static assets.

Features
- Original look and feel preserved
- Games broken into modules: `neon` and `pixel`
- Modal system and game lifecycle (start/stop) implemented

Quick start

1. Install dependencies

```bash
npm install
```

2. Start server

```bash
npm start
# or for dev with auto reload (nodemon required)
npm run dev
```

3. Open http://localhost:3000 in your browser

Development notes
- The site is served from `/public`.
- Client modules live in `/public/js`.
- To add more games create a module that returns `{ start, stop }` and call it from `main.js`.
 - There is now a `sites/` folder for contained portfolio instances. Example: `sites/retro` is available at http://localhost:3000/retro
 - To add another portfolio create `sites/<name>` with an `index.html`, `css/` and `js/` folder and add a static route in `server.js` (or follow the pattern used for `/retro`).
 - Example contained portfolios:
	 - `/retro` -> `sites/retro`
	 - `/elena` -> `sites/elena-stone`

License: MIT
