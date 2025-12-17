export function bindUI() {
    const ui = {
        moneyEl: document.getElementById('money-display'),
        weaponEl: document.getElementById('weapon-display'),
        promptEl: document.getElementById('interaction-prompt'),
        shopOverlay: document.getElementById('shop-overlay'),
        shopItems: document.getElementById('shop-items'),
        closeShopBtn: document.getElementById('close-shop'),
        statusEl: document.getElementById('status'),
        healthFill: document.getElementById('health-fill'),
        deathMsg: document.getElementById('death-message')
    };

    ui.closeShopBtn.addEventListener('click', () => { ui.shopOverlay.style.display = 'none'; });

    function updateHUD(state) {
        if (!state) return;
        ui.moneyEl.innerText = `LOOT: $${state.gold}`;
        ui.weaponEl.innerText = `WEAPON: ${state.weaponName ? state.weaponName.toUpperCase() : 'RUSTY PISTOL'}`;
        ui.healthFill.style.width = Math.max(0, (state.health/state.maxHealth) * 100) + '%';
    }

    return { ui, updateHUD };
}

export function renderShop(items, ownedWeapons, player, ui) {
    ui.shopItems.innerHTML = '';
    items.forEach(key => {
        const w = key; // simplified
        const div = document.createElement('div');
        const owned = ownedWeapons.includes(key);
        const canAfford = player.gold >= (key.cost || 0);
        div.className = `shop-item ${owned ? 'owned' : ''} ${!canAfford && !owned ? 'cant-afford' : ''}`;
        div.innerHTML = `<div><strong>${key}</strong></div><div>${owned ? 'EQUIPPED' : '$' + (key.cost || 0)}</div>`;
        ui.shopItems.appendChild(div);
    });
}
