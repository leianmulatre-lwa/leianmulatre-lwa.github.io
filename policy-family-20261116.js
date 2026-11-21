/* Shared BIG LWA Important-page family navigation.
 * Presentation only: leave policy language, publication dates and owner data intact.
 */
(()=>{'use strict';
 if(window.__biglwaPolicyFamily20261116)return;window.__biglwaPolicyFamily20261116=true;
 const pages=[['legal','LWA & Order'],['about','About'],['privacy','Privacy'],['terms','Terms'],['rights','Rights & Likeness'],['affidavit','Good Faith']];
 function mount(){
  const active=location.pathname.split('/').filter(Boolean)[0]||'';
  if(!pages.some(([id])=>id===active))return;
  const shell=document.querySelector('.policy-page .policy-shell');
  const legal=document.body.classList.contains('legal-index');
  const about=document.body.classList.contains('about-site');
  if(!shell&&!legal&&!about)return;
  if(document.querySelector('.policy-family-nav'))return;
  const nav=document.createElement('nav');
  nav.className='policy-family-nav';nav.setAttribute('aria-label','LWA and Order page family');
  for(const [id,title] of pages){
   const link=document.createElement('a');link.href='/'+id+'/';link.textContent=title;
   if(id===active)link.setAttribute('aria-current','page');
   nav.appendChild(link);
  }
  if(shell){
   const top=shell.querySelector('.policy-top');
   if(top)top.insertAdjacentElement('afterend',nav);else shell.prepend(nav);
  }else if(legal){
   const header=document.querySelector('body>header');
   if(header)header.insertAdjacentElement('afterend',nav);else document.body.prepend(nav);
  }else if(about){
   const header=document.querySelector('body>header');
   if(header)header.insertAdjacentElement('afterend',nav);else document.body.prepend(nav);
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();