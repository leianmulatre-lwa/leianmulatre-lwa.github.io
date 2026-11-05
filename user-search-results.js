/* L’wazi search shares the Studio’s page flow and module router. */
(() => {
  const widgetRoutes = {
    journal:'diary', diary:'diary', notes:'notes', sqwidz:'notes', calendar:'calendar',
    orbit:'orbit', feed:'feed', 'my feed':'feed', myfeed:'feed', veve:'veve',
    connect:'connect', camera:'camera', 'photo booth':'camera', booth:'camera',
    archive:'archive', library:'library', games:'games', arcade:'games', closet:'closet',
    trophies:'trophies', rooms:'rooms', room:'rooms', boards:'boards', projects:'projects',
    map:'map', learn:'learn', politics:'politc', politc:'politc', 'did you know':'learn',
    tools:'tools', 'lwazi workshop':'tools', stream:'stream', 'lwa tv':'stream'
  };

  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[char]);
  const routeFor = value => {
    if (value.startsWith('@')) return null;
    const command = value.toLowerCase().replace(/[.!]$/, '').replace(/\s+/g, ' ')
      .replace(/^(?:(?:can you|please) )?(?:open|go to|take me to|show(?: me)?) (?:the )?/, '')
      .replace(/ (?:widget|open)$/, '');
    return Object.hasOwn(widgetRoutes, command) ? widgetRoutes[command] : null;
  };
  const link = (text, url) => '<a class="bl-search-go" href="'+escape(url)+'" target="_blank" rel="noopener noreferrer">'+escape(text)+' ↗</a>';
  const profilePath = username => '/'+encodeURIComponent(username);
  const section = (title, content) => content ? '<section class="bl-search-section"><h3>'+escape(title)+'</h3>'+content+'</section>' : '';
  const grid = cards => cards.length ? '<div class="bl-search-grid">'+cards.join('')+'</div>' : '';
  const card = (title, body, action, image = '') => '<article class="bl-search-card">'+image+
    '<h4>'+escape(title)+'</h4>'+(body?'<p>'+escape(body)+'</p>':'')+action+'</article>';
  const guide = (title, steps, sources) => section(title,
    '<ol>'+steps.map(step=>'<li>'+escape(step)+'</li>').join('')+'</ol>'+
    '<div class="bl-search-sources">'+sources.map(([label,url])=>link(label,url)).join('')+'</div>');

  const aidSources = [
    ['Federal Student Aid · FAFSA checklist','https://studentaid.gov/articles/things-you-need-for-fafsa/'],
    ['Federal Student Aid · filling out the form','https://studentaid.gov/articles/fafsa-student-steps/'],
    ['Immigrants Rising · California college access','https://immigrantsrising.org/resource/quick-guide-to-college-access/']
  ];
  const hairSources = [
    ['American Academy of Dermatology · styles that pull','https://www.aad.org/public/diseases/hair-loss/causes/hairstyles'],
    ['American Academy of Dermatology · Black hair care','https://www.aad.org/public/everyday-care/hair-scalp-care/hair/care-african-american'],
    ['Alessandra Haskin and Crystal Aguh · research abstract','https://pubmed.ncbi.nlm.nih.gov/27114262/']
  ];
  const hairChoices = {
    coily:'Try loose two-strand twists, a low loose puff, or a wash-and-go.',
    curly:'Try a wash-and-go, loose twists, or a loose low ponytail with a soft tie.',
    wavy:'Try a loose braid, a loose low ponytail, or wearing your waves down.',
    straight:'Try wearing your hair down, a loose low ponytail, or a loose braid.'
  };

  function assistance(query) {
    if (/\b(fafsa|financial aid|pay(?:ing)? for college)\b/i.test(query)) {
      return guide('Get ready for U.S. college financial aid', [
        'Start with the year you’ll attend. Check the deadlines for your school and state, then open that year’s FAFSA on StudentAid.gov. The form is free.',
        'Make your own StudentAid.gov account. If the form asks you to invite a parent or spouse, each contributor uses their own account.',
        'Gather the tax and financial records requested for that year and make a list of the schools you’re considering. Enter personal information on the official form.',
        'If you can’t safely contact a parent or your financial situation changed, ask your school’s financial aid office which process applies and what documentation it accepts.',
        'After submitting, check your FAFSA Submission Summary for corrections or follow-up. Ask your school about state aid, grants and campus scholarships. If FAFSA isn’t available to you, ask about state and campus alternatives.'
      ], aidSources);
    }
    if (/\b(?:gender|body)[ -]affirm(?:ing|ation)\b|\b(?:trans|transition) (?:health|care)\b/i.test(query)) {
      return guide('Find gender-affirming support and care', [
        'Start with what you want help with. You can ask about presentation, voice support, finding a clinician or understanding costs. You can explore each at your own pace.',
        'When contacting a clinic, ask what it offers, how it handles privacy and what it charges before you book. Ask about sliding-scale or self-pay options if cost is a barrier.',
        'If you use insurance, check the policy for your specific plan. Ask what is covered, which providers are in network and whether you need a referral or prior authorization. Request the policy in writing.',
        'For medical options, take your questions to a qualified gender-affirming clinician who can explain benefits, risks and follow-up for your situation.'
      ], [
        ['Trans Health Project · understand your insurance plan','https://transhealthproject.org/trans-health-insurance-tutorial/understanding-your-plan/'],
        ['Trans Health Project · apply for coverage','https://transhealthproject.org/trans-health-insurance-tutorial/applying-for-coverage/']
      ]);
    }
    if (/\b(hair|hairstyles?|braids?|protective styles?)\b/i.test(query)) {
      return section('Find a hairstyle that feels like you',
        '<p>How does your hair naturally sit? Pick the closest description, or skip straight to the general tips.</p>'+
        '<div class="bl-search-sources">'+Object.keys(hairChoices).map(type=>
          '<button type="button" data-hair-texture="'+type+'" aria-pressed="false">'+type[0].toUpperCase()+type.slice(1)+'</button>'
        ).join('')+'</div><p class="bl-search-hair-choice" role="status"></p>'+
        guide('Start with low-tension styling',[
          'Choose a style that feels comfortable around your hairline. Ask for a looser style if braids, extensions or a ponytail pull.',
          'Switch up where you part or tie your hair. If a style hurts, loosen it.',
          'If you see thinning or broken hairs around your hairline, ask a dermatologist about the cause.'
        ],hairSources));
    }
    return '';
  }

  let panel;
  let origin;
  let request;
  function close({restoreFocus = true} = {}) {
    if (!panel) return;
    request?.abort();
    panel.remove();
    panel = null;
    origin?.setAttribute('aria-expanded','false');
    if (restoreFocus && origin?.isConnected) origin.focus({preventScroll:true});
  }

  async function externalResults(query, signal) {
    const term = encodeURIComponent(query);
    const get = async url => {
      const response = await fetch(url, {signal:AbortSignal.any([signal,AbortSignal.timeout(4500)]),headers:{Accept:'application/json'}});
      if (!response.ok) throw Error('Source unavailable');
      return response.json();
    };
    const [books,wiki] = await Promise.allSettled([
      get('https://openlibrary.org/search.json?q='+term+'&limit=5&fields=key,title,author_name,first_publish_year'),
      get('https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=5&srsearch='+term+'&format=json&origin=*')
    ]);
    const booksFound = (books.value?.docs || []).filter(book=>/^\/works\/OL\d+W$/.test(book.key));
    const articles = (wiki.value?.query?.search || []).filter(article=>Number.isSafeInteger(article.pageid));
    return section('Books',grid(booksFound.map(book=>card(book.title,
      [...(book.author_name||[]).slice(0,2),book.first_publish_year].filter(Boolean).join(' · '),
      link('Open Library','https://openlibrary.org'+book.key)))))+
      section('Background reading',grid(articles.map(article=>card(article.title,'',
        link('Wikipedia','https://en.wikipedia.org/?curid='+article.pageid)))))+
      section('Explore more','<div class="bl-search-sources">'+
        link('Songs on Bandcamp','https://bandcamp.com/search?q='+term+'&item_type=t')+
        link('Films on Internet Archive','https://archive.org/search?query='+encodeURIComponent(query+' mediatype:movies'))+
        link('Posts on Tumblr','https://www.tumblr.com/search/'+term)+'</div>')+
      ([books,wiki].some(result=>result.status==='rejected')?'<p>Some outside sources couldn’t load.</p>':'');
  }

  async function localResults(query, target, signal) {
    const username = query.replace(/^@/,'').toLowerCase();
    if (!/^[a-z0-9._-]{1,24}$/.test(username)) return false;
    const directory = window.BigLWAUserDirectory;
    const users = await directory?.searchUsers(username) || [];
    if (signal.aborted) return false;
    const exact = users.find(user=>user.username?.toLowerCase()===username);
    if (users.length) {
      const ordered = exact ? [exact,...users.filter(user=>user!==exact)] : users;
      target.innerHTML = section('People on BIG LWA',grid(ordered.map(user=>card(user.name||user.username,
        '@'+user.username+(user.bio?' · '+user.bio:''),
        '<a class="bl-search-go" href="'+escape(profilePath(user.username))+'">View profile →</a>'))));
    }
    if (exact && typeof directory.searchPublishedPosts==='function') {
      try {
        const posts = await directory.searchPublishedPosts(exact.username);
        if (signal.aborted) return true;
        const cards = posts.map(post=>{
          const image = post.thumbnailUrl || post.imageUrl || post.imageUrls?.[0];
          const preview = /^https:\/\/biglwa-instagram-api\.leianmulatre-284\.workers\.dev\/media\/(?:feed-image|orbit-image)\//i.test(image||'')
            ? '<img class="bl-search-post-image" loading="lazy" referrerpolicy="no-referrer" src="'+escape(image)+'" alt="">' : '';
          return card(post.linkTitle||'Published post',String(post.caption||'').slice(0,260),
            '<a class="bl-search-go" href="'+escape(profilePath(exact.username))+'">See on @'+escape(exact.username)+'’s Studio →</a>',preview);
        });
        target.insertAdjacentHTML('beforeend',section('Published by @'+exact.username,grid(cards)));
      } catch {
        if (!signal.aborted) target.insertAdjacentHTML('beforeend','<p>Published posts couldn’t load.</p>');
      }
    }
    return Boolean(exact);
  }

  async function search(raw, trigger = document.getElementById('globalSearch')) {
    const query = String(raw??'').trim().replace(/^ask\s+l[’']?wazi\b\s*[:,]?\s*/i,'');
    const studio = trigger?.closest('#studioApp') || document.getElementById('studioApp');
    const bar = studio?.querySelector('.topbar');
    const workspace = studio?.querySelector('.main');
    if (!bar || !workspace) return;
    const route = routeFor(query);
    if (route && typeof window.openBIGLWAModule==='function') {
      close({restoreFocus:false});
      window.openBIGLWAModule(route);
      return;
    }

    close({restoreFocus:false});
    origin = trigger;
    request = new AbortController();
    const {signal} = request;
    const results = document.createElement('section');
    results.id = 'lwaziStudioSearch';
    results.className = 'bl-search-panel';
    results.setAttribute('aria-labelledby','lwaziSearchHeading');
    results.innerHTML = '<div class="bl-search-head"><div><span>L’wazi</span><h2 id="lwaziSearchHeading" tabindex="-1">'+
      (query?'Results for '+escape(query):'What can I help you find?')+
      '</h2></div><button type="button" class="bl-search-close">Close results</button></div>'+
      '<div class="bl-search-local"></div><div class="bl-search-discovery"></div><p class="bl-search-status" role="status"></p>';
    panel = results;
    workspace.prepend(results);
    origin?.setAttribute('aria-expanded','true');
    results.querySelector('.bl-search-close').onclick = () => close();
    const heading = results.querySelector('h2');
    heading.focus({preventScroll:true});
    const top = heading.getBoundingClientRect().top;
    if (top < bar.getBoundingClientRect().bottom || top > window.innerHeight) {
      results.scrollIntoView?.({block:'start'});
    }

    const local = results.querySelector('.bl-search-local');
    const discovery = results.querySelector('.bl-search-discovery');
    const status = results.querySelector('.bl-search-status');
    if (route) {
      status.textContent = 'Studio widgets are still loading. Try again in a moment.';
      return;
    }
    if (!query) {
      local.innerHTML = '<p>Try a widget name, a BIG LWA @username, or a question.</p><div class="bl-search-sources">'+
        ['Open Journal','College financial aid','Find a hairstyle','Gender-affirming care'].map(example=>
          '<button type="button" data-lwazi-example="'+example+'">'+example+'</button>').join('')+'</div>';
      local.onclick = event => {
        const example = event.target.closest('[data-lwazi-example]')?.dataset.lwaziExample;
        if (example) {
          const input = studio.querySelector('#globalSearch');
          if (input) input.value = example;
          search(example,trigger);
        }
      };
      return;
    }
    const help = query.startsWith('@') ? '' : assistance(query);
    if (help) {
      local.innerHTML = help;
      local.onclick = event => {
        const option = event.target.closest('[data-hair-texture]');
        if (!option) return;
        for (const choice of local.querySelectorAll('[data-hair-texture]')) {
          choice.setAttribute('aria-pressed',String(choice===option));
        }
        local.querySelector('.bl-search-hair-choice').textContent = hairChoices[option.dataset.hairTexture];
      };
      return;
    }
    status.textContent = 'Searching BIG LWA…';
    const exact = await localResults(query,local,signal).catch(()=>{
      if (!signal.aborted) local.textContent = 'BIG LWA profiles couldn’t load.';
      return false;
    });
    if (signal.aborted) return;
    status.textContent = '';
    if (query.startsWith('@')) {
      if (!local.textContent) status.textContent = 'No matching BIG LWA profiles found.';
      return;
    }
    if (exact) return;

    // Outside searches are opt-in so questions and personal details stay in Studio by default.
    if (query.includes('?') || /^(?:how|what|why|when|where|can|do|is|should|help)\b/i.test(query)) {
      discovery.innerHTML = '<p>L’wazi’s current guides cover college aid, hair and gender-affirming care. You can also explore public sources using a topic or title.</p>';
    }
    const outside = document.createElement('button');
    outside.type = 'button';
    outside.textContent = 'Search public sources for books, music & more';
    discovery.append(outside);
    outside.onclick = async () => {
      outside.disabled = true;
      status.textContent = 'Searching public sources…';
      try {
        const found = await externalResults(query,signal);
        if (!signal.aborted) {
          discovery.innerHTML = found;
          status.textContent = 'Public search complete.';
        }
      } catch {
        if (!signal.aborted) {
          outside.disabled = false;
          status.textContent = 'Public search couldn’t finish. Try again.';
        }
      }
    };
  }

  function install() {
    const input = document.querySelector('#studioApp .topbar #globalSearch');
    if (!input || input.dataset.lwaziBound) return;
    const wrap = input.closest('.search-wrap') || input.parentElement;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bl-lwazi-button';
    button.setAttribute('aria-label','Search with L’wazi');
    button.title = 'Search with L’wazi';
    button.innerHTML = '<img src="/assets/lwazi-rainbow-stitch.svg" alt="">';
    for (const control of [input,button]) {
      control.setAttribute('aria-controls','lwaziStudioSearch');
      control.setAttribute('aria-expanded','false');
    }
    button.onclick = () => search(input.value,button);
    input.addEventListener('keydown',event=>{
      if (event.key==='Enter' && !event.isComposing) {
        event.preventDefault();
        if (input.value.trim()) search(input.value,input);
      }
    });
    input.dataset.lwaziBound = 'true';
    wrap.append(button);
  }

  window.__biglwaUserCards = search;
  window.__biglwaUserCardsClose = () => close();
  document.addEventListener('keydown',event=>{
    if (event.key==='Escape' && panel && (panel.contains(event.target)||origin===event.target)) {
      event.preventDefault();
      close();
    }
  });
  document.addEventListener('biglwa:module-open',()=>close({restoreFocus:false}));
  window.addEventListener('popstate',()=>close({restoreFocus:false}));
  install();
  new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
})();
