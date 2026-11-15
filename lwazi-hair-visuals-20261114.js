/* L’wazi Hair Visual Library — original, accessible pattern diagrams.
 * The user provided 1a–4c and texture/density examples as visual references.
 * These SVGs are drawn for BIG LWA, never copied from a source image.
 * Hair classification is descriptive and imperfect; not a diagnosis. */
(()=>{
 'use strict';
 if(window.BigLWAHairVisuals)return;
 const types=[
 ['1a','Straight','Very little bend'],['1b','Straight','Subtle body'],['1c','Straight','Coarser bend'],
 ['2a','Wavy','Loose S waves'],['2b','Wavy','Defined S waves'],['2c','Wavy','Deeper waves'],
 ['3a','Curly','Large spiral curls'],['3b','Curly','Springy ringlets'],['3c','Curly','Tighter spirals'],
 ['4a','Coily','Small defined coils'],['4b','Coily','Compact bends'],['4c','Coily','Dense tight coils']
 ];
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function strokes(type){
  const group=Number(type[0]),variant=type.charCodeAt(1)-97;
  const waves={1:[.5,1.1,2],2:[5,7.5,10],3:[11,8,6.5],4:[4,3,2]}[group][variant];
  const freq={1:[.5,.75,1],2:[1.1,1.6,2],3:[3.5,4.7,6.2],4:[8.5,11.2,15]}[group][variant];
  let paths=[];
  for(let strand=0;strand<3;strand++){
   const x=21+strand*7.7;
   let d='';
   for(let k=0;k<=70;k++){
    const y=8+k*1.45;
    const z=k/70;
    let offset=Math.sin(z*Math.PI*2*freq+strand*.3)*waves;
    if(group===4&&variant===1)offset=Math.sin(z*Math.PI*2*freq+strand*.2)*waves+Math.sin(z*Math.PI*4*freq)*.9;
    const px=(x+offset).toFixed(2),py=y.toFixed(2);
    d+=(k===0?'M':'L')+px+' '+py+' ';
   }
   paths.push('<path d="'+d+'" fill="none" stroke="currentColor" stroke-width="'+(1.7+variant*.25)+'" stroke-linecap="round"/>');
  }
  return '<svg viewBox="0 0 66 120" role="img" aria-label="'+esc(type)+' hair strand pattern sketch" focusable="false">'+paths.join('')+'</svg>';
 }
 function isVisualPrompt(query){
  const q=String(query||'').toLowerCase();
  const aboutHair=/\b(hair|curl|curls|coils|coily|kink|kinky|afro|strand|porosity|density)\b/.test(q);
  const code=/\b[1-4][abc]\b/.test(q)&&/\b(hair|type|curl|pattern|texture|look|compare)\b/.test(q);
  const visual=/\b(type|typing|texture|pattern|density|strand|straight|wavy|curly|coily|kinky|look like|compare|chart|diagram|visual|identify|show me|my hair)\b/.test(q);
  return code||(aboutHair&&visual);
 }
 function markup(query){
  if(!isVisualPrompt(query))return '';
  const cards=types.map(([id,group,detail])=>
   '<figure class="lwazi-hair-type" data-hair-type="'+esc(id)+'">'+strokes(id)+
   '<figcaption><strong>'+esc(id.toUpperCase())+'</strong><span>'+esc(detail)+'</span></figcaption></figure>').join('');
  return '<article class="lwazi-hair-visual-model" aria-label="Hair pattern visual models">'+
   '<header><strong>Pattern, texture & density</strong><span>Illustrated comparison · 1A–4C</span></header>'+
   '<p>These sketches compare broad pattern families. A person can have several patterns on one head; curl type is not a measurement of strand thickness, density or porosity.</p>'+
   '<div class="lwazi-hair-types">'+cards+'</div>'+
   '<div class="lwazi-hair-properties"><div><b>Strand thickness</b><span>Fine · Medium · Coarse</span></div>'+
   '<div><b>Density</b><span>Low · Medium · High</span></div>'+
   '<div><b>Pattern</b><span>Straight · Wavy · Curly · Coily</span></div></div>'+
   '<small>Illustrative reference, not a medical assessment. Avoid assigning a definitive type from one photo or treating the chart as a hair-care rule.</small></article>';
 }
 window.BigLWAHairVisuals=Object.freeze({isVisualPrompt,markup,version:'1.0.0'});
})();
