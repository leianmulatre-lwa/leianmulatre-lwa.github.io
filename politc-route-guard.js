/* Big LWA politc navigation guard.
 * Runs before old widget/customization click handlers and uses the mounted module router.
 * No changes to authentication, history, profile, or user data.
 */
(()=>{
  if(window.__biglwaPolitcRouteGuardV1)return;
  window.__biglwaPolitcRouteGuardV1=true;
  const selectors=[
    '#studioApp #politc [data-open]',
    '#studioApp #politc .card-cta',
    '#studioApp #politc .arrow-btn',
    '#studioApp #politc .window-light.green',
    '#studioApp [data-open="politc"]',
    '#studioApp [data-open="politic"]',
    '#studioApp [data-sidebar-route="politc"]',
    '#studioApp [data-shortcut-route="politc"]',
    '#studioApp [data-shortcut-open="politc"]',
    '#studioApp [data-open-widget-settings="politc"]'
  ].join(',');
  const status=(message)=>{
    const card=document.querySelector('#studioApp #politc');
    if(!card)return;
    let element=card.querySelector('#biglwaPolitcRouteStatus');
    if(!element){element=document.createElement('p');element.id='biglwaPolitcRouteStatus';element.setAttribute('role','status');card.appendChild(element);}
    element.textContent=message;
  };
  let loading=null;
  function ensureRouter(){
    const opener=window.openBIGLWAModule||window.BigLWAOpenModule;
    if(typeof opener==='function')return Promise.resolve(opener);
    if(loading)return loading;
    loading=new Promise(resolve=>{
      let finished=false;
      const done=()=>{if(finished)return;finished=true;clearTimeout(timeout);resolve(window.openBIGLWAModule||window.BigLWAOpenModule||null);};
      // Index normally injects the same module bundle. Reuse it rather than
      // executing module-pages twice while Studio is still mounting.
      const current='/module-pages.js?v=20261023-new-satellites-1';
      const present=[...document.scripts].find(script=>script.getAttribute('src')?.includes('/module-pages.js?'));
      const timeout=setTimeout(done,7000);
      if(present){
        present.addEventListener('load',done,{once:true});
        present.addEventListener('error',done,{once:true});
        // If already loaded, allow one turn for the router to mount.
        setTimeout(()=>{if(typeof (window.openBIGLWAModule||window.BigLWAOpenModule)==='function')done()},100);
      }else{
        const script=document.createElement('script');
        script.src=current;
        script.onload=done;script.onerror=done;
        document.head.appendChild(script);
      }
    }).finally(()=>{loading=null});
    return loading;
  }
  window.addEventListener('click',async event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    if(document.documentElement.classList.contains('biglwa-preview-mode'))return;
    const target=event.target?.closest?.(selectors);
    if(!target||target.matches('.window-light.yellow,.window-light.red'))return;
    event.preventDefault();event.stopImmediatePropagation();
    status('Opening politc…');
    const opener=await ensureRouter();
    if(typeof opener!=='function'){status('Studio is still loading. Please try opening politc again.');return;}
    try{
      opener('politc');
      const notice=document.getElementById('biglwaPolitcRouteStatus');
      if(notice)notice.remove();
    }catch(error){
      console.error('[BIGLWA] Could not open politc:',error);
      status('Politc could not open. Please refresh Studio and try again.');
    }
  },true);
})();
