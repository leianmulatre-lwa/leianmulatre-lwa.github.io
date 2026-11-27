import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{JSDOM}=require('jsdom');
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const context={window:{},Date,Set};vm.runInNewContext(read('./discovery-catalog.js'),context);
const catalog=context.window.BigLWADiscoveryCatalog;

test('Every station receives its weighted share in every daypart, even when cycle and daypart share factors',()=>{
 for(const count of [5,7,11,39,41]){
  const stations=Array.from({length:count},(_,i)=>({id:String(i),title:i?'Station '+i:'UCLA Radio'}));
  const totals=stations.map(()=>[0,0,0]);const weight=count+1;
  for(let day=0;day<weight;day++){
   const date=new Date(Date.UTC(2026,0,1+day)).toISOString().slice(0,10);
   for(let hour=0;hour<24;hour++){
    const pick=catalog.radioPick(stations,date,hour),part=hour>=6&&hour<12?0:hour>=12&&hour<18?1:2;
    totals[Number(pick.id)][part]++;
   }
  }
  for(let i=0;i<count;i++)assert.deepEqual(totals[i],[6,6,12].map(n=>n*(i?1:2)));
 }
});
test('Vibe search works locally, without a model response',()=>{
 assert(catalog.score({caption:'lofi ambient study music'},'cozy')>0);
 assert(catalog.score({title:'Streetwear lookbook'},'fashion vibes')>0);
 assert.equal(catalog.score({title:'City transit routes'},'fashion vibes'),0);
});
test('Source snapshot uses actual video IDs, dates, secure streams and all 50 state listings',()=>{
 const data=JSON.parse(read('./assets/discovery/latest.json'));
 assert.equal(new Set(data.radio.filter(x=>x.kind==='college').map(x=>x.stateCode)).size,50);
 assert(data.videos.some(x=>x.creator==='Bernie Sanders'&&x.section==='news'));
 for(const row of data.videos){assert.match(row.videoId,/^[\w-]{11}$/);assert(Number.isFinite(Date.parse(row.publishedAt)))}
 for(const row of data.radio)if(row.stream)assert.match(row.stream,/^https:\/\//);
 assert(data.stories.some(x=>x.sourceId==='aises'));
});
test('Real frequency data raises the meter smoothly; silence and unsupported origins stay flat',()=>{
 const dom=new JSDOM('<article><div id="eq">'+Array(10).fill('<i></i>').join('')+'</div><audio></audio></article>',{url:'https://biglwa.com/',runScripts:'outside-only'});
 const w=dom.window;let db=-Infinity,created=0;
 w.AudioContext=class{sampleRate=48000;destination={};createMediaElementSource(){created++;return {connect(){}}}createAnalyser(){return {fftSize:2048,frequencyBinCount:1024,connect(){},getFloatFrequencyData(a){a.fill(db)}}}resume(){return Promise.resolve()}};
 w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};
 const audio=w.document.querySelector('audio');audio.src='https://biglwa.com/tone.wav';Object.defineProperty(audio,'paused',{value:false});
 w.eq=w.document.querySelector('#eq');w.card=w.document.querySelector('article');w.audio=audio;
 const source=read('./studio-experience.js');const from=source.indexOf('    let musicAnalyser=null'),to=source.indexOf('    const seek=clientX',from);
 w.eval(source.slice(from,to)+'\nwindow.testWave={startWave,frameWave};');
 w.testWave.startWave();assert.equal(created,1);
 for(let t=0;t<1000;t+=16)w.testWave.frameWave(t);
 const level=()=>Number(w.eq.firstElementChild.style.transform.match(/[\d.]+/)[0]);assert(level()<.05);
 db=-14;for(let t=1000;t<2000;t+=16)w.testWave.frameWave(t);
 assert(level()>.85&&level()<1,'Peaks visibly use the taller canvas without overshoot');
 db=-Infinity;for(let t=2000;t<4000;t+=16)w.testWave.frameWave(t);assert(level()<.04);
 dom.window.close();
});
test('Stream joins catalogs, opens News, searches a creator and keeps radio manual picks distinct',async t=>{
 const dom=new JSDOM('<main id="studioApp"><div id="streamTest"></div></main>',{url:'https://biglwa.com/studio/stream',runScripts:'outside-only',pretendToBeVisual:true});
 t.after(()=>dom.window.close());
 const w=dom.window;w.HTMLElement.prototype.scrollIntoView=function(){};w.console={...console,warn(){}};w.fetch=async url=>({ok:true,json:async()=>String(url).includes('latest.json')?JSON.parse(read('./assets/discovery/latest.json')):{items:[]}});w.AbortSignal=AbortSignal;
 let clock=Date.parse('2026-11-17T08:00:00'),hourly;
 const RealDate=w.Date;w.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[clock]))}static now(){return clock}};
 const interval=w.setInterval.bind(w);w.setInterval=(callback,delay)=>delay===30000?(hourly=callback,1):interval(callback,delay);
 const playing=new WeakSet();Object.defineProperty(w.HTMLMediaElement.prototype,'paused',{get(){return !playing.has(this)}});
 w.HTMLMediaElement.prototype.load=function(){};w.HTMLMediaElement.prototype.pause=function(){playing.delete(this)};w.HTMLMediaElement.prototype.play=function(){playing.add(this);return Promise.resolve()};
 w.eval(read('./discovery-catalog.js'));w.eval(read('./stream-guide.js'));
 w.BigLWAStreamGuide.mount(w.document.querySelector('#streamTest'));
 await w.BigLWADiscoveryCatalog.load();await new Promise(r=>setTimeout(r,40));
 assert(w.BigLWAStreamGuide.stations.length>60);
 assert(w.document.querySelector('.stream-programming-math').textContent.includes('weight 2'));
 w.document.querySelector('[data-follow-radio]').click();
 w.document.querySelector('[data-radio-play]').click(); // pause
 w.document.querySelector('[data-radio-play]').click(); // resume scheduled listening
 clock+=3600000;hourly();
 const expected=w.BigLWAStreamGuide.getDailyGuide('2026-11-17').find(row=>row.category==='podcast').slots[9];
 assert.equal(w.BigLWAStreamGuide.lastWatchedTitle,expected.title,'Play/pause preserves the hourly schedule');
 assert.equal(w.document.querySelector('#streamRadioAudio').paused,false,'Scheduled listening resumes at the next hour');
 w.document.querySelector('[data-stream-station]').click();
 const manualTitle=w.BigLWAStreamGuide.lastWatchedTitle;
 clock+=3600000;hourly();
 assert.equal(w.BigLWAStreamGuide.lastWatchedTitle,manualTitle,'Manual selection remains on the chosen station');
 w.document.querySelector('[data-stream-tab="lwa-tv"]').click();
 w.document.querySelector('[data-tv-section="news"]').click();
 assert.equal(w.document.querySelector('#streamCategoryCopy h2').textContent,'lwa news');
 const wla=w.document.querySelector('[data-tv-section="wla"]');
 assert(wla?.querySelector('.wla-skull-mask'),'WLA tab and its skull are rendered next to News');
 assert.equal(wla.previousElementSibling.dataset.tvSection,'news');
 wla.click();
 assert.equal(w.document.querySelector('#streamCategoryCopy h2').textContent,'wla');
 assert(w.document.querySelector('.wla-cinema-standby .wla-skull-mask'));
 assert(w.document.querySelector('.stream-guide').hidden);
 assert(w.document.querySelector('.wla-source-own .wla-skull-mask'));
 assert(w.document.querySelector('.wla-source-tubi')?.textContent.includes('Tubi'));
 w.document.querySelector('[data-wla-filter="tubi"]').click();
 assert([...w.document.querySelectorAll('.wla-result')].every(x=>x.querySelector('.wla-source-tubi')));
 w.document.querySelector('[data-wla-filter="all"]').click();
 const oldFetch=w.fetch;
 w.fetch=async url=>({ok:true,json:async()=>String(url).includes('/search/shows')?[{show:{id:1,name:'Test Series',premiered:'2020-01-01',url:'https://www.tvmaze.com/shows/1/test'}}]:String(url).includes('/episodes')?[{id:2,season:1,number:1,name:'Pilot'}]:{results:[]}});
 w.document.querySelector('#wlaTitleQuery').value='Test Series';
 const submit=new w.Event('submit',{bubbles:true,cancelable:true});
 w.document.querySelector('.wla-title-search').dispatchEvent(submit);
 assert(submit.defaultPrevented,'Title search does not navigate away');
 await new Promise(r=>setTimeout(r,10));
 assert(w.document.querySelector('.wla-result')?.textContent.includes('Test Series'));
 w.document.querySelector('.wla-result').click();
 await new Promise(r=>setTimeout(r,10));
 assert(w.document.querySelector('.wla-episodes button')?.textContent.includes('Pilot'));
 w.fetch=oldFetch;
 w.document.querySelector('[data-tv-section="news"]').click();
 assert(!w.document.querySelector('.stream-guide').hidden);
 const bernie=w.BigLWADiscoveryCatalog.data.videos.find(v=>v.creator==='Bernie Sanders');
 assert(w.BigLWAStreamGuide.playlist.find(p=>p.category==='lwa-tv').slots.some(p=>p.id===bernie.id));
 w.document.querySelector('#streamProgramQuery').value='CoryxKenshin';w.document.querySelector('.stream-program-search').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 await new Promise(r=>setTimeout(r,40));
 const result=w.document.querySelector('.stream-program-results button');assert(result?.textContent.includes('CoryxKenshin'));result.click();
 assert.equal(w.document.querySelector('[data-tv-section="entertainment"]').getAttribute('aria-pressed'),'true');
 dom.window.close();
});
