const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// If a DEFAULT_SITE is provided (via env), redirect root to that contained portfolio
const DEFAULT_SITE = process.env.DEFAULT_SITE || null;

app.get('/', (req, res) => {
  if (DEFAULT_SITE) {
    return res.redirect(`/${DEFAULT_SITE}`);
  }

  // Root remains the main public site. To access other contained portfolios use /<site>
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve public static after root handling
app.use(express.static(path.join(__dirname, 'public')));

// Serve contained portfolio sites from /sites
app.use('/retro', express.static(path.join(__dirname, 'sites', 'retro')));
// Serve the Elena Stone contained portfolio at /elena
app.use('/elena', express.static(path.join(__dirname, 'sites', 'elena-stone')));
// Serve Stone RealEstate contained portfolio
app.use('/stone-realestate', express.static(path.join(__dirname, 'sites', 'stone-realestate')));
// Serve new gameportfolio site
app.use('/gameportfolio', express.static(path.join(__dirname, 'sites', 'gameportfolio')));
// Serve html5-games listing and demos
app.use('/html5-games', express.static(path.join(__dirname, 'sites', 'html5-games')));

// root handler is defined earlier (before public static middleware) and handles DEFAULT_SITE redirect

// Route to access the retro portfolio directly
app.get('/retro', (req, res) => {
  res.sendFile(path.join(__dirname, 'sites', 'retro', 'index.html'));
});

// Simple GET route for /elena
app.get('/elena', (req, res) => {
  res.sendFile(path.join(__dirname, 'sites', 'elena-stone', 'index.html'));
});

// Route for stone-realestate
app.get('/stone-realestate', (req, res) => {
  res.sendFile(path.join(__dirname, 'sites', 'stone-realestate', 'index.html'));
});

// Route for gameportfolio
app.get('/gameportfolio', (req, res) => {
  res.sendFile(path.join(__dirname, 'sites', 'gameportfolio', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});