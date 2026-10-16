/* Big LWA private multi-note / multi-page writing collections.
   Migrate the previous single-draft keys without deleting them. All entries remain private
   on this device and are separated by the current authenticated BIG LWA uid. */
(()=>{
  'use strict';
  if(window.BigLWAWritingCollections)return;
  const timestamp=()=>new Date().toISOString();
  const validDate=value=>{const d=new Date(value);return Number.isFinite(d.getTime())?d:null};
  const formatDate=value=>{
    const d=validDate(value);
    return d?d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Date unavailable';
  };
  const formatTime=value=>{
    const d=validDate(value);
    return d?d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}):'';
  };
  const identifier=()=>{
    if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();
    return 'entry-'+Date.now()+'-'+Math.random().toString(36).slice(2,9);
  };
  const userId=()=>String(window.__biglwaIdentity?.uid||window.__biglwaAuth?.currentUser?.uid||'guest').trim()||'guest';
  const clean=record=>{
    if(!record||typeof record!=='object')return null;
    return {
      id:String(record.id||identifier()),
      content:String(record.content||''),
      createdAt:validDate(record.createdAt)?.toISOString()||timestamp(),
      updatedAt:validDate(record.updatedAt)?.toISOString()||timestamp()
    };
  };
  const label=(record,kind)=>{
    const line=record.content.split(/\r?\n/).find(row=>row.trim())?.trim()||'';
    return line.slice(0,55)||(kind==='diary'?'Untitled page':'New note');
  };
  function mount({kind,form,area,status,onSelection,onSave}){
    if(!['notes','diary'].includes(kind)||!form||!area)return null;
    const uid=userId();
    const legacyKey='biglwaDraft_'+kind;
    const collectionKey='biglwaWritingCollectionV1:'+uid+':'+kind;
    const migrationOwnerKey='biglwaDraftMigrationOwnerV1';
    const isJournal=kind==='diary';
    let saved;
    try{saved=JSON.parse(localStorage.getItem(collectionKey)||'null')}catch{}
    let entries=Array.isArray(saved?.entries)?saved.entries.map(clean).filter(Boolean).slice(0,500):[];
    if(!entries.length){
      let first='';
      try{
        const owner=localStorage.getItem(migrationOwnerKey);
        if(!owner||owner===uid){
          first=localStorage.getItem(legacyKey)||'';
          if(!owner&&uid!=='guest')localStorage.setItem(migrationOwnerKey,uid);
        }
      }catch{}
      entries=[{id:identifier(),content:first,createdAt:timestamp(),updatedAt:timestamp()}];
    }
    let currentId=entries.some(entry=>entry.id===saved?.currentId)?saved.currentId:entries[0].id;
    const active=()=>entries.find(entry=>entry.id===currentId)||entries[0];
    const aside=document.createElement('aside');
    aside.className='writing-collection-sidebar';
    aside.setAttribute('aria-label',isJournal?'Journal pages':'Your private Sqwib notes');
    const head=document.createElement('div');
    head.className='writing-collection-head';
    const title=document.createElement('strong');
    title.textContent=isJournal?'pages':'all notes';
    const newButton=document.createElement('button');
    newButton.type='button';
    newButton.className='writing-collection-new';
    newButton.textContent=isJournal?'+ Add page':'+ New note';
    newButton.setAttribute('aria-label',isJournal?'Add a new journal page':'Create a new Sqwib note');
    head.append(title,newButton);
    const search=document.createElement('input');
    search.className='writing-collection-search';
    search.type='search';
    search.placeholder=isJournal?'Find a page…':'Search notes…';
    search.setAttribute('aria-label',search.placeholder);
    const list=document.createElement('div');
    list.className='writing-collection-list';
    list.setAttribute('role','list');
    aside.append(head,search,list);
    form.parentNode.insertBefore(aside,form);
    form.classList.add('writing-collection-form');
    const dateline=document.createElement('div');
    dateline.className='writing-collection-dateline';
    dateline.setAttribute('aria-live','polite');
    form.insertBefore(dateline,area);
    const count=()=>entries.length+' '+(isJournal?(entries.length===1?'page':'pages'):(entries.length===1?'note':'notes'));
    const commit=()=>{
      localStorage.setItem(collectionKey,JSON.stringify({version:1,currentId,entries}));
      // The Studio preview and existing publish flow intentionally follow the selected
      // entry. This legacy mirror also preserves older feature integrations.
      localStorage.setItem(legacyKey,active().content);
    };
    function renderList(){
      title.textContent=(isJournal?'pages':'all notes')+' · '+count();
      dateline.textContent=(isJournal?'Journal page':'Private Sqwib')+' · '+formatDate(active().createdAt)+' · '+formatTime(active().updatedAt)+' edited';
      const query=search.value.trim().toLocaleLowerCase();
      list.replaceChildren();
      const ordered=[...entries].sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt)||Date.parse(b.createdAt)-Date.parse(a.createdAt));
      const matches=ordered.filter(entry=>!query||entry.content.toLocaleLowerCase().includes(query)||label(entry,kind).toLocaleLowerCase().includes(query)||formatDate(entry.createdAt).toLocaleLowerCase().includes(query));
      if(!matches.length){
        const empty=document.createElement('p');empty.className='writing-collection-no-results';
        empty.textContent='No matching '+(isJournal?'pages':'notes')+'.';
        list.append(empty);
      }
      for(const entry of matches){
        const b=document.createElement('button');
        b.type='button';b.className='writing-collection-item';b.dataset.entryId=entry.id;
        b.setAttribute('role','listitem');
        b.setAttribute('aria-current',entry.id===currentId?'true':'false');
        const name=document.createElement('strong');name.textContent=label(entry,kind);
        const date=document.createElement('time');date.dateTime=entry.createdAt;
        date.textContent=formatDate(entry.createdAt)+(entry.updatedAt!==entry.createdAt?' · edited '+formatTime(entry.updatedAt):'');
        const preview=document.createElement('small');
        preview.textContent=entry.content.replace(/\s+/g,' ').trim().slice(0,78)||(isJournal?'Write on this page…':'Write something…');
        b.append(name,date,preview);
        list.append(b);
      }
    }
    const notify=()=>{
      if(typeof onSelection==='function')onSelection(active().content);
      document.dispatchEvent(new CustomEvent('biglwa:writing-saved',{detail:{key:kind,value:active().content}}));
    };
    function showEntry(id,focus=true){
      if(!entries.some(x=>x.id===id))return;
      currentId=id;
      area.value=active().content;
      commit();renderList();notify();
      if(status){status.textContent=isJournal?'Journal page opened. Private until you choose to publish.':'Private note opened.';status.classList.remove('ok')}
      if(focus)area.focus();
    }
    function saveCurrent(){
      const entry=active();
      if(entry.content!==area.value){
        entry.content=area.value;
        entry.updatedAt=timestamp();
      }
      commit();renderList();
      if(typeof onSave==='function')onSave(entry);
    }
    newButton.addEventListener('click',()=>{
      saveCurrent();
      const next={id:identifier(),content:'',createdAt:timestamp(),updatedAt:timestamp()};
      entries.push(next);
      search.value='';
      showEntry(next.id,true);
    });
    list.addEventListener('click',event=>{
      const btn=event.target.closest('button[data-entry-id]');
      if(!btn||btn.dataset.entryId===currentId)return;
      saveCurrent();showEntry(btn.dataset.entryId,true);
    });
    search.addEventListener('input',renderList);
    // Explicit deletion, not automatic cleanup: users can delete individual notes/pages.
    const removeButton=document.createElement('button');
    removeButton.type='button';removeButton.className='writing-collection-remove';
    removeButton.textContent=isJournal?'Delete page':'Delete note';
    removeButton.setAttribute('aria-label','Delete the currently selected '+(isJournal?'journal page':'note'));
    const actions=form.querySelector('.module-actions');
    if(actions)actions.append(removeButton);
    removeButton.addEventListener('click',()=>{
      const current=active();
      if(!window.confirm('Delete this '+(isJournal?'journal page':'private note')+'? This cannot be undone.'))return;
      entries=entries.filter(item=>item.id!==current.id);
      if(!entries.length)entries=[{id:identifier(),content:'',createdAt:timestamp(),updatedAt:timestamp()}];
      search.value='';showEntry([...entries].sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt))[0].id);
    });
    area.value=active().content;
    commit();renderList();notify();
    return Object.freeze({saveCurrent,getCurrent:()=>({...active()}),count:()=>entries.length});
  }
  window.BigLWAWritingCollections=Object.freeze({mount});
})();