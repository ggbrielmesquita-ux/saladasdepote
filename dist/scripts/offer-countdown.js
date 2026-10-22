(() => {
  'use strict';

  const container = document.querySelector('[data-offer-countdown]');
  if (!container) return;
  const minutes = container.querySelector('[data-countdown-minutes]');
  const seconds = container.querySelector('[data-countdown-seconds]');
  const clock = container.querySelector('[role="timer"]');
  const banner = document.querySelector('[data-offer-banner]');
  const eyebrow = document.querySelector('[data-offer-eyebrow]');
  const expiryNotice = document.querySelector('[data-offer-expiry]');
  const offerEndsAt = Date.parse(banner?.dataset.offerEndsAt);
  const duration = 15 * 60 * 1000;
  const storageKey = 'saladas:offer-countdown-15m:v1';
  const now = Date.now();
  let endsAt = now + duration;
  let interval;

  function syncOffer() {
    if (!Number.isFinite(offerEndsAt)) return;
    const currentTime = Date.now();
    const isLastDay = currentTime >= offerEndsAt - 24 * 60 * 60 * 1000 && currentTime < offerEndsAt;
    if (expiryNotice) expiryNotice.hidden = !isLastDay;
    if (currentTime >= offerEndsAt) {
      banner.hidden = true;
      window.clearInterval(interval);
      return;
    }
    if (isLastDay && eyebrow) {
      eyebrow.textContent = 'ÚLTIMO DIA DA OFERTA';
    }
  }

  // Prazo real confirmado: 22/10/2026, até o fim do dia em Brasília.
  syncOffer();
  if (Number.isFinite(offerEndsAt) && offerEndsAt > now) {
    window.setTimeout(syncOffer, offerEndsAt - now);
  }
  if (banner?.hidden) return;

  // Uma atualização da mesma aba mantém a contagem e não cria um novo prazo.
  try {
    const saved = Number(window.sessionStorage.getItem(storageKey));
    if (Number.isFinite(saved) && saved > 0 && saved <= now + duration) {
      endsAt = saved;
    } else {
      window.sessionStorage.setItem(storageKey, String(endsAt));
    }
  } catch {
    // A contagem continua se o navegador impedir o armazenamento da sessão.
  }

  function render() {
    syncOffer();
    const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    const minuteValue = Math.floor(remaining / 60);
    const secondValue = remaining % 60;
    minutes.textContent = String(minuteValue).padStart(2, '0');
    seconds.textContent = String(secondValue).padStart(2, '0');
    clock.setAttribute('aria-label', `${minuteValue} minutos e ${secondValue} segundos restantes na contagem regressiva`);
    if (remaining === 0) {
      clock.setAttribute('aria-label', 'Contagem regressiva concluída');
      window.clearInterval(interval);
    }
    return remaining;
  }

  container.hidden = false;
  if (render() > 0) interval = window.setInterval(render, 1000);
  document.addEventListener('visibilitychange', render);
  window.addEventListener('pageshow', render);
})();
