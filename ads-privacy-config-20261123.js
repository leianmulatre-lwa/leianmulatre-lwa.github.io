/* No paid inventory is active. Never fake certification or publisher approval. */
(function(){
'use strict';
const config=Object.freeze({enabled:false,certifiedCmpPublished:false,publisherApproved:false});
const prohibited=new Set(['feed','myfeed','photo-grid','archive','profile-photos']);
const allowedSurface=section=>!prohibited.has(String(section||'').toLowerCase());
function canLoad(){return config.enabled&&config.certifiedCmpPublished&&config.publisherApproved;}
function createCard(campaign,section){
 if(!canLoad()||!allowedSurface(section)||campaign?.approved!==true)return null;
 let url;try{url=new URL(campaign.destination);if(url.protocol!=='https:')return null;}catch{return null;}
 const item=document.createElement('article');item.className='biglwa-sponsored-card';item.setAttribute('aria-label','Sponsored advertisement');
 const label=document.createElement('span');label.className='biglwa-sponsored-label';label.textContent='Sponsored · Advertisement';
 const title=document.createElement('strong');title.textContent=String(campaign.title||'').slice(0,110);
 const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='sponsored noopener noreferrer';link.textContent='Learn more';
 item.append(label,title,link);return item;
}
window.BigLWAAds=Object.freeze({config,canLoad,allowedSurface,createCard});
})();