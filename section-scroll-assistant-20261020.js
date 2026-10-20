/* BIGLWA section-aware scroll assistant: no wheel/touch hijacking. */
(()=>{
'use strict';
if(window.BigLWAScrollAssistant)return;
const qs=(sel,root=document)=>[...root.querySelectorAll(sel)];
const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
let root=null,prev=null,next=null,label=null,frame=0;
function targets(){
 const workspace=document.querySelector('#studioApp.is-active #moduleWorkspace:not([hidden])');
 let nodes=workspace
  ?qs('.module-heading h1,.module-heading h2,#moduleWorkspaceBody > section > h2,#moduleWorkspaceBody > .module-grid > section > h2,#moduleWorkspaceBody > .politc-board h3,#moduleWorkspaceBody > .module-shell h2',workspace)
  :!document.querySelector('#studioApp')?qs('main h1,main h2,main h3'):[];
 return nodes.filter(node=>node.isConnected&&!node.closest('[hidden],[aria-hidden="true"]')&&node.getBoundingClientRect().height>0);
}
function jump(el){
 if(!el)return;
 const top=Math.max(0,window.scrollY+el.getBoundingClientRect().top-86);
 window.scrollTo({top,behavior:reduced()?'instant':'smooth'});
}
function update(){
 frame=0;
 if(!root)return;
 const items=targets();
 if(items.length<2){root.hidden=true;return}
 const threshold=window.scrollY+95;
 const positions=items.map(el=>window.scrollY+el.getBoundingClientRect().top);
 let current=0;for(let i=0;i<positions.length;i++)if(positions[i]<=threshold)current=i;
 const previousIndex=Math.max(0,current-1),nextIndex=Math.min(items.length-1,current+1);
 prev.disabled=threshold<=positions[0];next.disabled=current>=items.length-1;
 prev.onclick=()=>jump(items[previousIndex]);next.onclick=()=>jump(items[nextIndex]);
 next.title='Next: '+String(items[nextIndex]?.textContent||'section').trim().slice(0,70);
 label.textContent='Sections '+(current+1)+' / '+items.length;
 root.hidden=false;
}
function schedule(){if(frame)return;frame=requestAnimationFrame(update)}
function mount(){
 if(root)return;
 const css=document.createElement('style');css.id='biglwaScrollAssistantCSS';
 css.textContent=[
 'html{scroll-padding-top:86px}',
 'html:not(:has(#studioApp)){scroll-behavior:smooth}',
 '.biglwa-scroll-assistant{position:fixed;right:clamp(9px,2vw,22px);bottom:clamp(12px,3vh,27px);z-index:9100;display:flex;align-items:center;gap:5px;padding:6px;border:1px solid rgba(89,63,70,.26);border-radius:13px;background:rgba(255,251,246,.96);color:#503944;box-shadow:0 7px 20px rgba(35,17,23,.18);font:700 10px/1.2 system-ui}',
 '.biglwa-scroll-assistant[hidden]{display:none!important}',
 '.biglwa-scroll-assistant span{padding:3px 6px;white-space:nowrap}',
 '.biglwa-scroll-assistant button{display:grid;place-items:center;width:29px;height:29px;border:1px solid #cbb6bd;border-radius:7px;background:#f4e5e8;color:#603c51;cursor:pointer;font:900 17px/1 system-ui}',
 '.biglwa-scroll-assistant button:disabled{opacity:.32;cursor:default}',
 '.biglwa-scroll-assistant button:not(:disabled):hover{background:#e9d0dd}',
 '.biglwa-scroll-assistant button:focus-visible{outline:2px solid #7b4774;outline-offset:2px}',
 '@media(max-width:640px){.biglwa-scroll-assistant{bottom:10px;right:8px;padding:4px}}',
 '@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto!important}}'
 ].join('\n');document.head.append(css);
 root=document.createElement('nav');root.className='biglwa-scroll-assistant';root.hidden=true;
 root.setAttribute('aria-label','Smooth navigation between page headings');
 prev=document.createElement('button');prev.type='button';prev.textContent='↑';prev.setAttribute('aria-label','Previous heading');
 next=document.createElement('button');next.type='button';next.textContent='↓';next.setAttribute('aria-label','Next heading');
 label=document.createElement('span');label.textContent='Sections';root.append(prev,label,next);document.body.append(root);
 new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','data-module-key']});
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule,{passive:true});
 document.addEventListener('biglwa:module-open',schedule);
 document.addEventListener('biglwa:module-close',schedule);
 window.addEventListener('popstate',schedule);
 schedule();
}
window.BigLWAScrollAssistant={refresh:schedule};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
})();