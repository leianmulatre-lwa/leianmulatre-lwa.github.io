/* Search uses the same Veve card foundation, and the Studio's existing window-dot language.
 * Privacy: block preferences are strictly account-scoped in this browser, never sent
 * to the model or a remote API. A topic rule matches its explicitly entered phrase only. */
(function(){
'use strict';
const PREFIX='biglwa:lwazi-blocks:v1:';
const LIMIT=60;
const normalized=v=>String(v||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
function owner(){
  const id=String(window.__biglwaIdentity?.uid||window.BigLWAAccountStorage?.uid||'').slice(0,130);
  return id&&/^[\w:-]{1,130}$/.test(id)?id:'guest';
}
const storageKey=()=>PREFIX+owner();
function rules(){
  try{
    const data=JSON.parse(localStorage.getItem(storageKey())||'[]');
    return Array.isArray(data)?data.filter(r=>r&&['item','topic','source'].includes(r.scope)&&typeof r.key==='string').slice(0,LIMIT):[];
  }catch{return []}
}
function save(items){
  try{localStorage.setItem(storageKey(),JSON.stringify(items.slice(-LIMIT)));return true}
  catch{return false}
}
function cardDestination(card){
  const link=card.querySelector('a.bl-search-primary-action[href],a.bl-search-go[href],a[href]');
  const target=card.dataset.blDestination||(link&&link.href)||'';
  if(!target)return '';
  try{
    const url=new URL(target,location.origin);
    return ['https:','http:'].includes(url.protocol)?url.href:'';
  }catch{return ''}
}
function cardHost(card){
  try{return new URL(cardDestination(card)).hostname.replace(/^www\./,'')}catch{return ''}
}
function cardTitle(card){return card.querySelector('h3')?.textContent?.trim()||'Untitled result'}
function cardIdentity(card){return normalized(card.dataset.blGroup+'|'+cardTitle(card)+'|'+cardDestination(card))}
function cardBlocked(card,block){
  if(block.scope==='item')return cardIdentity(card)===block.key;
  if(block.scope==='source')return cardHost(card)===block.key;
  if(block.scope==='topic')return normalized(card.textContent).includes(block.key);
  return false;
}
function manageButton(panel){
  let b=panel.querySelector('.bl-search-manage-filters');
  if(!b){
    const head=panel.querySelector('.bl-search-head');if(!head)return;
    b=document.createElement('button');b.type='button';b.className='bl-search-manage-filters';
    b.addEventListener('click',()=>openManage(panel));head.insertBefore(b,head.firstChild);
  }
  const length=rules().length;
  b.hidden=!length;b.textContent='Manage blocked results ('+length+')';
}
function applyRules(panel){
  if(!panel)return;
  const all=rules();
  panel.querySelectorAll('.bl-search-card[data-bl-filterable]').forEach(card=>{
    card.hidden=all.some(rule=>cardBlocked(card,rule));
  });
  panel.querySelectorAll('.bl-search-section').forEach(section=>{
    const cards=[...section.querySelectorAll('.bl-search-card[data-bl-filterable]')];
    section.dataset.blAllBlocked=(cards.length>0&&cards.every(x=>x.hidden))?'true':'false';
  });
  manageButton(panel);
}
function openDestination(card){
  const url=cardDestination(card);
  if(url){window.open(url,'_blank','noopener,noreferrer');return;}
  const primary=card.querySelector('a.bl-search-primary-action[href],a.bl-search-go[href]');
  if(primary){primary.click();return;}
  const route=card.querySelector('[data-lwazi-route]');if(route)route.click();
}
function dialog(){
  let el=document.getElementById('bl-lwazi-block-dialog');
  if(el)return el;
  el=document.createElement('dialog');el.id='bl-lwazi-block-dialog';el.className='bl-search-block-dialog';
  el.innerHTML='<form class="bl-block-form" method="dialog">'+
    '<h2 id="bl-block-title">Block search results</h2>'+
    '<p class="bl-block-intro">Choose exactly what you want to avoid. L’wazi will not guess a broad preference from one result.</p>'+
    '<p class="bl-block-item" id="bl-block-item"></p>'+
    '<fieldset><legend>What should be blocked?</legend>'+
    '<label><input type="radio" name="scope" value="item" checked> Only this result</label>'+
    '<label><input type="radio" name="scope" value="topic"> A subject or phrase I choose</label>'+
    '<label><input type="radio" name="scope" value="source"> Results from this source</label>'+
    '</fieldset>'+
    '<label class="bl-block-topic-wrap" hidden>Words or topic to avoid (exact phrase)<input name="topic" maxlength="90" placeholder="e.g. robots on runways" autocomplete="off"></label>'+
    '<label>Why? (optional, stays in this browser)<textarea name="reason" rows="2" maxlength="240" placeholder="Describe what felt irrelevant or unwelcome"></textarea></label>'+
    '<p class="bl-block-help">Only the specific result, source, or phrase you approve is filtered. Manage or undo blocks here anytime. These preferences are stored on this browser, not sent to an AI provider.</p>'+
    '<p class="bl-block-error" aria-live="polite"></p>'+
    '<div class="bl-block-actions"><button type="button" data-bl-block-cancel>Cancel</button><button type="submit" class="bl-block-confirm">Block selected results</button></div>'+
    '</form>';
  document.body.appendChild(el);
  el.addEventListener('click',event=>{
    if(event.target.matches('[data-bl-block-cancel]'))el.close();
    if(event.target===el)el.close();
  });
  el.querySelectorAll('[name=scope]').forEach(input=>input.addEventListener('change',()=>{
    const topic=el.querySelector('.bl-block-topic-wrap');
    topic.hidden=el.querySelector('[name=scope]:checked')?.value!=='topic';
    el.querySelector('.bl-block-error').textContent='';
  }));
  el.querySelector('form').addEventListener('submit',event=>{
    event.preventDefault();
    const card=el.__activeCard,scope=el.querySelector('[name=scope]:checked')?.value;
    if(!card||!['item','topic','source'].includes(scope)){el.close();return}
    let key=scope==='item'?cardIdentity(card):scope==='source'?cardHost(card):normalized(el.querySelector('[name=topic]').value);
    const error=el.querySelector('.bl-block-error');
    if(scope==='topic'&&key.length<3){error.textContent='Enter the specific subject or phrase you want to avoid.';return}
    if(!key){error.textContent='This result has no identifiable source. Choose another blocking scope.';return}
    const items=rules(),label=scope==='item'?cardTitle(card):scope==='source'?cardHost(card):key;
    if(!items.some(r=>r.scope===scope&&r.key===key))items.push({scope,key,label:label.slice(0,125),reason:el.querySelector('[name=reason]').value.trim().slice(0,240),created:new Date().toISOString()});
    if(!save(items)){error.textContent='This browser could not save your preference. Nothing was blocked.';return}
    el.close();applyRules(el.__activePanel);
  });
  return el;
}
function openBlock(panel,card){
  const el=dialog();el.__activePanel=panel;el.__activeCard=card;
  el.querySelector('form').reset();el.querySelector('.bl-block-topic-wrap').hidden=true;
  el.querySelector('.bl-block-error').textContent='';
  el.querySelector('#bl-block-item').textContent='Result: '+cardTitle(card);
  const source=el.querySelector('input[value="source"]');
  source.disabled=!cardHost(card);source.parentElement.title=source.disabled?'No identifiable external source for this result':'';
  el.showModal();
}
function openManage(panel){
  const old=document.getElementById('bl-lwazi-manage-dialog');if(old)old.remove();
  const el=document.createElement('dialog');el.className='bl-search-block-dialog';el.id='bl-lwazi-manage-dialog';
  const title=document.createElement('h2');title.textContent='Blocked results and topics';el.appendChild(title);
  const note=document.createElement('p');note.textContent='These preferences affect this browser and your current BIG LWA account. Nothing is sent to an AI model.';el.appendChild(note);
  const list=document.createElement('div');list.className='bl-filter-list';el.appendChild(list);
  function draw(){
    list.replaceChildren();
    rules().forEach((item,i)=>{
      const row=document.createElement('div');row.className='bl-filter-row';
      const content=document.createElement('span');content.textContent=item.scope+': '+item.label+(item.reason?' — '+item.reason:'');row.appendChild(content);
      const remove=document.createElement('button');remove.type='button';remove.textContent='Unblock';remove.setAttribute('aria-label','Unblock '+item.label);
      remove.addEventListener('click',()=>{const copy=rules();copy.splice(i,1);save(copy);draw();applyRules(panel)});
      row.appendChild(remove);list.appendChild(row);
    });
    if(!list.childElementCount)list.textContent='No blocked results.';
  }
  const close=document.createElement('button');close.type='button';close.className='bl-block-close';close.textContent='Done';close.addEventListener('click',()=>el.close());el.appendChild(close);
  el.addEventListener('close',()=>el.remove(),{once:true});
  document.body.appendChild(el);draw();el.showModal();
}
function decorateCard(html,index,title){
  if(typeof html!=='string'||!html.includes('bl-search-card'))return html;
  const controls='<div class="bl-card-window-controls" role="group" aria-label="Result controls">'+
    '<button type="button" class="bl-card-dot bl-card-block" data-bl-result-action="block" aria-label="Block result" title="Block: choose what to avoid"></button>'+
    '<button type="button" class="bl-card-dot bl-card-hide" data-bl-result-action="hide" aria-label="Hide result" title="Hide from this search"></button>'+
    '<button type="button" class="bl-card-dot bl-card-open" data-bl-result-action="open" aria-label="Open destination" title="Open destination"></button>'+
    '</div>';
  return html.replace(/<article class="([^"]*\bbl-search-card\b[^"]*)"([^>]*)>/,function(_,classes,attrs){
    const veve=classes.includes('veve-tile')?'':' veve-tile';
    const family=classes.includes('veve-book')||classes.includes('veve-resource')?'':title==='Books'?' veve-book':' veve-resource';
    return '<article class="'+classes+veve+family+' bl-search-veve-card"'+attrs+' data-bl-filterable="true" data-bl-group="'+String(title).replace(/[&<>"']/g,'')+'">'+controls;
  });
}
function bind(panel){
  if(!panel||panel.dataset.blControlsReady)return;
  panel.dataset.blControlsReady='1';
  panel.addEventListener('click',event=>{
    const button=event.target.closest('[data-bl-result-action]');
    if(!button||!panel.contains(button))return;
    const card=button.closest('.bl-search-card[data-bl-filterable]');if(!card)return;
    event.preventDefault();event.stopPropagation();
    const action=button.dataset.blResultAction;
    if(action==='block')openBlock(panel,card);
    if(action==='hide')card.hidden=true;
    if(action==='open')openDestination(card);
  });
  manageButton(panel);
}
window.__biglwaLwaziSearchUi={decorateCard,bind,refresh:applyRules,version:'1.0.0'};
})();
