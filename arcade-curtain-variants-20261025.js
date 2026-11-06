/* Games Studio browser colorways. Three saved dots switch the actual visible browser frame.
   Existing game catalogue, logo art, screen events and controls are unchanged. */
(()=>{'use strict';
 if(window.__biglwaArcadeCurtainVariants)return;
 window.__biglwaArcadeCurtainVariants=true;
 const STORAGE='biglwaArcadeCurtainVersionV1';
 let version='1';
 try{version=localStorage.getItem(STORAGE)==='2'?'2':'1'}catch{}
 function apply(){
  const widget=document.querySelector('#studioApp #games');
  if(!widget)return;
  const folder=widget.querySelector('.games-arcade-brand');
  if(!folder)return;
  widget.dataset.arcadeVersion=version;
  if(folder.querySelector(':scope > .arcade-folder-dots'))return;
  const button=document.createElement('button');
  button.type='button';button.className='arcade-folder-dots';
  for(let i=0;i<3;i++){const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');button.append(dot)}
  const label=()=>{const next=version==='1'?'Plum':'Classic Blue';
    button.setAttribute('aria-label','Switch Games browser theme to '+next);
    button.title='Change browser color · '+next;};
  label();
  button.addEventListener('click',event=>{
   event.preventDefault();event.stopPropagation();
   version=version==='1'?'2':'1';
   widget.dataset.arcadeVersion=version;
   try{localStorage.setItem(STORAGE,version)}catch{}
   label();
  });
  folder.append(button);
 }
 let scheduled=false;
 const schedule=()=>{
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;apply()});
 };
 const start=()=>{
  apply();
  const root=document.querySelector('#studioApp')||document.body;
  new MutationObserver(records=>{
   if(records.some(record=>[...record.addedNodes].some(node=>
      node.nodeType===1&&(node.matches?.('#games,.games-arcade-brand')||
      node.querySelector?.('#games,.games-arcade-brand')))))schedule();
  }).observe(root,{childList:true,subtree:true});
  document.addEventListener('biglwa:widgets-restored',schedule);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
