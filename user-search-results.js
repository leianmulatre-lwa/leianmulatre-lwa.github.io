/* BIGLWA discovery search and Lwazi command assistant. */
(function(){
  try{
    function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
    function hueFor(name){var h=0,s=String(name||'u');for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h%360}
    function avatarText(name,u){var p=String(name||u||'?').trim().split(/\s+/);var a=p[0]?p[0][0]:'?';var b=p.length>1?p[p.length-1][0]:'';return esc((a+b).toUpperCase()||'?')}
    function localUsers(q){var out=[];try{var v=JSON.parse(localStorage.getItem('biglwaUserDirectory')||'[]');if(Array.isArray(v))out=out.concat(v)}catch(e){}if(Array.isArray(window.__biglwaUsers))out=out.concat(window.__biglwaUsers);var seen={};return out.filter(function(u){var key=String(u&&u.username||'').toLowerCase();if(seen[key])return false;if(!key)return false;if(String(u.username||u.name||'').toLowerCase().indexOf(q)==-1)return false;seen[key]=1;return true}).slice(0,8)}
    async function searchUsers(q){var hits=[];try{if(window.BigLWAUserDirectory&&window.BigLWAUserDirectory.searchUsers)hits=await window.BigLWAUserDirectory.searchUsers(q)}catch(e){}if(!hits.length)hits=localUsers(q);return hits.slice(0,8)}
    function userCard(u){var h=hueFor(u.username||u.uid),h2=(h+48)%360;return '<article class="bl-search-card bl-user-card"><div class="bl-user-card-avatar" style="background:linear-gradient(145deg,hsl('+h+',72%,80%),hsl('+h2+',60%,90%));color:hsl('+h+',42%,26%)">'+avatarText(u.name,u.username)+'</div><div class="bl-search-card-body"><span class="bl-search-kicker">BigLWA user</span><h3>'+esc(u.name||u.username)+'</h3><p class="bl-search-muted">@'+esc(u.username)+'</p>'+ (u.bio?'<p>'+esc(u.bio)+'</p>':'')+'<a class="bl-search-go" href="'+esc(u.url||('/'+encodeURIComponent(u.username)))+'">View profile &#8594;</a></div></article>'}
    async function fetchJSON(url){var response=await fetch(url,{headers:{Accept:'application/json'}});if(!response.ok)throw Error('Search source unavailable');return response.json()}
    async function searchWikipedia(q){var url='https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch='+encodeURIComponent(q+'& ((history) OR (politics) OR (culture) OR (film) OR (music))')+'&format=json&origin=*';var data=await fetchJSON(url);return (data.query&&data.query.search||[]).slice(0,5)}
    async function searchBooks(q){var data=await fetchJSON('https://openlibrary.org/search.json?q='+encodeURIComponent(q)+'&limit=6');return (data.docs||[]).slice(0,5)}

    var widgetRoutes={
      journal:'diary',diary:'diary',calendar:'calendar',orbit:'orbit',feed:'feed','my feed':'feed','myfeed':'feed',
      connect:'connect',camera:'camera','photo booth':'camera',booth:'camera',archive:'archive',library:'library',
      books:'library',bookiniz:'library',games:'games','arcade':'games',closet:'closet',clothes:'closet',
      trophies:'trophies',rooms:'rooms',room:'room',boards:'boards',projects:'projects',notes:'notes',
      map:'map',learn:'learn',politics:'politic','did you know':'didyouknow',lwazi:'games',tools:'tools','lwazi games':'games'
    };
    function normalizeCommand(raw){return String(raw||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()}
    function routeCommand(raw){var text=normalizeCommand(raw);var match=null;Object.keys(widgetRoutes).forEach(function(alias){if(!match&&(text==='take me to '+alias||text==='open '+alias||text==='go to '+alias||text===alias+' open'||text==='show me '+alias))match=widgetRoutes[alias]});if(match)return match;if(/(^|\s)(journal|diary)(\s|$)/.test(text))return 'diary';return null}
    function goRoute(route){
      close();
      var control=document.querySelector('[data-open="'+route+'"],button[data-widget-route="'+route+'"]');
      if(control){
        control.click();
        return;
      }
      window.location.hash=route;
      setTimeout(function(){
        var el=document.getElementById(route)||document.querySelector('[data-widget-route="'+route+'"]');
        if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',block:'center'});
      },80);
    }

    var overlay=null;
    function close(){if(overlay){var o=overlay;overlay=null;document.removeEventListener('keydown',onKey,true);document.removeEventListener('mousedown',outside,true);o.remove()}}
    function onKey(e){if(e.key==='Escape')close()}
    function outside(e){if(overlay&&!overlay.querySelector('.bl-search-panel').contains(e.target))close()}
    function resultCard(type,title,meta,body,url){return '<article class="bl-search-card"><div class="bl-search-card-body"><span class="bl-search-kicker">'+esc(type)+'</span><h3>'+esc(title)+'</h3>'+ (meta?'<p class="bl-search-muted">'+esc(meta)+'</p>':'')+(body?'<p>'+esc(body.replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim())+'</p>':'')+'<a class="bl-search-go" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Open &#8594;</a></div></article>'}
    function section(title,id,cards){if(!cards)return '';var items=Array.isArray(cards)?cards:[cards];return '<section class="bl-search-section"><h2>'+esc(title)+'</h2><div class="bl-search-grid">'+items.join('')+'</div></section>'}
    async function openPanel(raw,assistantOnly){var q=String(raw==null?'':raw).trim();if(!q)return;if(!assistantOnly)assistantOnly=false;var route=routeCommand(q);if(route){goRoute(route);return}
    close();overlay=document.createElement('div');overlay.className='bl-search-overlay';overlay.setAttribute('role','presentation');
    overlay.innerHTML='<div class="bl-search-panel" role="dialog" aria-modal="true" aria-label="Lwazi discovery search"><div class="bl-search-head"><div><span class="bl-search-assistant">Lwazi</span><h1>Search beyond the surface</h1></div><button type="button" class="bl-search-close" aria-label="Close search results">&#10005;</button></div><div class="bl-search-query"><input type="search" value="'+esc(q.replace(/^ask lwazi\s*/i,''))+'" aria-label="Ask Lwazi or search BigLWA"><button type="button" class="bl-search-submit">Search</button></div><div class="bl-search-loading">Searching people, books, cinema, history, politics, and BigLWA notes...</div></div>';
    document.body.appendChild(overlay);overlay.querySelector('.bl-search-close').addEventListener('click',close);
    var input=overlay.querySelector('.bl-search-query input');var submit=overlay.querySelector('.bl-search-submit');
    submit.onclick=function(){var next=input.value.trim();if(next)openPanel(next,false)};input.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();submit.click()}});
    document.addEventListener('keydown',onKey,true);setTimeout(function(){document.addEventListener('mousedown',outside,true)},0);var loading=overlay.querySelector('.bl-search-loading');

    var clean=q.replace(/^@/,'').replace(/^ask lwazi\s*/i,'').trim(),lc=clean.toLowerCase();
    var userPromise=searchUsers(lc).then(function(hits){return hits.map(userCard).join('')}).catch(function(){return ''});
    var bookPromise=searchBooks(clean).then(function(items){return items.map(function(b){return resultCard('Book',b.title||(b.title_suggest||'Untitled'),(b.author_name||[]).slice(0,2).join(', ')||'',String((b.first_publish_year||b.publish_year||[]).join ? ((b.first_publish_year||'')) : ''),'https://openlibrary.org'+(b.key||''))}).join('')}).catch(function(){return ''});
    var wikiPromise=searchWikipedia(clean).then(function(items){return items.map(function(w){return resultCard(/film|movie|cinema/i.test(clean)?'Film & history':'Public figure, history & politics',w.title,'','', 'https://en.wikipedia.org/wiki/'+encodeURIComponent(String(w.title).replace(/ /g,'_')))}) .join('')}).catch(function(){return ''});

    var socialCards=[
      resultCard('Social notes','Tumblr results for '+clean,'Tumblr','Notes and communities beyond mainstream publishing','https://www.tumblr.com/search/'+encodeURIComponent(clean)),
      resultCard('Social notes','X / Bluesky search for '+clean,'Public posts','Short-form political, cultural, and creative posts','https://bsky.app/search?q='+encodeURIComponent(clean))
    ].join('');
    var motion=[
      resultCard('Movies','Film discovery for '+clean,'Cinema, moving-image history & archives','Explore filmmakers, cinema history, and marginalized film archives','https://www.google.com/search?tbm=isch&q='+encodeURIComponent(clean+' film cinema archive')),
      resultCard('Movies','Internet Archive films for '+clean,'Moving-image archive','Search historical and independent film collections','https://archive.org/search?query='+encodeURIComponent(clean+' mediatype:movies')),
      resultCard('Movies','Wikipedia cinema search for '+clean,'Public film history','Search cinema, directors, movements, and film history','https://en.wikipedia.org/w/index.php?search='+encodeURIComponent(clean+' film movie cinema'))
    ].join('');
    var lwaziCards=[
      '<article class="bl-search-card bl-lwazi-card"><div class="bl-search-card-body"><span class="bl-search-kicker">Ask Lwazi</span><h3>'+esc(clean)+'</h3><p>Try a command: “take me to journal,” “open archive,” “go to orbit,” or “show politics.”</p><button type="button" class="bl-search-command">Run as a Lwazi command</button></div></article>'
    ].join('');

    Promise.all([userPromise,bookPromise,wikiPromise]).then(function(values){
      var html=section('BigLWA users','users',values[0]?values[0]:[]);
      html+=section('Books','books',values[1]?values[1]:[]);
      html+=section('Cinema, public figures, politics & history','research',values[2]?values[2]:[]);
      if(motion)html+=section('Movies & moving images','movies',motion);
      html+=section('Tweets, Tumblr notes & social search','social',socialCards);
      html+=section('Lwazi assistant','assistant',lwaziCards);
      if(!html.trim())html='<p class="bl-search-empty">Lwazi could not reach the research sources. Try a broader search.</p>';
      loading.outerHTML=html;var cmd=overlay&&overlay.querySelector('.bl-search-command');if(cmd)cmd.onclick=function(){openPanel(clean,true)};
      input.focus();
    }).catch(function(){if(loading)loading.textContent='Search results could not be completed.'});
  }
    window.__biglwaUserCards=openPanel;window.__biglwaUserCardsClose=close;
    function installLwaziButton(){var search=document.getElementById('globalSearch');if(!search)return;var wrap=search.closest('.search-wrap')||search.parentNode;if(!wrap)return;if(wrap.querySelector('.bl-lwazi-button'))return;var button=document.createElement('button');button.type='button';button.className='bl-lwazi-button';button.setAttribute('aria-label','Ask Lwazi assistant');button.title='Ask Lwazi';button.innerHTML='<img src="/assets/lwazi-rainbow-stitch.svg" alt="" aria-hidden="true">';button.onclick=function(){var q=search.value.trim();openPanel(q||'What can Lwazi help me explore?',true)};wrap.insertBefore(button,search.nextSibling);search.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();openPanel(search.value.trim(),false)}})}
    function bindFallback(){installLwaziButton();setTimeout(installLwaziButton,500)}
    bindFallback();window.addEventListener('load',bindFallback);new MutationObserver(bindFallback).observe(document.documentElement,{childList:true,subtree:true});
    var style=document.createElement('style');style.textContent='.bl-search-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-start;justify-content:center;padding:72px 16px 32px;box-sizing:border-box;background:rgba(26,16,14,.48);backdrop-filter:blur(5px);overflow:auto}.bl-search-panel{width:min(980px,100%);max-height:calc(100vh - 104px);overflow-y:auto;padding:22px;border:1px solid #ddd4ca;border-radius:20px;background:#fffaf3;color:#272321;box-shadow:0 30px 70px rgba(30,18,14,.38)}.bl-search-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.bl-search-assistant{font:800 11px/1 system-ui;text-transform:uppercase;letter-spacing:.16em;color:#a84a5d}.bl-search-head h1{margin:5px 0 14px;font:400 27px/1.05 Georgia,serif}.bl-search-close,.bl-search-submit,.bl-search-command{border:1px solid #d9d0c6;border-radius:10px;background:#fff;color:#342d29;cursor:pointer}.bl-search-close{width:34px;height:34px}.bl-search-query{display:flex;gap:8px;margin-bottom:18px}.bl-search-query input{flex:1;min-width:0;border:1px solid #d9d0c6;border-radius:11px;padding:11px 13px;background:white;color:inherit;font:14px system-ui}.bl-search-submit{padding:0 16px;font-weight:700}.bl-search-loading,.bl-search-empty{padding:28px;text-align:center;color:#81766e}.bl-search-section{margin-top:18px}.bl-search-section h2{margin:0 0 10px;font:700 13px/1 system-ui;text-transform:uppercase;letter-spacing:.08em;color:#756a62}.bl-search-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}.bl-search-card{display:flex;box-sizing:border-box;min-height:120px;border:1px solid #e4dbd0;border-radius:14px;background:rgba(255,255,255,.78);overflow:hidden}.bl-user-card-avatar{display:grid;place-items:center;flex:0 0 52px;height:52px;margin:12px 0 12px 12px;border-radius:15px;font:800 17px/1 Georgia}.bl-search-card-body{display:flex;flex-direction:column;gap:4px;padding:12px 14px;min-width:0}.bl-search-card h3{margin:0;font-size:14px;line-height:1.25}.bl-search-card p{margin:2px 0;font-size:12px;line-height:1.42;color:#574f49}.bl-search-kicker{font:800 9px/1 system-ui;text-transform:uppercase;letter-spacing:.12em;color:#9a5c68}.bl-search-muted{color:#81766e!important}.bl-search-go{margin-top:auto;padding-top:8px;font-weight:700;font-size:12px;color:#8b4051;text-decoration:none}.bl-lwazi-card{border-color:#d8a9b4;background:linear-gradient(135deg,#fff8fb,#fffaf3)}.bl-search-command{margin-top:8px;padding:8px 10px;font-size:12px;font-weight:700}.bl-lwazi-button{position:absolute;right:-42px;top:50%;width:32px;height:32px;transform:translateY(-50%);display:grid;place-items:center;border:0;border-radius:50%;background:transparent;cursor:pointer}.bl-lwazi-button img{width:30px;height:30px;object-fit:contain}.search-wrap{position:relative}@media(max-width:700px){.bl-search-overlay{padding:12px}.bl-search-panel{max-height:calc(100vh - 24px);padding:16px}.bl-search-head h1{font-size:21px}.bl-search-grid{grid-template-columns:1fr}.bl-lwazi-button{position:absolute;right:-38px}}body.night-mode .bl-search-panel{background:#241f1d;border-color:#4a423c;color:#f2ece6}body.night-mode .bl-search-card{background:#322c29;border-color:#514a45}body.night-mode .bl-search-card p{color:#d9cfc5}body.night-mode .bl-search-query input,body.night-mode .bl-search-close,body.night-mode .bl-search-submit,body.night-mode .bl-search-command{background:#37302d;border-color:#514a45;color:#f1ebe5}';
    document.head.appendChild(style);
  }catch(e){console.warn('[BIGLWA] discovery search unavailable:',e)}
})();
