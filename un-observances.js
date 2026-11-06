/* Read-only public calendar overlay; never writes into personal calendar storage. */
(()=>{
'use strict';let data=null,pending=null;
function dateOf(item,year){
 if(item.variableDate)return null; // Lunar observances need a verified year-specific date.
 if(item.weekdayRule){const [month,weekday,nth]=item.weekdayRule;
  // Python/ISO weekday order is Monday=0; JavaScript starts with Sunday.
  const day=(weekday+1)%7;
  if(nth<0){const end=new Date(year,month,0);return new Date(year,month-1,end.getDate()-((end.getDay()-day+7)%7))}
  const first=new Date(year,month-1,1);return new Date(year,month-1,1+(day-first.getDay()+7)%7+(nth-1)*7);
 }
 return new Date(year,item.month-1,item.day);
}
function onDay(key){if(!data)return [];const [year,month,day]=key.split('-').map(Number);return data.items.filter(item=>{const date=dateOf(item,year);return date&&date.getMonth()+1===month&&day>=date.getDate()&&day<=(item.endDay||date.getDate())}).map(item=>({...item,un:true,meta:'UN observance · All day'}))}
async function load(){if(data)return data;if(pending)return pending;pending=fetch('/assets/un-observances.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('UN observances unavailable');return r.json()}).then(value=>{if(!Array.isArray(value.items))throw Error('Invalid observance calendar');data=value;document.dispatchEvent(new CustomEvent('biglwa:observances-ready'));return value}).finally(()=>{pending=null});return pending}
window.BigLWAObservances={load,onDay,dateOf,get data(){return data}};
})();
