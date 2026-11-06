'use strict';
const screen=document.getElementById('screen'),status=document.getElementById('status');let turn=0;
function stop(){turn++;screen.replaceChildren();status.textContent='Player stopped.'}
async function play(bytes,name){
 const current=++turn;screen.replaceChildren();
 if(bytes.byteLength>32*1024*1024)throw Error('Choose a SWF smaller than 32 MB.');
 const header=String.fromCharCode(...new Uint8Array(bytes,0,Math.min(3,bytes.byteLength)));
 if(!['FWS','CWS','ZWS'].includes(header))throw Error('This file is not a Flash SWF.');
 if(!window.RufflePlayer?.newest)throw Error('The Flash runtime did not load. Reload the player and try again.');
 const player=window.RufflePlayer.newest().createPlayer();screen.append(player);status.textContent='Loading '+name+'…';
 await player.ruffle().load({data:new Uint8Array(bytes),autoplay:'on',allowScriptAccess:false,allowNetworking:'none',openUrlMode:'deny',contextMenu:'off',splashScreen:false});
 if(current!==turn)return;
 status.textContent='Loaded '+name+'. If the game stalls, it may need additional files or unsupported Flash features.';
}
document.getElementById('file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{await play(await file.arrayBuffer(),file.name)}catch(error){stop();status.textContent=error.message}});
document.getElementById('demo').onclick=async()=>{try{const r=await fetch('/arcade/flash-test.swf');if(!r.ok)throw Error('Flash test is unavailable.');await play(await r.arrayBuffer(),'BIG LWA color test')}catch(error){stop();status.textContent=error.message}};
document.getElementById('stop').onclick=stop;
