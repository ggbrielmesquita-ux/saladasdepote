(() => {
  'use strict';

  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const track = carousel.querySelector('[data-carousel-track]');
    if (!track) return;
    const slides = Array.from(track.querySelectorAll('[data-carousel-slide]'));
    if (slides.length < 2) return;

    // A cópia mantém a volta ao início visualmente contínua.
    const firstCopy = slides[0].cloneNode(true);
    firstCopy.removeAttribute('data-carousel-slide');
    firstCopy.removeAttribute('aria-label');
    firstCopy.setAttribute('aria-hidden', 'true');
    firstCopy.setAttribute('inert', '');
    firstCopy.querySelector('img').loading = 'eager';
    track.append(firstCopy);
    track.querySelectorAll('img').forEach((image) => {
      image.loading = 'eager';
      image.draggable = false;
    });

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const millisecondsPerImage = 6000;
    let animation;
    let timer;

    function start() {
      animation?.cancel();
      window.clearInterval(timer);
      track.style.transform = '';

      if (reducedMotion.matches) {
        // As fotos continuam alternando, sem movimento lateral animado.
        let index = 0;
        timer = window.setInterval(() => {
          index = (index + 1) % slides.length;
          track.style.transform = `translateX(-${index * 100}%)`;
        }, millisecondsPerImage);
        return;
      }

      animation = track.animate([
        { transform: 'translateX(0)' },
        { transform: `translateX(-${slides.length * 100}%)` },
      ], {
        duration: slides.length * millisecondsPerImage,
        iterations: Infinity,
        easing: 'linear',
      });
    }

    reducedMotion.addEventListener('change', start);
    start();
  });
})();
