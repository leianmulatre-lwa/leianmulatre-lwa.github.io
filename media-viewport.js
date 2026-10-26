/* Native videos keep their playback position, but do no playback work offscreen. */
export function watchVideoVisibility(doc = document, win = window) {
  const videos = new Map();
  const reduced = () => win.matchMedia?.('(prefers-reduced-motion: reduce)').matches || win.navigator?.connection?.saveData;
  const allowed = state => state.visible && !doc.hidden && state.video.isConnected;
  function hold(state) {
    if (!state.video.paused) {
      state.resume = true;
      state.ourPause = true;
      state.video.pause();
    }
  }
  function update(state) {
    if (!allowed(state)) return hold(state);
    if (state.resume && !state.manualPause && !reduced()) {
      state.resume = false;
      state.video.play()?.catch(() => {});
    }
  }
  const observer = win.IntersectionObserver && new win.IntersectionObserver(entries => {
    for (const entry of entries) {
      const state = videos.get(entry.target);
      if (!state) continue;
      state.visible = entry.isIntersecting && entry.intersectionRatio > 0;
      update(state);
    }
  }, { threshold: [0, 0.01] });
  function attach(video) {
    if (videos.has(video)) return;
    const state = { video, visible: false, resume: video.autoplay || video.hasAttribute('data-viewport-autoplay') || !video.paused, manualPause: false, ourPause: false };
    video.autoplay = false;
    state.onPlay = () => { state.manualPause = false; if (!allowed(state)) hold(state); };
    state.onPause = () => {
      if (state.ourPause) { state.ourPause = false; return; }
      state.manualPause = true;
      state.resume = false;
    };
    video.addEventListener('play', state.onPlay);
    video.addEventListener('pause', state.onPause);
    videos.set(video, state);
    hold(state);
    observer?.observe(video);
  }
  function scan(root) {
    if (root.matches?.('video')) attach(root);
    root.querySelectorAll?.('video').forEach(attach);
  }
  function clean() {
    for (const [video, state] of videos) if (!video.isConnected) {
      hold(state);
      observer?.unobserve(video);
      video.removeEventListener('play', state.onPlay);
      video.removeEventListener('pause', state.onPause);
      videos.delete(video);
    }
  }
  const changes = new win.MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) scan(node);
    clean();
  });
  const visibility = () => videos.forEach(update);
  doc.addEventListener('visibilitychange', visibility);
  changes.observe(doc.documentElement, { childList: true, subtree: true });
  scan(doc);
  // Older browsers retain manual playback; geometry checks still pause hidden video.
  let frame = 0;
  const measure = () => {
    frame = 0;
    videos.forEach(state => {
      const rect = state.video.getBoundingClientRect();
      state.visible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < win.innerHeight && rect.right > 0 && rect.left < win.innerWidth;
      update(state);
    });
  };
  const schedule = () => { if (!frame) frame = win.requestAnimationFrame(measure); };
  if (!observer) { win.addEventListener('scroll', schedule, true); win.addEventListener('resize', schedule); schedule(); }
  return () => {
    changes.disconnect(); observer?.disconnect();
    doc.removeEventListener('visibilitychange', visibility);
    win.removeEventListener('scroll', schedule, true); win.removeEventListener('resize', schedule);
    if (frame) win.cancelAnimationFrame(frame);
    for (const state of videos.values()) { hold(state); state.video.removeEventListener('play', state.onPlay); state.video.removeEventListener('pause', state.onPause); }
    videos.clear();
  };
}
if (typeof document !== 'undefined') watchVideoVisibility();
