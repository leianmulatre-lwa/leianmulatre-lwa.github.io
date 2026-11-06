/* BIG LWA · one source-shadow vocabulary for Orbit, Archive, myfeed, Veve and Skeleton Key.
 * FACE = Studio widget's three-body color; ONE shadow = source color.
 * Source colors match existing feed/Orbit cards. No two-tone duplicate shadows.
 */
(()=>{
 'use strict';
 if(window.BigLWAShadowKey)return;
 const sources=Object.freeze([
  ['instagram','Instagram','#f36b21'],['tiktok','TikTok','#772dcc'],
  ['pinterest','Pinterest','#e60023'],['facebook','Facebook','#1658be'],
  ['youtube','YouTube','#fff1ec'],['snapchat','Snapchat','#ffda00'],
  ['tumblr','Tumblr','#1b304b'],['x','X','#0e0e0e'],
  ['soundcloud','SoundCloud','#ff7700'],['spotify','Spotify','#1db954'],
  ['drive','Google Drive','#e7be31'],['calendar','Calendar','#4285f4'],
  ['goodreads','Goodreads','#7a5c3e'],['letterboxd','Letterboxd','#2c3440'],
  ['imdb','IMDb','#e6a800'],['vsco','VSCO','#b51668'],
  ['bereal','BeReal','#777b83'],['substack','Substack','#da521b'],
  ['xbox','Xbox','#a3d65e'],
  ['website','My website · Aura','rgb(var(--aura-rgb,216,95,109))'],
  ['lwa','BIG LWA','rainbow'],['ad','Advertisement','#ffffff']
 ]);
 const widgetColors=Object.freeze({individual:'#d9c6ee',social:'#f7cddd',political:'#f8d4b0'});
 const groups=Object.freeze({
   orbit:'social',archive:'individual',feed:'social',veve:'social',skeleton:'social'
 });
 const common=new Set(['instagram','tiktok','pinterest','facebook','youtube','snapchat','tumblr','x','website','lwa','ad']);
 function render(module){
   const group=groups[module]||'social';
   const visible=module==='orbit'||module==='skeleton'?sources:
     sources.filter(s=>common.has(s[0]));
    return '<div class="module-shadow-key" data-shadow-key="'+module+'" data-widget-body="'+group+
    '" role="group" aria-label="Source shadow key: ivory card face, one source shadow">'+
    '<b>SHADOW KEY</b>'+
    visible.map(([id,label,shadow])=>
      '<span class="module-shadow-key-item" data-key-source="'+id+'">'+
      '<i class="shadow-preview" aria-hidden="true" style="--key-shadow:'+shadow+'"></i>'+
      '<span>'+label+'</span></span>').join('')+'</div>';
 }
 window.BigLWAShadowKey=Object.freeze({render,sources,widgetColors,groups});
})();
