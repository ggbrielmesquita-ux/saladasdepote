(() => {
  'use strict';

  const frame = document.querySelector('#lesson-preview-player');
  const alternative = document.querySelector('[data-video-alternative]');
  if (!frame || !alternative) return;

  function showAlternative() {
    frame.hidden = true;
    alternative.hidden = false;
  }

  // file:// e WebViews sem origem HTTP não identificam o incorporador.
  // A alternativa continua utilizável também quando JavaScript está desativado.
  if (!/^https?:$/.test(window.location.protocol)) return;

  const embed = new URL(frame.dataset.youtubeSrc);
  embed.searchParams.set('origin', window.location.origin);
  embed.searchParams.set('enablejsapi', '1');
  frame.src = embed.href;
  frame.hidden = false;
  alternative.hidden = true;

  function connectPlayer() {
    new window.YT.Player(frame.id, {
      events: {
        // O YouTube informa 153 quando a identificação é bloqueada pelo ambiente.
        // Evita deixar o visitante preso na tela de erro do player.
        onError: showAlternative,
      },
    });
  }

  function loadPlayerAPI() {
    if (window.YT?.Player) {
      connectPlayer();
      return;
    }
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === 'function') previousReady();
      connectPlayer();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const api = document.createElement('script');
      api.src = 'https://www.youtube.com/iframe_api';
      api.async = true;
      document.head.append(api);
    }
  }

  // Mantém o carregamento da API próximo da seção, sem atrasar a hero.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        loadPlayerAPI();
      }
    }, { rootMargin: '300px' });
    observer.observe(frame.parentElement);
  } else {
    loadPlayerAPI();
  }
})();
