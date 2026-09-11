(()=>{
  if(window.__biglwaGoogleOrbit)return;
  const CLIENT_ID='208529705083-q6hlebsrlt1n5i78ubtubf1nrg9gv488.apps.googleusercontent.com';
  const SCOPES=[
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/calendar.readonly'
  ].join(' ');
  let tokenClient=null,accessToken='',loading=null;
  const state={connected:false,profile:null,drive:[],calendar:[],youtube:null,error:''};
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function loadGIS(){
    if(window.google?.accounts?.oauth2)return Promise.resolve();
    if(loading)return loading;
    loading=new Promise((resolve,reject)=>{
      const prior=document.querySelector('script[data-biglwa-google-identity]');
      if(prior){prior.addEventListener('load',resolve,{once:true});prior.addEventListener('error',reject,{once:true});return}
      const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;script.dataset.biglwaGoogleIdentity='1';script.onload=resolve;script.onerror=()=>reject(new Error('Google Identity Services could not load.'));document.head.appendChild(script);
    });
    return loading;
  }
  function status(message,kind=''){
    let toast=$('#biglwaGoogleOrbitStatus');
    if(!toast){toast=document.createElement('div');toast.id='biglwaGoogleOrbitStatus';toast.setAttribute('role','status');toast.style.cssText='position:fixed;right:18px;bottom:18px;z-index:12000;max-width:330px;padding:11px 14px;border:1px solid rgba(80,70,64,.2);border-radius:12px;background:rgba(250,247,241,.96);box-shadow:0 12px 34px rgba(0,0,0,.14);font:600 11px/1.4 system-ui;color:#302b28';document.body.appendChild(toast)}
    toast.textContent=message;toast.dataset.kind=kind;clearTimeout(status.timer);status.timer=setTimeout(()=>{toast.remove()},6000);
  }
  async function api(url){
    const response=await fetch(url,{headers:{Authorization:'Bearer '+accessToken}});
    if(!response.ok){const body=await response.text();throw new Error('Google API '+response.status+': '+body.slice(0,180))}
    return response.json();
  }
  async function loadData(){
    const now=new Date().toISOString();
    const [drive,calendar,youtube,profile]=await Promise.allSettled([
      api('https://www.googleapis.com/drive/v3/files?pageSize=5&orderBy=modifiedTime%20desc&fields=files(id,name,mimeType,modifiedTime,webViewLink)'),
      api('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5&singleEvents=true&orderBy=startTime&timeMin='+encodeURIComponent(now)),
      api('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true'),
      api('https://www.googleapis.com/oauth2/v3/userinfo')
    ]);
    if(drive.status==='fulfilled')state.drive=drive.value.files||[];
    if(calendar.status==='fulfilled')state.calendar=calendar.value.items||[];
    if(youtube.status==='fulfilled')state.youtube=youtube.value.items?.[0]||null;
    if(profile.status==='fulfilled')state.profile=profile.value;
    render();
  }
  async function connect(){
    try{
      await loadGIS();
      if(!tokenClient){
        tokenClient=google.accounts.oauth2.initTokenClient({
          client_id:CLIENT_ID,scope:SCOPES,
          callback:async response=>{
            if(response.error){state.error=response.error;status('Google connection failed: '+response.error,'error');render();return}
            accessToken=response.access_token;state.connected=true;state.error='';
            status('Google Orbit connected. Loading Calendar, Drive, and YouTube…','ok');
            try{await loadData();status('Google Calendar, Drive, and YouTube are connected.','ok')}catch(error){state.error=error.message;status(error.message,'error');render()}
          }
        });
      }
      tokenClient.requestAccessToken({prompt:state.connected?'':'consent'});
    }catch(error){state.error=error.message;status(error.message,'error');render()}
  }
  function disconnect(){
    const done=()=>{accessToken='';state.connected=false;state.profile=null;state.drive=[];state.calendar=[];state.youtube=null;render();status('Google Orbit disconnected.')};
    if(accessToken&&window.google?.accounts?.oauth2)google.accounts.oauth2.revoke(accessToken,done);else done();
  }
  function preview(kind){
    if(!state.connected)return '';
    if(kind==='drive')return state.drive.slice(0,3).map(x=>'<li>'+esc(x.name)+'</li>').join('');
    if(kind==='calendar')return state.calendar.slice(0,3).map(x=>'<li>'+esc(x.summary||'Untitled event')+'</li>').join('');
    if(kind==='youtube'&&state.youtube)return '<li>'+esc(state.youtube.snippet?.title||'YouTube channel')+'</li><li>'+esc(state.youtube.statistics?.subscriberCount||'0')+' subscribers</li>';
    return '';
  }
  function render(){
    ['youtube','drive','calendar'].forEach(kind=>{
      $$('[data-orbit-app="'+kind+'"]').forEach(tile=>{
        tile.dataset.googleOrbitBound='1';tile.setAttribute('aria-label',(state.connected?'View connected ':'Connect ')+kind);
        const small=$('small',tile);if(small)small.textContent=state.connected?'Connected':'Connect';
        tile.classList.toggle('orbit-connected',state.connected);
      });
      $$('[data-google-orbit-card="'+kind+'"]').forEach(card=>{
        const list=$('ul',card);if(list)list.innerHTML=preview(kind)||'<li>'+(state.connected?'No recent items found.':'Not connected')+'</li>';
      });
    });
    document.body.classList.toggle('google-orbit-connected',state.connected);
  }
  document.addEventListener('click',event=>{
    const tile=event.target.closest('[data-orbit-app="youtube"],[data-orbit-app="drive"],[data-orbit-app="calendar"]');
    if(tile){event.preventDefault();event.stopImmediatePropagation();connect();return}
    if(event.target.closest('[data-google-orbit-disconnect]')){event.preventDefault();disconnect()}
  },true);
  const observer=new MutationObserver(render);observer.observe(document.documentElement,{childList:true,subtree:true});
  render();
  window.__biglwaGoogleOrbit={connect,disconnect,state};
})();