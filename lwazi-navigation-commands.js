/* BIG LWA — deterministic L'wazi navigation commands.
   Only explicit navigation requests route. Everyday questions remain searches. */
(function(){
'use strict';
if(window.BigLWANavigationCommands)return;
const pages={
 studio:'/studio',home:'/studio',homepage:'/studio',dashboard:'/studio',
 settings:'/settings/',preferences:'/settings/',account:'/settings/',
 legal:'/legal/', 'legal pages':'/legal/', 'important pages':'/legal/',
 'about us':'/about/',about:'/about/','about big lwa':'/about/',
 privacy:'/privacy/','privacy policy':'/privacy/',
 terms:'/terms/','terms of service':'/terms/',
 rights:'/rights/','rights and likeness':'/rights/',
 affidavit:'/affidavit/','affidavit of good faith':'/affidavit/'
};
const categories={
 'widgets':'widgets','all widgets':'widgets','widget directory':'widgets',
 'skeleton key widgets':'widgets','songs':'songs','music results':'songs',
 'places and maps':'places','places maps':'places','maps search':'places',
 'stream videos':'stream','video results':'stream','books results':'books'
};
const widgets={
 'aura':'aura','avatar':'avatar','journal':'diary','diary':'diary',
 'stream':'stream','orbit':'orbit','calendar':'calendar','politic':'politic',
 'politics widget':'politic','politics':'politic','map':'map','map widget':'map',
 'my map':'map','booth':'camera','photo booth':'camera',
 'tunes':'music','jam':'music','music box':'music','archive':'archive',
 'myfeed':'feed','my feed':'feed','feed':'feed','sqwidz':'notes',
 'projects':'projects','closet':'closet','boards':'boards',
 'library':'library','games':'games','arcade':'games','trophies':'trophies',
 'connect':'connect','logs':'logs','workshop':'tools','lwazi workshop':'tools',
 'veve':'veve'
};
const rApps={
 'sqwibblr':'image-desk','image desk':'image-desk','visualizr':'visualizr',
 'lightr':'photocraft','paintr':'vectorcraft','keyframer':'effectcraft','filer':'pdfcraft'
};
const clean=s=>String(s||'').toLowerCase().replace(/[’']/g,"").replace(/[?!.,:;]+/g,' ').replace(/\s+/g,' ').trim();
function resolve(query){
 const text=clean(query);
 if(!text||text.length>180)return null;
 const bare=text.replace(/^(?:hey|hi|hello)\s+lwazi\s+/,'').replace(/^please\s+/,'');
 const prefix=/^(?:(?:(?:can|could|would)\s+you\s+)?(?:please\s+)?)(take me to|go to|navigate to|bring me to|send me to|head to|open|show me|show|pull up|switch to|visit|launch|bring up)\s+/;
 const match=bare.match(prefix);
 if(!match)return null;
 let destination=bare.slice(match[0].length).trim()
   .replace(/^(?:the|my|our)\s+/,'').replace(/\s+(?:page|section|tab|screen)$/,'');
 if(/^skeleton\s*(?:key|keys)(?:\s*(?:panel|menu))?$/.test(destination))
   return {type:'skeleton',label:'Skeleton Key'};
 if(destination==='settings legal'||destination==='legal and settings')destination='legal';
 if(pages[destination])return {type:'page',path:pages[destination],label:destination};
 if(categories[destination])return {type:'category',category:categories[destination],label:destination};
 if(rApps[destination])return {type:'craft',app:rApps[destination],label:destination};
 if(widgets[destination])return {type:'widget',route:widgets[destination],label:destination};
 return null;
}
function navigate(command){
 if(!command)return false;
 if(command.type==='page'){
   // Going to Studio itself reloads its canonical home view instead of
   // mutating a hash that the old router may mistake for login.
   window.location.assign(command.path);
   return true;
 }
 if(command.type==='category'){
   const open=window.__biglwaOpenSearchCategory;
   if(typeof open==='function')return open(command.category)!==false;
   return false;
 }
 if(command.type==='skeleton'){
   const app=document.querySelector('#studioApp');
   const toggle=app?.querySelector('#skeletonKeyLauncher,#biglwaSkeletonKeysToggle,[data-skeleton-toggle]');
   if(!toggle)return false;
   const panel=app.querySelector('.manifesto-card');
   if(!panel?.classList.contains('is-skeleton-open'))toggle.click();
   return true;
 }
 if(command.type==='craft'){
   if(typeof window.BigLWAOpenCraftApp==='function')return window.BigLWAOpenCraftApp(command.app);
   if(typeof window.openBIGLWAModule==='function'){window.openBIGLWAModule('tools');return true;}
   return false;
 }
 if(command.type==='widget'){
   if(typeof window.openBIGLWAModule==='function'){
     window.openBIGLWAModule(command.route);return true;
   }
   const route=command.route.replace(/[^a-z0-9-]/g,'');
   const btn=document.querySelector('#studioApp [data-sidebar-route="'+route+'"],#studioApp [data-open="'+route+'"],#studioApp [data-widget-route="'+route+'"]');
   if(btn){btn.click();return true}
 }
 return false;
}
function mountSuggestions(){
 const wrap=document.querySelector('#studioApp .topbar .search-wrap');
 const input=wrap?.querySelector('#globalSearch');
 if(!wrap||!input||wrap.querySelector('.bl-nav-hints'))return;
 const box=document.createElement('div');box.className='bl-nav-hints';
 const trigger=document.createElement('button');trigger.type='button';trigger.className='bl-nav-hints-trigger';
 trigger.textContent='✦ Try: Studio · Settings · Legal · Skeleton Key · Widgets';
 trigger.setAttribute('aria-label','Show L’wazi navigation commands');trigger.setAttribute('aria-expanded','false');
 const menu=document.createElement('div');menu.className='bl-nav-hints-menu';menu.hidden=true;menu.setAttribute('role','menu');
 const entries=[['Studio','take me to studio'],['Settings','take me to settings'],['Legal pages','take me to legal pages'],['Skeleton Key','open skeleton key'],['Widgets','show widgets']];
 for(const [label,query] of entries){
  const b=document.createElement('button');b.type='button';b.setAttribute('role','menuitem');
  b.textContent=label;b.addEventListener('click',()=>{
   input.value=query;menu.hidden=true;trigger.setAttribute('aria-expanded','false');
   const cmd=resolve(query);if(cmd&&!navigate(cmd))input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
  });menu.append(b);
 }
 trigger.addEventListener('click',event=>{event.stopPropagation();menu.hidden=!menu.hidden;trigger.setAttribute('aria-expanded',String(!menu.hidden))});
 document.addEventListener('pointerdown',event=>{if(!box.contains(event.target)){menu.hidden=true;trigger.setAttribute('aria-expanded','false')}});
 input.addEventListener('input',()=>{
   box.classList.toggle('is-typing',input.value.trim().length>24);
 });
 box.append(trigger,menu);wrap.append(box);
}
window.BigLWANavigationCommands={resolve,navigate,mountSuggestions};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountSuggestions,{once:true});
else mountSuggestions();
window.addEventListener('load',mountSuggestions);
setTimeout(mountSuggestions,1000);

})();
