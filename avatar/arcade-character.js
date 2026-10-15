/* Big LWA Arcade: private signed-in character bridge + original Quest game.
 * No Mii/Nintendo network connection and no invented multiplayer ranks. */
(()=>{
'use strict';
const $=s=>document.querySelector(s);
const identity=$('#biglwaArcadeIdentity'),grid=$('#questGrid');
if(!identity||!grid)return;
const API='https://biglwa-instagram-api.leianmulatre-284.workers.dev';
let character={name:'Guest',url:'',type:'guest'},uid='guest',level=0,player=0,stars=new Set(),finished=false;
const levels=[
  {walls:[9,16,23,25,31,32],stars:[3,24,45],exit:48},
  {walls:[10,17,24,31,38,12,26],stars:[5,21,42],exit:48},
  {walls:[8,15,29,30,36,11,39],stars:[6,22,40],exit:48}
];
const rows=7,cols=7;
function portrait(url,label){
  const host=$('.arcade-identity-portrait');if(!host)return;
  host.replaceChildren();
  if(!url){host.textContent='◉';return;}
  const img=new Image();img.src=url;img.alt=label+' character portrait';
  img.onerror=()=>host.textContent='◉';host.append(img);
}
function validPortrait(record){
  if(record?.type!=='mii'||typeof record?.url!=='string')return '';
  try{
    const url=new URL(record.url);
    return url.protocol==='https:'&&url.href.startsWith(API+'/media/profile-photo/')?url.href:'';
  }catch{return ''}
}
function refreshIdentity(){
  const name=String(character.name||'Guest').slice(0,32),signedIn=uid!=='guest';
  $('.arcade-identity strong').textContent=signedIn?'playing as '+name:'playing as guest';
  const detail=$('.arcade-identity small');
  detail.replaceChildren(document.createTextNode(signedIn
    ?(character.url?'Character connected to your account. ':'Save a character to your account. ')
    :'Sign in and save a character to play as them. '));
  const editor=document.createElement('a');editor.href='/avatar/mii-editor.html';
  editor.textContent='Edit character ↗';detail.append(editor);
  portrait(character.url,name);
  draw();
}
async function loadCharacter(){
  try{
    const [a,b,f]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
    ]);
    const app=a.getApps()[0]||a.initializeApp({
      apiKey:'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',authDomain:'biglwa.firebaseapp.com',
      projectId:'biglwa',appId:'1:83232670555:web:e04927b20458390b3b507e'
    });
    const auth=b.getAuth(app);await auth.authStateReady();
    const user=auth.currentUser;
    uid=user?.uid||'guest';
    if(!user){refreshIdentity();return;}
    const record=(await f.getDoc(f.doc(f.getFirestore(app),'users',user.uid))).data()?.studioAvatar||null;
    if(auth.currentUser?.uid!==user.uid)return;
    const url=validPortrait(record);
    character={
      type:record?.type||'guest',
      name:record?.type==='mii'?String(record?.preset?.name||'Your character').slice(0,32):record?.type==='minecraft'?'Minecraft player':'Your character',
      url
    };
    refreshIdentity();
  }catch(error){console.warn('[Big LWA Arcade] Character unavailable:',error);refreshIdentity();}
}
function announce(message){const status=$('#questStatus');if(status)status.textContent=message;}
function position(x,y){return y*cols+x}
function begin(next=0){
  level=next;player=0;stars=new Set(levels[level].stars);finished=false;
  announce('Collect the three stars, then enter the portal.');draw();
}
function draw(){
  if(!grid)return;
  const data=levels[level]||levels[0],walls=new Set(data.walls);
  const host=document.createDocumentFragment();
  for(let i=0;i<rows*cols;i++){
    const cell=document.createElement('div');
    cell.className='quest-cell'+(walls.has(i)?' is-wall':'')+
      (stars.has(i)?' is-star':'')+(i===data.exit?' is-goal':'')+(i===player?' is-player':'');
    cell.setAttribute('role','gridcell');
    const x=i%cols,y=Math.floor(i/cols);
    cell.setAttribute('aria-label','row '+(y+1)+', column '+(x+1)+': '+
      (i===player?'your character':walls.has(i)?'wall':stars.has(i)?'star':i===data.exit?'portal':'empty'));
    if(i===player){
      if(character.url){const img=new Image();img.src=character.url;img.alt='';
        img.className='quest-player';img.onerror=()=>{cell.textContent='◉'};cell.append(img);
      }else cell.textContent='◉';
    }else if(stars.has(i))cell.textContent='★';
    else if(i===data.exit)cell.textContent='◎';
    host.append(cell);
  }
  grid.replaceChildren(host);
  $('#questLevel').textContent='Level '+(level+1)+' of '+levels.length;
  $('#questStars').textContent=(3-stars.size)+' / 3 stars';
}
function move(direction){
  if($('#gameQuest').hidden||finished)return;
  const dx={left:-1,right:1,up:0,down:0}[direction],dy={left:0,right:0,up:-1,down:1}[direction];
  if(dx===undefined)return;
  const x=player%cols,y=Math.floor(player/cols),nx=x+dx,ny=y+dy;
  if(nx<0||nx>=cols||ny<0||ny>=rows)return;
  const to=position(nx,ny),data=levels[level];
  if(data.walls.includes(to)){announce('There is a wall here. Try another route.');return}
  player=to;
  if(stars.delete(to))announce('Star collected! '+(3-stars.size)+' of 3.');
  if(to===data.exit){
    if(stars.size){announce('Collect all three stars before entering the portal.');}
    else if(level===levels.length-1){
      finished=true;announce('All three levels complete! Your character won. Restart to play again.');
      try{
        if(uid!=='guest')localStorage.setItem('biglwaQuestCompleted:v1:'+uid,JSON.stringify({completed:true,at:Date.now()}));
      }catch{}
    }else{begin(level+1);announce('Level '+(level+1)+'! All stars collected.');return}
  }
  draw();
}
document.querySelectorAll('[data-quest-direction]').forEach(button=>{
  button.addEventListener('click',()=>move(button.dataset.questDirection));
});
$('#questReset')?.addEventListener('click',()=>begin(0));
document.addEventListener('keydown',event=>{
  if($('#gameQuest').hidden||event.target.matches('input,textarea,select,[contenteditable]'))return;
  const direction={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',
    ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down'}[event.key];
  if(direction){event.preventDefault();move(direction)}
});
let start=null;
grid.addEventListener('touchstart',event=>{
  if(event.touches.length!==1)return;
  start={x:event.touches[0].clientX,y:event.touches[0].clientY};
},{passive:true});
grid.addEventListener('touchend',event=>{
  if(!start)return;
  const dx=event.changedTouches[0].clientX-start.x,dy=event.changedTouches[0].clientY-start.y;
  start=null;
  if(Math.max(Math.abs(dx),Math.abs(dy))<18)return;
  move(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));
},{passive:true});
window.addEventListener('focus',loadCharacter);
begin(0);loadCharacter();
})();