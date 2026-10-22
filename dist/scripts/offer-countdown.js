(() => {
  'use strict';

  const container = document.querySelector('[data-offer-countdown]');
  if (!container) return;
  const minutes = container.querySelector('[data-countdown-minutes]');
  const seconds = container.querySelector('[data-countdown-seconds]');
  const clock = container.querySelector('[role="timer"]');
  const caption = container.querySelector('[data-countdown-caption]');
  const banner = document.querySelector('[data-offer-banner]');
  const eyebrow = document.querySelector('[data-offer-eyebrow]');
  const offerEndsAt = Date.parse(banner?.dataset.offerEndsAt);
  const duration = 5 * 60 * 1000;
  const storageKey = 'saladas:recipe-introduction-ends:v1';
  const now = Date.now();
  let endsAt = now + duration;
  let interval;

  function syncOffer() {
    if (!Number.isFinite(offerEndsAt)) return;
    if (Date.now() >= offerEndsAt) {
      banner.hidden = true;
      window.clearInterval(interval);
      return;
    }
    if (Date.now() >= offerEndsAt - 24 * 60 * 60 * 1000 && eyebrow) {
      eyebrow.textContent = 'ÚLTIMO DIA DA OFERTA';
    }
  }

  // Prazo real confirmado: 22/10/2026, até o fim do dia em Brasília.
  syncOffer();
  if (Number.isFinite(offerEndsAt) && offerEndsAt > now) {
    window.setTimeout(syncOffer, offerEndsAt - now);
  }
  if (banner?.hidden) return;

  // Tempo para conhecer a página; não altera preço ou validade da oferta.
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
    clock.setAttribute('aria-label', `${minuteValue} minutos e ${secondValue} segundos restantes para conhecer as receitas`);
    if (remaining === 0) {
      caption.textContent = 'Pronto para sua semana mais prática?';
      clock.setAttribute('aria-label', 'Tempo de apresentação concluído');
      window.clearInterval(interval);
    }
    return remaining;
  }

  container.hidden = false;
  if (render() > 0) interval = window.setInterval(render, 1000);
  document.addEventListener('visibilitychange', render);
  window.addEventListener('pageshow', render);
})();
