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
 // Each additional anniversary has its OWN dated primary/source article.
 // These aren't live appointments, and an article publication date is not
 // automatically treated as the date of the historical event.
 const additions=Object.freeze([
  {id:'afi-home-alone-1990',month:11,day:16,year:1990,
   title:'Home Alone opens in cinemas',
   description:'The holiday comedy was released in US theaters on November 16, 1990.',
   source:'20th Century Studios',url:'https://family.20thcenturystudios.com/movies/home-alone'},
  {id:'afi-harry-potter-2001',month:11,day:16,year:2001,
   title:'The first Harry Potter film reaches cinemas',
   description:'The first Harry Potter film opened in the United States on November 16, 2001.',
   source:'American Film Institute',url:'https://catalog.afi.com/Catalog/moviedetails/53881'},
  {id:'aj-english-launch-2006',month:11,day:15,year:2006,
   title:'Al Jazeera English launches',
   description:'Al Jazeera English began broadcasting on November 15, 2006, adding another international television-news voice.',
   source:'Al Jazeera English',url:'https://www.aljazeera.com/news/2026/11/15/al-jazeera-english-marks-20-years-stories-that-shaped-the-journey'}
 ].map(e=>Object.freeze({...e,category:'pop-culture-history',readOnly:true})));
 const allEvents=Object.freeze([...events,...additions]);
 function onDay(key){
  const match=/^\d{4}-(\d{2})-(\d{2})$/.exec(String(key||''));
  if(!match)return [];
  const month=Number(match[1]),day=Number(match[2]);
  return allEvents.filter(e=>e.month===month&&e.day===day)
   .map(e=>({...e,pop:true,meta:e.year+' · '+e.source}));
 }
 function forMonth(month){
  return allEvents.filter(e=>e.month===Number(month)).map(e=>({...e}));
 }
 window.BigLWAPopCultureCalendar=Object.freeze({
  onDay,forMonth,source:SOURCE,version:'1.1.0'
 });
})();
