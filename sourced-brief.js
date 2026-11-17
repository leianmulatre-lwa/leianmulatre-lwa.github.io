/* In-page reading of explicitly supplied public sources. No private profile,
   calendar appointments or GPS coordinates are passed to the model. */
(()=>{'use strict';
 const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text||'';return n;};
 function mount(host,sources,question){
  if(!host||!sources?.length)return;
  const section=el('section');section.className='lwa-source-brief';
  const button=el('button','Summarize these sources');button.type='button';
  const output=el('p');output.setAttribute('role','status');output.style.whiteSpace='pre-line';
  const refs=el('div');refs.className='lwa-source-refs';
  const safe=sources.filter(s=>/^https:\/\//.test(s.url||'')).slice(0,6);
  safe.forEach((s,i)=>{const a=el('a',(i+1)+'. '+s.title);a.href=s.url;a.target='_blank';a.rel='noopener';refs.append(a);});
  button.addEventListener('click',async()=>{
   button.disabled=true;output.textContent='Reading the loaded public source material…';
   try{
    if(typeof window.__biglwaAskLwazi!=='function')throw Error('L’wazi is unavailable. The sourced information above is still available.');
    const result=await window.__biglwaAskLwazi(question+' Use only the supplied source excerpts. Cite source numbers. Distinguish missing information from facts; never invent dates, prices, quotes or live availability. Keep it under 150 words.',safe,'',null,{mode:'auto'});
    if(section.isConnected)output.textContent=result;
   }catch(error){output.textContent=error.message||'Summary unavailable. Try again.';}
   finally{button.disabled=false;}
  });
  section.append(button,output,refs);host.append(section);return section;
 }
 const pricing=[
  {title:'Uber pricing',url:'https://developer.uber.com/docs/riders/references/api/v1.2/estimates-price-get',snippet:'Route-specific price estimates require access to the Uber estimate API. No quote has been retrieved for this trip.'},
  {title:'Lyft pricing',url:'https://help.lyft.com/hc/en-us/all/articles/115012925707-Ride-pricing-and-charges',snippet:'Lyft shows upfront prices for entered pickup and drop-off locations. Demand and ride changes affect price. No quote has been retrieved for this trip.'},
  {title:'Waymo pricing',url:'https://support.google.com/waymo/answer/9059184?hl=en',snippet:'Waymo provides up-to-date fare estimates in its app. No quote has been retrieved for this trip.'}
 ];
 function fares(host){
  if(!host||host.querySelector('.lwa-fare-comparison'))return;
  const panel=el('section');panel.className='lwa-fare-comparison';panel.append(el('h3','Compare ride costs'));
  const list=el('dl');for(const name of ['Uber','Waymo','Lyft']){list.append(el('dt',name),el('dd','Route estimate unavailable'));}
  panel.append(list,el('p','No route-specific fares have been returned. Prices depend on demand, service area, fees and pickup time.'));
  mount(panel,pricing,'Explain the available pricing information for these three services, and what is missing for a reliable comparison. Do not rank prices without quotes.');host.append(panel);
 }
 window.BigLWASourceBrief=Object.freeze({mount,fares});
})();
