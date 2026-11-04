/* BIG LWA — independently load local MIT-licensed Mux media elements.
   If a browser rejects one player, the existing original-provider iframe fallback stays usable.
   https://github.com/muxinc/media-elements (2026-10-22 snapshot) */
(async function(){
  if(typeof window==='undefined'||!window.customElements)return;
  const root='/assets/media-elements/';
  const modules=['youtube-video-element','tiktok-video-element','spotify-audio-element'];
  const results=await Promise.allSettled(modules.map(name=>import(root+name+'.js')));
  window.BigLWAStreamMediaElements={
    ready:true,
    available:Object.fromEntries(modules.map((name,i)=>[name,results[i].status==='fulfilled'])),
    source:'muxinc/media-elements'
  };
  window.dispatchEvent(new Event('biglwa:stream-media-elements-ready'));
})().catch(error=>console.warn('BIG LWA original embed fallback available',error));
