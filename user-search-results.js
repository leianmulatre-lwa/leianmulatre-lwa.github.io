/* BIGLWA discovery search and Lwazi Studio assistant. */
(function(){
  try{
    function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
    function localUsers(q){var out=[];try{var v=JSON.parse(localStorage.getItem('biglwaUserDirectory')||'[]');if(Array.isArray(v))out=out.concat(v)}catch(e){}if(Array.isArray(window.__biglwaUsers))out=out.concat(window.__biglwaUsers);var seen={};return out.filter(function(u){var key=String(u&&u.username||'').toLowerCase();if(seen[key]||!key||/private/i.test(String(u.accountVisibility||u.visibility||u.privacy||'')))return false;if(String(u.username||u.name||'').toLowerCase().indexOf(q)==-1)return false;seen[key]=1;return true}).slice(0,8)}
    async function searchUsers(q){var hits=[];try{if(window.BigLWAUserDirectory&&window.BigLWAUserDirectory.searchUsers)hits=await window.BigLWAUserDirectory.searchUsers(q)}catch(e){}if(!hits.length)hits=localUsers(q);return hits.slice(0,8)}
    async function fetchJSON(url){var controller=new AbortController(),stop=setTimeout(function(){controller.abort()},7000);try{var response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});if(!response.ok)throw Error('Search source unavailable');return await response.json()}finally{clearTimeout(stop)}}
    var sourceLibraryPromise=fetchJSON('/lwazi-source-library-v02.json?v=20261105-v02').catch(function(){return null});
    function sourceLibraryMatches(library,q){if(!library||!Array.isArray(library.public_sources))return [];var needle=String(q||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();var words=needle.split(' ').filter(function(w){return w.length>2});return library.public_sources.map(function(source){var hay=[source.title,source.creator,source.topic,source.role,source.usage,source.notes].join(' ').toLowerCase();var score=words.reduce(function(total,word){return total+(hay.indexOf(word)!==-1?1:0)},0)+(hay.indexOf(needle)!==-1?4:0);return {source:source,score:score}}).filter(function(item){return item.score>0}).sort(function(a,b){return b.score-a.score||String(a.source.id).localeCompare(String(b.source.id))}).slice(0,6).map(function(item){return item.source})}
    function sourceLibraryCard(source){var access=String(source.access||'Public source').replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase()});return '<article class="bl-search-card bl-source-card"><div class="bl-search-card-body"><span class="bl-search-kicker">'+esc(/official|government|clinical|medical|legal|regulator/i.test(String(source.role||'')+' '+String(source.topic||''))?'Official or clinical reference':'Community and academic research')+'</span><h3>'+esc(source.title||'Research source')+'</h3><p class="bl-search-muted">'+esc(source.creator||'Community or academic source')+' \u00b7 '+esc(access)+'</p><p>'+esc(source.usage||source.topic||'')+'</p><a class="bl-search-go" href="'+esc(source.url)+'" target="_blank" rel="noopener noreferrer">Open source &#8594;</a></div></article>'}
    async function searchWikipedia(q){var data=await fetchJSON('https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch='+encodeURIComponent(q)+'&format=json&origin=*');return (data.query&&data.query.search||[]).slice(0,5)}
    async function searchBooks(q){var data=await fetchJSON('https://openlibrary.org/search.json?q='+encodeURIComponent(q)+'&limit=8');return (data.docs||[]).slice(0,5)}
    async function searchSongs(q){var data=await fetchJSON('https://itunes.apple.com/search?term='+encodeURIComponent(q)+'&entity=song&limit=6');return (data.results||[]).filter(function(s){return s.trackName&&s.artistName}).slice(0,5)}
    async function wikipediaImages(items){if(!items.length)return {};var titles=items.map(function(item){return item.title}).join('|');var data=await fetchJSON('https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail&pithumbsize=500&titles='+encodeURIComponent(titles)+'&format=json&origin=*');var pages=(data.query&&data.query.pages)||{};var out={};Object.keys(pages).forEach(function(id){if(pages[id].thumbnail)out[pages[id].title]=pages[id].thumbnail.source});return out}

    var widgetRoutes={
      journal:'diary',diary:'diary',stream:'stream',videos:'stream',calendar:'calendar',orbit:'orbit',feed:'feed','my feed':'feed','myfeed':'feed',
      connect:'connect',camera:'camera','photo booth':'camera',booth:'camera',archive:'archive',library:'library',
      books:'library',bookiniz:'library',games:'games','arcade':'games',closet:'closet',clothes:'closet',
      trophies:'trophies',rooms:'rooms',room:'room',boards:'boards',projects:'projects',notes:'notes',
      map:'map',learn:'learn',politics:'politic','did you know':'didyouknow',tools:'tools',
      'lwazi games':'games','my journal':'diary'
    };
    function normalizeCommand(raw){return String(raw||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()}
    function routeCommand(raw){var text=normalizeCommand(raw);if(text==='take me to journal'||text==='open journal'||text==='go to journal'||text==='show my journal')return 'diary';var match=null;Object.keys(widgetRoutes).forEach(function(alias){if(!match&&(text==='take me to '+alias||text==='open '+alias||text==='go to '+alias||text===alias+' open'||text==='show me '+alias||text==='show '+alias))match=widgetRoutes[alias]});if(match)return match;if(/(^|\s)(journal|diary)(\s|$)/.test(text))return 'diary';return null}
    function close(){}
    function goRoute(route){close();var control=document.querySelector('[data-open="'+route+'"],button[data-widget-route="'+route+'"],a[href="#'+route+'"]');if(control){control.click();return}window.location.hash=route;setTimeout(function(){var el=document.getElementById(route)||document.querySelector('[data-widget-route="'+route+'"]');if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',block:'center'})},80)}

    var panel=null;
    function onKey(e){if(e.key==='Escape')close()}
    // Search is part of the Studio layout: outside interactions never dismiss it.
    close=function(){if(!panel)return;if(layoutObserver)layoutObserver.disconnect();panel.remove();panel=null;document.body.classList.remove('bl-search-is-open');var search=document.getElementById('globalSearch');if(search)search.setAttribute('aria-expanded','false');document.removeEventListener('keydown',onKey,true)};
    function mount(q){close();panel=document.createElement('aside');panel.className='bl-search-panel';panel.id='bl-studio-search-results';panel.setAttribute('role','region');panel.setAttribute('aria-label','Lwazi discovery search');var search=document.getElementById('globalSearch');var anchor=(search&&search.closest('header'))||search&&search.closest('[role="banner"]')||document.querySelector('#studioApp>header')||search&&search.parentElement||document.body.firstElementChild;if(anchor&&anchor.parentNode)anchor.insertAdjacentElement('afterend',panel);else document.body.insertBefore(panel,document.body.firstElementChild);document.body.classList.add('bl-search-is-open');observeSearchLayout();if(search){search.setAttribute('aria-controls',panel.id);search.setAttribute('aria-expanded','true')}document.addEventListener('keydown',onKey,true)}
    function internalButton(label,route){return '<button type="button" class="bl-search-go bl-search-route" data-lwazi-route="'+esc(route)+'">'+esc(label)+' &#8594;</button>'}
    function bookCover(b){if(b.cover_i)return 'https://covers.openlibrary.org/b/id/'+encodeURIComponent(b.cover_i)+'-M.jpg';if(b.isbn&&b.isbn[0])return 'https://covers.openlibrary.org/b/isbn/'+encodeURIComponent(b.isbn[0])+'-M.jpg';return ''}
    function userCard(u){var h=Math.abs(String(u.username||u.name||'u').split('').reduce(function(n,c){return n+c.charCodeAt(0)},0)*7)%360;return '<article class="bl-search-card bl-user-card"><div class="bl-search-card-media bl-avatar"> '+esc(String(u.name||u.username||'?').split(/\s+/).map(function(p){return p[0]}).join('').slice(0,2).toUpperCase())+'</div><div class="bl-search-card-body"><span class="bl-search-kicker">BigLWA user</span><h3>'+esc(u.name||u.username)+'</h3><p class="bl-search-muted">@'+esc(u.username)+'</p>'+ (u.bio?'<p>'+esc(u.bio)+'</p>':'')+'<a class="bl-search-go" href="'+esc(u.url||('/'+encodeURIComponent(u.username)))+'">View profile &#8594;</a></div></article>'}
    function bookCard(b){var cover=bookCover(b),meta=(b.author_name||[]).slice(0,2).join(', ')+(b.first_publish_year?' \u00b7 '+b.first_publish_year:'');return '<article class="bl-search-card bl-media-card">'+(cover?'<img class="bl-search-card-media" src="'+esc(cover)+'" alt="'+esc(b.title||'Book cover')+'" loading="lazy">':'<div class="bl-search-card-media bl-media-placeholder">Book</div>')+'<div class="bl-search-card-body"><span class="bl-search-kicker">Book</span><h3>'+esc(b.title||'Untitled')+'</h3><p class="bl-search-muted">'+esc(meta)+'</p>'+(b.key?'<a class="bl-search-go" href="https://openlibrary.org'+esc(b.key)+'" target="_blank" rel="noopener noreferrer">View book record &#8594;</a>':'')+internalButton('Open in Library','library')+'</div></article>'}
    function songCard(s){return '<article class="bl-search-card bl-media-card">'+(s.artworkUrl100?'<img class="bl-search-card-media" src="'+esc(s.artworkUrl100)+'" loading="lazy" alt="">':'<div class="bl-search-card-media bl-media-placeholder">Song</div>')+'<div class="bl-search-card-body"><span class="bl-search-kicker">Song</span><h3>'+esc(s.trackName)+'</h3><p class="bl-search-muted">'+esc(s.artistName)+(s.collectionName?' · '+esc(s.collectionName):'')+'</p>'+(s.trackViewUrl?'<a class="bl-search-go" href="'+esc(s.trackViewUrl)+'" target="_blank" rel="noopener noreferrer">View song information &#8594;</a>':'')+'</div></article>'}
    function publicSqwibCard(p,u){var username=String(u.username||'').replace(/^@/,'');return '<article class="bl-search-card bl-sqwib-card"><div class="bl-search-card-body"><span class="bl-search-kicker">Public Sqwidz · @'+esc(username)+'</span><p>'+esc(String(p.text||'').slice(0,420))+'</p><a class="bl-search-go" href="'+esc(u.url||('/'+encodeURIComponent(username)))+'">View public profile &#8594;</a></div></article>'}
    async function publicUserPosts(users){if(!users.length||!window.BigLWASqwibs||typeof window.BigLWASqwibs.publicSqwibs!=='function')return [];var visible=users.filter(function(u){return !/private/i.test(String(u.accountVisibility||u.visibility||u.privacy||''))});if(!visible.length)return [];var posts=await window.BigLWASqwibs.publicSqwibs(90);var cards=[];posts.forEach(function(p){if(p.visibility!=='public'||!p.text)return;var u=visible.find(function(u){return (u.uid&&p.uid&&String(u.uid)===String(p.uid))||(p.username&&String(p.username).toLowerCase()===String(u.username||'').toLowerCase())});if(u&&cards.length<8)cards.push(publicSqwibCard(p,u))});return cards}
    function wikiCard(w,image,type){return '<article class="bl-search-card bl-media-card">'+(image?'<img class="bl-search-card-media" src="'+esc(image)+'" alt="'+esc(w.title)+'" loading="lazy">':'<div class="bl-search-card-media bl-media-placeholder">'+esc(type==='movie'?'Cinema':'Research')+'</div>')+'<div class="bl-search-card-body"><span class="bl-search-kicker">'+esc(type==='movie'?'Film, history & culture':'Public figure, politics & history')+'</span><h3>'+esc(w.title)+'</h3><p>'+esc(w.snippet||'')+'</p>'+'<a class="bl-search-go" href="https://en.wikipedia.org/wiki/'+encodeURIComponent(String(w.title||'').replace(/\s+/g,'_'))+'" target="_blank" rel="noopener noreferrer">Open free article &#8594;</a>'+internalButton(type==='movie'?'Open in Archive':'Explore in Lwazi','archive')+'</div></article>'}
    function simpleCard(type,title,meta,body,image,route){return '<article class="bl-search-card bl-media-card">'+(image?'<img class="bl-search-card-media" src="'+esc(image)+'" alt="'+esc(title)+'" loading="lazy">':'<div class="bl-search-card-media bl-media-placeholder">'+esc(type)+'</div>')+'<div class="bl-search-card-body"><span class="bl-search-kicker">'+esc(type)+'</span><h3>'+esc(title)+'</h3>'+ (meta?'<p class="bl-search-muted">'+esc(meta)+'</p>':'')+(body?'<p>'+esc(body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim())+'</p>':'')+internalButton('Open in '+route.replace(/^./,function(c){return c.toUpperCase()}),route)+'</div></article>'}
    function sectionId(title){return 'bl-section-'+String(title).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
    // Use the same symbols as the Studio/Skeleton Key, not unrelated emoji or initials.
    function sectionSymbol(title){
      var type=/image/i.test(title)?'veve':/politic/i.test(title)?'politc':/research/i.test(title)?'research':/book/i.test(title)?'library':/stream|video|cinema/i.test(title)?'stream':/sqwidz/i.test(title)?'notes':/user|people/i.test(title)?'connect':/song/i.test(title)?'music':/place|map/i.test(title)?'map':/widget/i.test(title)?'studio':'archive';
      if(type==='politc')return '<img src="/assets/politc-nyame-baatanpa.svg" alt="" loading="lazy">';
      if(type==='research')return '<img src="/assets/tools-hand-eye.svg" alt="" loading="lazy">';
      var selectors=[
        '#studioApp .sidebar-navigation-row[data-sidebar-route-row="'+type+'"] .sidebar-route-icon',
        '#studioApp .sidebar-widget-restore-row[data-shortcut-row="'+type+'"] .sidebar-route-icon',
        '#studioApp [data-sidebar-route-row="'+type+'"] .sidebar-route-icon',
        '#studioApp #'+type+' .card-head .card-icon',
        '#studioApp #'+type+' .card-icon',
        '#studioApp [data-shortcut-row="'+type+'"] .sidebar-route-icon'
      ];
      if(type==='veve')selectors.push('#studioApp [data-open="veve"] .card-icon');
      for(var i=0;i<selectors.length;i++){
        var source=document.querySelector(selectors[i]);if(!source)continue;
        var artwork=source.matches('svg,img')?source:source.querySelector('svg,img');
        if(artwork)return artwork.outerHTML;
        var fallback=source.textContent.trim();if(fallback&&fallback.length<4)return esc(fallback);
      }
      var fallback={veve:'✺',stream:'▶',connect:'✣',library:'▥',notes:'▤',music:'♫',map:'⌖',studio:'▦',archive:'▤'};
      return fallback[type]||'◉';
    }
    var layoutObserver=null;
    function fitSearchPanel(){
      if(!panel)return;
      var parent=panel.parentElement.getBoundingClientRect(),rail=document.querySelector('#studioApp .sidebar');
      var bounds=rail&&rail.getBoundingClientRect();
      var visible=rail&&getComputedStyle(rail).visibility!=='hidden'&&getComputedStyle(rail).display!=='none'&&bounds.width>0;
      var search=document.getElementById('globalSearch'),searchBounds=search&&search.getBoundingClientRect();
      // Align the entire result canvas and tabs with the search input,
      // always clearing the Skeleton Key (including its expanded state).
      var safeX=visible?bounds.right+18:parent.left+18;
      var alignedX=searchBounds?searchBounds.left+18:safeX;
      var left=Math.max(18,Math.ceil(Math.max(safeX,alignedX)-parent.left));
      panel.style.setProperty('--bl-search-left',left+'px');
    }
    function observeSearchLayout(){
      fitSearchPanel();
      if(layoutObserver)layoutObserver.disconnect();
      if(window.ResizeObserver){layoutObserver=new ResizeObserver(fitSearchPanel);layoutObserver.observe(panel.parentElement);var rail=document.querySelector('#studioApp .sidebar');if(rail)layoutObserver.observe(rail)}
    }
    window.addEventListener('resize',fitSearchPanel);
    new MutationObserver(fitSearchPanel).observe(document.body,{attributes:true,attributeFilter:['class']});
    function section(title,cards,category){if(!cards||!cards.length)return '';return '<section class="bl-search-section" data-bl-category="'+esc(category||'research')+'" id="'+sectionId(title)+'"><h2><span class="bl-search-section-icon" aria-hidden="true">'+sectionSymbol(title)+'</span>'+esc(title)+'</h2><div class="bl-search-grid">'+cards.join('')+'</div></section>'}
    function renderAnswer(target,value){if(!target)return;var html=esc(String(value==null?'':typeof value==='object'?(value.answer||value.text||'No answer available.'):value));html=html.replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[\s(])\*([^*\n]+)\*(?=\s|[.,;!?)]|$)/g,'$1<em>$2</em>');html=html.replace(/\n\n+/g,'</p><p>').replace(/\n/g,'<br>');target.innerHTML='<p>'+html+'</p>'}

    var browserSessionPromise=null;
    function fastLwaziResponse(q){
      var text=normalizeCommand(q);
      if(/^(?:what is\s+)?2\s*\+\s*2\s*\??$/i.test(String(q).trim()))return '4. Quick, clean, no research spiral required.';
      if(/^(hi|hey|hello|sup|what'?s up|wassup)$/.test(text)||/^how are you(?: doing)?/.test(text))return "I’m doing good, bookini. Coffee-level processing speed, petty-level discernment, and enough patience for one more ballroom tea spill. How you doing?";
      if(/^(who are you|what are you)$/.test(text))return 'I’m L’wazi—BigLWA’s cooler, chronically online older cousin. I help you search, research, navigate widgets, and talk through culture without pretending one mainstream center speaks for everybody.';
      if(/^(thanks|thank you|thank u)$/.test(text))return 'Anytime, bookini. You keep me employed and fabulous.';
      if(/^(good morning|good night)$/.test(text))return text==='good morning'?'Morning, bookini. Go get that coin.':'Night, bookini. Rest is resistance, sleep is policy.';
      return null;
    }
    async function askLwazi(q,sources,onPartial){
      var fast=fastLwaziResponse(q);if(fast)return fast;
      var hooks=[window.__biglwaAskLwazi,window.BigLWA&&window.BigLWA.askLwazi].filter(function(fn){return typeof fn==='function'});
      if(hooks.length){
        try{
          var libraryForHook=await sourceLibraryPromise;
          var hookStop,hookTimeout=new Promise(function(_,reject){hookStop=setTimeout(function(){reject(Error('Lwazi provider timed out'))},33000)});
          var external;
          try{external=await Promise.race([Promise.resolve().then(function(){return hooks[0](q,sources,libraryForHook&&libraryForHook.critical_reasoning,onPartial)}),hookTimeout])}
          finally{clearTimeout(hookStop)}
          if(external)return String(external.answer||external);
        }catch(e){console.warn('[Lwazi] Provider hook unavailable:',e)}
      }
      var config=window.__biglwaLwaziConfig||{};
      if(config.apiUrl){
        var controller=new AbortController(),stop=setTimeout(function(){controller.abort()},18000);
        try{
          var providerResponse=await fetch(config.apiUrl,{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({question:q,context:sources,models:config.models||['latest-fast'],reasoning:{charter:'lwazi-v2'}})});
          if(providerResponse.ok){var providerData=await providerResponse.json();var providerAnswer=providerData.answer||providerData.message||providerData.output_text;if(providerAnswer)return String(providerAnswer)}
        }catch(e){console.warn('[Lwazi] Secure provider endpoint unavailable:',e)}
        finally{clearTimeout(stop)}
      }
      try{
        var lm=(window.LanguageModel)||(window.ai&&window.ai.languageModel);
        if(lm&&typeof lm.create==='function'){
          var policyLibrary=await sourceLibraryPromise;var charter=policyLibrary&&policyLibrary.critical_reasoning;
          var session=await (browserSessionPromise||(browserSessionPromise=lm.create({systemPrompt:'You are L’wazi, a source-grounded, Black-centered and community-accountable research assistant in BIG LWA. Answer directly and humanely. Favor evidence over agreement. Apply the individual, social and political body lenses when useful, protect privacy and never invent sources. Write with warmth and natural cultural fluency, not forced slang.'+(charter?'\nUse this research method: '+JSON.stringify({three_bodies:charter.three_bodies,argument_rules:charter.argument_rules}):'')}).catch(function(error){browserSessionPromise=null;throw error})));
          var answer=await Promise.race([session.prompt(q+'\n\nDiscovery references (not verified full text):\n'+sources.map(function(s){return s.title+': '+s.snippet+(s.url?' | '+s.url:'')}).join('\n')),new Promise(function(_,reject){setTimeout(function(){reject(Error('Browser model timed out'))},15000)})]);
          if(answer)return String(answer);
        }
        if(lm&&typeof lm==='object'&&typeof lm.prompt==='function'){var quick=await lm.prompt(q);if(quick)return String(quick)}
      }catch(e){console.warn('[Lwazi] Browser AI unavailable:',e)}
      if(sources.length)return 'Here are the most relevant public discovery links for “'+q+'”: '+sources.slice(0,3).map(function(s){return s.title+' — '+String(s.snippet||'').replace(/<[^>]+>/g,' ').slice(0,180)}).join('; ')+'. I could not verify their full text.';
      return 'I could not reach a model or verified research sources for “'+q+'”. Please try again or use the search results below.';
    }

    async function openPanel(raw){
      var q=String(raw==null?'':raw).trim().replace(/^@/,'').replace(/^ask lwazi\s*/i,'').trim();if(!q)return;
      var route=routeCommand(q);if(route){goRoute(route);return}
      mount(q);var current=panel;var clean=String(q).replace(/^@/,'').trim();panel.innerHTML='<article class="bl-lwazi-answer"><span class="bl-search-kicker">L’wazi answer</span><div class="bl-lwazi-answer-body">Finding grounded sources…</div></article><div class="bl-search-head"><div><span class="bl-search-assistant">L’wazi</span><h1>Explore BIG LWA and beyond</h1><p class="bl-search-question">'+esc(clean)+'</p></div><button type="button" class="bl-search-close" aria-label="Close search results">&#10005;</button></div><nav class="bl-search-category-nav" aria-label="Search result categories"><button type="button" data-bl-match="users"><span class="bl-search-tab-symbol" aria-hidden="true">'+sectionSymbol('People')+'</span>People</button><button type="button" data-bl-match="sqwidz"><span class="bl-search-tab-symbol" aria-hidden="true">'+sectionSymbol('Sqwidz')+'</span>Sqwidz</button><button type="button" data-bl-match="books"><span class="bl-search-tab-symbol" aria-hidden="true">'+sectionSymbol('Books')+'</span>Books</button><button type="button" data-bl-match="songs"><span class="bl-search-tab-symbol" aria-hidden="true">'+sectionSymbol('Songs')+'</span>Songs</button><button type="button" data-bl-match="research"><span class="bl-search-tab-symbol" aria-hidden="true">'+sectionSymbol('Research')+'</span>Research</button><button type="button" data-bl-match="politics"><span class="bl-search-tab-symbol" aria-hidden="true">'+sectionSymbol('Politics')+'</span>Politics</button><button type="button" data-bl-match="stream"><span class="bl-search-tab-symbol" aria-hidden="true">'+sectionSymbol('Stream')+'</span>Stream</button></nav><div class="bl-search-loading">Finding people, books, songs and sources…</div>';
      panel.querySelector('.bl-search-close').addEventListener('click',close);
      // One delegated handler for the canonical categories and their extended searches.
      var extraTabs=[['images','Images'],['places','Places'],['history','History'],['widgets','Widgets'],['maps','Maps']];
      var extraNav=panel.querySelector('.bl-search-category-nav');
      extraTabs.forEach(function(tab){
        var b=document.createElement('button');b.type='button';b.dataset.blMatch=tab[0];
        b.innerHTML='<span class="bl-search-tab-symbol" aria-hidden="true">'+sectionSymbol(tab[1])+'</span>'+tab[1];
        extraNav.appendChild(b);
      });
      function activateCategory(category,fromClick){
        if(panel!==current)return;
        var tab=extraNav.querySelector('[data-bl-match="'+category+'"]');
        extraNav.querySelectorAll('button[data-bl-match]').forEach(function(b){
          var active=b===tab;b.classList.toggle('is-active',active);
          if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
        });
        var sections=Array.from(current.querySelectorAll('.bl-search-section'));
        var named={users:'BigLWA users',sqwidz:'Public Sqwidz',books:'Books',songs:'Songs',research:'Community-centered research sources',politics:'Politics & public life',stream:'Cinema & video'};
        var sectionName=named[category];
        var matches=sections.filter(function(section){
          return sectionName?section.id===sectionId(sectionName):
            (' '+(section.getAttribute('data-bl-category')||'')+' ').includes(' '+category+' ');
        });
        sections.forEach(function(section){section.style.display=matches.includes(section)?'':'none'});
        if(fromClick&&matches.length)matches[0].scrollIntoView({behavior:'smooth',block:'nearest'});
        if(fromClick&&!matches.length&&!current.querySelector('.bl-search-loading')){
          if(category==='stream')goRoute('stream');
          else if(category==='politics')goRoute('politic');
          else if(category==='widgets')goRoute('library');
          else if(category==='maps')goRoute('map');
        }
      }
      extraNav.addEventListener('click',function(event){
        var b=event.target.closest('button[data-bl-match]');
        if(b&&extraNav.contains(b))activateCategory(b.dataset.blMatch,true);
      });


      if(/\b(eligib|financial aid|fafsa|medic|healthcare|medical|clinical|gender affirming|insurance|benefits)\b/i.test(clean)){var note=document.createElement('p');note.className='bl-search-guidance';note.textContent='Requirements and care guidance can change. Confirm current eligibility with the relevant agency, and medical questions with current clinical sources; community guidance adds important context.';current.querySelector('.bl-lwazi-answer').appendChild(note)}
      var lc=clean.toLowerCase();
      var immediate=fastLwaziResponse(clean);
      if(immediate){var instantBox=current.querySelector('.bl-lwazi-answer-body');if(instantBox)instantBox.textContent=immediate}
      var userPromise=searchUsers(lc).catch(function(){return []});
      var postPromise=userPromise.then(publicUserPosts).catch(function(){return []});
      var songPromise=searchSongs(clean).then(function(items){return items.map(songCard)}).catch(function(){return []});
      var bookPromise=searchBooks(clean).then(function(items){return items.map(bookCard)}).catch(function(){return []});
      var wikiDataPromise=searchWikipedia(clean).catch(function(){return []});
       var wikiPromise=wikiDataPromise.then(function(items){return Promise.all([wikipediaImages(items).catch(function(){return {}}),items])}).then(function(pair){var images=pair[0];return pair[1].map(function(w){return wikiCard(w,images[w.title],/film|movie|cinema|director/i.test(clean+' '+w.title)?'movie':'research')})}).catch(function(){return []});
       // Wikipedia results are fetched once for cards, not twice to block the answer.
      var libraryPromise=sourceLibraryPromise.then(function(library){return sourceLibraryMatches(library,clean)}).catch(function(){return []});
       var answerPromise=immediate?Promise.resolve(immediate):Promise.all([libraryPromise,Promise.race([wikiDataPromise,new Promise(function(resolve){setTimeout(function(){resolve([])},1400)})])]).then(function(parts){var sources=parts[0].map(function(source){return {title:source.title,snippet:String(source.creator||'')+' · '+String(source.topic||'')+' · '+String(source.usage||source.notes||''),url:String(source.url||'')}});parts[1].slice(0,3).forEach(function(w){sources.push({title:w.title,snippet:String(w.snippet||'').replace(/<[^>]+>/g,''),url:'https://en.wikipedia.org/wiki/'+encodeURIComponent(String(w.title||'').replace(/\s+/g,'_'))})});return askLwazi(clean,sources,function(partial){if(panel!==current||!current.isConnected)return;var answerBox=current.querySelector('.bl-lwazi-answer-body');if(answerBox)renderAnswer(answerBox,partial)})});
       libraryPromise.then(function(matches){if(panel!==current||!current.isConnected)return;var box=current.querySelector('.bl-lwazi-answer-body');if(!immediate&&matches.length&&box)box.textContent='Found '+matches.length+' relevant sources: '+matches.slice(0,3).map(function(x){return x.title}).join('; ')+'. Preparing a fuller answer…'});

      Promise.all([userPromise,bookPromise,wikiPromise,libraryPromise,postPromise,songPromise]).then(function(parts){
        if(panel!==current||!current.isConnected)return;
         var wikiCards=parts[2],politics=wikiCards.filter(function(x){return /politic|electoral|vote|government|president|law|court|parliament/i.test(x)}),films=wikiCards.filter(function(x){return /cinema|film|movie|video|episode|director/i.test(x)}),general=wikiCards.filter(function(x){return !politics.includes(x)&&!films.includes(x)});
         var html=section('BigLWA users',parts[0].map(userCard),'people users images')+section('Public Sqwidz',parts[4],'sqwidz social posts')+section('Books',parts[1],'books images')+section('Songs',parts[5],'songs music videos audio')+section('Politics & public life',politics,'politics history research')+section('Cinema & video',films,'stream videos movies images')+section('People, places & history',general,'research history places people politics images');
        html+=section('Community-centered research sources',parts[3].map(sourceLibraryCard),'research history politics');
        var loading=panel.querySelector('.bl-search-loading');if(loading)loading.outerHTML=html||'<p class="bl-search-empty">No public results found.</p>';
        var qType=/\b(song|music|album|artist|sing|track)\b/i.test(clean)?'songs':/\b(book|novel|author|read|library)\b/i.test(clean)?'books':/\b(politic|government|election|president|law|court|policy)\b/i.test(clean)?'politics':/\b(movie|film|cinema|director|episode)\b/i.test(clean)?'stream':/\b(user|person|people|who is|@)\b/i.test(clean)?'people':parts[3].length?'research':'history';
        var primaryName=({songs:'Songs',books:'Books',politics:'Politics & public life',stream:'Cinema & video',people:'BigLWA users',research:'Community-centered research sources',history:'People, places & history'})[qType];
        var primary=document.getElementById(sectionId(primaryName||''));activateCategory(qType==='people'?'users':qType,false);
        panel.querySelectorAll('[data-lwazi-route]').forEach(function(button){button.addEventListener('click',function(){goRoute(button.dataset.lwaziRoute)})});
      });
      answerPromise.then(function(answer){if(panel!==current||!current.isConnected)return;var box=current.querySelector('.bl-lwazi-answer-body');if(box)renderAnswer(box,answer==null?'No answer available.':answer)}).catch(function(){if(panel!==current||!current.isConnected)return;var box=current.querySelector('.bl-lwazi-answer-body');if(box)renderAnswer(box,'Search information could not be loaded. Try again.')});
    }
    window.__biglwaUserCards=openPanel;window.__biglwaUserCardsClose=close;
    function boothSearchSymbol(){
      // The card icon is the canonical Booth mark shared with the Studio.
      var source=document.querySelector('#studioApp #camera .card-head .card-icon')||
        document.querySelector('#studioApp [data-sidebar-route-row="camera"] .sidebar-route-icon')||
        document.querySelector('#studioApp [data-shortcut-row="camera"] .sidebar-route-icon');
      var artwork=source&&(source.matches('img,svg')?source:source.querySelector('img,svg'));
      var symbol=artwork?artwork.outerHTML:(source&&source.textContent.trim().slice(0,3))||'◉';
      return '<span class="bl-booth-symbol" aria-hidden="true">'+symbol+'</span>';
    }
    function installLwaziButton(){
      var search=document.getElementById('globalSearch');if(!search)return;
      var wrap=search.closest('.search-wrap')||search.parentNode;if(!wrap)return;
      // The old floating autocomplete used this flag. Discovery now belongs in the Studio flow.
      search.__biglwaSearchBound=1;
      if(wrap.tagName&&wrap.tagName.toLowerCase()==='label'){
        var div=document.createElement('div');div.className=wrap.className;div.style.cssText=wrap.style.cssText;
        while(wrap.firstChild)div.appendChild(wrap.firstChild);wrap.replaceWith(div);wrap=div;
      }
      wrap.classList.add('bl-search-ready');
      // The existing magnifying-glass glyph is no longer a separate control.
      // L'wazi occupies this leading position; do not leave two symbols there.
      wrap.querySelectorAll('.search-icon').forEach(function(icon){icon.remove()});
      if(!wrap.querySelector('.bl-lwazi-button')){
        var button=document.createElement('button');button.type='button';button.className='bl-lwazi-button';
        button.setAttribute('aria-label','Ask Lwazi');button.title='Ask Lwazi';
        button.innerHTML='<span class="bl-lwazi-stitch" aria-hidden="true"><svg class="bl-lwazi-ring" viewBox="0 0 36 36" focusable="false"><defs><linearGradient id="bl-lwazi-stitch-rainbow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d75671"/><stop offset=".2" stop-color="#e2b34c"/><stop offset=".4" stop-color="#4c9f66"/><stop offset=".6" stop-color="#398bb5"/><stop offset=".8" stop-color="#8e63b4"/><stop offset="1" stop-color="#d75671"/></linearGradient></defs><circle cx="18" cy="18" r="15.5" fill="none" stroke="url(#bl-lwazi-stitch-rainbow)" stroke-width="2.2" stroke-dasharray="3.2 2.1" stroke-linecap="round"/></svg><img class="bl-lwazi-glyph" src="/assets/tools-hand-eye.svg" alt=""></span>';
        button.onclick=function(e){e.stopPropagation();openPanel(search.value.trim()||'What can Lwazi help me explore?')};
        wrap.appendChild(button);
      }
      if(!wrap.querySelector('.bl-voice-button')){
        var mic=document.createElement('button');mic.type='button';mic.className='bl-voice-button';
        mic.setAttribute('aria-label','Dictate search with microphone');mic.setAttribute('aria-pressed','false');mic.title='Voice to text';
        mic.innerHTML='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/></svg>';
        var Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
        if(!Speech){mic.disabled=true;mic.title='Voice dictation is not supported by this browser';mic.setAttribute('aria-label',mic.title)}
        else{
          var recognition=null,original='';
          function stop(){if(recognition){try{recognition.stop()}catch(e){}}}
          mic.onclick=function(e){e.stopPropagation();if(mic.getAttribute('aria-pressed')==='true'){stop();return}
            try{
              recognition=new Speech();recognition.lang=(document.documentElement.lang||navigator.language||'en-US');
              recognition.continuous=false;recognition.interimResults=true;recognition.maxAlternatives=1;
              original=search.value.trim();mic.setAttribute('aria-pressed','true');mic.classList.add('is-listening');
              recognition.onresult=function(event){var transcript='';for(var i=0;i<event.results.length;i++)transcript+=event.results[i][0].transcript;
                search.value=(original?original+' ':'')+transcript.trim();search.dispatchEvent(new Event('input',{bubbles:true}));
              };
              recognition.onerror=function(event){mic.title=event.error==='not-allowed'?'Microphone permission denied':'Voice input unavailable: '+event.error};
              recognition.onend=function(){mic.setAttribute('aria-pressed','false');mic.classList.remove('is-listening');search.focus();recognition=null};
              recognition.start();
            }catch(error){mic.setAttribute('aria-pressed','false');mic.classList.remove('is-listening');mic.title='Voice input unavailable'}
          };
        }
        wrap.appendChild(mic);
      }
      if(!wrap.querySelector('.bl-camera-button')){
        var camera=document.createElement('button');camera.type='button';camera.className='bl-camera-button';camera.title='Search by image';camera.setAttribute('aria-label','Search by image');
        // Keep the image-search behavior, but use the existing Booth widget
        // symbol, not a generic camera icon or a framed control.
        camera.innerHTML=boothSearchSymbol();
        var picker=document.createElement('input');picker.type='file';picker.accept='image/*';picker.hidden=true;picker.className='bl-search-file-input';picker.style.setProperty('display','none','important');picker.setAttribute('aria-label','Choose image to search');wrap.appendChild(picker);
        camera.onclick=function(e){e.stopPropagation();picker.click()};
        picker.addEventListener('change',function(){var file=picker.files&&picker.files[0];if(!file)return;
          if(!/^image\//.test(file.type)||file.size>10*1024*1024){alert('Choose an image under 10 MB.');picker.value='';return}
          var url=URL.createObjectURL(file);openPanel(search.value.trim()||'Search by image');var host=panel;
          var block=document.createElement('div');block.className='bl-image-search-preview';
          var img=document.createElement('img');img.src=url;img.alt='Image selected for search';
          var msg=document.createElement('p');msg.textContent='Image selected. Nothing is uploaded until you choose Analyze image.';
          var run=document.createElement('button');run.type='button';run.className='bl-search-image-run';run.textContent='Analyze image';block.append(img,msg,run);host?.querySelector('.bl-search-head')?.after(block);
          run.onclick=async function(){var hook=window.__biglwaAskLwaziImage||window.BigLWA?.askLwaziImage;
            if(typeof hook!=='function'){msg.textContent='Image recognition needs a connected vision-capable L’wazi service. This image stays on your device.';return}
            run.disabled=true;msg.textContent='Analyzing image…';
            try{var result=await hook(file,search.value.trim());if(panel===host)renderAnswer(host.querySelector('.bl-lwazi-answer-body'),result?.answer||result);msg.textContent='Image analysis finished.'}
            catch(e){msg.textContent='Image analysis failed. Try again.'}finally{run.disabled=false}
          };
          host?.querySelector('.bl-search-close')?.addEventListener('click',function(){URL.revokeObjectURL(url);picker.value=''},{once:true});
        });
        wrap.appendChild(camera);
      }
      var boothButton=wrap.querySelector('.bl-camera-button');
      if(boothButton){
        var latestBoothSymbol=boothSearchSymbol();
        if(boothButton.innerHTML!==latestBoothSymbol)boothButton.innerHTML=latestBoothSymbol;
      }
      if(!wrap.querySelector('.bl-search-clear')){
        var clear=document.createElement('button');clear.type='button';clear.className='bl-search-clear';clear.title='Clear search';clear.setAttribute('aria-label','Clear search');clear.textContent='×';
        clear.onclick=function(e){e.stopPropagation();search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));close();search.focus()};wrap.appendChild(clear);
      }
      if(!search.__blLwaziEnterBound){
        search.__blLwaziEnterBound=true;
        search.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();openPanel(search.value.trim())}},true);
      }
    }
    installLwaziButton();setTimeout(installLwaziButton,500);window.addEventListener('load',installLwaziButton);new MutationObserver(installLwaziButton).observe(document.documentElement,{childList:true,subtree:true});
    var style=document.createElement('style');
    style.textContent='.bl-search-panel{position:relative;z-index:800;box-sizing:border-box;width:100%;margin:0;padding:18px 24px 22px;border-bottom:1px solid #d9d0c6;background:#fffaf3;color:#272321;box-shadow:0 14px 30px rgba(30,18,14,.14)}.bl-search-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.bl-search-assistant{font:800 10px/1 system-ui;text-transform:uppercase;letter-spacing:.16em;color:#a84a5d}.bl-search-head h1{margin:5px 0 12px;font:400 24px/1 Georgia,serif}.bl-search-close,.bl-search-submit,.bl-search-command,.bl-search-route{border:1px solid #d9d0c6;border-radius:10px;background:#fff;color:#342d29;cursor:pointer}.bl-search-close{width:34px;height:34px}.bl-search-query{display:flex;gap:8px;max-width:980px}.bl-search-query input{flex:1;min-width:0;border:1px solid #d9d0c6;border-radius:11px;padding:10px 12px;background:white;color:inherit;font:14px system-ui}.bl-search-submit{padding:0 16px;font-weight:700}.bl-lwazi-answer{margin:14px 0 0;padding:14px 16px;border:1px solid rgba(168,74,93,.25);border-radius:14px;background:linear-gradient(135deg,#fff5f7,#fffaf3);max-width:980px}.bl-lwazi-answer-body{margin-top:6px;font-size:14px;line-height:1.55}.bl-search-loading,.bl-search-empty{padding:22px 0;color:#81766e}.bl-search-section{margin-top:16px}.bl-search-section h2{margin:0 0 9px;font:800 12px/1 system-ui;text-transform:uppercase;letter-spacing:.08em;color:#756a62}.bl-search-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;max-width:1180px}.bl-search-card{display:flex;box-sizing:border-box;min-height:116px;border:1px solid #e4dbd0;border-radius:14px;background:rgba(255,255,255,.82);overflow:hidden}.bl-search-card-media{width:82px;min-width:82px;height:116px;object-fit:cover;background:#efe4dc}.bl-media-placeholder{display:grid;place-items:center;min-height:116px;text-align:center;padding:8px;box-sizing:border-box;font:800 12px/1.2 system-ui;color:#806d62;background:linear-gradient(145deg,#f0ddd4,#e7edf1)}.bl-avatar{display:grid;place-items:center;width:52px;min-width:52px;height:52px;margin:12px 0 12px 12px;border-radius:15px;font:800 17px/1 Georgia;background:linear-gradient(145deg,#f4d0d7,#ddd8f2)}.bl-search-card-body{display:flex;flex-direction:column;gap:4px;padding:12px 14px;min-width:0}.bl-search-card h3{margin:0;font-size:14px;line-height:1.25}.bl-search-card p{margin:2px 0;font-size:12px;line-height:1.42;color:#574f49}.bl-search-kicker{font:800 9px/1 system-ui;text-transform:uppercase;letter-spacing:.12em;color:#9a5c68}.bl-search-muted{color:#81766e!important}.bl-search-go{margin-top:auto;padding-top:8px;border:0;background:transparent;font-weight:700;font-size:12px;color:#8b4051;text-decoration:none;text-align:left}.bl-search-route{padding:7px 9px;margin-top:auto;width:max-content}.bl-lwazi-button,.bl-voice-button{position:absolute;top:50%;width:32px;height:32px;transform:translateY(-50%);display:grid;place-items:center;border:0;border-radius:50%;background:transparent;color:inherit;cursor:pointer;z-index:5}.bl-lwazi-button{right:7px}.bl-voice-button{right:45px}.bl-voice-button.is-listening{color:#b73752;background:rgba(220,64,90,.12);box-shadow:0 0 0 2px rgba(220,64,90,.28)}.bl-voice-button:disabled{opacity:.42;cursor:not-allowed}.bl-lwazi-button:focus-visible,.bl-voice-button:focus-visible{outline:2px solid #9a3854;outline-offset:1px}.bl-lwazi-button img{width:28px;height:30px;object-fit:contain}.search-wrap{position:relative;min-width:0!important}.search-wrap #globalSearch{box-sizing:border-box;min-width:0!important;width:100%!important;padding-right:89px!important}.bl-search-panel{box-shadow:none!important;border-radius:0!important;position:relative!important;overflow:visible!important;z-index:2!important}.bl-search-is-open #studioApp .masonry{position:relative}.bl-sqwib-card .bl-search-card-body{width:100%}.bl-search-guidance{margin:10px 0 0;color:#675b5b;font-size:12px;line-height:1.5}@media(max-width:700px){.bl-search-panel{padding:14px}.bl-search-head h1{font-size:21px}.bl-search-grid{grid-template-columns:1fr}.bl-search-card-media{width:72px;min-width:72px}.bl-lwazi-button{right:5px}.bl-voice-button{right:42px}.search-wrap #globalSearch{padding-right:82px!important}}body.night-mode .bl-search-panel{background:#241f1d;border-color:#4a423c;color:#f2ece6}body.night-mode .bl-search-card{background:#322c29;border-color:#514a45}body.night-mode .bl-search-card p{color:#d9cfc5}body.night-mode .bl-search-query input,body.night-mode .bl-search-close,body.night-mode .bl-search-submit,body.night-mode .bl-search-route{background:#37302d;border-color:#514a45;color:#f1ebe5}body.night-mode .bl-lwazi-answer{background:#34292b;border-color:#684650}';
    var lwaziUiStyle=document.createElement('style');
    lwaziUiStyle.textContent="\n/* Search follows the header like Google; the rail cannot cover the result canvas. */\n.bl-search-panel{display:flex!important;flex-direction:column!important;box-sizing:border-box!important;max-width:100%!important;padding:8px 22px 25px var(--bl-search-left,22px)!important;overflow:visible!important}\n.bl-search-panel>.bl-search-category-nav{order:-3!important}\n.bl-search-panel>.bl-lwazi-answer{order:-2!important}\n.bl-search-panel>.bl-search-head{order:-1!important}\n.bl-search-panel>.bl-search-loading,.bl-search-panel>.bl-search-empty,.bl-search-panel>.bl-search-section,.bl-search-panel>.bl-search-guidance{order:1!important}\n.bl-search-category-nav{display:flex!important;align-items:stretch!important;flex-wrap:nowrap!important;gap:0!important;width:100%!important;max-width:100%!important;min-width:0!important;overflow-x:auto!important;overflow-y:hidden!important;margin:0 0 13px!important;padding:0!important;border:0!important;border-bottom:1px solid rgba(125,112,102,.19)!important;scrollbar-width:thin}\n.bl-search-category-nav button{position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;gap:7px!important;box-sizing:border-box!important;height:43px!important;min-height:43px!important;padding:2px 13px 5px!important;border:0!important;border-bottom:3px solid transparent!important;border-radius:0!important;background:transparent!important;color:inherit!important;font:500 12px/1.2 system-ui!important;white-space:nowrap!important;cursor:pointer!important}\n.bl-search-category-nav button+button::before{content:'';position:absolute;left:0;top:14px;width:1px;height:13px;background:rgba(119,108,100,.22)}\n.bl-search-category-nav button.is-active{border-bottom-color:rgba(var(--aura-rgb,183,75,98),.95)!important;color:inherit!important;font-weight:700!important}\n.bl-search-category-nav button:focus-visible{outline:2px solid rgba(var(--aura-rgb,183,75,98),.78)!important;outline-offset:-3px!important}\n.bl-search-category-nav .bl-search-tab-symbol{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 21px!important;width:21px!important;height:21px!important;min-width:21px!important;margin:0!important;line-height:1!important;font-size:17px!important;vertical-align:middle!important}\n.bl-search-category-nav .bl-search-tab-symbol img,.bl-search-category-nav .bl-search-tab-symbol svg{display:block!important;position:static!important;width:19px!important;height:19px!important;max-width:19px!important;max-height:19px!important;min-width:0!important;min-height:0!important;object-fit:contain!important;flex:0 0 auto!important}\n.bl-search-section-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:21px!important;height:21px!important;margin-right:7px!important;vertical-align:middle!important}\n.bl-search-section-icon svg,.bl-search-section-icon img{width:19px!important;height:19px!important;max-width:19px!important;max-height:19px!important;object-fit:contain!important}\n.bl-search-section h2{display:flex!important;align-items:center!important;font-size:12px!important;line-height:1.25!important;margin-bottom:8px!important}\n.bl-lwazi-answer{margin:0 0 12px!important;padding:10px 13px!important;max-width:min(100%,1100px)!important}\n.bl-lwazi-answer-body{font-size:13px!important;line-height:1.45!important}\n.bl-search-head{margin:5px 0 2px!important}\n.bl-search-head h1{font-size:22px!important;margin:3px 0 8px!important}\n.bl-search-close{width:30px!important;height:30px!important;min-width:30px!important}\n.search-wrap #globalSearch::-webkit-search-cancel-button{-webkit-appearance:none!important;appearance:none!important;display:none!important}\n.bl-search-clear{position:absolute!important;right:4px!important;top:50%!important;width:30px!important;height:30px!important;transform:translateY(-50%)!important;border:0!important;border-radius:50%!important;background:transparent!important;color:#2585ad!important;font-size:20px!important;line-height:1!important;z-index:7!important;cursor:pointer!important}\n.bl-camera-button,.bl-file-button{right:42px!important}\n.bl-lwazi-button{right:82px!important;width:36px!important;height:36px!important}\n.bl-voice-button{right:124px!important}\n.search-wrap #globalSearch{padding-right:164px!important}\n.bl-lwazi-stitch{position:relative!important;display:grid!important;place-items:center!important;width:36px!important;height:36px!important;border-radius:50%!important;background:#fff8ef!important;isolation:isolate!important}\n.bl-lwazi-ring{position:absolute!important;inset:0!important;width:36px!important;height:36px!important;overflow:visible!important}\n.bl-lwazi-glyph{position:relative!important;display:block!important;width:19px!important;height:25px!important;max-width:19px!important;max-height:25px!important;border:0!important;border-radius:0!important;background:transparent!important;object-fit:contain!important}\nbody.night-mode .bl-search-category-nav button{background:transparent!important;color:#eee5df!important}\nbody.night-mode .bl-lwazi-stitch{background:#f8eee7!important}\n@media(max-width:700px){.bl-search-panel{padding-right:12px!important;padding-bottom:16px!important}.bl-search-category-nav button{height:39px!important;min-height:39px!important;padding:2px 10px 4px!important;font-size:11px!important;gap:5px!important}.bl-search-category-nav .bl-search-tab-symbol{width:19px!important;height:19px!important;flex-basis:19px!important}.bl-search-category-nav .bl-search-tab-symbol svg,.bl-search-category-nav .bl-search-tab-symbol img{width:17px!important;height:17px!important}.search-wrap #globalSearch{padding-right:144px!important}.bl-voice-button{right:108px!important}.bl-lwazi-button{right:70px!important}.bl-camera-button{right:34px!important}.bl-search-clear{right:2px!important;width:26px!important}}\n\n/* Search input controls: Lwazi leads; mic, Booth and clear align like Google. */\n#studioApp .search-wrap.bl-search-ready .search-icon{display:none!important;visibility:hidden!important}\n#studioApp .search-wrap.bl-search-ready{position:relative!important}\n#studioApp .search-wrap.bl-search-ready #globalSearch{padding-left:42px!important;padding-right:128px!important}\n#studioApp .search-wrap.bl-search-ready .bl-lwazi-button{left:9px!important;right:auto!important;top:50%!important;width:36px!important;height:36px!important;transform:translateY(-50%)!important;padding:0!important;border:0!important;box-shadow:none!important;background:transparent!important}\n#studioApp .search-wrap.bl-search-ready .bl-voice-button{left:auto!important;right:84px!important;top:50%!important;width:30px!important;height:30px!important;transform:translateY(-50%)!important;padding:0!important;border:0!important;box-shadow:none!important;background:transparent!important}\n#studioApp .search-wrap.bl-search-ready .bl-camera-button{position:absolute!important;left:auto!important;right:45px!important;top:50%!important;width:30px!important;height:30px!important;transform:translateY(-50%)!important;display:grid!important;place-items:center!important;padding:0!important;border:0!important;border-radius:50%!important;outline:0!important;box-shadow:none!important;background:transparent!important;color:inherit!important;cursor:pointer!important;z-index:6!important}\n#studioApp .search-wrap.bl-search-ready .bl-booth-symbol{display:grid!important;place-items:center!important;width:22px!important;height:22px!important;margin:0!important;font:500 22px/1 system-ui,sans-serif!important;white-space:nowrap!important}\n#studioApp .search-wrap.bl-search-ready .bl-booth-symbol img,#studioApp .search-wrap.bl-search-ready .bl-booth-symbol svg{position:static!important;display:block!important;width:21px!important;height:21px!important;max-width:21px!important;max-height:21px!important;object-fit:contain!important}\n#studioApp .search-wrap.bl-search-ready .bl-search-clear{left:auto!important;right:7px!important;top:50%!important;width:30px!important;height:30px!important;transform:translateY(-50%)!important}\n#studioApp .search-wrap.bl-search-ready .bl-camera-button:focus-visible{outline:2px solid rgba(var(--aura-rgb,183,75,98),.9)!important;outline-offset:1px!important}\n@media(max-width:700px){#studioApp .search-wrap.bl-search-ready #globalSearch{padding-left:42px!important;padding-right:112px!important}#studioApp .search-wrap.bl-search-ready .bl-lwazi-button{left:5px!important}#studioApp .search-wrap.bl-search-ready .bl-voice-button{right:76px!important}#studioApp .search-wrap.bl-search-ready .bl-camera-button{right:40px!important}#studioApp .search-wrap.bl-search-ready .bl-search-clear{right:3px!important;width:26px!important}}\n";
    document.head.appendChild(style);
    document.head.appendChild(lwaziUiStyle);
  }catch(e){console.warn('[BIGLWA] discovery search unavailable:',e)}
})();
