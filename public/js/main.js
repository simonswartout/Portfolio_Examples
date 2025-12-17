import { createNeonGame } from './games/neon.js';
import { createPixelGame } from './games/pixel.js';

const modals = document.querySelectorAll('.modal-overlay');
const openButtons = document.querySelectorAll('[data-open]');
const closeButtons = document.querySelectorAll('[data-close]');

let activeGameInstance = null;
let activeModalId = null;

function openModal(modalId){
  const modal = document.getElementById(modalId);
  if(!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  activeModalId = modalId;

  // Start games depending on ID
  if(modalId === 'modal1') {
    const canvas = document.getElementById('neon-canvas');
    activeGameInstance = createNeonGame(canvas);
    activeGameInstance.start();
  }
  if(modalId === 'modal3'){
    const canvas = document.getElementById('pixel-canvas');
    activeGameInstance = createPixelGame(canvas);
    activeGameInstance.start();
  }
}

function closeModal(force=false){
  const active = document.querySelectorAll('.modal-overlay.active');
  active.forEach(m => m.classList.remove('active'));
  document.body.style.overflow = 'auto';
  activeModalId = null;
  if(activeGameInstance && activeGameInstance.stop){ activeGameInstance.stop(); activeGameInstance = null; }
}

openButtons.forEach(btn => btn.addEventListener('click', e => openModal(btn.dataset.open)));
closeButtons.forEach(btn => btn.addEventListener('click', e => closeModal(true)));

// close by clicking outside content
modals.forEach(m => m.addEventListener('click', e => { if(e.target === m) closeModal(true); }));

// export for debugging if needed
window._portfolio = { openModal, closeModal };

// small accessibility/wrapper: allow keyboard ESC to close modal
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && activeModalId) closeModal(true); });