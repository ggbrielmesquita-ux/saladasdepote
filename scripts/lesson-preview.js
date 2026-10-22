(() => {
  'use strict';

  const frame = document.querySelector('#lesson-preview-player');
  const alternative = document.querySelector('[data-video-alternative]');
  if (!frame || !alternative) return;

  const videoContainer = frame.parentElement;
  const visibilityThreshold = 0.55;
  let player;
  let ready = false;
  let inView = false;
  let failed = false;
  let hasPlayed = false;
  let manualPlaybackOnly = false;
  let pauseRequested = false;
  let finished = false;

  function showAlternative() {
    failed = true;
    frame.hidden = true;
    alternative.hidden = false;
  }

  // file:// e WebViews sem origem HTTP não identificam o incorporador.
  // A alternativa continua utilizável também quando JavaScript está desativado.
  if (!/^https?:$/.test(window.location.protocol)) return;

  const embed = new URL(frame.dataset.youtubeSrc);
  embed.searchParams.set('origin', window.location.origin);
  embed.searchParams.set('enablejsapi', '1');
  // A reprodução será iniciada pela API somente quando o card estiver visível.
  embed.searchParams.set('autoplay', '0');
  frame.src = embed.href;
  frame.hidden = false;
  alternative.hidden = true;

  function syncPlayback() {
    if (!ready || failed) return;
    const state = player.getPlayerState();
    if (state === 0) {
      finished = true;
      return;
    }
    const playing = state === 1 || state === 3;
    if (!inView || document.hidden) {
      if (playing) {
        pauseRequested = true;
        player.pauseVideo();
      }
    } else if (!manualPlaybackOnly && !finished && !pauseRequested && !playing) {
      player.playVideo();
    }
  }

  function onStateChange(event) {
    if (event.data === 1) {
      hasPlayed = true;
      manualPlaybackOnly = false;
      finished = false;
      syncPlayback();
    } else if (event.data === 2) {
      if (pauseRequested) {
        pauseRequested = false;
        // Retomar também se a pessoa voltou antes de a pausa ser confirmada.
        syncPlayback();
      } else if (hasPlayed) {
        manualPlaybackOnly = true;
      }
    } else if (event.data === 0) {
      finished = true;
      pauseRequested = false;
    }
  }

  function connectPlayer() {
    player = new window.YT.Player(frame.id, {
      events: {
        onReady(event) {
          player = event.target;
          player.setVolume(100);
          player.unMute();
          ready = true;
          syncPlayback();
        },
        onStateChange,
        onAutoplayBlocked() {
          if (!ready || failed) return;
          manualPlaybackOnly = true;
          player.setVolume(100);
          player.unMute();
        },
        // O YouTube informa 153 quando a identificação é bloqueada pelo ambiente.
        // Evita deixar o visitante preso na tela de erro do player.
        onError: showAlternative,
      },
    });
  }

  document.addEventListener('visibilitychange', syncPlayback);

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

  // Pré-carregamento e reprodução têm limites diferentes: preparar não dá play.
  if ('IntersectionObserver' in window) {
    const playbackObserver = new IntersectionObserver(entries => {
      const entry = entries[0];
      inView = entry.isIntersecting && entry.intersectionRatio >= visibilityThreshold;
      syncPlayback();
    }, { threshold: [0, visibilityThreshold] });
    playbackObserver.observe(videoContainer);

    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        loadPlayerAPI();
      }
    }, { rootMargin: '300px' });
    observer.observe(videoContainer);
  } else {
    // Fallback para navegadores sem IntersectionObserver, ainda sem tocar fora da tela.
    const updateVisibility = () => {
      const box = videoContainer.getBoundingClientRect();
      const width = Math.max(0, Math.min(box.right, window.innerWidth) - Math.max(box.left, 0));
      const height = Math.max(0, Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0));
      inView = box.width > 0 && box.height > 0 && (width * height) / (box.width * box.height) >= visibilityThreshold;
      syncPlayback();
    };
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);
    updateVisibility();
    loadPlayerAPI();
  }
})();
