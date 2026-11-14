/* BIG LWA Calendar · source-linked editorial anniversaries.
 * The source article was supplied by the site owner. These are short, original
 * summaries of date-specific facts, not a reproduction of the article.
 * They are read-only anniversaries and never Google Calendar appointments. */
(()=>{
 'use strict';
 if(window.BigLWAPopCultureCalendar)return;
 const SOURCE='https://writerofpop.com/2020/01/20/this-day-in-pop-culture-for-january-20/';
 const events=Object.freeze([
  {year:1954,title:'National Negro Network founded',description:'A pioneering Black-owned American radio network began on January 20, 1954.'},
  {year:1971,title:'Marvin Gaye · What’s Going On',description:'The article marks the single’s release and its commentary on police violence.'},
  {year:1982,title:'Ozzy Osbourne’s bat incident',description:'The singer’s notorious onstage bat incident occurred on January 20.'},
  {year:1986,title:'First federal Martin Luther King Jr. Day',description:'The United States observed the federal holiday for the first time. Future observances fall on the third Monday of January, not always January 20.'},
  {year:2006,title:'High School Musical premieres',description:'The Disney Channel movie premiered on January 20 and helped define a generation of teen musicals.'},
  {year:2008,title:'Breaking Bad debuts',description:'The American television drama began its run on January 20.'}
 ].map((e,i)=>Object.freeze({
  ...e,id:'writerofpop-0120-'+i,
  month:1,day:20,source:'Writer of Pop Culture',
  url:SOURCE,category:'pop-culture-history',readOnly:true
 })));
 function onDay(key){
  if(!/^\d{4}-01-20$/.test(String(key||'')))return [];
  return events.map(e=>({...e,pop:true,meta:e.year+' · '+e.source}));
 }
 function forMonth(month){
  return Number(month)===1?events.map(e=>({...e})): [];
 }
 window.BigLWAPopCultureCalendar=Object.freeze({onDay,forMonth,source:SOURCE,version:'1.0.0'});
})();
