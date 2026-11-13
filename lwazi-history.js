/* BIG LWA / L’wazi history v1 — local, account-scoped, user erasable.
 * Never sends queries or conversation turns to a history API. Signed-out
 * searches live only in sessionStorage; signed-in ones use UID-specific keys.
 */
(()=>{'use strict';
 if(window.BigLWALwaziHistory)return;
 const PREFIX='biglwa:lwazi:history:v1:',MAX_ENTRIES=100,MAX_MONTHS=12,MAX_TURNS=12;
 let explicitUid=null;
 function uid(){
   const candidate=explicitUid!==null?explicitUid:
     (window.__biglwaIdentity?.uid||window.BigLWAAccountStorage?.uid||'');
   return String(candidate||'').trim().slice(0,160);
 }
 function store(){return uid()?localStorage:sessionStorage}
 function key(){return PREFIX+(uid()||'guest')}
 function month(at){const d=new Date(at);return Number.isFinite(d.getTime())?d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'):''}
 function sanitize(entry){
   if(!entry||typeof entry!=='object')return null;
   const at=Number(entry.at);
   if(!Number.isFinite(at)||at<=0||at>Date.now()+86400000)return null;
   const q=String(entry.q||'').trim().slice(0,250);if(!q)return null;
   const turns=(Array.isArray(entry.turns)?entry.turns:[]).slice(-MAX_TURNS).map(t=>({
     role:t?.role==='assistant'?'assistant':'user',
     text:String(t?.text||'').slice(0,1200)
   })).filter(t=>t.text.trim());
   return {id:String(entry.id||'').slice(0,110)||'history-'+at,
     at,q,mode:['off','npc','deep'].includes(entry.mode)?entry.mode:'off',turns};
 }
 function read(){
   try{
     const raw=JSON.parse(store().getItem(key())||'[]');
     return (Array.isArray(raw)?raw:[]).map(sanitize).filter(Boolean).sort((a,b)=>b.at-a.at);
   }catch{return []}
 }
 function emit(){window.dispatchEvent(new CustomEvent('biglwa:lwazi-history-changed',{detail:{uid:uid()||null}}))}
 function write(items){
   try{
     const fresh=items.map(sanitize).filter(Boolean).sort((a,b)=>b.at-a.at);
     const allowedMonths=new Set(fresh.map(e=>month(e.at)).filter(Boolean).slice(0,MAX_MONTHS));
     store().setItem(key(),JSON.stringify(fresh.filter(e=>allowedMonths.has(month(e.at))).slice(0,MAX_ENTRIES)));
     emit();return true;
   }catch{return false}
 }
 function add(q,mode='off'){
   const query=String(q||'').trim().slice(0,250);if(!query)return null;
   const at=Date.now();
   const entry={id:'lwazi-'+at.toString(36)+'-'+Math.random().toString(36).slice(2,9),at,q:query,mode,turns:[]};
   return write([entry,...read()])?entry.id:null;
 }
 function update(id,patch={}){
   const items=read(),entry=items.find(x=>x.id===id);
   if(!entry)return false;
   if(patch.mode!==undefined&&['off','npc','deep'].includes(patch.mode))entry.mode=patch.mode;
   if(Array.isArray(patch.turns))entry.turns=patch.turns;
   return write(items);
 }
 function remove(id){return write(read().filter(x=>x.id!==id))}
 function clearMonth(label){return /^\d{4}-(0[1-9]|1[0-2])$/.test(label)?write(read().filter(x=>month(x.at)!==label)):false}
 function clearAll(){return write([])}
 function group(items=read()){
   const groups=new Map();
   items.forEach(entry=>{
     const m=month(entry.at);if(!m)return;
     if(!groups.has(m))groups.set(m,[]);
     groups.get(m).push(entry);
   });
   return [...groups].map(([id,entries])=>({
     id,label:new Intl.DateTimeFormat(undefined,{month:'long',year:'numeric'}).format(new Date(id+'-02T12:00:00')),
     entries
   }));
 }
 function setUid(value){explicitUid=String(value||'').trim().slice(0,160);emit()}
 function mountSettings(){
   const host=document.getElementById('lwaziHistorySettings');
   if(!host||host.dataset.bound==='1')return;
   host.dataset.bound='1';
   const status=document.getElementById('lwaziHistoryStatus');
   const list=document.getElementById('lwaziHistoryMonths');
   const show=()=>{
     if(!list)return;
     list.replaceChildren();
     if(!uid()){
       if(status)status.textContent='Sign in to review your private account history on this browser.';
       return;
     }
     const groups=group();
     if(status)status.textContent=groups.length?'Stored on this browser for this account only. Nothing is shared or synced across devices.':'No saved searches on this browser for this account.';
     groups.forEach(g=>{
       const section=document.createElement('section');section.className='lwazi-history-month';
       const head=document.createElement('div');head.className='lwazi-history-month-head';
       const title=document.createElement('strong');title.textContent=g.label+' · '+g.entries.length;
       const clear=document.createElement('button');clear.type='button';clear.textContent='Clear month';
       clear.setAttribute('aria-label','Clear L’wazi history for '+g.label);
       clear.addEventListener('click',()=>{if(confirm('Clear L’wazi history for '+g.label+' on this browser?'))clearMonth(g.id)});
       head.append(title,clear);
       const entries=document.createElement('ul');
       g.entries.forEach(e=>{
         const row=document.createElement('li');
         const link=document.createElement('a');link.href='/studio?lwaziHistory='+encodeURIComponent(e.id);
         link.textContent=e.q;link.title='Return to this search in Studio';
         const time=document.createElement('time');time.dateTime=new Date(e.at).toISOString();
         time.textContent=new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(new Date(e.at));
         const removeButton=document.createElement('button');removeButton.type='button';
         removeButton.textContent='×';removeButton.setAttribute('aria-label','Delete history entry: '+e.q);
         removeButton.addEventListener('click',()=>remove(e.id));
         row.append(link,time,removeButton);entries.append(row);
       });
       section.append(head,entries);list.append(section);
     });
   };
   host.querySelector('[data-lwazi-clear-all]')?.addEventListener('click',()=>{
     if(confirm('Clear all L’wazi history on this browser for this account?'))clearAll();
   });
   window.addEventListener('biglwa:lwazi-history-changed',show);
   show();
   // Settings loads auth separately from Studio. Observe the verified Firebase
   // user rather than deriving the identity from a public profile route.
   Promise.all([
     import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
     import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js')
   ]).then(([a,b])=>{
     const app=a.getApps().find(x=>x.options?.projectId==='biglwa')||
       a.initializeApp({apiKey:'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',
         authDomain:'biglwa.firebaseapp.com',projectId:'biglwa',
         appId:'1:83232670555:web:e04927b20458390b3b507e'});
     b.onAuthStateChanged(b.getAuth(app),user=>setUid(user?.uid||''));
   }).catch(()=>{if(status)status.textContent='History will appear after account sign-in is available.'});
 }
 window.BigLWALwaziHistory={read,add,update,remove,clearMonth,clearAll,group,setUid,mountSettings};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountSettings,{once:true});
 else mountSettings();
})();
