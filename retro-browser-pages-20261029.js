/* BIG LWA: desktop-browser chrome for the *full* Games and Lwazi pages.
   Additive only: never replace/move the game player, editor router, form or iframe. */
(()=>{
 'use strict';
 if(window.__biglwaRetroModulePagesV1)return;
 window.__biglwaRetroModulePagesV1=true;
 const $=(s,r=document)=>r.querySelector(s);
 const make=(tag,cls,txt)=>{
   const el=document.createElement(tag);
   if(cls)el.className=cls;
   if(txt!=null)el.textContent=txt;
   return el;
 };
 function chrome(type){
   const games=type==='games';
   const name=games?'Games — BIG LWA':'L\u2019wazi Workshop — BIG LWA';
   const head=make('header','retro-window-chrome');
   head.setAttribute('aria-label',name+' browser controls');
   const titlebar=make('div','retro-window-titlebar');
   const identity=make('span','retro-window-title');
   identity.append(make('span','retro-window-icon',games?'▣':'▤'),
                   make('strong','',name));
   const controls=make('span','retro-window-controls');
   controls.setAttribute('aria-label','Window controls');
   controls.append(make('span','retro-window-min','_'),make('span','retro-window-max','□'));
   controls.querySelectorAll('span').forEach(el=>el.setAttribute('aria-hidden','true'));
   const close=make('button','retro-window-close','×');
   close.type='button';
   close.setAttribute('aria-label','Close '+(games?'Games':'L\u2019wazi')+' and return to Studio');
   close.title='Return to Studio';
   close.addEventListener('click',ev=>{
     ev.preventDefault();ev.stopPropagation();
     const back=$('#studioApp #moduleBack');
     if(back)back.click();
   });
   controls.append(close);
   titlebar.append(identity,controls);
   const menu=make('div','retro-window-menu');
   menu.setAttribute('aria-hidden','true');
   for(const part of ['File','Edit','View','Favorites','Help'])
     menu.append(make('span','',part));
   const nav=make('div','retro-window-navigation');
   nav.append(make('span','retro-window-navicons','◀  ▶  ⌂'));
   const addressLabel=make('span','retro-window-address-label','Address');
   const address=make('span','retro-window-address',games?'biglwa://studio/games':'biglwa://studio/lwazi');
   nav.append(addressLabel,address);
   head.append(titlebar,menu,nav);
   return head;
 }
 function status(type){
   const bar=make('footer','retro-window-status');
   bar.append(make('span','retro-window-status-message',type==='games'?'Ready · Choose a game to play':'Ready · Select a tool to create'));
   bar.append(make('span','retro-window-status-right',type==='games'?'20 games · in-browser player':'L\u2019wazi R-series · private workspace'));
   return bar;
 }
 function mount(type,selector){
   const target=$(selector);
   if(!target)return;
   if(target.dataset.biglwaRetroBrowser===type &&
      $(':scope > .retro-window-chrome',target) &&
      $(':scope > .retro-window-status',target))return;
   // Re-rendered pages get their own frame; existing interactive content is untouched.
   const existing=$(':scope > .retro-window-chrome',target);
   const oldStatus=$(':scope > .retro-window-status',target);
   if(existing)existing.remove();
   if(oldStatus)oldStatus.remove();
   target.prepend(chrome(type));
   target.append(status(type));
   target.dataset.biglwaRetroBrowser=type;
 }
 function sync(){
   const workspace=$('#studioApp #moduleWorkspace');
   if(!workspace||workspace.hidden)return;
   const type=workspace.dataset.moduleKey;
   if(type==='games')mount('games','#studioApp #moduleWorkspace[data-module-key="games"] .module-game-stage');
   else if(type==='tools')mount('lwazi','#studioApp #moduleWorkspace[data-module-key="tools"] #craftSuite.craft-workshop');
 }
 let observer=null,watching=null,scheduled=false;
 function schedule(){
   if(scheduled)return;scheduled=true;
   requestAnimationFrame(()=>{scheduled=false;attach();sync()});
 }
 function attach(){
   const workspace=$('#studioApp #moduleWorkspace');
   const root=workspace||document.documentElement;
   if(root===watching)return;
   if(observer)observer.disconnect();
   watching=root;
   observer=new MutationObserver(schedule);
   observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['data-module-key','hidden']});
 }
 function start(){attach();sync();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
 document.addEventListener('biglwa:widgets-restored',schedule);
})();
