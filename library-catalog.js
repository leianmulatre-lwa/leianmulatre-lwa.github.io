(function(){
'use strict';
if(window.__biglwaLibraryCatalog)return;
const KEY='biglwaLibraryCatalogV1',LINKS='biglwaOrbitLinks';
let results=[],pending=[],busy=false,message='',filter='all',query='',kind='book',generation=0;
const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}}
function shelf(){const v=read(KEY,[]);return Array.isArray(v)?v:[]}
function write(rows){localStorage.setItem(KEY,JSON.stringify(rows))}
function safeUrl(value,host){try{const u=new URL(value);return u.protocol==='https:'&&(!host||u.hostname===host||u.hostname.endsWith('.'+host))?u.href:''}catch{return ''}}
function rating(v){const n=Number(v);return Number.isFinite(n)&&n>=0&&n<=5?Math.round(n*2)/2:0}
function rateOptions(value){return '<option value="0">Not rated</option>'+Array.from({length:10},(_,i)=>(i+1)/2).map(n=>'<option value="'+n+'"'+(n===Number(value)?' selected':'')+'>'+n+' / 5 ★</option>').join('')}
function statusOptions(value){return ['Want to read/watch','In progress','Finished'].map(s=>'<option'+(s===value?' selected':'')+'>'+s+'</option>').join('')}
function sourceLink(item){const u=safeUrl(item.url);return u?'<a href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">'+esc(item.source||'Source')+'</a>':''}
function card(item,saved=false){
 const image=safeUrl(item.image,'openlibrary.org');
 return '<article class="lib-item">'+(image?'<img loading="lazy" src="'+esc(image)+'" alt="Cover of '+esc(item.title)+'">':'')+'<div class="lib-item-body"><small>'+esc(item.kind==='book'?'Book':'Movie')+(item.year?' · '+esc(item.year):'')+'</small><h3>'+esc(item.title)+'</h3><p>'+esc(item.author||item.description||'')+'</p><div class="lib-links">'+sourceLink(item)+(item.imdb&&/^tt\d+$/.test(item.imdb)?'<a href="https://www.imdb.com/title/'+item.imdb+'/" target="_blank" rel="noopener noreferrer">IMDb</a>':'')+'</div>'+
 (saved?'<label>Your rating<select data-lib-rating="'+esc(item.id)+'">'+rateOptions(item.rating)+'</select></label><label>Shelf status<select data-lib-status="'+esc(item.id)+'">'+statusOptions(item.status)+'</select></label><button type="button" data-lib-remove="'+esc(item.id)+'">Remove</button>':'<button type="button" data-lib-add="'+esc(item.id)+'"'+(shelf().some(s=>s.id===item.id)?' disabled':'')+'>'+(shelf().some(s=>s.id===item.id)?'Saved':'Add to Library')+'</button>')+'</div></article>';
}
function render(){
 if($('#moduleRouteName')?.textContent==='Orbit'){renderOrbit();return}
 if($('#moduleRouteName')?.textContent!=='Library')return;
 const body=$('#moduleWorkspaceBody');if(!body)return;
 let root=$('#libraryCatalog');if(!root){root=document.createElement('section');root.id='libraryCatalog';body.querySelector('.module-heading')?.after(root)}
 const rows=shelf(),shown=rows.filter(x=>filter==='all'||x.kind===filter);
 root.innerHTML='<div class="lib-panel"><h2>Find your next chapter. Or opening scene.</h2><p>Search books and films, save titles, and give them your own rating. Your shelf and imports stay in this browser.</p><form id="librarySearch"><label>Catalog<select name="kind"><option value="book"'+(kind==='book'?' selected':'')+'>Books · Open Library</option><option value="movie"'+(kind==='movie'?' selected':'')+'>Movies · Wikidata</option></select></label><label>Title or author<input name="query" required minlength="2" maxlength="150" value="'+esc(query)+'" placeholder="Try Beloved or Moonlight"></label><button'+(busy?' disabled':'')+'>Search</button></form><p role="status">'+esc(message)+'</p><div class="lib-grid">'+results.map(x=>card(x)).join('')+'</div><p class="lib-muted">Catalogs are extensive, but not exhaustive. Film records link to IMDb where an identifier is available. Ratings below are yours, not IMDb scores.</p></div>'+
 '<div class="lib-panel"><div class="lib-heading"><h2>Your shelf <small>('+rows.length+')</small></h2><label>Show<select id="libFilter"><option value="all">Everything</option><option value="book"'+(filter==='book'?' selected':'')+'>Books</option><option value="movie"'+(filter==='movie'?' selected':'')+'>Movies</option></select></label></div><div class="lib-grid">'+shown.map(x=>card(x,true)).join('')+'</div>'+(!shown.length?'<p>No titles here yet. Search above or import a shelf below.</p>':'')+'<button type="button" data-lib-export>Download shelf backup</button></div>'+
 '<div class="lib-panel"><h2>Bring your shelves with you</h2><p>Link your profiles and import exported CSV files. This is a one-time import; ratings do not sync back to Goodreads or Letterboxd.</p><div class="lib-profile-links">'+profileForm('goodreads','Goodreads','https://www.goodreads.com/user/show/…')+profileForm('letterboxd','Letterboxd','https://letterboxd.com/username/')+'</div><label>Import source<select id="libImportSource"><option value="goodreads">Goodreads library export</option><option value="letterboxd">Letterboxd CSV (unzip the export first)</option><option value="imdb">IMDb ratings export</option><option value="backup">BIGLWA shelf backup</option></select></label><label>Choose a CSV file<input id="libImportFile" type="file" accept=".csv,text/csv"></label><p>Goodreads: <a href="https://www.goodreads.com/review/import" target="_blank" rel="noopener noreferrer">Import/Export</a>. Letterboxd: <a href="https://letterboxd.com/settings/data/" target="_blank" rel="noopener noreferrer">Settings → Data</a>. Imported titles and ratings are previewed before saving.</p><div id="libImportPreview">'+(pending.length?'<p>'+pending.length+' titles ready. Existing matches will be kept.</p><ul>'+pending.slice(0,5).map(x=>'<li>'+esc(x.title)+' · '+(x.rating||'unrated')+'/5</li>').join('')+'</ul><button type="button" data-lib-import>Import '+pending.length+' titles</button> <button type="button" data-lib-cancel>Cancel</button>':'')+'</div></div>'+
 '<details class="lib-panel"><summary>Add a title manually</summary><form id="libManual"><label>Type<select name="kind"><option value="book">Book</option><option value="movie">Movie</option></select></label><label>Title<input name="title" required maxlength="250"></label><label>Author / director<input name="author" maxlength="250"></label><label>Year<input name="year" inputmode="numeric" maxlength="4"></label><button>Add title</button></form></details>';
}
function profileForm(service,label,placeholder){const url=read(LINKS,{})[service]||'';return '<form data-lib-profile="'+service+'"><h3>'+label+'</h3><label>Public profile URL<input name="url" type="url" value="'+esc(url)+'" placeholder="'+placeholder+'"></label><button>Save link</button>'+(safeUrl(url,service+'.com')?' <a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Open profile</a>':'')+'</form>'}
function renderOrbit(){
 for(const service of ['goodreads','letterboxd','imdb']){
 const row=$('[data-orbit-path="'+service+'"]')?.closest('.module-orbit-row');if(!row)continue;
 const auth=row.querySelector('[data-orbit-auth]');if(auth){if(auth.previousElementSibling)auth.previousElementSibling.hidden=true;auth.hidden=true;auth.value=''}
 const open=row.querySelector('[data-orbit-open]');if(open)open.disabled=!safeUrl(read(LINKS,{})[service],service+'.com');
 if(!row.querySelector('.lib-orbit-note')){const p=document.createElement('p');p.className='lib-orbit-note';p.textContent='Profile link + CSV import. No live account sync.';row.append(p);const b=document.createElement('button');b.type='button';b.className='module-action';b.dataset.libOpen='';b.textContent='Open Library / import ratings';row.append(b)}
 }
}
async function fetchJSON(url,signal){const res=await fetch(url,{signal});if(!res.ok)throw new Error('Catalog is unavailable ('+res.status+'). Try again shortly.');return res.json()}
let controller;
async function search(){
 const token=++generation;controller?.abort();controller=new AbortController();const signal=controller.signal;busy=true;message='Searching…';render();
 const timeout=setTimeout(()=>controller.abort(),20000);
 try{
 let items=[];
 if(kind==='book'){
 const u='https://openlibrary.org/search.json?'+new URLSearchParams({q:query,limit:'20',fields:'key,title,author_name,first_publish_year,cover_i'});
 const data=await fetchJSON(u,signal);
 items=(data.docs||[]).filter(d=>/^\/works\/OL\d+W$/.test(d.key)).map(d=>({id:'ol:'+d.key,kind:'book',title:d.title,author:(d.author_name||[]).join(', '),year:String(d.first_publish_year||''),image:d.cover_i?'https://covers.openlibrary.org/b/id/'+d.cover_i+'-M.jpg':'',url:'https://openlibrary.org'+d.key,source:'Open Library'}));
 }else{
 const base='https://www.wikidata.org/w/api.php?';
 const data=await fetchJSON(base+new URLSearchParams({action:'wbsearchentities',format:'json',origin:'*',language:'en',search:query,limit:'30'}),signal);
 const found=(data.search||[]).filter(x=>/\b(film|movie|documentary)\b/i.test(x.description||''));
 if(found.length){const entities=await fetchJSON(base+new URLSearchParams({action:'wbgetentities',format:'json',origin:'*',ids:found.map(x=>x.id).join('|'),props:'claims'}),signal);items=found.map(d=>{const claims=entities.entities?.[d.id]?.claims||{};return {id:'wd:'+d.id,kind:'movie',title:d.label,description:d.description,year:(claims.P577?.[0]?.mainsnak?.datavalue?.value?.time||'').match(/\d{4}/)?.[0]||'',imdb:claims.P345?.[0]?.mainsnak?.datavalue?.value||'',url:'https://www.wikidata.org/wiki/'+d.id,source:'Wikidata'}})}
 }
 if(token!==generation)return;results=items;message=items.length?items.length+' results.':'No matching titles found. Try another title or add it manually.';
 }catch(e){if(token===generation){results=[];message=e.name==='AbortError'?'Search timed out. Please try again.':e.message}}
 finally{clearTimeout(timeout);if(token===generation){busy=false;render()}}
}
function parseCSV(text){
 text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=''}else cell+=c}
 if(quoted)throw new Error('CSV has an unfinished quoted field. Export the file again.');
 row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 if(!rows.length)return [];const header=rows.shift().map(x=>x.trim());return rows.map(r=>Object.fromEntries(header.map((h,i)=>[h,r[i]||''])));
}
function fromCSV(text,source){
 return parseCSV(text).map((r,i)=>{
 const title=r.Title||r.Name;if(!title)return null;
 const book=source==='goodreads'||(source==='backup'&&r.Kind==='book');
 const imdb=r.Const||r.imdbID||r.IMDb||'';
 const url=source==='goodreads'&&/^\d+$/.test(r['Book Id'])?'https://www.goodreads.com/book/show/'+r['Book Id']:source==='imdb'&&/^tt\d+$/.test(imdb)?'https://www.imdb.com/title/'+imdb+'/':safeUrl(r['Letterboxd URI']||r.LetterboxdURI||r.URL);
 const rawRating=source==='goodreads'?r['My Rating']:source==='imdb'?Number(r['Your Rating']||0)/2:r.Rating;
 const year=r.Year||r['Original Publication Year']||r['Year Published']||'';
 return {id:source==='backup'&&r.ID?r.ID:source+':'+(r['Book Id']||imdb||url||title+':'+year),kind:book?'book':'movie',title:title.slice(0,500),author:(r.Author||r.Directors||'').slice(0,500),year,imdb:/^tt\d+$/.test(imdb)?imdb:'',url,source:source==='backup'?(r.Source||'Imported'):source==='goodreads'?'Goodreads':source==='imdb'?'IMDb':'Letterboxd',rating:rating(rawRating),status:r.Status||((r['Exclusive Shelf']==='read'||Number(rawRating)>0)?'Finished':r['Exclusive Shelf']==='currently-reading'?'In progress':'Want to read/watch')};
 }).filter(Boolean);
}
function merge(existing,incoming){const ids=new Set(existing.map(x=>x.id));const titles=new Set(existing.map(x=>[x.kind,x.title.toLowerCase().trim(),x.year||''].join('|')));const next=[...existing];for(const item of incoming){const key=[item.kind,item.title.toLowerCase().trim(),item.year||''].join('|');if(!ids.has(item.id)&&!titles.has(key)){next.push(item);ids.add(item.id);titles.add(key)}}return next}
function exportCSV(){
 const rows=[['ID','Kind','Title','Author','Year','Rating','Status','URL','IMDb','Source'],...shelf().map(x=>[x.id,x.kind,x.title,x.author,x.year,x.rating,x.status,x.url,x.imdb,x.source])];
 const csv=rows.map(row=>row.map(v=>{let text=String(v??'');if(/^[=+\-@\t\r]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"'}).join(',')).join('\r\n');
 const u=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='biglwa-library.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
}
function fail(e){message=e.message||'Could not save. Check browser storage availability.';render()}
document.addEventListener('submit',e=>{
 const f=e.target;if(!(f instanceof HTMLFormElement))return;
 if(!f.matches('#librarySearch,#libManual,[data-lib-profile]'))return;e.preventDefault();e.stopImmediatePropagation();
 try{const data=Object.fromEntries(new FormData(f));
 if(f.id==='librarySearch'){query=data.query.trim();kind=data.kind;search()}
 else if(f.id==='libManual'){const item={id:'manual:'+crypto.randomUUID(),kind:data.kind,title:data.title.trim(),author:data.author.trim(),year:data.year.trim(),rating:0,status:'Want to read/watch',source:'Manual'};if(!item.title)return;write(merge(shelf(),[item]));message='Title saved.';render()}
 else{const service=f.dataset.libProfile,url=data.url.trim();if(url&&!safeUrl(url,service+'.com'))throw new Error('Use an HTTPS '+service+' profile URL.');const links=read(LINKS,{});if(url)links[service]=url;else delete links[service];localStorage.setItem(LINKS,JSON.stringify(links));message='Profile link saved. Import a CSV to bring in ratings.';render()}
 }catch(err){fail(err)}
},true);
document.addEventListener('change',async e=>{
 const el=e.target;try{
 if(el.id==='libFilter'){filter=el.value;render()}
 else if(el.matches('[data-lib-rating],[data-lib-status]')){const id=el.dataset.libRating||el.dataset.libStatus;write(shelf().map(x=>x.id===id?{...x,...(el.dataset.libRating?{rating:rating(el.value)}:{status:el.value})}:x))}
 else if(el.id==='libImportFile'&&el.files[0]){const file=el.files[0],source=$('#libImportSource').value;if(file.size>5*1024*1024)throw new Error('Choose a CSV smaller than 5 MB.');pending=fromCSV(await file.text(),source);if(!pending.length)throw new Error('No titles found. Choose an original export with a Title or Name column.');message='Import preview ready.';render();$('#libImportPreview')?.scrollIntoView({block:'center'})}
 }catch(err){pending=[];fail(err)}
});
document.addEventListener('click',e=>{
 if(e.target instanceof Element&&e.target.closest('[data-orbit-save]'))setTimeout(renderOrbit,0);
 if(!(e.target instanceof Element))return;const b=e.target.closest('[data-lib-add],[data-lib-remove],[data-lib-import],[data-lib-cancel],[data-lib-export],[data-lib-open]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();
 try{if(b.hasAttribute('data-lib-add')){const item=results.find(x=>x.id===b.dataset.libAdd);if(item)write(merge(shelf(),[{...item,rating:0,status:'Want to read/watch'}]))}
 else if(b.hasAttribute('data-lib-remove'))write(shelf().filter(x=>x.id!==b.dataset.libRemove));
 else if(b.hasAttribute('data-lib-import')){const before=shelf();const after=merge(before,pending);write(after);message=(after.length-before.length)+' titles imported. Existing entries kept.';pending=[]}
 else if(b.hasAttribute('data-lib-cancel'))pending=[];
 else if(b.hasAttribute('data-lib-export'))exportCSV();
 else window.openBIGLWAModule?.('library');render();
 }catch(err){fail(err)}
},true);
document.addEventListener('biglwa:module-open',render);
function init(){const style=document.createElement('style');style.textContent='#libraryCatalog{margin-top:22px;font-size:16px}#libraryCatalog p{font-size:16px;line-height:1.55}#libraryCatalog h2{font:600 30px Georgia,serif;margin:0 0 15px}.lib-panel{padding:24px;border:1px solid #d9cfc4;border-radius:18px;background:#fffaf2;margin-bottom:20px}.lib-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,230px),1fr));gap:16px}.lib-item{border:1px solid #ded4c8;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;background:white}.lib-item img{height:210px;width:100%;object-fit:contain;background:#e9e1d5}.lib-item-body{padding:16px}.lib-item h3{font:600 24px Georgia,serif;overflow-wrap:anywhere}.lib-item small,.lib-muted{color:#665e57}.lib-links{display:flex;gap:15px;flex-wrap:wrap;margin-bottom:15px}#libraryCatalog label{display:flex;flex-direction:column;gap:5px;font-size:14px;margin:12px 0}#libraryCatalog input,#libraryCatalog select{font:16px system-ui;padding:10px;border:1px solid #b9b0a5;border-radius:7px;max-width:100%;min-width:0;background:white;color:#272321}#libraryCatalog button{font:600 14px system-ui;border:1px solid #b9b0a5;border-radius:8px;padding:11px 15px;cursor:pointer;background:#302823;color:white}#libraryCatalog button:disabled{opacity:.55;cursor:default}#libraryCatalog :focus-visible{outline:3px solid #a53332;outline-offset:3px}#librarySearch,.lib-heading{display:flex;align-items:end;gap:15px;flex-wrap:wrap}#librarySearch label:nth-child(2){flex:1}.lib-heading{justify-content:space-between}.lib-profile-links{display:grid;grid-template-columns:1fr 1fr;gap:24px}#libraryCatalog summary{cursor:pointer;font-size:18px}@media(max-width:650px){.lib-profile-links{grid-template-columns:1fr}#librarySearch{display:block}.lib-panel{padding:16px}}';document.head.append(style);render()}
window.__biglwaLibraryCatalog={render,parseCSV,fromCSV,merge};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
}());
