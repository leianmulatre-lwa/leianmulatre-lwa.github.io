/* BIG LWA · Multi-purpose Map mode rail and honest provider setup
 * Existing Map panels handle pins/routes; this layer only navigates them.
 * No OAuth token, fake fare, automatic geolocation, or user data is exposed.
 */
(()=>{
 'use strict';
 const params=new URLSearchParams(location.search);
 if(params.has('preview')||(window.parent!==window&&window.parent.__biglwaPublicStorageView))return;
 if(window.BigLWAMapPurposes)return;
 const side=document.querySelector('.map-side');
 const planner=document.getElementById('mapTripPlanner');
 if(!side||!planner)return;
 const el=(tag,cls,text)=>{
  const node=document.createElement(tag);if(cls)node.className=cls;
  if(text!==undefined)node.textContent=text;return node;
 };
 const modes=[
  {id:'routes',name:'↗ Routes',description:'Road, walking, transit and cycling routes'},
  {id:'places',name:'⌖ Places',description:'Nearby places and landmarks'},
  {id:'culture',name:'✦ Culture',description:'Real film, TV, music and Black cultural landmarks'},
  {id:'saved',name:'▤ Saved',description:'Your private pins and places'},
  {id:'music',name:'♫ Music',description:'Local radio, tunes and music services'},
  {id:'connections',name:'◉ Connect',description:'Review transport and music integration readiness'}
 ];
 let active='routes';
 const rail=el('nav','map-purpose-rail');
 rail.id='mapPurposeRail';
 rail.setAttribute('aria-label','Map uses');
 const intro=el('div','map-purpose-heading');
 intro.append(el('strong','','Explore your world'),el('small','','Places · routes · sounds · scenes'));
 rail.append(intro);
 const bar=el('div','map-purpose-buttons');bar.setAttribute('role','group');bar.setAttribute('aria-label','Choose Map tools');
 const panel=el('section','map-purpose-panel');panel.id='mapPurposePanel';
 panel.setAttribute('aria-live','polite');
 panel.hidden=true;
 const actions={};
 const jump=(id)=>{
  const tab=document.getElementById('mapTab'+id);
  if(tab){tab.click();tab.focus({preventScroll:true});return true}
  return false;
 };
 function link(text,href,klass=''){
  const a=el('a',klass,text);a.href=href;
  a.target=href.startsWith('https://')?'_blank':'_top';
  if(a.target==='_blank')a.rel='noopener noreferrer';
  return a;
 }
 function currentMode(next){
  if(!modes.some(x=>x.id===next))return false;
  if(active==='culture'&&next!=='culture')window.BigLWAMapCulture?.clear?.();
  active=next;
  for(const [key,button] of Object.entries(actions)){
   button.setAttribute('aria-pressed',String(key===next));
  }
  panel.replaceChildren();
  panel.hidden=next!=='music'&&next!=='connections'&&next!=='culture';
  if(next==='routes'){jump('plan');}
  else if(next==='places'){
   jump('nearby');
   // Places is an explicit opt-in: reveal the existing discovery panel and
   // mark stores, cafés and mapped locations in one combined nearby layer.
   if(typeof window.dispatchEvent==='function'&&typeof Event==='function')
    window.dispatchEvent(new Event('biglwa:map-discover-open'));
   window.BigLWAMapDiscover?.load?.('auto');
  }else if(next==='saved'){jump('saved');}
  else if(next==='culture'){
   if(window.BigLWAMapCulture?.render){
    window.BigLWAMapCulture.render(panel,{onRoute:()=>currentMode('routes')});
   }else panel.append(el('p','','Culture places are unavailable. Route and saved pins still work.'));
  }
  else if(next==='music'){
   const h=el('h3','','Sound & place');panel.append(h);
   panel.append(el('p','','Find college radio by state and world stations by country and language in LWA Stream. Spotify playlists will be available only after account authorization is installed.'));
   const group=el('div','map-purpose-actions');
   group.append(link('Open LWA Radio ↗','/studio/stream'),link('Manage Spotify in Orbit ↗','/studio/orbit'));
   panel.append(group);
  }else if(next==='connections'){
   panel.append(el('h3','','Provider connections'));
   const group=el('div','map-purpose-connections');
   for(const entry of [
    {name:'Uber · Rides',status:'OAuth setup required',detail:'Ride booking handoff works; approved API access and a server callback are not yet available.',link:'https://m.uber.com/'},
    {name:'Lyft · Rides',status:'API setup required',detail:'Open Lyft for real quotes. Account-linked fare API is not connected.',link:'https://www.lyft.com/rider'},
    {name:'Spotify · Music',status:'OAuth setup required',detail:'Public links work; private playlist syncing needs the Spotify OAuth callback.',link:'https://open.spotify.com/'}
   ]){
    const item=el('article','map-purpose-connection');
    item.append(el('strong','',entry.name),el('span','map-purpose-status',entry.status),el('p','',entry.detail));
    const buttons=el('div','map-purpose-actions');
    buttons.append(link('Set up in Orbit ↗','/studio/orbit'),link('Open provider ↗',entry.link));
    item.append(buttons);group.append(item);
   }
   panel.append(group);
   panel.append(el('p','map-purpose-disclaimer','A public app ID or saved profile link does not mean a connected OAuth session. No estimated fares or saved music data are requested here.'));
  }
  return true;
 }
 for(const mode of modes){
  const button=el('button','map-purpose-tab',mode.name);
  button.type='button';button.title=mode.description;
  button.dataset.mapPurpose=mode.id;
  button.setAttribute('aria-pressed',String(mode.id===active));
  button.addEventListener('click',()=>currentMode(mode.id));
  actions[mode.id]=button;bar.append(button);
 }
 rail.append(bar,panel);
 const brand=side.querySelector('.map-brand-strip');
 if(brand)brand.insertAdjacentElement('afterend',rail);
 else side.prepend(rail);
 // Map mode shortcuts don't replace the original pin, route or travel controls.
 window.BigLWAMapPurposes=Object.freeze({choose:currentMode,getMode:()=>active});
})();