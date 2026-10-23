/* Prévia animada do material, com pausa e respeito à preferência de movimento. */
(() => {
  const preview = document.querySelector('[data-material-preview]');
  if (!preview) return;
  const image = preview.querySelector('[data-preview-image]');
  const sources = preview.querySelectorAll('[data-preview-picture] source');
  const toggle = preview.querySelector('[data-preview-toggle]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motion.matches;

  function render() {
    const source = paused ? image.dataset.stillSrc : image.dataset.animationSrc;
    sources.forEach(item => { item.srcset = source; });
    image.src = source;
    toggle.textContent = paused ? 'Reproduzir animação' : 'Pausar animação';
  }

  toggle.addEventListener('click', () => {
    paused = !paused;
    render();
  });
  motion.addEventListener('change', event => {
    paused = event.matches;
    render();
  });
  render();
  toggle.hidden = false;
})();
