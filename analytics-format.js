/* One number grammar for every audience figure on the site.
 * Followers stay exact below one million (no trailing "+"), while Reach and
 * Likes abbreviate thousands with k and millions with m. Abbreviated values
 * carry "+" because they are rounded down to one decimal place. */
(()=>{
 'use strict';
 if(typeof window.__biglwaFormatMetric==='function')return;
 const trim=value=>String(Math.round(value*10)/10).replace(/\.0$/,'');
 const count=value=>new Intl.NumberFormat().format(value);
 function formatMetric(kind,value){
  if(value===null||value===undefined||value===''||!Number.isFinite(Number(value))||Number(value)<0)return '—';
  const amount=Number(value),name=String(kind||'count').toLowerCase();
  if(name==='followers')return amount>=1e6?trim(amount/1e6)+'m+':count(amount);
  if(name==='reach'||name==='likes'){
   if(amount>=1e6)return trim(amount/1e6)+'m+';
   if(amount>=1000)return trim(amount/1000)+'k+';
  }
  return count(amount);
 }
 window.__biglwaFormatMetric=formatMetric;
})();
