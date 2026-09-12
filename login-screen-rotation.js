(() => {
  const setupRotation = () => {
    const screen = document.querySelector('[data-login-screen-rotation]');
    if (!screen || screen.dataset.rotationReady === 'true') return;

    const items = [...screen.querySelectorAll('[data-login-screen-item]')];
    if (!items.length) return;

    screen.dataset.rotationReady = 'true';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let activeIndex = Math.floor(Math.random() * items.length);
    let timer = null;

    const show = index => {
      items.forEach((item, itemIndex) => {
        item.classList.toggle('is-active', itemIndex === index);
      });
      activeIndex = index;
    };

    const stop = () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
    };

    const start = () => {
      stop();
      if (items.length < 2 || reducedMotion.matches || document.hidden) return;
      timer = window.setInterval(() => {
        let nextIndex = activeIndex;
        while (nextIndex === activeIndex) {
          nextIndex = Math.floor(Math.random() * items.length);
        }
        show(nextIndex);
      }, 8000);
    };

    show(activeIndex);
    start();
    document.addEventListener('visibilitychange', start);
    reducedMotion.addEventListener?.('change', start);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupRotation, { once: true });
  } else {
    setupRotation();
  }
})();
