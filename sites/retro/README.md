Retro portfolio (contained)

This folder contains a self-contained portfolio site ("retro" theme) with all assets in the folder so you can add more portfolios side-by-side.

Structure:
- index.html — the site entry
- css/styles.css — visual styles
- js/app.js — modal system + game manager
- js/games/neon.js — neon racer game logic
- js/games/pixel.js — pixel royale game logic

Access: http://localhost:3000/retro

How to add another portfolio:
- Create a new folder under `sites/` e.g. `sites/my_portfolio`
- Add an `index.html` plus `css/` and `js/` folders as needed
- In `server.js` add a static route (e.g. `app.use('/my_portfolio', express.static(path.join(__dirname, 'sites', 'my_portfolio')))`)
