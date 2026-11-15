/* BIG LWA Room topic discovery — source-attributed, never fabricated rankings.
 * UN dates are verified against the installed official-calendar overlay.
 * Instagram tags reflect only the signed-in member's connected media; no private
 * content is published. X and Instagram links are outbound live searches, NOT
 * claims that a topic trends on those platforms. */
(()=>{
 'use strict';
 if(window.BigLWARoomSignals)return;
 const iso=date=>date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
 const clean=value=>String(value||'').replace(/[^\p{L}\p{N}_ -]/gu,'').trim().slice(0,55);
 const queryLinks=(term)=>({
   x:'https://x.com/search?q='+encodeURIComponent(term)+'&f=live',
   instagram:'https://www.instagram.com/explore/tags/'+encodeURIComponent(term.replace(/^#/,'').toLowerCase().replace(/\s+/g,''))+'/'
 });
 function isOwner(){
  const uid=String(window.__biglwaIdentity?.uid||'').trim();
  return Boolean(uid)&&!document.documentElement.classList.contains('biglwa-preview-mode')&&!window.__biglwaPublicStorageView;
 }
 function fromInstagram(){
  if(!isOwner())return [];
  const state=window.__biglwaInstagramOrbit?.state;
  if(!state?.connected||!Array.isArray(state.media))return [];
  const counts=new Map(),cutoff=Date.now()-10*86400000;
  state.media.slice(0,80).forEach(item=>{
    const created=new Date(item.timestamp||item.created_time||item.createdAt||0).valueOf();
    if(!Number.isFinite(created)||created<cutoff||created>Date.now()+86400000)return;
    const tags=[...String(item.caption||'').matchAll(/#([\p{L}\p{N}_]{3,32})/gu)]
      .map(m=>clean(m[1])).filter(Boolean);
    new Set(tags).forEach(tag=>counts.set(tag,(counts.get(tag)||0)+1));
  });
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([tag,count])=>({
    title:'#'+tag,kind:'Connected Instagram',detail:count+' recent post'+(count===1?'':'s')+' in your own synced media · not a global trend',
    url:queryLinks(tag).instagram,links:queryLinks(tag)
  }));
 }
 async function load(){
  const items=[];
  try{
    const un=window.BigLWAObservances;
    if(un){
      await un.load();
      const now=new Date(),until=new Date(now);until.setDate(now.getDate()+14);
      const list=Array.isArray(un.data?.items)?un.data.items:[];
      const results=[];
      for(const item of list){
        const when=un.dateOf(item,now.getFullYear());
        if(!(when instanceof Date)||!Number.isFinite(when.valueOf()))continue;
        if(when<new Date(now.getFullYear(),now.getMonth(),now.getDate())||when>until)continue;
        if(!/^https:\/\/(?:www\.)?un\.org\//i.test(String(item.url||'')))continue;
        results.push({when,item});
      }
      results.sort((a,b)=>a.when-b.when);
      results.slice(0,6).forEach(({when,item})=>{
        const title=clean(item.title);
        if(!title)return;
        items.push({title,kind:'United Nations',detail:when.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' · Official observance (not social-platform ranking)',url:item.url,links:queryLinks(title),date:iso(when)});
      });
    }
  }catch{/* leave UN absent rather than invent topics */}
  items.push(...fromInstagram());
  return items.slice(0,11);
 }
 window.BigLWARoomSignals=Object.freeze({load,queryLinks,fromInstagram,version:'1.0.0'});
})();
