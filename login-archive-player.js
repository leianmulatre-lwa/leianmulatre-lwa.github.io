(() => {
  const video = document.getElementById('loginArchiveVideo');
  if (!video) return;

  const soundButton = document.getElementById('loginVolumeToggle');
  const credit = document.querySelector('.login-archive-credit');
  const base = 'https://archive.org/download/BettyBoopCartoons/';
  const episodes = [
    ['A Song a Day (1936)', 'Betty_Boop_A_Song_a_Day_1936_512kb.mp4'],
    ['Is My Palm Read (1932)', 'Betty_Boop_Is_My_Palm_Read_1932_512kb.mp4'],
    ['More Pep (1936)', 'Betty_Boop_More_Pep_1936_512kb.mp4'],
    ["Betty Boop's Ker-Choo (1932)", 'Betty_Boops_KerCho_1932_512kb.mp4'],
    ['The Candid Candidate (1937)', 'The_Candid_Candidate_1937_512kb.mp4']
  ];

  const storageKey = 'biglwaLoginCartoonLast';
  let episodeIndex = -1;
  let failedAttempts = 0;
  let muted = true;

  const readLastEpisode = () => {
    try {
      const stored = Number(sessionStorage.getItem(storageKey));
      return Number.isInteger(stored) && stored >= 0 && stored < episodes.length ? stored : -1;
    } catch (_) {
      return -1;
    }
  };

  const chooseEpisode = excluded => {
    const choices = episodes.map((_, index) => index).filter(index => index !== excluded);
    return choices[Math.floor(Math.random() * choices.length)];
  };

  const updateSoundButton = () => {
    if (!soundButton) return;
    const soundIsOn = !muted;
    soundButton.setAttribute('aria-pressed', String(soundIsOn));
    soundButton.setAttribute('aria-label', soundIsOn ? 'Mute cartoon' : 'Turn cartoon sound on');
    soundButton.title = soundIsOn ? 'Mute cartoon' : 'Turn cartoon sound on';
  };

  const play = () => {
    const playback = video.play();
    if (playback && typeof playback.catch === 'function') playback.catch(() => {});
  };

  const loadEpisode = index => {
    episodeIndex = index;
    const [title, file] = episodes[index];
    try { sessionStorage.setItem(storageKey, String(index)); } catch (_) {}
    video.dataset.episode = title;
    video.src = base + encodeURIComponent(file);
    video.defaultMuted = true;
    video.muted = muted;
    if (credit) {
      credit.textContent = `${title} · Internet Archive`;
      credit.title = `Now playing: ${title}`;
    }
    video.load();
    play();
  };

  video.addEventListener('ended', () => {
    failedAttempts = 0;
    loadEpisode(chooseEpisode(episodeIndex));
  });

  video.addEventListener('error', () => {
    if (failedAttempts >= episodes.length - 1) return;
    failedAttempts += 1;
    loadEpisode((episodeIndex + 1) % episodes.length);
  });

  video.addEventListener('canplay', () => {
    video.muted = muted;
    play();
  });

  soundButton?.addEventListener('click', () => {
    muted = !muted;
    video.muted = muted;
    video.volume = .78;
    updateSoundButton();
    play();
  });

  updateSoundButton();
  loadEpisode(chooseEpisode(readLastEpisode()));
})();
