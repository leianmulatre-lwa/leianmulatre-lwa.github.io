/* No paid inventory is active. Never fake certification or publisher approval. */
(function(){
'use strict';
const config=Object.freeze({enabled:false,certifiedCmpPublished:false,publisherApproved:false});
// Set only after approved inventory and the production consent integration exist.
const downloadCampaign=null;
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
function createDownloadCard(){
 const card=createCard(downloadCampaign,'download');if(!card)return null;
 // Only approved first-party campaign video, no pasted source URL or tracking data.
 if(downloadCampaign.videoUrl){
  try{
   const url=new URL(downloadCampaign.videoUrl,location.origin);
   if(url.origin===location.origin&&url.protocol==='https:'&&url.pathname.startsWith('/assets/ads/')){
    const video=document.createElement('video');video.src=url.href;video.controls=true;video.muted=true;video.playsInline=true;video.preload='metadata';
    video.autoplay=!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    card.append(video);
   }
  }catch{}
 }
 return card;
}
window.BigLWAAds=Object.freeze({config,canLoad,allowedSurface,createCard,createDownloadCard});
})();