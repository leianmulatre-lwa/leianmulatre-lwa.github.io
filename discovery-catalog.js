/* Public source metadata only. Vibe matching works without a model or watch-history access. */
(()=>{'use strict';
if(window.BigLWADiscoveryCatalog)return;
let snapshot={videos:[],stories:[],radio:[]},request;
const normal=value=>String(value||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const vibes=[['cozy','calm','soft','lofi','ambient','study','rain','unwind'],['fashion','style','outfit','streetwear','runway','editorial','lookbook'],['retro','vintage','nostalgia','y2k','archive','old internet'],['funny','comedy','humor','laugh'],['gaming','games','playthrough','gameplay'],['news','politics','organizing','justice','bernie'],['art','design','drawing','illustration','creative']];
function terms(query){const words=normal(query).split(' ').filter(w=>w.length>2&&!['the','and','for','with','find','show','some','vibe','vibes','videos','images'].includes(w));return [...new Set(words.concat(vibes.filter(group=>group.some(w=>words.includes(w))).flat()))]}
function score(item,query){const hay=normal([item.title,item.name,item.creator,item.caption,item.description,item.subtitle,item.tags,item.topics,item.school,item.state].flat().join(' '));return terms(query).reduce((n,word)=>n+(hay.includes(word)?1:0),0)}
async function load(){
 if(request)return request;
 request=(async()=>{
  try{const response=await fetch('/assets/discovery/latest.json',{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Catalog unavailable');const data=await response.json();
   for(const key of ['videos','stories','radio'])snapshot[key]=Array.isArray(data[key])?data[key]:[];
   snapshot.generatedAt=data.generatedAt;document.dispatchEvent(new CustomEvent('biglwa:discovery-ready'));
  }catch{request=null}
  return snapshot;
 })();return request;
}
// 06–12 morning, 12–18 midday, 18–06 night. Independent counters prevent
// a station from being permanently stranded in one time of day.
function radioPick(stations,date,hour){
 const queue=stations.slice().sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 const ucla=queue.find(s=>/^UCLA Radio$/i.test(s.title));
 if(ucla)queue.splice(Math.ceil(queue.length/2),0,ucla);
 if(!queue.length)return null;
 const parts=String(date).split('-').map(Number),day=Math.floor(Date.UTC(parts[0],parts[1]-1,parts[2])/86400000);
 const slot=hour>=6&&hour<12?day*6+hour-6:hour>=12&&hour<18?day*6+hour-12:day*12+(hour>=18?hour-18:hour+6);
 return queue[((slot%queue.length)+queue.length)%queue.length];
}
window.BigLWADiscoveryCatalog={load,score,terms,radioPick,get data(){return snapshot}};
})();
