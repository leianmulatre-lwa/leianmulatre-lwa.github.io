(() => {
  if (window.__biglwaModulePagesReady) return;
  window.__biglwaModulePagesReady = true;

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const main = $('.main');
  if (!main) return;

  const style = document.createElement('style');
  style.id = 'biglwa-module-pages-style';
  style.textContent = `
    .module-workspace[hidden]{display:none!important}
    .main.module-view>.hero,.main.module-view>.masonry,.main.module-view>.site-policy-footer{display:none!important}
    .module-workspace{position:relative;z-index:4;min-height:calc(100vh - 66px);padding:34px clamp(18px,4vw,54px) 110px;background:linear-gradient(180deg,rgba(246,240,233,.94),rgba(239,231,223,.97));color:#272321}
    .module-shell{max-width:1120px;margin:0 auto}
    .module-top{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:26px}
    .module-back{border:1px solid #d8cec5;background:rgba(255,255,255,.68);border-radius:999px;padding:9px 14px;font:600 11px/1 system-ui;letter-spacing:.02em;color:#3a3430;cursor:pointer}
    .module-back:hover{background:#fff}
    .module-route{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#8b8179}
    .module-heading{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:end;padding-bottom:22px;border-bottom:1px solid #d9d0c8}
    .module-heading h1{margin:0;font:500 clamp(34px,6vw,66px)/.95 Georgia,serif;letter-spacing:-.04em}
    .module-heading p{max-width:660px;margin:12px 0 0;font-size:13px;line-height:1.6;color:#6e655f}
    .module-badge{align-self:start;border:1px solid #d8cec5;border-radius:999px;padding:8px 11px;font-size:9px;letter-spacing:.1em;text-transform:uppercase;background:rgba(255,255,255,.56);color:#746a64}
    .module-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(240px,.75fr);gap:14px;margin-top:20px}
    .module-card{border:1px solid #ddd3ca;background:rgba(255,255,255,.58);border-radius:18px;padding:18px;box-shadow:0 10px 30px rgba(55,42,34,.05)}
    .module-card.wide{grid-column:1/-1}.module-card h2{font:600 18px/1.1 Georgia,serif;margin:0 0 6px}.module-card>p{margin:0 0 14px;font-size:11px;line-height:1.55;color:#766c66}
    .module-form{display:grid;gap:8px}.module-form.two{grid-template-columns:1fr 1fr}.module-form.three{grid-template-columns:1.3fr 1fr .8fr}
    .module-input,.module-textarea,.module-select{width:100%;min-width:0;box-sizing:border-box;border:1px solid #d8cec5;background:rgba(255,255,255,.76);border-radius:11px;padding:10px 11px;font:11px/1.35 system-ui;color:#302b28;outline:none}
    .module-textarea{min-height:230px;resize:vertical;line-height:1.65}
    .module-input:focus,.module-textarea:focus,.module-select:focus{border-color:rgba(var(--aura-rgb,216,95,109),.7);box-shadow:0 0 0 3px rgba(var(--aura-rgb,216,95,109),.10)}
    .module-action{border:0;border-radius:11px;background:rgb(var(--aura-rgb,216,95,109));color:var(--aura-button-ink,#fff);padding:10px 13px;font:700 10px/1 system-ui;cursor:pointer}
    .module-action.secondary{background:#2a2725;color:#fff}.module-action.ghost{background:rgba(255,255,255,.65);color:#4f4742;border:1px solid #d8cec5}
    .module-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
    .module-list{display:grid;gap:8px;margin-top:12px}.module-list-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;border:1px solid #dfd6cd;background:rgba(255,255,255,.5);border-radius:13px;padding:11px 12px}.module-list-item b,.module-list-item small{display:block}.module-list-item b{font-size:11px}.module-list-item small{font-size:9px;color:#857b74;margin-top:3px}.module-list-item button{border:0;background:transparent;color:#8b7e76;font-size:10px;cursor:pointer}
    .module-status{min-height:16px;margin-top:7px;font-size:9px;color:#81766f}.module-status.ok{color:#477650}
    .module-orbit{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.module-orbit-row{border:1px solid #ddd3ca;background:rgba(255,255,255,.52);border-radius:14px;padding:11px}.module-orbit-row header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.module-orbit-row header b{font-size:10px}.module-orbit-row header span{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#292523;color:#fff;font-size:8px;font-weight:800}
    .module-launchers{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.module-launcher{border:1px solid #ddd3ca;background:rgba(255,255,255,.58);border-radius:14px;padding:15px 12px;text-align:left;cursor:pointer}.module-launcher b{display:block;font-family:Georgia,serif;font-size:14px;margin-bottom:4px}.module-launcher small{font-size:9px;color:#81776f;line-height:1.35}
    .module-camera-preview{min-height:270px;border:1px dashed #cfc3ba;border-radius:16px;display:grid;place-items:center;overflow:hidden;background:rgba(255,255,255,.35);color:#938880;font-size:11px;text-align:center;padding:16px}.module-camera-preview img{max-width:100%;max-height:430px;border-radius:12px;display:block}
    .module-chat{height:300px;overflow:auto;display:grid;align-content:start;gap:7px;padding:8px;border:1px solid #ded5cd;border-radius:14px;background:rgba(255,255,255,.36)}.module-bubble{max-width:78%;padding:9px 11px;border-radius:13px;background:#fff;font-size:11px;line-height:1.45}.module-bubble.mine{margin-left:auto;background:#efdad3}
    .module-quiz button{width:100%;text-align:left;margin-top:7px;border:1px solid #d9d0c7;background:rgba(255,255,255,.62);border-radius:11px;padding:10px;font-size:10px;cursor:pointer}.module-quiz button.correct{border-color:#7ea787;background:#edf6ee}.module-quiz button.wrong{border-color:#b98080;background:#f8eaea}
    body.night-mode .module-workspace{background:linear-gradient(180deg,rgba(31,29,28,.97),rgba(25,23,22,.98));color:#f3eee8}.night-mode .module-heading,.night-mode .module-card,.night-mode .module-list-item,.night-mode .module-orbit-row,.night-mode .module-launcher,.night-mode .module-input,.night-mode .module-textarea,.night-mode .module-select,.night-mode .module-chat{border-color:#504943;background:rgba(45,41,39,.78);color:#f4eee8}.night-mode .module-heading p,.night-mode .module-card>p,.night-mode .module-list-item small,.night-mode .module-route,.night-mode .module-status,.night-mode .module-launcher small{color:#b6aaa2}.night-mode .module-back,.night-mode .module-action.ghost{background:#302c2a;border-color:#514a45;color:#eee7e0}.night-mode .module-bubble{background:#3b3633}.night-mode .module-bubble.mine{background:#5a3d3e}
    @media(max-width:850px){.module-grid{grid-template-columns:1fr}.module-card.wide{grid-column:1}.module-launchers{grid-template-columns:repeat(2,minmax(0,1fr))}.module-form.two,.module-form.three{grid-template-columns:1fr}.module-orbit{grid-template-columns:1fr}.module-heading{grid-template-columns:1fr}.module-badge{justify-self:start}}
  `;
  document.head.appendChild(style);

  const workspace = document.createElement('section');
  workspace.id = 'moduleWorkspace';
  workspace.className = 'module-workspace';
  workspace.hidden = true;
  workspace.innerHTML = `<div class="module-shell"><div class="module-top"><button class="module-back" id="moduleBack" type="button">← Studio</button><span class="module-route">BIGLWA / Studio / <b id="moduleRouteName">Module</b></span></div><div id="moduleWorkspaceBody"></div></div>`;
  const footer = $('.site-policy-footer', main);
  if (footer) main.insertBefore(workspace, footer); else main.appendChild(workspace);

  const body = $('#moduleWorkspaceBody');
  const routeName = $('#moduleRouteName');
  const moduleBack = $('#moduleBack');
  const known = new Set(['create','calendar','orbit','feed','connect','camera','diary','stream','library','archive','closet','rooms','room','boards','notes','projects','project','games','learn','didyouknow']);
  const labels = {create:'Create',calendar:'Calendar',orbit:'Orbit',feed:'Feed',connect:'Connect',camera:'Camera',diary:'Diary',stream:'Stream',library:'Library',archive:'Archive',closet:'Closet',rooms:'The Lounge',room:'The Lounge',boards:'Boards',notes:'Quick Notes',projects:'Projects',project:'Projects',games:'Games',learn:'Did You Know?',didyouknow:'Did You Know?'};
  const desc = {create:'Start something and send it to the right part of BIGLWA.',calendar:'A working calendar for events, deadlines, and an optional external sync path.',orbit:'Connect the rest of your internet without making it your identity. Save a path, change it, or open it when you choose.',feed:'Publish a small update to your local Studio feed.',connect:'Find collaborators and keep a small connection list.',camera:'Preview an image from your device before deciding what to do with it.',diary:'A private writing page that autosaves in this browser.',stream:'Plan a screening, talk, radio set, workshop, or live session.',library:'Build a returnable shelf of texts, PDFs, links, cases, and research.',archive:'Record materials worth preserving with enough context to find them again.',closet:'Draft preloved or creative listings before publishing them.',rooms:'A shared-space prototype for conversation and working together.',boards:'Create visual/reference boards with names and context.',notes:'A fast private scratchpad that autosaves.',projects:'Track projects and collaborative work in progress.',games:'Small culture games and learning interactions.',learn:'Browse sourced learning prompts without leaving the Studio.'};

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const readJSON = (k, fallback=[]) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fallback)); } catch { return fallback; } };
  const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const heading = (key, extra='') => `<div class="module-heading"><div><h1>${esc(labels[key] || key)}</h1><p>${esc(desc[key] || 'A working BIGLWA space.')}${extra ? ` <strong>${esc(extra)}</strong>` : ''}</p></div><span class="module-badge">working page</span></div>`;
  const listHtml = (items, type='item') => items.length ? items.map((x,i)=>`<div class="module-list-item"><div><b>${esc(x.title || x.name || x.text || type)}</b><small>${esc(x.meta || x.detail || x.date || '')}</small></div><button type="button" data-remove-item="${i}" aria-label="Remove">remove</button></div>`).join('') : `<div class="module-status">Nothing saved yet.</div>`;

  function renderCollection(key, fields, sample=[]){
    const storage=`biglwaModule_${key}`;
    const items=readJSON(storage,sample);
    const fieldMarkup=fields.map(f=>`<input class="module-input" name="${f.name}" placeholder="${esc(f.placeholder)}" ${f.type?`type="${f.type}"`:''}>`).join('');
    body.innerHTML = heading(key) + `<div class="module-grid"><section class="module-card"><h2>Add</h2><p>Saved locally in this prototype.</p><form class="module-form" id="moduleCollectionForm">${fieldMarkup}<button class="module-action" type="submit">Save</button></form><div class="module-status" id="moduleStatus"></div></section><section class="module-card"><h2>Saved</h2><div class="module-list" id="moduleCollectionList">${listHtml(items,key)}</div></section></div>`;
    const form=$('#moduleCollectionForm',body), list=$('#moduleCollectionList',body), status=$('#moduleStatus',body);
    const render=()=>{const cur=readJSON(storage,[]);list.innerHTML=listHtml(cur,key)};
    form.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(form);const vals=Object.fromEntries(fd.entries());const title=(vals.title||vals.name||'').trim();if(!title){status.textContent='Give it a name first.';return;}const meta=fields.slice(1).map(f=>vals[f.name]).filter(Boolean).join(' · ');const cur=readJSON(storage,[]);cur.unshift({title,meta,date:new Date().toLocaleDateString()});writeJSON(storage,cur);form.reset();status.textContent='Saved.';status.classList.add('ok');render();});
    list.addEventListener('click',e=>{const b=e.target.closest('[data-remove-item]');if(!b)return;const cur=readJSON(storage,[]);cur.splice(Number(b.dataset.removeItem),1);writeJSON(storage,cur);render();});
  }

  function renderCalendar(){
    const storage='biglwaCalendarEvents';
    const items=readJSON(storage,[{title:'Studio review',meta:'Sep 8 · 11:00 AM'},{title:'Project call',meta:'Sep 10 · 3:30 PM'}]);
    const sync=localStorage.getItem('biglwaCalendarSyncPath')||'';
    body.innerHTML=heading('calendar')+`<div class="module-grid"><section class="module-card"><h2>Add event</h2><form class="module-form" id="calendarEventForm"><input class="module-input" name="title" placeholder="Event title"><div class="module-form two"><input class="module-input" type="date" name="date"><input class="module-input" type="time" name="time"></div><button class="module-action" type="submit">Add to calendar</button></form><div class="module-status" id="calendarPageStatus"></div></section><section class="module-card"><h2>Sync path</h2><p>Save a webcal, calendar URL, or .ics path. This stores the path; provider OAuth comes later.</p><input class="module-input" id="calendarPageSync" value="${esc(sync)}" placeholder="webcal://… · calendar URL · .ics path"><div class="module-actions"><button class="module-action" id="calendarPageSave" type="button">Save path</button></div><div class="module-status" id="calendarSyncPageStatus">${sync?'Path saved.':'No path saved.'}</div></section><section class="module-card wide"><h2>Upcoming</h2><div class="module-list" id="calendarPageList">${listHtml(items,'event')}</div></section></div>`;
    const render=()=>{$('#calendarPageList',body).innerHTML=listHtml(readJSON(storage,[]),'event')};
    $('#calendarEventForm',body).addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.currentTarget),title=(fd.get('title')||'').trim(),date=fd.get('date'),time=fd.get('time');if(!title)return;const cur=readJSON(storage,[]);cur.unshift({title,meta:[date,time].filter(Boolean).join(' · ')});writeJSON(storage,cur);e.currentTarget.reset();render();});
    $('#calendarPageList',body).addEventListener('click',e=>{const b=e.target.closest('[data-remove-item]');if(!b)return;const cur=readJSON(storage,[]);cur.splice(Number(b.dataset.removeItem),1);writeJSON(storage,cur);render();});
    $('#calendarPageSave',body).addEventListener('click',()=>{const v=$('#calendarPageSync',body).value.trim();localStorage.setItem('biglwaCalendarSyncPath',v);const cardSync=$('#calendarSyncPath');if(cardSync) cardSync.value=v;$('#calendarSyncPageStatus',body).textContent=v?'Path saved.':'Path cleared.';});
  }

  function renderOrbitPage(){
    const apps=[['instagram','IG','Instagram'],['tiktok','TT','TikTok'],['pinterest','P','Pinterest'],['spotify','SP','Spotify'],['soundcloud','SC','SoundCloud'],['youtube','YT','YouTube'],['drive','GD','Drive'],['calendar','GC','Google Calendar']];
    const links=readJSON('biglwaOrbitLinks',{});
    body.innerHTML=heading('orbit')+`<div class="module-grid"><section class="module-card wide"><h2>Your orbit</h2><p>Paths stay private to this browser in the current build.</p><div class="module-orbit">${apps.map(([k,g,n])=>`<div class="module-orbit-row"><header><b>${n}</b><span>${g}</span></header><input class="module-input" data-orbit-path="${k}" value="${esc(links[k]||'')}" placeholder="Paste profile or app URL"><div class="module-actions"><button class="module-action" type="button" data-orbit-save="${k}">Save</button><button class="module-action ghost" type="button" data-orbit-open="${k}" ${links[k]?'':'disabled'}>Open</button></div></div>`).join('')}</div><div class="module-status" id="orbitPageStatus"></div></section></div>`;
    body.addEventListener('click',function orbitClick(e){const save=e.target.closest('[data-orbit-save]'),open=e.target.closest('[data-orbit-open]');if(save){const k=save.dataset.orbitSave,input=$(`[data-orbit-path="${k}"]`,body),all=readJSON('biglwaOrbitLinks',{});if(input.value.trim())all[k]=input.value.trim();else delete all[k];writeJSON('biglwaOrbitLinks',all);$('#orbitPageStatus',body).textContent='Orbit updated.';$('#orbitPageStatus',body).classList.add('ok');if(typeof window.renderOrbit==='function')window.renderOrbit();openModule('orbit','',false);}if(open){const k=open.dataset.orbitOpen,all=readJSON('biglwaOrbitLinks',{}),url=all[k];if(url){const target=/^https?:\/\//i.test(url)?url:`https://${url}`;window.open(target,'_blank','noopener');}}},{once:false});
  }

  function renderWriting(key){
    const storage=`biglwaDraft_${key}`;
    body.innerHTML=heading(key)+`<div class="module-grid"><section class="module-card wide"><h2>${key==='diary'?'New diary page':'Scratchpad'}</h2><textarea class="module-textarea" id="moduleWritingArea" placeholder="Write here…">${esc(localStorage.getItem(storage)||'')}</textarea><div class="module-status" id="moduleWritingStatus">Private to this browser · autosaves</div></section></div>`;
    const area=$('#moduleWritingArea',body),status=$('#moduleWritingStatus',body);let t;area.addEventListener('input',()=>{status.textContent='Saving…';clearTimeout(t);t=setTimeout(()=>{localStorage.setItem(storage,area.value);status.textContent='Saved locally.';status.classList.add('ok');},250)});
  }

  function renderFeed(){
    const storage='biglwaFeedPosts';
    const seed=[{title:'Maya added to Diaspora Docs',meta:'project update'},{title:'Jules published a closet drop',meta:'community'}];
    const posts=readJSON(storage,seed);
    body.innerHTML=heading('feed')+`<div class="module-grid"><section class="module-card"><h2>Post an update</h2><form class="module-form" id="feedComposer"><textarea class="module-input" style="min-height:96px;resize:vertical" name="text" placeholder="What changed? What are you making?"></textarea><button class="module-action" type="submit">Post</button></form></section><section class="module-card"><h2>Collective feed</h2><div class="module-list" id="feedPageList">${listHtml(posts,'post')}</div></section></div>`;
    const render=()=>{$('#feedPageList',body).innerHTML=listHtml(readJSON(storage,[]),'post')};
    $('#feedComposer',body).addEventListener('submit',e=>{e.preventDefault();const text=(new FormData(e.currentTarget).get('text')||'').trim();if(!text)return;const cur=readJSON(storage,[]);cur.unshift({title:text,meta:'just now · local prototype'});writeJSON(storage,cur);e.currentTarget.reset();render();});
    $('#feedPageList',body).addEventListener('click',e=>{const b=e.target.closest('[data-remove-item]');if(!b)return;const cur=readJSON(storage,[]);cur.splice(Number(b.dataset.removeItem),1);writeJSON(storage,cur);render();});
  }

  function renderConnect(){
    const people=[['Sam','film · LA'],['Noor','law · NYC'],['Ty','design · ATL'],['Imani','research · DC'],['Mika','music · Chicago'],['Ari','archives · LA']];
    const connected=new Set(readJSON('biglwaConnections',[]));
    body.innerHTML=heading('connect')+`<div class="module-grid"><section class="module-card wide"><h2>Find people</h2><input class="module-input" id="connectSearch" placeholder="Search skill, name, or city"><div class="module-list" id="connectPageList"></div></section></div>`;
    const render=(q='')=>{const list=$('#connectPageList',body);list.innerHTML=people.filter(p=>p.join(' ').toLowerCase().includes(q.toLowerCase())).map(([name,meta])=>`<div class="module-list-item"><div><b>${name}</b><small>${meta}</small></div><button type="button" data-connect="${name}">${connected.has(name)?'connected':'connect'}</button></div>`).join('')};render();
    $('#connectSearch',body).addEventListener('input',e=>render(e.target.value));
    $('#connectPageList',body).addEventListener('click',e=>{const b=e.target.closest('[data-connect]');if(!b)return;connected.has(b.dataset.connect)?connected.delete(b.dataset.connect):connected.add(b.dataset.connect);writeJSON('biglwaConnections',[...connected]);render($('#connectSearch',body).value);});
  }

  function renderCamera(){
    body.innerHTML=heading('camera')+`<div class="module-grid"><section class="module-card wide"><h2>Camera roll</h2><div class="module-camera-preview" id="cameraPreview">Choose an image from your device.<br><small>Nothing uploads automatically.</small></div><div class="module-actions"><label class="module-action" style="display:inline-block">Choose image<input id="cameraFile" type="file" accept="image/*" hidden></label></div></section></div>`;
    $('#cameraFile',body).addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;const url=URL.createObjectURL(f);$('#cameraPreview',body).innerHTML=`<img src="${url}" alt="Local preview">`;});
  }

  function renderRoom(){
    const storage='biglwaRoomMessages',messages=readJSON(storage,[{text:'Welcome to the Lounge.',mine:false}]);
    body.innerHTML=heading('rooms')+`<div class="module-grid"><section class="module-card wide"><h2>The Lounge</h2><div class="module-chat" id="roomChat">${messages.map(m=>`<div class="module-bubble ${m.mine?'mine':''}">${esc(m.text)}</div>`).join('')}</div><form class="module-form two" id="roomForm" style="margin-top:8px"><input class="module-input" name="text" placeholder="Say something…"><button class="module-action" type="submit">Send</button></form><div class="module-status">Local prototype — real room sync comes with the backend.</div></section></div>`;
    $('#roomForm',body).addEventListener('submit',e=>{e.preventDefault();const text=(new FormData(e.currentTarget).get('text')||'').trim();if(!text)return;const cur=readJSON(storage,[]);cur.push({text,mine:true});writeJSON(storage,cur);openModule('rooms','',false);});
  }

  function renderGames(){
    body.innerHTML=heading('games')+`<div class="module-grid"><section class="module-card module-quiz"><h2>Culture check</h2><p>Where did hip-hop emerge as a culture in the 1970s?</p><button data-answer="wrong">Brooklyn</button><button data-answer="correct">The Bronx</button><button data-answer="wrong">Harlem</button><div class="module-status" id="moduleQuizStatus"></div></section></div>`;
    $$('.module-quiz [data-answer]',body).forEach(btn=>btn.addEventListener('click',()=>{$$('.module-quiz [data-answer]',body).forEach(x=>x.classList.remove('correct','wrong'));const ok=btn.dataset.answer==='correct';btn.classList.add(ok?'correct':'wrong');$('#moduleQuizStatus',body).textContent=ok?'Correct — the Bronx, New York City.':'Not quite — try again.';}));
  }

  function renderCreate(){
    const mods=['calendar','feed','projects','camera','diary','boards','closet','archive','stream','orbit'];
    body.innerHTML=heading('create')+`<div class="module-grid"><section class="module-card wide"><h2>Choose where this belongs</h2><div class="module-launchers">${mods.map(k=>`<button class="module-launcher" type="button" data-module-launch="${k}"><b>${labels[k]}</b><small>${desc[k]}</small></button>`).join('')}</div></section></div>`;
    body.addEventListener('click',e=>{const b=e.target.closest('[data-module-launch]');if(b)openModule(b.dataset.moduleLaunch);},{once:true});
  }

  function renderLearn(){
    body.innerHTML=heading('learn')+`<div class="module-grid"><section class="module-card wide"><h2>Did you know?</h2><p style="font:500 25px/1.25 Georgia,serif;color:inherit">Culture survives because people document it, teach it, argue with it, and keep context attached.</p><div class="module-list"><div class="module-list-item"><div><b>Source layer</b><small>This page is ready for citations, reading links, and related archive objects.</small></div></div><div class="module-list-item"><div><b>Next card</b><small>Future build: swipe or browse by theme without an engagement-score feed.</small></div></div></div></section></div>`;
  }

  function openModule(rawKey, context='', push=true){
    let key=(rawKey||'').toLowerCase();
    if(key==='room')key='rooms';if(key==='project')key='projects';if(key==='didyouknow')key='learn';
    if(!known.has(key)) key='create';
    main.classList.add('module-view');workspace.hidden=false;routeName.textContent=labels[key]||key;
    if(key==='calendar')renderCalendar();
    else if(key==='orbit')renderOrbitPage();
    else if(key==='diary'||key==='notes')renderWriting(key);
    else if(key==='feed')renderFeed();
    else if(key==='connect')renderConnect();
    else if(key==='camera')renderCamera();
    else if(key==='rooms')renderRoom();
    else if(key==='games')renderGames();
    else if(key==='learn')renderLearn();
    else if(key==='create')renderCreate();
    else if(key==='library')renderCollection('library',[{name:'title',placeholder:'Resource title'},{name:'detail',placeholder:'URL, author, or collection'}],[{title:'Black Visual Culture',meta:'reading shelf'},{title:'Law + Creative Rights',meta:'guides · cases'}]);
    else if(key==='archive')renderCollection('archive',[{name:'title',placeholder:'Archive entry'},{name:'detail',placeholder:'Context, source, date, or medium'}],[{title:'Community flyer collection',meta:'ephemera · context preserved'}]);
    else if(key==='closet')renderCollection('closet',[{name:'title',placeholder:'Item name'},{name:'detail',placeholder:'Price · size · condition'}]);
    else if(key==='boards')renderCollection('boards',[{name:'title',placeholder:'Board name'},{name:'detail',placeholder:'What belongs here?'}],[{title:'My Inspiration',meta:'visual references'}]);
    else if(key==='projects')renderCollection('projects',[{name:'title',placeholder:'Project name'},{name:'detail',placeholder:'Status · collaborators · next step'}],[{title:'City Screens',meta:'community · 12 collaborators'},{title:'Diaspora Docs',meta:'video · 8 collaborators'}]);
    else if(key==='stream')renderCollection('stream',[{name:'title',placeholder:'Broadcast title'},{name:'detail',placeholder:'Date · time · format'}]);
    window.scrollTo({top:0,behavior:'instant'});
    if(push){try{history.pushState({biglwaModule:key},'',`/studio?view=${encodeURIComponent(key)}`)}catch{}}
  }
  window.openBIGLWAModule=openModule;

  function closeModule(push=true){main.classList.remove('module-view');workspace.hidden=true;body.innerHTML='';routeName.textContent='Module';if(push){try{history.pushState({},'', '/studio')}catch{}}}
  moduleBack.addEventListener('click',()=>closeModule());

  document.addEventListener('click',e=>{
    if(e.target.closest('#moduleWorkspace')) return;
    const mobile=e.target.closest('#mobileCreate');
    const trigger=e.target.closest('[data-open],.arrow-btn');
    if(!mobile&&!trigger)return;
    let key=mobile?'create':trigger.dataset.open;
    const card=trigger?.closest('.card');
    const cardKey=card?.id;
    if(!known.has(String(key||'').toLowerCase()) && cardKey) key=cardKey;
    if(!key&&cardKey)key=cardKey;
    if(!key)return;
    e.preventDefault();e.stopImmediatePropagation();openModule(key,trigger?.dataset.open||'');
  },true);

  window.addEventListener('popstate',()=>{const v=new URLSearchParams(location.search).get('view');if(v)openModule(v,'',false);else closeModule(false)});
  const initialView=new URLSearchParams(location.search).get('view');if(initialView)setTimeout(()=>openModule(initialView,'',false),50);
})();
