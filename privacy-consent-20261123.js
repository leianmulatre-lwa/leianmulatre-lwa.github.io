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
   '<p id="biglwaPrivacyText">Essential storage keeps your account and Studio working. Optional choices below never restrict our free tools.</p>'+
   '<div class="biglwa-privacy-row"><div><strong>Essential</strong><small>Login, security, drafts and requested account settings</small></div><span>Always on</span></div>'+
   '<label class="biglwa-privacy-row"><span><strong>Experience analytics</strong><small>Opt into on-device performance counters; reports are not automatically uploaded.</small></span><input type="checkbox" id="biglwaAllowAnalytics"></label>'+
   '<label class="biglwa-privacy-row"><span><strong>Personalization</strong><small>Allow future optional experience improvements based on your chosen preferences.</small></span><input type="checkbox" id="biglwaAllowPersonalization"></label>'+
   '<p class="biglwa-privacy-ad-note"><strong>Advertising is off.</strong> Future Google ads will require their own certified consent platform. These checkboxes do not authorize advertising.</p>'+
   '<div class="biglwa-privacy-actions"><button type="button" data-privacy-action="reject">Reject optional</button><button type="button" data-privacy-action="save">Save choices</button><button type="button" data-privacy-action="accept">Accept optional</button></div>'+
   '<p class="biglwa-privacy-links"><a href="/privacy/">Privacy policy</a> · <a href="/settings/#privacyControls">Settings</a> · <a href="/data-deletion/">Data deletion</a></p></section>';
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