/* BIG LWA Room topic discovery — source-attributed, never fabricated rankings.
 * Culture dates use the existing sourced calendar; editorial headlines are not trend rankings.
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
 const curated=[
  {title:'Black music & cultural history',kind:'Culture spotlight',detail:'Explore music, art and community history.',url:'https://nmaahc.si.edu/explore',links:queryLinks('Black music history')},
  {title:'Independent film & new voices',kind:'Culture spotlight',detail:'Film, directors and independent storytelling.',url:'https://www.sundance.org/',links:queryLinks('independent film')},
  {title:'Fashion, design & visual culture',kind:'Culture spotlight',detail:'Collections, exhibitions and creative history.',url:'https://www.metmuseum.org/about-the-met/collection-areas/the-costume-institute',links:queryLinks('fashion design')},
  {title:'Sounds from the diaspora',kind:'Culture spotlight',detail:'Music and cultural traditions from around the world.',url:'https://folkways.si.edu/',links:queryLinks('diaspora music')}
 ];
 async function load(){
  const now=new Date(),today=iso(now),tomorrow=new Date(now);tomorrow.setDate(now.getDate()+1);
  const items=[];
  for(const [day,label] of [[today,'Today'],[iso(tomorrow),'Tomorrow']]){
    for(const e of window.BigLWAPopCultureCalendar?.onDay?.(day)||[]){
      if(!/^https:\/\//i.test(e.url||''))continue;
      items.push({title:String(e.title||'').slice(0,140),kind:'Culture anniversary',detail:label+' · '+e.year+' · '+e.source,url:e.url,links:queryLinks(e.title),date:day});
    }
  }
  try{
    const u='https://public-api.wordpress.com/rest/v1.1/sites/writerofpop.com/posts/?number=5&fields=title,URL,date';
    const res=await fetch(u,{credentials:'omit',signal:AbortSignal.timeout(4500)});
    if(res.ok){const data=await res.json();for(const p of (data.posts||[]).slice(0,4)){
      const link=new URL(p.URL);if(link.protocol!=='https:'||!['writerofpop.com','www.writerofpop.com'].includes(link.hostname))continue;
      const title=String(p.title||'').replace(/<[^>]*>/g,'').trim().slice(0,140);
      if(!title)continue;const date=new Date(p.date);if(!Number.isFinite(date.valueOf())||date>Date.now()+86400000||Date.now()-date.valueOf()>30*86400000)continue;
      items.push({title,kind:'Culture editorial',detail:date.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' · Writer of Pop Culture',url:link.href,links:queryLinks(title)});
    }}
  }catch{/* A missing news feed must not invent recent stories. */}
  items.push(...fromInstagram().slice(0,3),...curated);
  return items.slice(0,10);
 }
 window.BigLWARoomSignals=Object.freeze({load,queryLinks,fromInstagram,version:'1.0.0'});
})();
