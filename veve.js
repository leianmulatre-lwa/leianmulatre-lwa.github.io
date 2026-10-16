/* Veve — Big LWA's opt-in discovery wall.
 * Public posts are queried from Firestore; there is no fabricated engagement,
 * rented advertisement or unauthorized private Orbit/Sqwib/room content. */
(()=>{
  if(window.BigLWAVeve)return;
  const CDN='https://www.gstatic.com/firebasejs/12.18.0/';
  const groups=['politc','photos','sqwibs','pinterest','rooms','games','books','closet','mcm','ads'];
  const names={photos:'collective photos',sqwibs:'sqwibs',pinterest:'pinterest vibe',rooms:'the lounge',politc:'politc',mcm:'mcm',games:'arcade',books:'books',closet:'closet',ads:'sponsored'};
  const route={rooms:'rooms',politc:'politc',mcm:'politc',games:'games',books:'library',closet:'closet',pinterest:'boards',photos:'feed',sqwibs:'notes'};
  const e=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl=v=>{try{const p=new URL(String(v||''));return p.protocol==='https:'?p.href:''}catch{return ''}};
  const time=x=>x?.toMillis?.()||Date.parse(x||'')||0;
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const order=arr=>[...new Set(arr.filter(x=>groups.includes(x)))].concat(groups.filter(x=>!arr.includes(x)));
  const defaults={sections:groups,enabled:groups.filter(x=>x!=='ads'),sort:'latest'};
  const state={items:[],sqwibs:[],resqwibs:[],loadError:'',prefs:null,uid:'',loading:false,mounted:null,renderGen:0,showSettings:false,active:'all',sourceCounts:new Map()};
  let firebasePromise=null;
  async function fb(){
    if(!firebasePromise)firebasePromise=Promise.all([
      import(CDN+'firebase-app.js'),import(CDN+'firebase-auth.js'),import(CDN+'firebase-firestore.js')
    ]).then(([a,b,f])=>{
      const app=a.getApps()[0];if(!app)throw Error('BIG LWA account services are still loading.');
      return {auth:b.getAuth(app),db:f.getFirestore(app),...f};
    }).catch(err=>{firebasePromise=null;throw err});
    const f=await firebasePromise;await f.auth.authStateReady();return f;
  }
  function localKey(){return 'biglwaVevePreferences:v1:'+(state.uid||'guest')}
  function validPrefs(p){
    const settings=p&&typeof p==='object'?p:{};
    return {
      sections:order(Array.isArray(settings.sections)?settings.sections:defaults.sections),
      enabled:[...new Set(Array.isArray(settings.enabled)?settings.enabled.filter(x=>groups.includes(x)):defaults.enabled)],
      sort:['latest','popular','daily'].includes(settings.sort)?settings.sort:'latest'
    };
  }
  async function restorePrefs(){
    try{const f=await fb();state.uid=f.auth.currentUser?.uid||''}catch{state.uid=''}
    let local;try{local=JSON.parse(localStorage.getItem(localKey())||'null')}catch{}
    state.prefs=validPrefs(local);
    if(state.uid){
      try{
        const f=await fb(),snap=await f.getDoc(f.doc(f.db,'users',state.uid));
        if(snap.exists()&&snap.data().vevePrefs){
          state.prefs=validPrefs(snap.data().vevePrefs);
          localStorage.setItem(localKey(),JSON.stringify(state.prefs));
        }
      }catch{/* Local choices remain usable while account preferences are unavailable. */}
    }
  }
  async function savePrefs(){
    state.prefs=validPrefs(state.prefs);
    try{localStorage.setItem(localKey(),JSON.stringify(state.prefs))}catch{}
    if(!state.uid)return 'Saved on this device. Sign in to sync preferences.';
    try{
      const f=await fb();
      if(f.auth.currentUser?.uid!==state.uid)throw Error('Account changed.');
      await f.setDoc(f.doc(f.db,'users',state.uid),{vevePrefs:state.prefs},{merge:true});
      return 'Veve preferences saved to your Big LWA account.';
    }catch{return 'Saved on this device. Account syncing is unavailable right now.'}
  }
  function score(p){
    const keys=['likeCount','likes','saves','saveCount','resqwibCount','commentCount','views'];
    return keys.reduce((n,key)=>n+Math.max(0,Number(p[key])||0),0);
  }
  function rank(list){
    const sort=state.prefs?.sort||'latest';
    return [...list].sort((a,b)=>{
      if(sort==='popular'){const delta=score(b)-score(a);if(delta)return delta;}
      if(sort==='daily'){
        const day=new Date().toISOString().slice(0,10);
        const hash=x=>{let h=2166136261;for(const c of day+String(x.id||'')){h=Math.imul(h^c.charCodeAt(0),16777619)}return h>>>0;};
        return hash(a)-hash(b);
      }
      const dateDiff=time(b.createdAt||b.sourceCreatedAt)-time(a.createdAt||a.sourceCreatedAt);
      return dateDiff||String(a.id||'').localeCompare(String(b.id||''));
    });
  }
  async function load(){
    if(state.loading)return;state.loading=true;state.loadError='';
    try{
      const f=await fb();
      const rows=await f.getDocs(f.query(f.collection(f.db,'posts'),f.where('state','==','approved'),f.limit(250)));
      // Query public posts only. Do not load private board data into discovery.
      state.items=rows.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.state==='approved'&&p.visibility!=='private'&&p.veveOptOut!==true);
      state.sourceCounts=new Map();
      for(const p of state.items){
        if(String(p.source||'').toLowerCase()!=='pinterest')continue;
        const key=String(p.sourcePostId||p.sourceUrl||'').trim();
        const owner=String(p.uid||'').trim();
        if(key&&owner){
          if(!state.sourceCounts.has(key))state.sourceCounts.set(key,new Set());
          state.sourceCounts.get(key).add(owner);
        }
      }
    }catch(err){state.items=[];state.loadError='Collective photos could not load: '+(err?.message||'Try refreshing');}
    try{
      if(window.BigLWASqwibs){
        const pub=await window.BigLWASqwibs.publicSqwibs(70);
        state.sqwibs=pub;
        const resh=await window.BigLWASqwibs.publicResqwibs().catch(()=>[]);
        state.resqwibs=resh.filter(r=>pub.some(p=>p.id===r.sourceId&&p.allowResqwib===true));
      }else{state.sqwibs=[];state.resqwibs=[]}
    }catch(err){state.sqwibs=[];state.resqwibs=[];state.loadError+=(state.loadError?' ':'')+'Sqwib discovery is not available until its security rules are published.';}
    state.loading=false;
  }
  const videoFile=x=>/\.(mp4|webm|m4v|mov)(?:\?|#|$)/i.test(String(x||''));
  function video(post){
    const pieces=Array.isArray(post.mediaItems)?post.mediaItems:[];
    return [post.videoUrl,post.video_url,post.mediaUrl,...pieces.filter(x=>x&&(x.isPicture===false||/^video/i.test(x.mediaType||x.type||''))).map(x=>x.url),
      ...(Array.isArray(post.imageUrls)?post.imageUrls:[])].map(safeUrl).find(x=>videoFile(x))||'';
  }
  // Match Collective Feed's managed Orbit key resolution, not just imageUrl.
  // Only already approved public posts are passed into these renderers.
  const orbitBase='https://biglwa-instagram-api.leianmulatre-284.workers.dev';
  const orbitFromKey=key=>{
    const clean=String(key||'').replace(/^orbit\//,'');
    return /^[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+$/.test(clean)?orbitBase+'/media/orbit/'+clean:'';
  };
  function picture(post){
    const pieces=Array.isArray(post.mediaItems)?post.mediaItems:[];
    const urls=[
      ...pieces.flatMap(x=>x?[x.url,x.thumbnailUrl,orbitFromKey(x.key)]:[]),
      ...(Array.isArray(post.imageUrls)?post.imageUrls:[]),
      ...(Array.isArray(post.imageKeys)?post.imageKeys.map(orbitFromKey):[]),
      post.imageUrl,orbitFromKey(post.imageUrlKey),post.thumbnailUrl
    ];
    const usable=urls.map(safeUrl).filter(x=>x&&!videoFile(x));
    // Instagram/Pinterest Orbit imports must use the durable copy, not a
    // short-lived provider CDN URL that looks valid but fails when displayed.
    if(post?.orbitImported&&['instagram','pinterest'].includes(String(post.source||'').toLowerCase())){
      const managed=usable.find(x=>{
        try{const u=new URL(x);return u.origin===orbitBase&&/^\/media\/orbit\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+$/.test(u.pathname)}
        catch{return false}
      });
      return managed||'';
    }
    return usable[0]||'';
  }
  function videoEmbed(post){
    const link=safeUrl(post.sourceUrl||post.permalink||'');
    try{
      const u=new URL(link);
      if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(u.hostname)){
        const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.pathname.startsWith('/shorts/')?u.pathname.split('/')[2]:u.searchParams.get('v');
        if(/^[a-zA-Z0-9_-]{11}$/.test(id||''))return 'https://www.youtube-nocookie.com/embed/'+id;
      }
      if(u.hostname==='www.tiktok.com'||u.hostname==='tiktok.com'||u.hostname==='m.tiktok.com'){
        const m=u.pathname.match(/\/video\/(\d{9,25})/);
        if(m)return 'https://www.tiktok.com/player/v1/'+m[1];
      }
      if(u.hostname==='www.instagram.com'||u.hostname==='instagram.com'){
        const m=u.pathname.match(/^\/(reel|p|tv)\/([A-Za-z0-9_-]+)\/?/);
        if(m&&(m[1]!=='p'||post.isVideo===true||(post.mediaItems||[]).some(x=>x?.isPicture===false||/^video/i.test(x?.mediaType||''))))return 'https://www.instagram.com/'+m[1]+'/'+m[2]+'/embed/';
      }
      if(u.hostname==='vimeo.com'){
        const id=u.pathname.split('/').filter(Boolean)[0];
        if(/^\d+$/.test(id||''))return 'https://player.vimeo.com/video/'+id;
      }
    }catch{}
    return '';
  }
  function usage(post){
    if(String(post.source||'').toLowerCase()!=='pinterest')return '';
    const ids=state.sourceCounts.get(String(post.sourcePostId||post.sourceUrl||''))?.size||0;
    // Counts are based on the loaded public sample, not a claim about all members.
    return ids>=10?(Math.floor(ids/10)*10)+'+ public accounts':ids>0?'under 10 public accounts':'';
  }
  function sectionBar(key,extra=''){
    return '<div class="veve-section-heading"><h2>'+e(names[key])+'</h2>'+extra+'</div>';
  }
  function photoMarkup(post,section){
    const url=picture(post),direct=video(post),embed=videoEmbed(post),src=String(post.source||'BIG LWA').toLowerCase();
    if(!url&&!direct&&!embed)return '';
    const label=src==='pinterest'?'Pinterest':src==='instagram'?'Instagram':src==='tiktok'?'TikTok':src==='facebook'?'Facebook':src==='youtube'?'YouTube':'Big LWA';
    const caption=String(post.caption||post.title||'').slice(0,240),link=safeUrl(post.sourceUrl||post.permalink);
    const clip=Boolean(direct||embed),single=(Array.isArray(post.mediaItems)?post.mediaItems.length<=1:true);
    const ratio=Number(post.aspectRatio||post.videoAspectRatio||0);
    const match=single&&(!ratio||ratio>.15&&ratio<5);
    const videoMarkup=direct&&match
      ?'<video class="veve-inline-video" src="'+e(direct)+'" '+(url?'poster="'+e(url)+'" ':'')+'autoplay muted loop playsinline controls preload="metadata"></video>'
      :url?'<img src="'+e(url)+'" loading="lazy" decoding="async" alt="'+e(caption||'Published collective media')+'">':
         '<div class="veve-video-fallback">Video preview</div>';
    return '<article class="veve-tile veve-photo" data-veve-origin="'+e(src)+'" data-veve-post="'+e(post.id)+'">'+
      '<div class="veve-photo-frame">'+videoMarkup+
      '<span class="veve-provider">'+e(label)+'</span>'+
      '<button type="button" class="veve-media-open" data-veve-view="'+e(post.id)+'" aria-label="'+(clip?'Watch video in Veve':'Enlarge media in Veve')+'" title="Preview here">'+(clip?'▶':'↗')+'</button>'+
      '<span class="veve-lights"><button type="button" data-veve-view="'+e(post.id)+'" aria-label="Enlarge or play media" title="View in Veve"></button></span>'+
      '</div>'+
      ((usage(post)||src==='pinterest'&&link)?'<div class="veve-photo-details">'+
        (usage(post)?'<span class="veve-usage">'+e(usage(post))+' using this Pin</span>':'')+
        (src==='pinterest'&&link?'<a class="veve-source-credit" href="'+e(link)+'" target="_blank" rel="noopener noreferrer">Original Pinterest Pin ↗</a>':'')+
        '</div>':'')+
      '</article>';
  }
  function sqwibMarkup(p,reshared=false){
    const allowed=p.allowResqwib===true,own=state.uid&&p.uid===state.uid;
    const iResqwibbed=!!state.uid&&state.resqwibs.some(r=>r.uid===state.uid&&r.sourceId===p.id);
    return '<article class="veve-tile veve-note" data-veve-sqwib="'+e(p.id)+'">'+
      '<div class="veve-note-head"><span>sqwib · public</span>'+(reshared?'<b>resqwibbed</b>':'')+'</div>'+
      '<p>'+e(String(p.text||'').slice(0,1200))+'</p>'+
      '<div class="veve-note-actions">'+
      (allowed&&!own?'<button type="button" data-veve-reshare="'+e(p.id)+'" aria-label="'+(iResqwibbed?'Undo resqwib':'Resqwib this note')+'">↻ '+(iResqwibbed?'undo resqwib':'resqwib')+'</button>':
       own?'<span>your sqwib</span>':'<span>resqwibs disabled by author</span>')+'</div></article>';
  }
  function quickCard(kind,title,detail,destination,footer=''){
    return '<article class="veve-tile veve-resource veve-resource-'+e(kind)+'"><span class="veve-eyebrow">'+e(kind)+'</span>'+
      '<h3>'+e(title)+'</h3><p>'+e(detail)+'</p>'+
      (destination?'<button type="button" class="veve-card-hit" data-veve-route="'+e(destination)+'" aria-label="Explore '+e(title)+' in Big LWA"></button>':'')+
      (footer?'<small>'+e(footer)+'</small>':'')+'</article>';
  }
  function nextFederalElection(){
    const now=new Date();let year=now.getFullYear();
    if(year%2!==0)year++;
    const election=y=>{
      const d=new Date(y,10,1,12,0,0);
      const firstMonday=1+((1-d.getDay()+7)%7);
      return new Date(y,10,firstMonday+1,12,0,0);
    };
    let date=election(year);
    if(now>date)date=election(year+=2);
    const days=Math.max(0,Math.ceil((date-now)/86400000));
    return {days,label:date.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'})};
  }
  function blocks(key){
    if(key==='photos'){
      const available=rank(state.items).filter(p=>picture(p)||video(p)||videoEmbed(p));
      const photos=[...available.filter(p=>p.veveFeatured===true),...available.filter(p=>p.veveFeatured!==true)].slice(0,80);
      return photos.length?photos.map(p=>photoMarkup(p,key)).join(''):quickCard('photos','Your collective is taking shape','Only actually published images appear here. Private Orbit imports and drafts remain in Archive.','feed');
    }
    if(key==='pinterest'){
      const rows=rank(state.items).filter(p=>String(p.source||'').toLowerCase()==='pinterest'&&picture(p)).slice(0,16);
      return rows.length?rows.map(p=>photoMarkup(p,key)).join(''):quickCard('pinterest','A Pinterest-inspired discovery wall','Connect Pinterest in Orbit and publish chosen Pins before they can appear here.','boards');
    }
    if(key==='sqwibs'){
      const allowed=new Map(state.sqwibs.map(p=>[p.id,p]));
      const notes=rank(state.sqwibs).slice(0,16).map(p=>sqwibMarkup(p));
      const reshares=state.resqwibs.slice(0,8).map(r=>allowed.get(r.sourceId)).filter(p=>p?.allowResqwib).map(p=>sqwibMarkup(p,true));
      return notes.concat(reshares).join('')||quickCard('sqwib','No public Sqwibs yet','Write a private Sqwib, then explicitly publish it and decide whether resqwibing is allowed.','notes');
    }
    if(key==='rooms')return quickCard('lounge','the lounge','Browse the room list and join a conversation. Current room messages are local prototypes, not verified live streams.','rooms','Live status will appear only when real room synchronization is available.');
    if(key==='politc'){
      const x=nextFederalElection();
      return quickCard('politc',x.days+' days until the next U.S. federal general election',x.label+' · Election dates and eligibility vary by jurisdiction. See politc for resources.','politc');
    }
    if(key==='mcm'){
      const posts=rank(state.items).filter(p=>String(p.source||'').toLowerCase()==='mcm'&&picture(p)).slice(0,5);
      return posts.map(p=>photoMarkup(p,key)).join('')||quickCard('mcm','mcm community picks','Nominations live in politc. No rankings or winners are claimed until real nominations are available.','politc');
    }
    if(key==='games')return [
      {label:'2048',id:'2048',image:'/assets/arcade/2048.svg',description:'Merge matching tiles to reach 2048.'},
      {label:'crossword',id:'crossword',image:'/assets/arcade/crossword.svg',description:'Fill the grid from the clues.'},
      {label:'culture quiz',id:'culture',image:'/assets/culture-quiz-cubes.png',description:'Explore the culture quiz in Arcade.'}
    ].map(game=>
      '<article class="veve-tile veve-game">'+
      '<button class="veve-game-cover" type="button" data-veve-game="'+e(game.id)+'" aria-label="Play '+e(game.label)+' in Big LWA">'+
      '<img loading="lazy" decoding="async" src="'+e(game.image)+'" alt="" aria-hidden="true">'+
      '<span class="veve-game-cover-title">'+e(game.label)+'</span>'+
      '</button>'+
      '<div class="veve-game-info"><span class="veve-eyebrow">arcade · playable here</span>'+
      '<h3>'+e(game.label)+'</h3><p>'+e(game.description)+'</p>'+
      '<button type="button" data-veve-game="'+e(game.id)+'">Play here ▶</button></div></article>').join('');
    if(key==='books'){
      const bibliography=[
        ['Frankenstein','Mary Shelley','https://www.gutenberg.org/ebooks/84'],
        ['Narrative of the Life of Frederick Douglass','Frederick Douglass','https://www.gutenberg.org/ebooks/23'],
        ['Pride and Prejudice','Jane Austen','https://www.gutenberg.org/ebooks/1342']
      ];
      return bibliography.map(b=>'<article class="veve-tile veve-book"><span class="veve-eyebrow">public-domain reading pick</span><h3>'+e(b[0])+'</h3><p>'+e(b[1])+'</p><button type="button" data-veve-reader="'+e(b[2])+'">Preview reading ↗</button></article>').join('');
    }
    if(key==='closet')return quickCard('closet','community closet','Browse your closet space. Member listings are not treated as publicly available until their owners choose to publish them.','closet');
    if(key==='ads')return quickCard('sponsored','No sponsored placements','Veve will identify paid placements clearly. Nothing is labeled as sponsored until a genuine approved campaign exists.',null);
    return '';
  }
  function settingsMarkup(){
    if(!state.showSettings)return '';
    const p=state.prefs||validPrefs(null);
    return '<div class="veve-settings"><div class="veve-settings-title"><h2>shape your veve</h2><p>Arrange sections and choose what appears. Changes follow your account when syncing is available.</p></div>'+
      '<div class="veve-settings-grid">'+p.sections.map((key,i)=>
        '<div class="veve-setting-row"><label><input type="checkbox" data-veve-enabled="'+e(key)+'" '+(p.enabled.includes(key)?'checked':'')+'><span>'+e(names[key])+'</span></label>'+
        '<div class="veve-move"><button type="button" data-veve-move="'+e(key)+'" data-dir="-1" '+(i===0?'disabled':'')+' aria-label="Move '+e(names[key])+' earlier">↑</button>'+
        '<button type="button" data-veve-move="'+e(key)+'" data-dir="1" '+(i===p.sections.length-1?'disabled':'')+' aria-label="Move '+e(names[key])+' later">↓</button></div></div>'
      ).join('')+'</div><p class="veve-settings-note">Private drafts and archive-only media are never shared by changing these options.</p></div>';
  }
  function draw(){
    const root=state.mounted;if(!root?.isConnected)return;
    if(!state.prefs)state.prefs=validPrefs(null);
    const ordered=state.prefs.sections.filter(k=>state.prefs.enabled.includes(k)&&(state.active==='all'||state.active===k));
    // CSS columns flow top-to-bottom before moving right. Appending all photos
    // and then all resource cards made the resources stack in the last column.
    // Weave public photos and non-image cards into one stable account layout,
    // without changing the sort order of the photos themselves.
    const tileNodes=(markup)=>{
      const template=document.createElement('template');
      template.innerHTML=markup;
      return [...template.content.children].filter(n=>n.matches('article.veve-tile')).map(n=>n.outerHTML);
    };
    const seen=new Set(),images=[],extras=[];
    for(const key of ordered){
      const tiles=tileNodes(blocks(key));
      for(const tile of tiles){
        const pid=tile.match(/data-veve-post="([^"]+)"/)?.[1]||'';
        if(pid&&seen.has(pid))continue;
        if(pid)seen.add(pid);
        (tile.includes('class="veve-tile veve-photo"')?images:extras).push(tile);
      }
    }
    // Never reshuffle convenience areas because the date changed.
    // Account and section choices determine stable positions.
    const salt=String(state.uid||'guest')+'|'+ordered.join(',');
    let seed=[...salt].reduce((n,c)=>((n*31+c.charCodeAt(0))>>>0),2166136261);
    const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
    const mixedExtras=[...extras];
    const mixed=[];
    if(!images.length)mixed.push(...mixedExtras);
    else {
      // Spread resources into predictable slots with fixed minimal jitter.
      // Keep the photo order consistent with Sort while avoiding resource clusters.
      const positions=[];
      for(let k=0;k<mixedExtras.length;k++){
        const ideal=(k+1)*(images.length+1)/(mixedExtras.length+1);
        const target=Math.max(0,Math.min(images.length,Math.round(ideal+(random()-.5)*1.3)));
        positions.push(target);
      }
      positions.sort((a,b)=>a-b);
      let cursor=0;
      for(let i=0;i<=images.length;i++){
        while(cursor<positions.length&&positions[cursor]===i)mixed.push(mixedExtras[cursor++]);
        if(i<images.length)mixed.push(images[i]);
      }
    }
    const sectionHtml='<section class="veve-section"><div class="veve-masonry">'+
      mixed.join('')+'</div></section>';
    const select=['latest','popular','daily'].map(k=>'<option value="'+k+'" '+(state.prefs.sort===k?'selected':'')+'>'+
       ({latest:'most recent',popular:'most activity',daily:'daily mix'}[k])+'</option>').join('');
    const scope=['all',...state.prefs.sections.filter(k=>state.prefs.enabled.includes(k))];
    root.innerHTML='<div class="veve-top"><div class="veve-intro"><span>BIG LWA · DISCOVERY</span><h1>veve</h1>'+
      '<p>A collective of public ideas, photos, culture and communities. You choose the way it flows.</p></div>'+
      '<div class="veve-toolbar"><label>Sort<select id="veveSort">'+select+'</select></label>'+
      '<label>Show<select id="veveScope">'+scope.map(k=>'<option value="'+e(k)+'" '+(state.active===k?'selected':'')+'>'+e(k==='all'?'everything':names[k])+'</option>').join('')+'</select></label>'+
      '<button type="button" data-veve-settings aria-expanded="'+state.showSettings+'">⚙ customize</button>'+
      '<button type="button" data-veve-refresh aria-label="Refresh discovery feed">↻ refresh</button></div></div>'+
      '<div class="veve-message" id="veveMessage" role="status">'+e(state.loadError||
        (state.prefs.sort==='popular'&&!state.items.some(p=>score(p)>0)
          ?'No verified engagement counts yet — showing the most recent published posts instead.'
          :'Public content only · no inferred follower activity or fabricated trends'))+'</div>'+
      settingsMarkup()+
      (sectionHtml||'<div class="veve-empty">Nothing is selected. Open Customize to bring back sections.</div>');
  }
  function say(message){const el=state.mounted?.querySelector('#veveMessage');if(el)el.textContent=String(message);}
  function viewDialog(){
    let d=document.querySelector('#biglwaVevePreview');
    if(!d){
      d=document.createElement('dialog');d.id='biglwaVevePreview';
      d.innerHTML='<button type="button" data-veve-close aria-label="Close preview">×</button>'+
        '<div id="vevePreviewStage"></div>'+
        '<section id="vevePreviewCaption" aria-label="Full post caption" hidden><span id="vevePreviewProvider"></span><p id="vevePreviewCaptionText"></p></section>'+
        '<a id="vevePreviewOriginal" target="_blank" rel="noopener noreferrer" hidden>View original ↗</a>';
      d.addEventListener('click',ev=>{if(ev.target===d||ev.target.closest('[data-veve-close]'))d.close()});
      d.addEventListener('close',()=>{d.querySelector('#vevePreviewStage').replaceChildren()});
      document.body.append(d);
    }
    return d;
  }
  function openMedia(post){
    const d=viewDialog(),target=d.querySelector('#vevePreviewStage'),link=safeUrl(post.sourceUrl||post.permalink);
    const direct=video(post),embed=videoEmbed(post),still=picture(post);
    target.replaceChildren();
    let el;
    if(direct){
      el=document.createElement('video');el.src=direct;el.controls=true;el.autoplay=true;el.playsInline=true;el.poster=still||'';el.preload='metadata';
    }else if(embed){
      el=document.createElement('iframe');el.src=embed+'?autoplay=1';el.title='Video preview';el.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';el.allowFullscreen=true;el.referrerPolicy='strict-origin-when-cross-origin';
    }else if(still){
      el=document.createElement('img');el.src=still;el.alt='Full-size post preview';
    }else{
      el=document.createElement('p');el.textContent='This provider does not supply an embeddable preview.';
    }
    target.append(el);
    const caption=String(post.caption??post.title??post.description??'').trim();
    const panel=d.querySelector('#vevePreviewCaption');
    panel.hidden=!caption;
    d.querySelector('#vevePreviewCaptionText').textContent=caption;
    d.querySelector('#vevePreviewProvider').textContent=String(post.source||'BIG LWA')+' · full caption';
    const original=d.querySelector('#vevePreviewOriginal');original.hidden=!link;if(link)original.href=link;
    d.showModal();
  }
  function openGame(kind){
    // Use exactly the existing Arcade cabinet emulator, including its controls
    // and same-origin puzzles, rather than a second unstyled Veve iframe.
    if(!['2048','crossword','culture'].includes(kind))return;
    window.__biglwaArcadeRequestedGame=kind;
    window.openBIGLWAModule?.('games');
    // When Arcade is already mounted, openModule may reuse it.
    window.dispatchEvent(new CustomEvent('biglwa:arcade-request-game',{detail:{kind}}));
  }
  let listenersInstalled=false;
  function bind(){
    if(listenersInstalled)return;listenersInstalled=true;
    document.addEventListener('biglwa:sqwib-published',()=>{if(state.mounted?.isConnected)refresh()});
    document.addEventListener('biglwa:sqwib-reshared',()=>{if(state.mounted?.isConnected)refresh()});
    document.addEventListener('biglwa:feed-ready',()=>{if(state.mounted?.isConnected)refresh()});
  }
  async function refresh(){
    const generation=++state.renderGen;
    say('Refreshing public discovery…');
    await load();
    if(state.renderGen===generation)draw();
  }
  async function mount(root){
    if(!root)return;state.mounted=root;bind();
    root.innerHTML='<p class="veve-loading" role="status">Opening Veve · loading public collections…</p>';
    state.active='all';
    await restorePrefs();
    draw();await refresh();
    if(root.dataset.veveBound)return;
    root.dataset.veveBound='1';
    root.addEventListener('change',async ev=>{
      const t=ev.target;
      if(t.id==='veveSort'){state.prefs.sort=t.value;draw();say(await savePrefs());return}
      if(t.id==='veveScope'){state.active=t.value;draw();return}
      if(t.matches('[data-veve-enabled]')){
        const key=t.dataset.veveEnabled;
        const arr=new Set(state.prefs.enabled);
        if(t.checked)arr.add(key);else arr.delete(key);
        state.prefs.enabled=[...arr];draw();say(await savePrefs());
      }
    });
    root.addEventListener('click',async ev=>{
      const previewImage=ev.target.closest('.veve-photo-frame img,.veve-video-fallback');
      if(previewImage){
        const id=previewImage.closest('[data-veve-post]')?.dataset.vevePost;
        const p=state.items.find(p=>String(p.id)===String(id));
        if(p)openMedia(p);return;
      }
      const b=ev.target.closest('button');if(!b)return;
      if(b.hasAttribute('data-veve-view')){
        const p=state.items.find(p=>String(p.id)===String(b.dataset.veveView));
        if(p)openMedia(p);return;
      }
      if(b.hasAttribute('data-veve-game')){openGame(b.dataset.veveGame);return}
      if(b.hasAttribute('data-veve-reader')){
        const d=viewDialog(),stage=d.querySelector('#vevePreviewStage');stage.replaceChildren();
        const frame=document.createElement('iframe');frame.className='veve-reading-frame';frame.title='Public-domain book preview';
        frame.src=b.dataset.veveReader;stage.append(frame);
        d.querySelector('#vevePreviewCaption').hidden=true;
        const original=d.querySelector('#vevePreviewOriginal');original.hidden=false;original.href=frame.src;d.showModal();return;
      }
      if(b.hasAttribute('data-veve-route')){window.openBIGLWAModule?.(b.dataset.veveRoute);return}
      if(b.hasAttribute('data-veve-refresh')){await refresh();return}
      if(b.hasAttribute('data-veve-settings')){state.showSettings=!state.showSettings;draw();return}
      if(b.hasAttribute('data-veve-move')){
        const p=state.prefs.sections,key=b.dataset.veveMove,n=p.indexOf(key),to=n+Number(b.dataset.dir);
        if(n>=0&&to>=0&&to<p.length){[p[n],p[to]]=[p[to],p[n]];draw();say(await savePrefs())}
        return;
      }
      if(b.hasAttribute('data-veve-reshare')){
        b.disabled=true;
        try{
          const id=b.dataset.veveReshare;
          const already=state.resqwibs.some(r=>r.uid===state.uid&&r.sourceId===id);
          if(already)await window.BigLWASqwibs.undoResqwib(id);
          else await window.BigLWASqwibs.resqwib(id);
          say(already?'Resqwib removed.':'Resqwibbed with author permission.');
        }
        catch(err){b.disabled=false;say(err?.message||'Could not resqwib.')}
      }
    });
  }
  window.BigLWAVeve=Object.freeze({mount,refresh});
})();
