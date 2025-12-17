(function(){
  // Smooth scroll for anchor links
  document.addEventListener('click', function(e){
    const a = e.target.closest('a[href^="#"]');
    if(!a) return;
    const href = a.getAttribute('href');
    if(href === '#') { e.preventDefault(); return; }
    const target = document.querySelector(href);
    if(target){ e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });

  // Focus the first input when contact button used
  const contactBtn = document.querySelector('a[href="#contact"]');
  if(contactBtn){ contactBtn.addEventListener('click', ()=> setTimeout(()=>{ const first = document.querySelector('#contact .form-control'); if(first) first.focus(); }, 600)); }
})();