/* BIG LWA navigation rule: normal off-site links must never replace Studio.
 * OAuth handoffs and explicit site navigation happen through app code, not anchors.
 */
(()=>{
 'use strict';
 if(window.__biglwaExternalLinkPolicyV1)return;
 window.__biglwaExternalLinkPolicyV1=true;
 function mark(anchor){
   if(!anchor?.href || anchor.hasAttribute('download'))return;
   let url;
   try{url=new URL(anchor.href,location.href)}catch{return}
   if(!['http:','https:'].includes(url.protocol)||url.origin===location.origin)return;
   anchor.setAttribute('target','_blank');
   anchor.setAttribute('rel','noopener noreferrer');
   if(!anchor.title)anchor.title='Opens '+url.hostname+' in a new tab';
 }
 // Capture before native link navigation. Leave JS auth redirects untouched.
 document.addEventListener('click',e=>{
   const a=e.target?.closest?.('a[href]');
   if(a)mark(a);
 },true);
 document.addEventListener('auxclick',e=>{
   const a=e.target?.closest?.('a[href]');
   if(a)mark(a);
 },true);
 // Apply to keyboard activation and links added by delayed modules.
 document.addEventListener('keydown',e=>{
   if(e.key==='Enter')mark(document.activeElement?.closest?.('a[href]'));
 },true);
 const apply=()=>document.querySelectorAll('a[href]').forEach(mark);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
 else apply();
 // Mark newly rendered links without observing every changed attribute.
 const watch=new MutationObserver(records=>{
   for(const record of records)for(const node of record.addedNodes){
     if(node.nodeType!==1)continue;
     if(node.matches?.('a[href]'))mark(node);
     node.querySelectorAll?.('a[href]').forEach(mark);
   }
 });
 const begin=()=>watch.observe(document.body,{childList:true,subtree:true});
 if(document.body)begin();else document.addEventListener('DOMContentLoaded',begin,{once:true});
})();