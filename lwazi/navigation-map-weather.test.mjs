import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('lwazi-navigation-commands.js');
const search=read('user-search-results.js');
const extras=read('lwazi-discovery-extras.js');
const map=read('map-app.html');
const weather=read('studio-weather.js');
const css=read('lwazi-navigation-map-weather.css');
const legal=read('legal/index.html');
function nav(){
  const navigated=[],clicked=[];
  const window={
    location:{assign:path=>navigated.push(path)},
    __biglwaOpenSearchCategory:cat=>{clicked.push(cat);return true},
    openBIGLWAModule:route=>clicked.push('widget:'+route),
    addEventListener(){}
  };
  const document={readyState:'loading',addEventListener(){},
    querySelector:sel=>sel==='#studioApp'?{querySelector:()=>({click:()=>clicked.push('skeleton')}),classList:{contains:()=>false}}:null};
  vm.runInNewContext(source,{window,document,setTimeout,console});
  return {api:window.BigLWANavigationCommands,navigated,clicked};
}
test('natural language commands reach real destinations and do not capture ordinary questions',()=>{
 const {api}=nav();
 for(const [phrase,path] of [
  ['take me to studio','/studio'],['please open settings','/settings/'],
  ['could you navigate to legal pages','/legal/'],['go to privacy','/privacy/'],
  ['show me the affidavit of good faith','/affidavit/'],['open about','/about/'],
  ['take me to terms','/terms/'],['open rights and likeness','/rights/']
 ])assert.equal(api.resolve(phrase)?.path,path,phrase);
 assert.equal(api.resolve('open skeleton key')?.type,'skeleton');
 assert.equal(api.resolve('show widgets')?.category,'widgets');
 assert.equal(api.resolve('take me to the map widget')?.route,'map');
 for(const phrase of ['why did i go to studio','where is the map?','how does a legal contract work','take me to mars','what is the skeleton key?'])
  assert.equal(api.resolve(phrase),null,'Do not navigate exploratory search: '+phrase);
});
test('actions open the correct Studio page, widgets and categories with real handlers',()=>{
 const {api,navigated,clicked}=nav();
 assert(api.navigate(api.resolve('take me to studio')));
 assert(api.navigate(api.resolve('go to settings')));
 assert(api.navigate(api.resolve('open skeleton key')));
 assert(api.navigate(api.resolve('show widgets')));
 assert(api.navigate(api.resolve('open journal')));
 assert.deepEqual(navigated,['/studio','/settings/']);
 assert.deepEqual(clicked,['skeleton','widgets','widget:diary']);
 assert.match(source,/aria-label','Show L’wazi navigation commands/);
 assert.match(source,/menu\.append\(b\)/);
 assert.match(source,/trigger\.addEventListener\('click'/);
});
test('Lwazi resolves navigation before fetching ordinary public search results',()=>{
 assert.match(search,/var navCommand=window\.BigLWANavigationCommands\?\.resolve\(q\)/);
 assert.match(search,/window\.BigLWANavigationCommands\.navigate\(navCommand\)/);
 assert.match(search,/window\.__biglwaOpenSearchCategory=function\(category\)/);
 assert.match(search,/activateCategory\(options\.preferredCategory\|\|'all',false\)/);
});
test('weather displays explicitly chosen city and sits left of account actions',()=>{
 assert.match(weather,/String\(city\?\.name\|\|''\)\.split\(','\)\[0\]/);
 assert.match(weather,/button\.replaceChildren\(conditions\)/);
 assert.match(weather,/if\(actions\)actions\.prepend\(button\)/);
 assert.match(weather,/weather-code/);
 assert.match(css,/top-actions>\.studio-weather/);
 assert.match(css,/\.studio-weather-city/);
 assert.doesNotMatch(weather,/navigator\.geolocation/,'Weather never silently accesses precise location');
});
test('Map uses existing interactive Leaflet preview and only asks for location on click',()=>{
 assert.match(extras,/src="\/map-app\.html\?preview=1&lwazi=1"/);
 assert.match(extras,/function placePromo\(\)/);
 assert.match(extras,/data-bl-use-location/);
 assert.match(extras,/navigator\.geolocation\.getCurrentPosition\(position=>/);
 assert.match(extras,/Math\.round\(position\.coords\.latitude\*100\)\/100/);
 assert.match(extras,/Math\.round\(position\.coords\.longitude\*100\)\/100/);
 assert.match(extras,/enableHighAccuracy:false/);
 assert.match(map,/biglwa:lwazi-map-location/);
 assert.match(map,/L\.circle\(\[lat,lng\]/);
 assert.match(map,/Your approximate location · not saved/);
 assert.match(extras,/option value="transit"/);
 assert.match(extras,/data-bl-open-places="walking"/);
 assert.match(search,/window\.BigLWADiscoveryExtras\.placePromo\(\)/);
 assert.match(css,/\.bl-lwazi-map-promo/);
 assert.match(css,/\.bl-lwazi-map-stage iframe/);
});
test('vinyl buttons are anchored in a real player rail and visible album art remains dominant',()=>{
 assert.match(css,/\.bl-search-card\.bl-search-song\.bl-search-veve-card::after/);
 assert.match(css,/content:"♫  SONG"/);
 assert.match(css,/\.bl-search-song \.bl-card-window-controls/);
 assert.match(css,/top:8px!important;right:11px!important/);
 assert.match(css,/\.bl-search-song \.bl-vinyl-record/);
});
test('real legal index and all shell entrypoints are available',()=>{
 for(const path of ['/about/','/privacy/','/terms/','/rights/','/affidavit/'])
  assert(legal.includes('href="'+path+'"'),'Legal links to '+path);
 for(const path of ['index.html','studio/index.html','404.html','live-studio-shell.html']){
   const shell=read(path);
   assert(shell.includes('lwazi-navigation-commands.js?v=20261113-navigation-v1'),path+' loads navigation');
   assert(shell.includes('lwazi-navigation-map-weather.css?v=20261113-navmap-v1'),path+' loads updated chrome');
   assert(shell.indexOf('lwazi-navigation-commands.js')<shell.indexOf('user-search-results.js'),path+' routes loaded first');
   assert(shell.includes('studio-weather.js?v=20261113-city-header-v2'),path+' city weather cache bust');
 }
});
