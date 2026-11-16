(() => {
  const video = document.getElementById('loginArchiveVideo');
  if (!video) return;

  const laptop = video.closest('.login-laptop');
  const loginPage = document.getElementById('loginPage');
  const screen=video.closest('.login-screen-video');
  // Public, simulated Studio desktop beneath the optional cartoon.
  // No auth state, personal images, account data or interactive private widgets.
  let setCartoonWindow=()=>{};
  if(screen&&laptop){
    const desktop=document.createElement('section');
    desktop.className='login-studio-desktop';
    desktop.setAttribute('aria-label','BIG LWA Studio interface preview');
    desktop.setAttribute('aria-hidden','true');
    desktop.innerHTML=
      '<div class="login-mini-top"><b>✳ BIG LWA</b><button type="button" class="login-mini-explore-toggle" aria-controls="loginScreenExploreLinks" aria-expanded="false">⌕ explore BIG LWA</button><small>STUDIO</small></div>'+
      '<div class="login-mini-content">'+
      '<aside class="login-mini-key"><b>⌑</b><span>studio</span><span>veve</span><span>stream</span><span>map</span><span>orbit</span></aside>'+
      '<div class="login-mini-widgets">'+
      '<article class="login-mini-card login-mini-aura"><header>✺ aura <small>● ● ●</small></header><div class="login-mini-aura-art">a bigger you.</div></article>'+
      '<article class="login-mini-card login-mini-feed"><header>◉ myfeed <small>● ● ●</small></header><div class="login-mini-film"><i></i><i></i><i></i><i></i></div><p>your published pictures</p></article>'+
      '<article class="login-mini-card login-mini-stream"><header>◎ stream <small>● ● ●</small></header><div class="login-mini-screen">♫ <b>LWA RADIO</b><span>on air · campus & world</span></div></article>'+
      '<article class="login-mini-card login-mini-map"><header>⌖ map <small>● ● ●</small></header><div class="login-mini-landscape"><span>↗ plan · pin · explore</span></div></article>'+
      '<article class="login-mini-card login-mini-orbit"><header>✧ orbit <small>● ● ●</small></header><div class="login-mini-orbits">✹　✦　✧　✷</div></article>'+
      '<article class="login-mini-card login-mini-tunes"><header>♫ tunes <small>● ● ●</small></header><div class="login-mini-radio">88　·　92　·　96　·　100　·　104</div></article>'+
      '</div></div>'+
      '<div class="login-mini-dock"><span>people · ideas · sounds · self</span><span>green ● restores TV</span></div>';
    screen.insertBefore(desktop,video);
    // Reuse the three original laptop dots, instead of creating a second
    // window-control bar on the opposite side of the picture.
    const dots=laptop.querySelector('.login-laptop-lights');
    const explore=loginPage?.querySelector('.login-explore-links');
    const exploreToggle=desktop.querySelector('.login-mini-explore-toggle');
    if(explore){
      explore.id='loginScreenExploreLinks';
      explore.hidden=true;
      explore.setAttribute('aria-hidden','true');
      desktop.append(explore); // Crawlable links stay in the DOM, but inside the screen.
    }
    const hideExplore=()=>{
      if(!explore)return;
      explore.hidden=true;
      explore.classList.remove('is-open');
      explore.setAttribute('aria-hidden','true');
      exploreToggle?.setAttribute('aria-expanded','false');
    };
    laptop.dataset.cartoonWindow='open';
    setCartoonWindow=state=>{
      const showing=state==='open';
      laptop.dataset.cartoonWindow=state;
      laptop.classList.toggle('is-studio-preview',!showing);
      desktop.setAttribute('aria-hidden',String(showing));
      hideExplore();
      if(!showing){video.pause();}
      else if(previewStarted){
        const playing=video.play();
        playing?.catch?.(()=>{});
      }
      const green=dots?.querySelector('button.green');
      if(green){
        green.setAttribute('aria-label',showing?'Switch laptop to Studio preview':'Restore Betty Boop on laptop');
        green.title=showing?'Show Studio preview':'Restore Betty Boop';
      }
    };
    if(dots){
      dots.removeAttribute('aria-hidden');
      dots.setAttribute('role','group');
      dots.setAttribute('aria-label','Laptop window controls');
      for(const color of ['red','yellow','green']){
        const original=dots.querySelector('span.'+color);
        if(!original)continue;
        const button=document.createElement('button');
        button.type='button';
        button.className=original.className;
        button.dataset.loginWindowAction=color==='red'?'close':color==='yellow'?'minimize':'switch';
        const label=color==='red'?'Close Betty Boop and show Studio':color==='yellow'?'Minimize Betty Boop and show Studio':'Switch laptop to Studio preview';
        button.setAttribute('aria-label',label);
        button.title=label;
        original.replaceWith(button);
        button.addEventListener('click',()=>{
          if(color==='red')setCartoonWindow('closed');
          else if(color==='yellow')setCartoonWindow('minimized');
          else setCartoonWindow(laptop.dataset.cartoonWindow==='open'?'minimized':'open');
        });
      }
    }
    exploreToggle?.addEventListener('click',()=>{
      if(!explore||laptop.dataset.cartoonWindow==='open')return;
      const opening=explore.hidden;
      hideExplore();
      if(opening){
        explore.hidden=false;
        explore.classList.add('is-open');
        explore.setAttribute('aria-hidden','false');
        exploreToggle.setAttribute('aria-expanded','true');
        explore.querySelector('a')?.focus();
      }
    });
    explore?.addEventListener('keydown',event=>{
      if(event.key==='Escape'){
        hideExplore();
        exploreToggle?.focus();
      }
    });
  }

  // The preview has a real introductory screen, not a second app-wide loader.
  // Delay requesting video until a signed-out visitor can actually see it.
  const INTRO_MS = 2600;
  let previewStarted = false;
  let introStartedAt = 0;
  let introTimer = null;
  let revealed = false;
  const revealProgramming = () => {
    if(revealed)return;
    revealed = true;
    laptop?.classList.remove('is-preparing');
  };
  const revealWhenReady = () => {
    if(!previewStarted||revealed)return;
    const elapsed=Date.now()-introStartedAt;
    if(elapsed<INTRO_MS){
      // A browser timer may fire a millisecond early. Recheck once the
      // full intro has elapsed, rather than leaving a ready video behind
      // the loading screen until the 8-second recovery timeout.
      setTimeout(revealWhenReady,INTRO_MS-elapsed+12);
      return;
    }
    if(video.readyState>=2)revealProgramming();
  };
  video.poster='/assets/tv-no-signal.svg';
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
    if(!previewStarted||laptop?.dataset.cartoonWindow!=='open')return;
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
    if(laptop?.dataset.cartoonWindow!=='open')return;
    failedAttempts = 0;
    loadEpisode(chooseEpisode(episodeIndex));
  });

  video.addEventListener('error', () => {
    if (laptop?.dataset.cartoonWindow !== 'open') return;
    if (failedAttempts >= episodes.length - 1) { setCartoonWindow('closed'); return; }
    failedAttempts += 1;
    loadEpisode((episodeIndex + 1) % episodes.length);
  });

  video.addEventListener('canplay', () => {
    video.muted = muted;
    play();
    revealWhenReady();
  });
  video.addEventListener('playing', revealWhenReady);

  soundButton?.addEventListener('click', () => {
    muted = !muted;
    video.muted = muted;
    video.volume = .78;
    updateSoundButton();
    play();
  });

  updateSoundButton();
  const beginIfVisible = () => {
    if(previewStarted||!loginPage||!laptop)return;
    const style=getComputedStyle(loginPage);
    // Do not show programming or start the countdown behind auth's curtain.
    if(document.body.classList.contains('biglwa-session-pending')||
       document.documentElement.classList.contains('biglwa-startup-protected')||
       style.display==='none'||style.visibility==='hidden')return;
    previewStarted=true;introStartedAt=Date.now();
    watcher?.disconnect();
    // Start fetching near the end of the intro so transitions feel intentional.
    introTimer=setTimeout(()=>loadEpisode(chooseEpisode(readLastEpisode())),1800);
    setTimeout(revealWhenReady,INTRO_MS);
    // A provider error or autoplay restriction must not freeze the laptop.
    setTimeout(revealProgramming,8000);
  };
  const watcher=new MutationObserver(beginIfVisible);
  if(loginPage)watcher.observe(loginPage,{attributes:true,attributeFilter:['class','style','hidden']});
  watcher.observe(document.body,{attributes:true,attributeFilter:['class','style']});
  beginIfVisible();
})();
