/* BIG LWA · Ge'ez / Ethiopian civil calendar display adapter.
   Dates remain local Gregorian Date objects in Google Orbit, saved events,
   observances and weekly crushes. Only presentation changes.
   Uses ICU's ethiopic calendar rather than inaccurate fixed year offsets. */
(()=>{'use strict';
 if(window.BigLWAGeezCalendar)return;
 const names=[
  ['Meskerem','መስከረም'],['Tikimt','ጥቅምት'],['Hidar','ኅዳር'],
  ['Tahsas','ታኅሣሥ'],['Tir','ጥር'],['Yekatit','የካቲት'],
  ['Megabit','መጋቢት'],['Miazia','ሚያዝያ'],['Ginbot','ግንቦት'],
  ['Sene','ሰኔ'],['Hamle','ሐምሌ'],['Nehase','ነሐሴ'],
  ['Pagume','ጳጉሜን']
 ];
 const weekdays=[
  ['Ehud','እሑድ'],['Segno','ሰኞ'],['Maksegno','ማክሰኞ'],
  ['Rebu','ረቡዕ'],['Hamus','ሐሙስ'],['Arb','ዓርብ'],
  ['Kidame','ቅዳሜ']
 ];
 const formatter=(()=>{
  try{
   const fmt=new Intl.DateTimeFormat('en-u-ca-ethiopic',{calendar:'ethiopic',year:'numeric',month:'numeric',day:'numeric'});
   return fmt.resolvedOptions().calendar==='ethiopic'?fmt:null;
  }catch{return null;}
 })();
 const supported=Boolean(formatter);
 const noon=input=>new Date(input.getFullYear(),input.getMonth(),input.getDate(),12);
 function parts(date){
  if(!supported)return null;
  const vals={};
  formatter.formatToParts(noon(date)).forEach(piece=>{
   if(['month','day','year'].includes(piece.type))vals[piece.type]=Number(piece.value);
  });
  const month=vals.month,year=vals.year,day=vals.day;
  if(!Number.isInteger(month)||month<1||month>13||!Number.isInteger(day)||day<1||day>30||!Number.isInteger(year))return null;
  return {month,year,day,name:names[month-1][0],script:names[month-1][1]};
 }
 function monthStart(date){
  const value=parts(date);if(!value)return null;
  const start=noon(date);start.setDate(start.getDate()-(value.day-1));return start;
 }
 function monthEnd(start){
  const current=parts(start);if(!current)return null;
  const cursor=noon(start);
  for(let i=0;i<32;i++){
   cursor.setDate(cursor.getDate()+1);
   const next=parts(cursor);
   if(next&&(next.month!==current.month||next.year!==current.year))return cursor;
  }
  return null;
 }
 function shift(date,delta){
  if(!supported||!Number.isInteger(delta)||Math.abs(delta)>240)return null;
  let begin=monthStart(date);
  for(let i=0;i<Math.abs(delta);i++){
   if(delta>0)begin=monthEnd(begin);
   else{const last=noon(begin);last.setDate(last.getDate()-1);begin=monthStart(last);}
   if(!begin)return null;
  }
  return begin;
 }
 function grid(date){
  const start=monthStart(date),end=start&&monthEnd(start);
  if(!start||!end)return null;
  const duration=Math.round((end-start)/86400000);
  const leading=start.getDay();
  const total=Math.max(14,Math.ceil((leading+duration)/7)*7);
  const first=noon(start);first.setDate(first.getDate()-leading);
  const dates=Array.from({length:total},(_,index)=>{
   const d=noon(first);d.setDate(first.getDate()+index);return d;
  });
  return {start,end,dates,days:duration,month:parts(start)};
 }
 function display(date){
  const p=parts(date);
  return p?p.script+' · '+p.name+' '+p.day+', '+p.year+' E.C.':'';
 }
 function label(date){
  const p=parts(date);
  return p?p.script+' · '+p.name+' '+p.year+' E.C.':'';
 }
 window.BigLWAGeezCalendar=Object.freeze({
  supported,parts,monthStart,monthEnd,shift,grid,display,label,
  months:names.map(row=>Object.freeze([...row])),
  weekdays:weekdays.map(row=>Object.freeze([...row]))
 });
})();
