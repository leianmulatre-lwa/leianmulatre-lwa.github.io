/* City-level weather only; no automatic location permission or precise GPS. */
(()=>{
'use strict';
const KEY='biglwaWeatherCity:v1';let city=null,button,timer,request=0;
try{city=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}
const emoji=(code,day)=>code===0?(day?'☀️':'🌙'):code<=3?'☁️':code<=48?'🌫️':code<=67?'🌧️':code<=77?'🌨️':code<=82?'🌦️':code<=86?'❄️':'⛈️';
async function refresh(){
 if(!button||!city||document.hidden)return;
 const id=++request;button.textContent='🌤️ …';
 try{
  const url=new URL('https://api.open-meteo.com/v1/forecast');
  url.search=new URLSearchParams({latitude:city.latitude,longitude:city.longitude,current:'temperature_2m,weather_code,is_day',temperature_unit:'fahrenheit',timezone:'auto'});
  const response=await fetch(url,{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Weather unavailable');
  const data=await response.json();if(id!==request)return;
  if(!Number.isFinite(data.current?.temperature_2m))throw Error('Weather unavailable');
  button.textContent=emoji(data.current.weather_code,data.current.is_day)+' '+Math.round(data.current.temperature_2m)+'°F';
  button.title=city.name+' · Updated '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' · Open-Meteo · Change city';
  button.setAttribute('aria-label',button.textContent+' in '+city.name+'. Change weather city');
 }catch{if(id===request){button.textContent='🌤️ —';button.title='Weather unavailable. Click to choose a city or retry.'}}
}
function choose(){
 let dialog=document.getElementById('studioWeatherDialog');
 if(!dialog){
  dialog=document.createElement('dialog');dialog.id='studioWeatherDialog';dialog.setAttribute('aria-label','Choose weather city');
  dialog.innerHTML='<form><h2>Weather</h2><label>City <input name="city" required maxlength="100" autocomplete="address-level2" placeholder="City or postal code"></label><button type="submit">Find</button></form><p role="status"></p><div class="weather-results"></div><p><a href="https://open-meteo.com/" target="_blank" rel="noopener">Weather data: Open-Meteo</a> · <a href="https://weather.com/" target="_blank" rel="noopener">Full forecast ↗</a></p><button type="button" data-close>Close</button>';
  document.body.append(dialog);dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.querySelector('form').onsubmit=async e=>{
   e.preventDefault();const status=dialog.querySelector('[role="status"]'),results=dialog.querySelector('.weather-results'),submit=e.target.querySelector('button');
   status.textContent='Finding cities…';results.replaceChildren();submit.disabled=true;
   try{
    const url=new URL('https://geocoding-api.open-meteo.com/v1/search');url.search=new URLSearchParams({name:e.target.elements.city.value.trim(),count:5,language:'en',format:'json'});
    const response=await fetch(url,{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('City search unavailable. Try again.');
    const data=await response.json();status.textContent=data.results?.length?'Choose your city:':'No cities found. Try a nearby city.';
    for(const item of data.results||[]){const choice=document.createElement('button');choice.type='button';choice.textContent=[item.name,item.admin1,item.country].filter(Boolean).join(', ');choice.onclick=()=>{city={name:choice.textContent,latitude:item.latitude,longitude:item.longitude};try{localStorage.setItem(KEY,JSON.stringify(city))}catch{}dialog.close();refresh()};results.append(choice)}
   }catch(error){status.textContent=error.message}finally{submit.disabled=false}
  };
 }
 dialog.showModal();dialog.querySelector('input').focus();
}
function mount(){
 const search=document.querySelector('#studioApp .topbar .search-wrap');if(!search||document.getElementById('studioWeather'))return;
 button=document.createElement('button');button.id='studioWeather';button.type='button';button.className='studio-weather';button.textContent='🌤️ Weather';button.title='Choose a city for weather';button.onclick=choose;search.after(button);refresh();clearInterval(timer);timer=setInterval(refresh,15*60*1000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
document.addEventListener('biglwa:account-ready',mount);setTimeout(mount,1500);setTimeout(mount,4000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
})();
