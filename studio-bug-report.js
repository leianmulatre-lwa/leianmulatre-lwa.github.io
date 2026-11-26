async function prepareImage(file) {
  if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 20*1024*1024)
    throw Error('Choose a PNG, JPEG, or WebP screenshot under 20 MB.');
  const image = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    let scale = Math.min(1, 1800 / Math.max(image.width,image.height));
    while (true) {
      canvas.width = Math.max(1, Math.round(image.width*scale));
      canvas.height = Math.max(1, Math.round(image.height*scale));
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      const data = canvas.toDataURL('image/webp',0.84);
      if (data.length <= 680000) return data;
      scale *= 0.8;
    }
  } finally { image.close(); }
}

async function saveReport(id, description, screenshot, owner) {
  const [apps, auth, fs] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
  ]);
  const app = apps.getApp(), session = auth.getAuth(app);
  await session.authStateReady();
  const user = session.currentUser;
  if (!user || user.uid !== owner) throw Error('Open the report again from your signed-in Studio.');
  const ua = navigator.userAgentData;
  let device = {};
  try { device = await ua?.getHighEntropyValues(['model','platformVersion']) || {}; } catch {}
  const context = {
    browser: navigator.userAgent, model: device.model || '', platformVersion: device.platformVersion || '',
    platform: ua?.platform || navigator.platform || '', viewport: [innerWidth,innerHeight],
    theme: document.body.classList.contains('night-mode') ? 'night' : 'day',
    module: document.querySelector('#moduleWorkspace')?.dataset.moduleKey || 'studio'
  };
  const ref = fs.doc(fs.getFirestore(app),'users',owner,'index','bug-'+id);
  await fs.setDoc(ref,{kind:'bugReport',description,screenshot,context,createdAt:fs.serverTimestamp()});
}

export function openReport(trigger) {
  let dialog = document.getElementById('studioBugDialog');
  if (dialog) { if (!dialog.open) dialog.showModal(); return; }
  const owner = window.BigLWAAccountStorage?.uid || window.__biglwaIdentity?.uid || '';
  dialog = document.createElement('dialog');
  dialog.id = 'studioBugDialog';dialog.setAttribute('aria-labelledby','studioBugHeading');
  dialog.innerHTML = '<form><h2 id="studioBugHeading">Report a bug</h2><label>What happened?<textarea name="description" required maxlength="1500" autofocus></textarea></label><label>Screenshot · choose, paste, or drop an image<input name="shot" type="file" accept="image/png,image/jpeg,image/webp"></label><img hidden alt="Attached screenshot"><p role="status"></p><footer><button type="button">Close</button><button type="submit">Send report</button></footer></form>';
  document.body.append(dialog);
  const form = dialog.querySelector('form'), preview = dialog.querySelector('img');
  const status = dialog.querySelector('[role=status]'), send = form.querySelector('[type=submit]');
  const close = form.querySelector('[type=button]'), id = crypto.randomUUID();
  let screenshot = '', generation = 0, sending = false;
  close.onclick = () => dialog.close();
  dialog.oncancel = event => { if (sending) event.preventDefault(); };
  dialog.onclose = () => { dialog.remove(); trigger.focus(); };
  async function attach(file) {
    if (sending || !file) return;
    const turn = ++generation;send.disabled = true;
    try {
      const image = await prepareImage(file);
      if (turn !== generation) return;
      screenshot = image;preview.src = image;preview.hidden = false;status.textContent = '';
    } catch (error) {
      if (turn === generation) status.textContent = error.message;
    } finally { if (turn === generation) send.disabled = false; }
  }
  form.elements.shot.onchange = event => attach(event.target.files[0]);
  dialog.onpaste = event => { const file = event.clipboardData?.files[0];if (file) { event.preventDefault();attach(file); } };
  dialog.ondragover = event => event.preventDefault();
  dialog.ondrop = event => { event.preventDefault();attach(event.dataTransfer.files[0]); };
  form.onsubmit = async event => {
    event.preventDefault();
    const description = form.elements.description.value.trim();
    if (send.disabled || sending) return;
    if (!description) { form.elements.description.focus();return; }
    sending = true;send.disabled = close.disabled = true;status.textContent = 'Sending…';
    try {
      await saveReport(id, description, screenshot, owner);
      status.textContent = 'Report received.';send.hidden = true;
      form.querySelectorAll('input,textarea').forEach(el => el.disabled = true);
    } catch (error) {
      status.textContent = error.message.includes('signed-in Studio') ? error.message : 'Could not send. Your report is still here to retry.';
      send.disabled = false;
    } finally { sending = false;close.disabled = false; }
  };
  dialog.showModal();
}
