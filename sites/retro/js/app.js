// App-level game manager and modal system
window.GM = {
    gameInterval: null,
    activeGame: null
};

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (modalId === 'modal1' && typeof window.startNeonRacer === 'function') window.startNeonRacer();
    if (modalId === 'modal3' && typeof window.startPixelRoyale === 'function') window.startPixelRoyale();
}

function closeModal(event, force = false) {
    if (force || event.target.classList.contains('modal-overlay')) {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(m => m.classList.remove('active'));
        document.body.style.overflow = 'auto';
        stopGames();
    }
}

function stopGames() {
    if (window.GM && window.GM.gameInterval) cancelAnimationFrame(window.GM.gameInterval);
    window.GM.gameInterval = null;
    window.GM.activeGame = null;
}

// Expose functions globally to keep onclick handlers working in markup
window.openModal = openModal;
window.closeModal = closeModal;
window.stopGames = stopGames;