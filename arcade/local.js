'use strict';
const kind=new URLSearchParams(location.search).get('game'),host=document.getElementById('game'),controls=document.getElementById('controls'),status=document.getElementById('status');
function button(text,fn){const b=document.createElement('button');b.textContent=text;b.onclick=fn;controls.append(b);return b}
if(kind==='sudoku'){
 document.getElementById('title').textContent='Number Grid';document.getElementById('help').textContent='Fill each row, column and 3×3 box with 1–9.';
 const puzzle='530070000600195000098000060800060003400803001700020006060000280000419005000080079';
 const grid=document.createElement('div');grid.id='grid';host.append(grid);const inputs=[];
 [...puzzle].forEach((digit,i)=>{const input=document.createElement('input');input.inputMode='numeric';input.maxLength=1;input.setAttribute('aria-label','Row '+(Math.floor(i/9)+1)+' column '+(i%9+1));if(digit!=='0'){input.value=digit;input.readOnly=true}input.oninput=()=>{input.value=input.value.replace(/[^1-9]/g,'');status.textContent=''};inputs.push(input);grid.append(input)});
 button('Check grid',()=>{const values=inputs.map(i=>i.value);if(values.some(v=>!v)){status.textContent='Keep going — some cells are empty.';return}const groups=[];for(let i=0;i<9;i++){groups.push(values.slice(i*9,i*9+9),values.filter((_,j)=>j%9===i));const r=Math.floor(i/3)*3,c=(i%3)*3;groups.push(values.filter((_,j)=>Math.floor(j/9)>=r&&Math.floor(j/9)<r+3&&j%9>=c&&j%9<c+3))}status.textContent=groups.every(g=>new Set(g).size===9)?'Solved! Every row, column and box is complete.':'Some numbers repeat. Check the rows, columns and boxes.'});
 button('Reset',()=>{inputs.forEach((i,n)=>{if(!i.readOnly)i.value=''});status.textContent='Grid reset.'});
}else{
 document.getElementById('title').textContent='Snake';document.getElementById('help').textContent='Eat the red apples! Use arrows, WASD, swipe or the direction buttons. Each apple increases your score.';
 const canvas=document.createElement('canvas');canvas.width=400;canvas.height=400;canvas.tabIndex=0;canvas.setAttribute('aria-label','Snake game board');host.append(canvas);const ctx=canvas.getContext('2d');let snake,dir,next,food,score,active=false,timer;
 function spawn(){const free=[];for(let y=0;y<20;y++)for(let x=0;x<20;x++)if(!snake.some(p=>p[0]===x&&p[1]===y))free.push([x,y]);return free[Math.floor(Math.random()*free.length)]}
 function paint(){
   ctx.fillStyle='#201c13';ctx.fillRect(0,0,400,400);
   ctx.strokeStyle='rgba(244,209,123,.07)';ctx.lineWidth=1;
   for(let n=20;n<400;n+=20){ctx.beginPath();ctx.moveTo(n,0);ctx.lineTo(n,400);ctx.stroke();ctx.beginPath();ctx.moveTo(0,n);ctx.lineTo(400,n);ctx.stroke()}
   if(food){
     const cx=food[0]*20+10,cy=food[1]*20+11;
     ctx.fillStyle='#e83f4b';ctx.beginPath();ctx.arc(cx,cy,7.5,0,2*Math.PI);ctx.fill();
     ctx.fillStyle='#ff9a94';ctx.beginPath();ctx.arc(cx-2.4,cy-2.4,2.2,0,2*Math.PI);ctx.fill();
     ctx.strokeStyle='#7d4723';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,cy-6);ctx.lineTo(cx+1,cy-10);ctx.stroke();
     ctx.fillStyle='#69c76b';ctx.beginPath();ctx.ellipse(cx+4,cy-9,4,2,Math.PI/5,0,2*Math.PI);ctx.fill();
   }
   snake.forEach((p,i)=>{ctx.fillStyle=i?'#6baf80':'#c0e8ba';ctx.fillRect(p[0]*20+1,p[1]*20+1,18,18)});
 }
 function reset(){clearInterval(timer);snake=[[8,10],[7,10],[6,10]];dir=[1,0];next=dir;score=0;food=[11,10];active=false;status.textContent='Press Start to play · a red apple is waiting.';paint()}
 function step(){dir=next;const p=[snake[0][0]+dir[0],snake[0][1]+dir[1]],eat=!!food&&p[0]===food[0]&&p[1]===food[1],body=eat?snake:snake.slice(0,-1);if(p.some(v=>v<0||v>=20)||body.some(q=>q[0]===p[0]&&q[1]===p[1])){clearInterval(timer);active=false;status.textContent='Game over · score '+score+'. Press Start for a new game.';return}snake.unshift(p);if(eat){score++;food=spawn();if(!food){clearInterval(timer);active=false;status.textContent='You filled the board!';paint();return}}else snake.pop();status.textContent='Score '+score;paint()}
 function steer(d){if(d[0]!==-dir[0]||d[1]!==-dir[1])next=d}
 button('Start / restart',()=>{reset();active=true;timer=setInterval(step,145);canvas.focus()});button('Pause',()=>{if(active){clearInterval(timer);active=false;status.textContent='Paused · score '+score}else{active=true;timer=setInterval(step,145)}});
 for(const [label,d] of [['↑',[0,-1]],['←',[-1,0]],['↓',[0,1]],['→',[1,0]]])button(label,()=>steer(d));
 const controlsByKey={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};
 document.addEventListener('keydown',e=>{if(e.target?.matches?.('input,textarea,[contenteditable="true"]'))return;const d=controlsByKey[e.key];if(d){e.preventDefault();steer(d)}});
 window.addEventListener('message',e=>{if(e.origin!==location.origin||!window.frameElement)return;
   if(e.data?.type==='biglwa-arcade-key'){const d=controlsByKey[e.data.key];if(d)steer(d)}
 });
 let touchX=0,touchY=0;
 canvas.addEventListener('touchstart',e=>{touchX=e.touches[0]?.clientX||0;touchY=e.touches[0]?.clientY||0},{passive:true});
 canvas.addEventListener('touchend',e=>{const dx=(e.changedTouches[0]?.clientX||0)-touchX,dy=(e.changedTouches[0]?.clientY||0)-touchY;
   if(Math.max(Math.abs(dx),Math.abs(dy))>15)steer(Math.abs(dx)>Math.abs(dy)?(dx>0?[1,0]:[-1,0]):(dy>0?[0,1]:[0,-1]));
   e.preventDefault();
 },{passive:false});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInterval(timer);active=false;status.textContent='Paused'}});reset();
}
