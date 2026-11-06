/* Big LWA private video trim: browser-native local-only, no uploads.
   Handles large inputs via a blob URL and real-time MediaRecorder playback,
   avoiding a full file.arrayBuffer()/FFmpeg in-memory copy. */
export function mountVideoTrimmer(root,file,{download,onStatus,onProgress}={}){
  let source='',cancelled=false,recording=false,recorder=null,output=[],stopCurrent=null;
  const supported=typeof MediaRecorder!=='undefined'&&
    ('captureStream' in HTMLMediaElement.prototype||'webkitCaptureStream' in HTMLMediaElement.prototype);
  const formats=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4;codecs=avc1,mp4a.40.2','video/mp4']
    .filter(m=>typeof MediaRecorder!=='undefined'&&MediaRecorder.isTypeSupported(m));
  const safeText=text=>{const p=root.querySelector('[data-trim-status]');if(p)p.textContent=text;onStatus?.(text);};
  root.innerHTML='<h3>Trim video</h3>'+
    '<p class="tool-note">Preview the file here, select a start and end time, and save a clip. Up to 500 MB can be selected. Trimming is local, recorded in real time as WebM where the browser supports it — no account upload.</p>'+
    '<video data-trim-player playsinline preload="metadata" controls style="width:100%;max-height:360px;border-radius:12px;background:#171616"></video>'+
    '<div class="tool-trim-timeline"><label>Start (seconds)<input type="number" min="0" step="0.1" value="0" data-trim-start></label>'+
    '<label>End (seconds)<input type="number" min="0" step="0.1" value="0" data-trim-end></label></div>'+
    '<div class="tool-actions"><button type="button" class="module-action" data-trim-preview>Preview selection</button>'+
    '<button type="button" class="module-action" data-trim-export>Export trimmed WebM</button>'+
    '<button type="button" class="module-action ghost" data-trim-cancel hidden>Stop</button></div>'+
    '<p class="tool-note" data-trim-status role="status" aria-live="polite">Loading video metadata…</p>';
  const media=root.querySelector('[data-trim-player]'),
    startEl=root.querySelector('[data-trim-start]'),
    endEl=root.querySelector('[data-trim-end]'),
    exportEl=root.querySelector('[data-trim-export]'),
    previewEl=root.querySelector('[data-trim-preview]'),
    cancelEl=root.querySelector('[data-trim-cancel]');
  source=URL.createObjectURL(file);media.src=source;
  const mime=formats[0]||'';
  if(!supported||!mime){
    exportEl.disabled=true;
    safeText('This browser cannot trim videos locally using MediaRecorder/captureStream. You can still preview the video; try Chrome on desktop for export.');
  }
  const duration=()=>Number.isFinite(media.duration)?media.duration:0;
  media.addEventListener('loadedmetadata',()=>{
    if(cancelled)return;
    if(!duration()){safeText('This video does not expose a seekable duration. Trimming may not be supported.');return;}
    endEl.value=duration().toFixed(1);
    startEl.max=String(duration());endEl.max=String(duration());
    if(supported&&mime)safeText('Ready. Your '+(file.size/1024/1024).toFixed(1)+' MB video stays on this device. Choose the portion to keep.');
  });
  media.addEventListener('error',()=>safeText('The browser cannot decode this video. Try a standard MP4/WebM or a desktop editor.'));
  const range=()=>{
    const a=Number(startEl.value),b=Number(endEl.value),d=duration();
    if(!d||!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<=a||b>d+0.11)
      throw Error('Enter a valid start and end within the video duration, with end after start.');
    return [a,Math.min(d,b)];
  };
  function seek(time){
    return new Promise((resolve,reject)=>{
      if(Math.abs(media.currentTime-time)<.06){resolve();return}
      let deadline;
      const cleanup=()=>{media.removeEventListener('seeked',done);media.removeEventListener('error',bad);clearTimeout(deadline)};
      const done=()=>{cleanup();resolve()};
      const bad=()=>{cleanup();reject(Error('Could not seek to the trim start.'))};
      media.addEventListener('seeked',done,{once:true});media.addEventListener('error',bad,{once:true});
      deadline=setTimeout(()=>{cleanup();reject(Error('Timed out seeking in this video.'))},12000);
      try{media.currentTime=time}catch(e){cleanup();reject(e)}
    });
  }
  previewEl.onclick=async()=>{
    if(recording)return;
    try{
      const [a,b]=range();media.pause();await seek(a);
      await media.play();safeText('Previewing selected range: '+a.toFixed(1)+'–'+b.toFixed(1)+' seconds.');
      const pauseEnd=()=>{
        if(media.currentTime>=b-.05){media.pause();media.removeEventListener('timeupdate',pauseEnd)}
      };
      media.addEventListener('timeupdate',pauseEnd);
    }catch(e){safeText(e.message||'Could not preview selection.')}
  };
  async function exportClip(){
    if(recording||!supported||!mime)return;
    let begin,end;
    try{[begin,end]=range()}catch(e){safeText(e.message);return}
    media.pause();cancelled=false;recording=true;output=[];
    exportEl.disabled=true;previewEl.disabled=true;cancelEl.hidden=false;
    safeText('Preparing the clip…');
    try{
      await seek(begin);
      if(cancelled)throw Error('Trim cancelled.');
      const capture=media.captureStream||media.webkitCaptureStream;
      // Start playback through MediaRecorder without decoding the full input
      // into a worker memory buffer (unlike the FFmpeg conversion path).
      const stream=capture.call(media);
      if(!stream?.getVideoTracks().length)throw Error('This browser did not expose a video track for export.');
      const recorderOptions={mimeType:mime};
      recorder=new MediaRecorder(stream,recorderOptions);
      const result=new Promise((resolve,reject)=>{
        recorder.ondataavailable=e=>{if(e.data?.size)output.push(e.data)};
        recorder.onerror=e=>reject(Error('Recording failed: '+(e.error?.message||'browser limitation')));
        recorder.onstop=()=>resolve();
      });
      const onTime=()=>{
        onProgress?.(Math.max(0,Math.min(1,(media.currentTime-begin)/(end-begin))));
        if(media.currentTime>=end-.045)stop();
      };
      function stop(){
        media.pause();media.removeEventListener('timeupdate',onTime);stopCurrent=null;
        if(recorder?.state==='recording')recorder.stop();
      }
      stopCurrent=stop;
      recorder.start(1000);
      media.addEventListener('timeupdate',onTime);
      safeText('Trimming in real time — keep this tab open. This may take '+Math.ceil(end-begin)+' seconds.');
      await media.play();
      await result;
      if(cancelled)throw Error('Trim cancelled.');
      if(!output.length)throw Error('The browser produced no video data.');
      const blob=new Blob(output,{type:mime});
      const extension=mime.includes('mp4')?'mp4':'webm';
      const filename=file.name.replace(/\.[^.]+$/,'')+'-trimmed.'+extension;
      if(download)download(blob,filename);
      else{
        const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
      }
      onProgress?.(1);
      safeText('Downloaded '+filename+' ('+(blob.size/1024/1024).toFixed(1)+' MB). Output codec and audio support depend on the browser.');
    }catch(e){safeText(e?.message||'Trim failed. Try a shorter clip or use a desktop editor.')}
    finally{
      media.pause();stopCurrent=null;recording=false;recorder=null;output=[];
      exportEl.disabled=!supported;previewEl.disabled=false;cancelEl.hidden=true;
    }
  }
  exportEl.addEventListener('click',exportClip);
  cancelEl.onclick=()=>{cancelled=true;if(stopCurrent)stopCurrent();else if(recorder?.state==='recording')recorder.stop();media.pause();safeText('Trim stopped.');};
  return {dispose(){cancelled=true;if(stopCurrent)stopCurrent();else if(recorder?.state==='recording')try{recorder.stop()}catch{};media.pause();media.removeAttribute('src');media.load();URL.revokeObjectURL(source);root.replaceChildren()}};
}
