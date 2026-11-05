/* BIG LWA Settings: cache-only maintenance.
   Never remove localStorage, IndexedDB, sessionStorage, cookies, or Firebase
   auth persistence. Those may hold user projects, layouts, and credentials. */
(()=>{
  'use strict';
  const button=document.getElementById('clearTemporaryCache');
  const status=document.getElementById('clearCacheStatus');
  if(!button||!status)return;
  button.addEventListener('click',async()=>{
    if(button.disabled)return;
    button.disabled=true;
    status.classList.remove('good','bad');
    status.textContent='Clearing temporary cached files…';
    try{
      if(!('caches' in window)){
        status.textContent='This browser does not expose Cache Storage. No saved account data was changed.';
        return;
      }
      const names=await caches.keys();
      // The Cache Storage API exposes caches for the current Big LWA origin
      // only. A service worker may recreate needed assets on next navigation.
      const attempts=await Promise.allSettled(names.map(key=>caches.delete(key)));
      const cleared=attempts.filter(x=>x.status==='fulfilled'&&x.value===true).length;
      const failed=attempts.filter(x=>x.status==='rejected').length;
      status.classList.add(failed?'bad':'good');
      status.textContent=failed
        ? 'Cleared '+cleared+' temporary caches; '+failed+' could not be removed. Your saved account data and layout were kept.'
        : 'Cleared '+cleared+' temporary caches. Your layout, saved work, and sign-in were kept. Reload the page to request fresh assets.';
    }catch(error){
      status.classList.add('bad');
      status.textContent='Unable to clear temporary caches in this browser. Your saved data remains untouched.';
      console.warn('[Big LWA] cache maintenance:',error);
    }finally{button.disabled=false}
  });
})();