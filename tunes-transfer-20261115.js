/* BIG LWA Tunes transfer · manual CSV/JSON metadata import, NOT provider OAuth sync. */
(()=>{'use strict';if(window.BigLWATunesTransfer)return;
const ROOT='biglwaTunesImportV1:',LIMIT=500,MAX_FILE=2*1024*1024;
const $=(q,root=document)=>root.querySelector(q);
const uid=()=>String(window.__biglwaIdentity?.uid||window.BigLWAAccountStorage?.uid||'').trim();
const isOwner=()=>/^[\w:-]{5,145}$/.test(uid())&&!!$('#profileMusicOwnerButtons')&&!$('#profileMusicOwnerButtons').hidden;
const clean=(v,n=160)=>String(v==null?'':v).trim().slice(0,n);
const providerHosts={spotify:['open.spotify.com'],soundcloud:['soundcloud.com','www.soundcloud.com'],apple:['music.apple.com'],youtube:['music.youtube.com','youtube.com','www.youtube.com','youtu.be']};
function safeLink(value,provider){
 try{const u=new URL(clean(value,1500));if(u.protocol!=='https:'||u.username||u.password||u.port||!(providerHosts[provider]||[]).includes(u.hostname.toLowerCase()))return '';return u.origin+u.pathname}catch{return ''}
}
function normalize(row){
 if(!row||typeof row!=='object')return null;
 const raw=clean(row.source||row.platform||row.provider||'manual',25).toLowerCase();
 const provider=/spotify/.test(raw)?'spotify':/soundcloud/.test(raw)?'soundcloud':/apple|itunes/.test(raw)?'apple':/youtu/.test(raw)?'youtube':'manual';
 const title=clean(row.title||row.track||row.track_name||row.trackName||row.name,180);
 if(!title)return null;
 return {title,artist:clean(row.artist||row.artists||row.artist_name||row.artistName,160),album:clean(row.album||row.album_name||row.albumName),playlist:clean(row.playlist||row.playlist_name||row.playlistName||'Imported songs'),provider,url:safeLink(row.url||row.track_url||row.link||row.uri,provider)};
}
function csv(text){
 const raw=String(text||'').replace(/^\uFEFF/,'');let field='',row=[],rows=[],quoted=false;
 for(let i=0;i<raw.length;i++){const c=raw[i],next=raw[i+1];
  if(c==='"'){if(quoted&&next==='"'){field+='"';i++}else quoted=!quoted;continue;}
  if(!quoted&&(c===','||c==='\n'||c==='\r')){row.push(field);field='';if(c!==','){if(row.some(x=>x.trim()))rows.push(row);row=[];if(c==='\r'&&next==='\n')i++}continue;}field+=c;
 }
 if(quoted)throw Error('CSV has an unclosed quote.');
 row.push(field);if(row.some(x=>x.trim()))rows.push(row);
 const keys=(rows.shift()||[]).map(x=>clean(x,60).toLowerCase().replace(/[\s-]+/g,'_'));
 return rows.slice(0,LIMIT*3).map(cols=>Object.fromEntries(keys.map((key,i)=>[key,cols[i]||''])));
}
function json(text){
 const data=JSON.parse(text);
 if(Array.isArray(data))return data;
 if(Array.isArray(data?.tracks))return data.tracks;
 if(Array.isArray(data?.items))return data.items;
 if(Array.isArray(data?.playlists))return data.playlists.flatMap(p=>(p.tracks||[]).map(t=>({...t,playlist:t.playlist||p.name||p.title})));
 throw Error('Expected JSON tracks or playlists.');
}
function saved(){
 if(!/^[\w:-]{5,145}$/.test(uid()))return [];
 try{const x=JSON.parse(localStorage.getItem(ROOT+uid())||'[]');return Array.isArray(x)?x.map(normalize).filter(Boolean).slice(-LIMIT):[]}catch{return []}
}
function persist(rows){
 if(!isOwner())throw Error('Sign in to your own Studio to save imports.');
 const cleaned=rows.map(normalize).filter(Boolean).slice(-LIMIT);
 localStorage.setItem(ROOT+uid(),JSON.stringify(cleaned));return cleaned;
}
function merge(rows){
 const previous=saved(),keys=new Set(previous.map(key));let added=0,skipped=0;
 for(const raw of rows){const entry=normalize(raw);if(!entry)continue;
  const id=key(entry);if(keys.has(id)){skipped++;continue;}previous.push(entry);keys.add(id);added++;if(previous.length>LIMIT)previous.shift();
 }
 persist(previous);return {added,skipped};
}
function key(v){return [v.provider,v.title.toLowerCase(),v.artist.toLowerCase(),v.playlist.toLowerCase(),v.url].join('|')}
function csvEscape(value){let v=String(value??'');if(/^\s*[=+\-@]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'}
function exportCSV(rows){const cols=['title','artist','album','playlist','provider','url'];return [cols.join(','),...rows.map(r=>cols.map(c=>csvEscape(r[c])).join(','))].join('\r\n')}
function download(name,body,mime){
 const url=URL.createObjectURL(new Blob([body],{type:mime})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function draw(panel){
 const host=$('[data-tunes-preview]',panel);host.replaceChildren();
 const rows=saved(),p=document.createElement('p');p.textContent=rows.length+' imported track entries · this browser only';host.append(p);
 for(const record of rows.slice(-7).reverse()){
  const div=document.createElement('div');div.className='biglwa-tunes-import-row';
  const b=document.createElement('b');b.textContent=record.title+' · '+(record.artist||'Unknown artist');
  const small=document.createElement('small');small.textContent=record.playlist+' / '+record.provider;
  div.append(b,small);
  if(record.url){const a=document.createElement('a');a.href=record.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Original ↗';div.append(a)}
  host.append(div);
 }
}
function mount(){
 const dialog=$('#profileMusicDialog');if(!dialog)return false;
 let panel=$('#biglwaTunesTransfer',dialog);
 if(!isOwner()){panel?.remove();return false;}
 if(!panel){
  panel=document.createElement('section');panel.id='biglwaTunesTransfer';
  panel.innerHTML='<details><summary>Playlist transfer · CSV / JSON (beta)</summary>'+
    '<p>Import playlist titles, artists and safe source links. No protected audio is copied and no music-platform API is connected yet.</p>'+
    '<div class="biglwa-tunes-import-actions"><label class="biglwa-tunes-file">Choose CSV / JSON<input type="file" accept=".csv,.json,text/csv,application/json" data-tunes-import hidden></label>'+
    '<button type="button" data-tunes-export="csv">Export CSV</button><button type="button" data-tunes-export="json">Export JSON</button><button type="button" data-tunes-clear>Clear imports</button></div>'+
    '<p data-tunes-status role="status" aria-live="polite"></p><div data-tunes-preview></div>'+
    '<p><b>Next:</b> Spotify, Apple Music, SoundCloud and YouTube Music OAuth / official playlist API integrations require separate app authorization. <a href="/studio?view=orbit">Manage Orbit links</a>. A profile link alone does not sync playlists.</p></details>';
  const songs=$('#profileMusicSongList',dialog);songs?.insertAdjacentElement('afterend',panel);
  panel.addEventListener('change',async e=>{
   if(!e.target.matches('[data-tunes-import]'))return;
   const file=e.target.files?.[0];e.target.value='';if(!file)return;
   const status=$('[data-tunes-status]',panel);
   if(file.size>MAX_FILE){status.textContent='Limit: 2 MB.';return}
   if(!/\.(csv|json)$/i.test(file.name)){status.textContent='Choose a CSV or JSON file.';return}
   try{const data=await file.text(),rows=/\.json$/i.test(file.name)?json(data):csv(data);
    if(!isOwner())throw Error('Account changed before save.');
    const result=merge(rows);status.textContent=result.added+' saved · '+result.skipped+' duplicates. Local metadata only.';draw(panel);
   }catch(error){status.textContent='Import failed: '+String(error?.message||error).slice(0,140)}
  });
  panel.addEventListener('click',e=>{
   const b=e.target.closest('button');if(!b||!isOwner())return;
   const rows=saved();
   if(b.dataset.tunesExport==='json')download('biglwa-tunes.json',JSON.stringify({version:1,tracks:rows},null,2),'application/json');
   else if(b.dataset.tunesExport==='csv')download('biglwa-tunes.csv',exportCSV(rows),'text/csv;charset=utf-8');
   else if(b.hasAttribute('data-tunes-clear')&&confirm('Clear imported playlist metadata from this browser only?')){persist([]);$('[data-tunes-status]',panel).textContent='Import list cleared.';draw(panel)}
  });
 }
 draw(panel);return true;
}
const style=document.createElement('style');style.id='biglwaTunesTransferCss';
style.textContent=[
 '#profileMusicDialog #biglwaTunesTransfer{margin-top:14px;padding:12px 0 0;border-top:1px solid #dbc7c0;color:#382b2b}',
 '#profileMusicDialog #biglwaTunesTransfer summary{cursor:pointer;font:750 13px system-ui}',
 '#profileMusicDialog #biglwaTunesTransfer p{font:500 11px/1.5 system-ui;color:#5c464a}',
 '#profileMusicDialog .biglwa-tunes-import-actions{display:flex;gap:6px;flex-wrap:wrap}',
 '#profileMusicDialog .biglwa-tunes-file{display:inline-block;padding:8px;cursor:pointer;background:#fffaf5;border:1px solid #b9a099;border-radius:7px;font:700 11px system-ui}',
 '#profileMusicDialog [data-tunes-preview]{max-height:185px;overflow:auto}',
 '#profileMusicDialog .biglwa-tunes-import-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:5px;border-bottom:1px solid #ddd1c9;font:11px system-ui}',
 '#profileMusicDialog .biglwa-tunes-import-row b{font-size:12px}',
 '#profileMusicDialog .biglwa-tunes-import-row small{color:#766269}',
 '#profileMusicDialog #biglwaTunesTransfer a{color:#783e58;text-decoration:underline}'
].join('\n');document.head.append(style);
document.addEventListener('click',e=>{if(e.target.closest?.('#profileMusicOpen'))queueMicrotask(mount)});
window.addEventListener('biglwa:session-verified',()=>queueMicrotask(mount));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,1200),{once:true});else setTimeout(mount,1200);
window.BigLWATunesTransfer={csv,json,normalize,saved,merge,exportCSV,mount};
})();