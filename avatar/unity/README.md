# Big LWA · IMVU / Unity WebGL adapter

This folder is the **integration point** for a future Unity WebGL export, not a Unity player or a copy of IMVUnity.

## Source package reviewed

The user-supplied `imvunity_0_2_0.unitypackage` contains Unity 2015-era demo scenes, shaders, C# scripts, `IMVUnity.dll` and `Scripts/Platform/HttpWebGL.cs`. The included `LICENSE.txt` identifies it as proprietary IMVU source code licensed under commercial terms. **Do not commit the package, binary DLL, licensed models, scripts or demo assets to this public website repository without written distribution authorization.**

## To enable the live 3D viewer

1. In a licensed Unity project, import IMVUnity using Unity's Package Manager / Assets > Import Package > Custom Package and verify compatibility with the Unity version you are using.
2. Obtain proper IMVU SDK/API credentials and a written license that covers the intended web deployment and avatar/media rights. Never expose IMVU credentials or BIG LWA Firebase access tokens to the browser.
3. Implement a narrow, authenticated backend proxy for approved account-avatar retrieval and validate every asset URL and ownership check.
4. Integrate the sanitized avatar data with the Unity scene. The website supports still-image uploads today; there is no authorized live IMVU connector yet.
5. Export Unity for WebGL, publishing its `index.html`, `Build/` and `TemplateData/` assets under this `avatar/unity/` folder. Serve WebGL assets with the response headers required by your Unity export.
6. From the exported WebGL shell, call:

```js
window.parent.postMessage({ type: 'biglwa:unity-ready' }, window.location.origin);
window.addEventListener('message', e => {
  if (e.origin !== location.origin || e.source !== window.parent) return;
  if (e.data?.type !== 'biglwa:avatar-context') return;
  // e.data.avatar: {type:'imvu'|'minecraft'|'mii', url:'https://...'} | null
  // Forward ONLY explicitly allowed avatar context to Unity SendMessage(...)
});
```

Big LWA opens the Unity scene only when a deployed HTML page contains an actual `createUnityInstance` / `UnityLoader` bootstrap. The website checks for a matching-origin `biglwa:unity-ready` message before sharing the saved avatar image URL with that frame.

## Current browser functionality

The on-site Mii-inspired character editor lives at `/avatar/mii-editor.html` and saves a PNG through the BIG LWA account upload API; it is not an official Nintendo Mii data editor. Minecraft PNG skins use a separate 3D preview. IMVU currently accepts avatar image/snapshot imports, not IMVU 3D model import.
