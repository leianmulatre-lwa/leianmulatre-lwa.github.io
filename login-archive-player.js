(() => {
  const video = document.getElementById('loginArchiveVideo');
  if (!video) return;

  const base = 'https://archive.org/download/BettyBoopCartoons/';
  const episodes = [
    ['A Song a Day (1936)', 'Betty_Boop_A_Song_a_Day_1936_512kb.mp4'],
    ['Is My Palm Read (1932)', 'Betty_Boop_Is_My_Palm_Read_1932_512kb.mp4'],
    ['More Pep (1936)', 'Betty_Boop_More_Pep_1936_512kb.mp4'],
    ["Betty Boop's Ker-Choo (1932)", 'Betty_Boops_KerCho_1932_512kb.mp4'],
    ['The Candid Candidate (1937)', 'The_Candid_Candidate_1937_512kb.mp4']
  ];

  const storageKey = 'biglwaLoginCartoonLast';
  let lastIndex = -1;
  try {
    const stored = Number(sessionStorage.getItem(storageKey));
    if (Number.isInteger(stored) && stored >= 0 && stored < episodes.length) lastIndex = stored;
  } catch (_) {}

  const available = episodes.map((_, index) => index).filter(index => index !== lastIndex);
  let episodeIndex = available[Math.floor(Math.random() * available.length)];
  let attempts = 0;

  const loadEpisode = index => {
    const [title, file] = episodes[index];
    try { sessionStorage.setItem(storageKey, String(index)); } catch (_) {}
    video.dataset.episode = title;
    video.src = base + encodeURIComponent(file);
    video.defaultMuted = true;
    video.muted = true;
    video.load();
    const playback = video.play();
    if (playback && typeof playback.catch === 'function') playback.catch(() => {});
  };

  video.addEventListener('error', () => {
    if (attempts >= episodes.length - 1) return;
    attempts += 1;
    episodeIndex = (episodeIndex + 1) % episodes.length;
    loadEpisode(episodeIndex);
  });

  video.addEventListener('canplay', () => {
    video.muted = true;
    const playback = video.play();
    if (playback && typeof playback.catch === 'function') playback.catch(() => {});
  });

  loadEpisode(episodeIndex);
})();
