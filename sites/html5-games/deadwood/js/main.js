import { createNetworkLayer } from './network.js';
import { bindUI } from './ui.js';
import { createEngine } from './engine.js';

async function boot() {
    const appId = window.__app_id || 'deadwood-demo';
    const initialToken = window.__initial_auth_token || null;

    const network = await createNetworkLayer(appId, initialToken);

    const { ui, updateHUD } = bindUI();
    const canvas = document.getElementById('gameCanvas');

    const engine = createEngine(canvas, ui, network, { appId });

    // wire HUD updates from the engine state each 200ms
    setInterval(() => {
        updateHUD({ gold: engine.state.player.gold, weaponName: engine.state.player.weapon, health: engine.state.player.health, maxHealth: engine.state.player.maxHealth });
    }, 200);

    engine.start();
}

boot().catch(e => console.error('Boot failed', e));
