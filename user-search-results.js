/* BIGLWA top search -> user profile cards.
 * Pressing Enter in #globalSearch opens an overlay of match cards.
 * Card fields come from the public `usernames` documents (private `users`
 * docs, which hold email, stay locked down).
 */
(function(){
  try{
    function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
    function localFallback(q){var out=[];try{var v=JSON.parse(localStorage.getItem('biglwaUserDirectory')||'[]');if(Array.isArray(v))out=out.concat(v)}catch(e){}if(Array.isArray(window.__biglwaUsers))out=out.concat(window.__biglwaUsers);return out.filter(function(u){return u&&String(u.username||'').toLowerCase().indexOf(q)!==-1}).slice(0,16)}
    function hueFor(name){var h=0,s=String(name||'u');for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h%360}
    function avatarText(name,u){var p=String(name||u||'?').trim().split(/\s+/);var a=p[0]?p[0][0]:'?';var b=p.length>1?p[p.length-1][0]:'';return esc((a+b).toUpperCase()||'?')}
    function cardHTML(u){
      var h=hueFor(u.username||u.uid);
      var h2=(h+48)%360;
      var bio=u.bio||'',loc=u.location||'',web=u.website||'',mood=u.mood||'';
      var meta='';
      if(loc)meta+='<span class="bl-user-card-loc">'+esc(loc)+'</span>';
      if(web)meta+='<a class="bl-user-card-web" href="'+esc(/^[a-z]+:\/\//i.test(web)?web:'https://'+web)+'" target="_blank" rel="noopener noreferrer">'+esc(web)+'</a>';
      return '<article class="bl-user-card">'
        +'<div class="bl-user-card-avatar" style="background:linear-gradient(145deg,hsl('+h+',72%,80%),hsl('+h2+',60%,90%));color:hsl('+h+',42%,26%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.45)">'+avatarText(u.name,u.username)+'</div>'
        +'<div class="bl-user-card-body">'
        +'<h3>'+esc(u.name||u.username)+'</h3>'
        +'<p class="bl-user-card-name">@'+esc(u.username)+'</p>'
        +(bio?'<p class="bl-user-card-bio">'+esc(bio)+'</p>':'')
        +(meta?'<p class="bl-user-card-meta">'+meta+'</p>':'')
        +(mood?'<p class="bl-user-card-mood-wrap"><span class="bl-user-card-mood">'+esc(mood)+'</span></p>':'')
        +'<a class="bl-user-card-go" href="'+esc(u.url||('/'+encodeURIComponent(u.username)))+'">View profile &#8594;</a>'
        +'</div></article>'
    }
    var overlay=null;
    function close(){if(overlay){var o=overlay;overlay=null;document.removeEventListener('keydown',onKey,true);document.removeEventListener('mousedown',outside,true);o.remove()}}
    function onKey(e){if(e.key==='Escape')close()}
    function outside(e){if(overlay&&!overlay.querySelector('.bl-user-panel').contains(e.target))close()}
    function openPanel(q,hits){
      close();
      overlay=document.createElement('div');
      overlay.className='bl-user-overlay';
      overlay.setAttribute('role','presentation');
      overlay.innerHTML='<div class="bl-user-panel" role="dialog" aria-modal="true" aria-label="People matching @'+esc(q)+'">'
        +'<div class="bl-user-head"><h2>People matching&nbsp;&#8220;@'+esc(q)+'&#8221;</h2><button type="button" class="bl-user-close" aria-label="Close search results">&#10005;</button></div>'
        +(hits.length
          ?'<div class="bl-user-grid">'+hits.map(cardHTML).join('')+'</div>'
          :'<p class="bl-user-empty">No users found for &ldquo;@'+esc(q)+'&rdquo;.</p>')
        +'</div>';
      document.body.appendChild(overlay);
      overlay.querySelector('.bl-user-close').addEventListener('click',close);
      document.addEventListener('keydown',onKey,true);
      setTimeout(function(){document.addEventListener('mousedown',outside,true)},0);
    }
    window.__biglwaUserCards=async function(raw){
      var q=String(raw==null?'':raw).trim().replace(/^@/,'').toLowerCase();
      if(!q)return;
      var hits=[];
      try{if(window.BigLWAUserDirectory&&window.BigLWAUserDirectory.searchUsers)hits=await window.BigLWAUserDirectory.searchUsers(q)}catch(e){}
      if(!hits.length)hits=localFallback(q);
      openPanel(q,hits);
    };
    window.__biglwaUserCardsClose=close;
    var style=document.createElement('style');
    style.textContent='.bl-user-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-start;justify-content:center;padding:72px 16px 32px;box-sizing:border-box;background:rgba(26,16,14,.46);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);overflow:auto}.bl-user-panel{box-sizing:border-box;width:min(820px,100%);max-height:calc(100vh - 104px);overflow-y:auto;padding:20px 22px 24px;border:1px solid #ddd4ca;border-radius:20px;background:#fffaf3;color:#272321;box-shadow:0 30px 70px rgba(30,18,14,.35),0 0 0 1px rgba(255,255,255,.5) inset}.bl-user-head{position:sticky;top:-20px;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;margin:-20px -22px 16px;padding:16px 22px 14px;background:linear-gradient(to bottom,#fffaf3 78%,rgba(255,250,243,0))}.bl-user-head h2{margin:0;font:400 22px/1.1 "CS Bergamot Stitched",Georgia,"Times New Roman",serif;letter-spacing:.01em}.bl-user-close{flex:0 0 auto;width:30px;height:30px;border:1px solid #d9d0c6;border-radius:9px;background:rgba(255,255,255,.7);color:#6f655d;font:600 15px/1 system-ui,sans-serif;cursor:pointer}.bl-user-close:hover{background:#fff;color:#211c19}.bl-user-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}.bl-user-card{display:flex;flex-direction:column;gap:7px;box-sizing:border-box;padding:14px;border:1px solid #e4dbd0;border-radius:14px;background:rgba(255,255,255,.72)}.bl-user-card-avatar{display:grid;place-items:center;width:52px;height:52px;border-radius:15px;font:800 18px/1 Georgia,"Times New Roman",serif}.bl-user-card-body{display:flex;flex-direction:column;gap:3px;min-height:0}.bl-user-card-body h3{margin:2px 0 0;font:700 14px/1.25 Inter,ui-sans-serif,system-ui,sans-serif;color:inherit;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bl-user-card-name{margin:0;font-size:11px;color:#8a7f75;letter-spacing:.01em}.bl-user-card-bio{margin:5px 0 0;font-size:12px;line-height:1.42;color:#4c453f;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.bl-user-card-meta{margin:6px 0 0;display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11px;color:#77716b}.bl-user-card-meta .bl-user-card-web{color:rgb(var(--aura-rgb,216,95,109));text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}.bl-user-card-mood-wrap{margin:5px 0 0}.bl-user-card-mood{display:inline-block;padding:3px 9px;border:1px solid rgba(var(--aura-rgb,216,95,109),.34);border-radius:999px;background:rgba(var(--aura-rgb,216,95,109),.08);color:#6d3650;font-size:11px}.bl-user-card-go{margin-top:auto;padding-top:8px;font:700 12px/1 Inter,ui-sans-serif,system-ui,sans-serif;color:rgb(var(--aura-rgb,216,95,109));text-decoration:none}.bl-user-card-go:hover{text-decoration:underline}.bl-user-empty{margin:0;padding:26px 4px 10px;font-size:13px;color:#8a7f75;text-align:center}@media(max-width:600px){.bl-user-overlay{padding:14px}.bl-user-panel{max-height:calc(100vh - 28px);padding:16px 14px 20px}.bl-user-head{top:-16px;margin:-16px -14px 14px;padding:12px 14px;background:linear-gradient(to bottom,#fffaf3 80%,rgba(255,250,243,0))}.bl-user-head h2{font-size:18px}.bl-user-grid{grid-template-columns:1fr}}body.night-mode .bl-user-panel{background:#241f1d;border-color:#4a423c;color:#f2ece6}body.night-mode .bl-user-head{background:linear-gradient(to bottom,#241f1d 80%,rgba(36,31,29,0))}body.night-mode .bl-user-card{background:rgba(52,45,42,.72);border-color:#4a423c}body.night-mode .bl-user-card-name,body.night-mode .bl-user-card-meta{color:#a99a90}body.night-mode .bl-user-card-bio{color:#d9cfc5}body.night-mode .bl-user-card-mood{color:#e7b8c2}body.night-mode .bl-user-close{background:#37302d;border-color:#514a45;color:#eee7e0}';
    document.head.append(style);
  }catch(e){console.warn('[BIGLWA] user search results unavailable:',e)}
})();