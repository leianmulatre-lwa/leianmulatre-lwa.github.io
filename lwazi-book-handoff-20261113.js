/* BIG LWA — a selected Open Library book follows the L'wazi result into
   the existing account-owned Library. Viewing NEVER implicitly saves it. */
(() => {
 'use strict';
 const storageKey='biglwa:selected-book:v1',ownerModule='library';
 let pending=null,epoch=0;
 const validKey=value=>/^\/(?:works\/OL\d+W|books\/OL\d+M)$/.test(String(value||''));
 const validCover=value=>{try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='covers.openlibrary.org'?u.href:'';}catch{return '';}};
 const safeBook=row=>{
  if(!row||typeof row!=='object')return null;
  const key=validKey(row.key)?String(row.key):'';
  const title=String(row.title||'').trim().slice(0,180);
  if(!title)return null;
  const author=String(row.author||'').trim().slice(0,190);
  const year=String(row.year||'').replace(/[^\d]/g,'').slice(0,4);
  return {key,title,author,year,cover:validCover(row.cover),
   url:key?'https://openlibrary.org'+key:''};
 };
 function remembered(){
  if(pending)return pending;
  try{return safeBook(JSON.parse(sessionStorage.getItem(storageKey)||'null'));}catch{return null;}
 }
 const el=(tag,className,text)=>{
  const node=document.createElement(tag);if(className)node.className=className;
  if(text!=null)node.textContent=String(text);return node;
 };
 function renderFocus(){
  const module=document.querySelector('#moduleWorkspace[data-module-key="library"]');
  const body=module?.querySelector('#moduleWorkspaceBody');
  const grid=body?.querySelector('.module-grid');
  if(!grid)return;
  body.querySelector('#biglwaSelectedBook')?.remove();
  const item=remembered();if(!item)return;
  const token=++epoch;
  const card=el('section','module-card wide bl-selected-book');
  card.id='biglwaSelectedBook';card.setAttribute('aria-label','Selected book');
  const label=el('p','bl-selected-book-kicker','L’wazi → Library · selected book');
  const layout=el('div','bl-selected-book-layout');
  const image=item.cover?el('img','bl-selected-book-cover'):el('div','bl-selected-book-no-cover','▥');
  if(item.cover){image.src=item.cover;image.alt='Cover: '+item.title;image.loading='lazy';
   image.referrerPolicy='no-referrer';}
  const detail=el('div','bl-selected-book-detail');
  detail.append(el('h2','',item.title),
    el('p','bl-selected-book-meta',[item.author,item.year].filter(Boolean).join(' · ')||'Catalog record'));
  const note=el('p','bl-selected-book-status','This is the exact book you selected. It is not saved to your shelf yet.');
  note.setAttribute('role','status');
  const actions=el('div','bl-selected-book-actions');
  const save=el('button','module-action','Save this book to my shelf');
  save.type='button';save.addEventListener('click',()=>{
   const form=body.querySelector('#moduleCollectionForm');
   const title=form?.querySelector('input[name="title"]');
   const more=form?.querySelector('input[name="detail"]');
   if(!form||!title||!more){note.textContent='Library form unavailable. Try opening Library again.';return;}
   const url=item.url||'';
   const existing=(()=>{try{const rows=JSON.parse(localStorage.getItem('biglwaModule_library')||'[]');return Array.isArray(rows)&&rows.some(r=>r?.title===item.title&&String(r?.meta||'').includes(url||item.author));}catch{return false;}})();
   if(existing){note.textContent='Already on your shelf. No duplicate added.';return;}
   title.value=item.title;more.value=[item.author,item.year,url].filter(Boolean).join(' · ');
   if(typeof form.requestSubmit==='function')form.requestSubmit();
   else form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   note.textContent='Requested a save through your existing Library form. Check sync status in Settings.';
  });
  actions.append(save);
  if(item.url){
   const source=el('a','module-action ghost','Original Open Library record ↗');
   source.href=item.url;source.target='_blank';source.rel='noopener noreferrer';actions.append(source);
  }
  detail.append(note,actions);
  const summary=el('div','bl-selected-book-summary');
  summary.setAttribute('role','region');summary.setAttribute('aria-label','Book description');
  summary.textContent=item.key.startsWith('/works/')?'Loading the publisher/community catalog description…':'Edition selected · see the original bibliographic entry for details.';
  detail.append(summary);layout.append(image,detail);card.append(label,layout);
  grid.parentNode.insertBefore(card,grid);
  if(!item.key.startsWith('/works/'))return;
  // The public work record is bibliographic metadata, not a full copyrighted book.
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6500);
  fetch('https://openlibrary.org'+item.key+'.json',{signal:controller.signal})
  .then(resp=>{if(!resp.ok)throw Error('Unavailable');return resp.json();})
  .then(data=>{
   if(token!==epoch||!summary.isConnected)return;
   const raw=data?.description;
   const desc=String(typeof raw==='string'?raw:raw?.value||'').trim().slice(0,1150);
   summary.textContent=desc||'No book description is available for this work. Open the original record for editions and availability.';
  })
  .catch(()=>{if(token===epoch&&summary.isConnected)summary.textContent='Preview unavailable here. The selected record and shelf controls still work.';})
  .finally(()=>clearTimeout(timer));
 }
 function openCard(card){
  if(!card||!card.classList.contains('bl-search-book'))return false;
  const row=safeBook({
   key:card.dataset.blBookKey,
   title:card.dataset.blBookTitle,
   author:card.dataset.blBookAuthor,
   cover:card.dataset.blBookCover,
   year:card.dataset.blBookYear
  });
  if(!row)return false;
  pending=row;
  try{sessionStorage.setItem(storageKey,JSON.stringify(row));}catch{}
  window.__biglwaUserCardsClose?.();
  const open=window.openBIGLWAModule||window.BigLWAOpenModule;
  if(typeof open==='function'){open(ownerModule);return true;}
  const fallback=document.querySelector('[data-open="library"],[data-widget-route="library"]');
  fallback?.click();return Boolean(fallback);
 }
 window.BigLWABookHandoff=Object.freeze({openCard,safeBook,renderFocus});
 document.addEventListener('biglwa:module-open',event=>{
  if(event?.detail?.key==='library')renderFocus();
 });
})();