/* BIG LWA: optional analytics and personalization. NOT a Google-certified CMP. */
(function(){
'use strict';
if(window.BigLWAPrivacy)return;
const KEY='biglwa:privacy-choices:v1';
const defaults=()=>({version:1,analytics:false,personalization:false,savedAt:null});
function get(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');return x&&x.version===1&&typeof x.analytics==='boolean'&&typeof x.personalization==='boolean'?x:defaults();}catch{return defaults();}}
function allowed(name){return (name==='analytics'||name==='personalization')&&get()[name]===true;}
let dialog,launcher;
function close(){if(dialog){dialog.remove();dialog=null;}launcher?.focus({preventScroll:true});}
function save(a,p){
  const value={version:1,analytics:a===true,personalization:p===true,savedAt:new Date().toISOString()};
  try{localStorage.setItem(KEY,JSON.stringify(value));}catch{}
  window.dispatchEvent(new CustomEvent('biglwa:privacy-changed',{detail:{analytics:allowed('analytics'),personalization:allowed('personalization')}}));
  close();return get();
}
function open(){
  if(dialog||!document.body)return;
  dialog=document.createElement('div');dialog.id='biglwaPrivacyChoices';
  dialog.innerHTML='<section class="biglwa-privacy-panel" role="dialog" aria-modal="true" aria-labelledby="biglwaPrivacyTitle" aria-describedby="biglwaPrivacyText">'+
   '<p class="biglwa-privacy-kicker">BIG LWA · PRIVACY & DATA</p><h2 id="biglwaPrivacyTitle">Your data, your terms.</h2>'+
   '<p id="biglwaPrivacyText">BIG LWA uses cookies and similar storage to keep your Studio working. You choose whether to allow anything extra. Our free tools are available either way.</p>'+
   '<div class="biglwa-privacy-row"><div><strong>Keep BIG LWA working</strong><small>Remember your login, protect your account, and save your drafts and settings.</small></div><span>Always on</span></div>'+
   '<label class="biglwa-privacy-row"><span><strong>Help improve BIG LWA</strong><small>Allow this browser to count page visits, slow loads and errors. This information stays on your device and is never uploaded.</small></span><input type="checkbox" id="biglwaAllowAnalytics"></label>'+
   '<label class="biglwa-privacy-row"><span><strong>Make BIG LWA more you</strong><small>Save your permission for future optional features that tailor your experience to your preferences.</small></span><input type="checkbox" id="biglwaAllowPersonalization"></label>'+
   '<p><strong>We never sell your personal data or creative work.</strong></p>'+
   '<p class="biglwa-privacy-ad-note"><strong>No ads are active right now.</strong> These choices do not give permission for advertising. If ads are introduced, any required advertising consent will be requested separately.</p>'+
   '<div class="biglwa-privacy-actions"><button type="button" data-privacy-action="reject">Use essentials only</button><button type="button" data-privacy-action="save">Save my choices</button><button type="button" data-privacy-action="accept">Allow both</button></div>'+
   '<p class="biglwa-privacy-links">Change your choices anytime in <a href="/settings/#privacyControls">Settings</a>. <a href="/privacy/">Privacy policy</a> · <a href="/data-deletion/">Data deletion</a></p></section>';
  const c=get();dialog.querySelector('#biglwaAllowAnalytics').checked=c.analytics;dialog.querySelector('#biglwaAllowPersonalization').checked=c.personalization;
  dialog.addEventListener('click',e=>{
   const action=e.target.closest('[data-privacy-action]')?.dataset.privacyAction;
   if(!action)return;
   if(action==='reject')save(false,false);
   else if(action==='accept')save(true,true);
   else save(dialog.querySelector('#biglwaAllowAnalytics').checked,dialog.querySelector('#biglwaAllowPersonalization').checked);
  });
  document.body.append(dialog);dialog.querySelector('[data-privacy-action="reject"]').focus({preventScroll:true});
}
function note(event){
  if(!allowed('analytics')||!['page-view','slow-load','ui-error'].includes(event))return false;
  try{
   const route=/^\/studio/.test(location.pathname)?'studio':/^\/settings/.test(location.pathname)?'settings':'public';
   const counters=JSON.parse(sessionStorage.getItem('biglwa:optional-diagnostics:v1')||'{}');
   const key=route+':'+event;counters[key]=Math.min(9999,Math.max(0,Number(counters[key])||0)+1);
   sessionStorage.setItem('biglwa:optional-diagnostics:v1',JSON.stringify(counters));return true;
  }catch{return false;}
}
function report(){if(!allowed('analytics'))return null;try{return JSON.parse(sessionStorage.getItem('biglwa:optional-diagnostics:v1')||'{}');}catch{return null;}}
function install(){
 if(!document.body||document.querySelector('#biglwaPrivacyLauncher'))return;
 launcher=document.createElement('button');launcher.type='button';launcher.id='biglwaPrivacyLauncher';launcher.textContent='Privacy choices';
 launcher.addEventListener('click',open);document.body.append(launcher);
 document.addEventListener('click',e=>{if(e.target.closest('[data-open-biglwa-privacy]')){e.preventDefault();open();}});
 if(!get().savedAt)open();
 if(allowed('analytics'))note('page-view');
}
window.BigLWAPrivacy=Object.freeze({get,allowed,save,open,note,report});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();