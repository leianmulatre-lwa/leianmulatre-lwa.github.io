/* VisualSlidez regression: PowerPoint import keeps actual images, font runs,
   coordinates, notes, metadata and exact original package bytes. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM}=require('jsdom'),JSZip=require('jszip');
const html='<!doctype html><html><head></head><body><div id="slide-target"></div></body></html>';
const dom=new JSDOM(html,{url:'https://biglwa.com/studio',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;
w.eval(readFileSync(new URL('./visualslidez-pptx-import.js',import.meta.url),'utf8'));
assert(w.BigLWAVisualPptx,'full PPTX import helper loads');
const zip=new JSZip();
const p='http://schemas.openxmlformats.org/presentationml/2006/main';
const a='http://schemas.openxmlformats.org/drawingml/2006/main';
const r='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
zip.file('ppt/presentation.xml','<p:presentation xmlns:p="'+p+'"><p:sldSz cx="12192000" cy="6858000"/></p:presentation>');
zip.file('ppt/slides/slide1.xml','<p:sld xmlns:p="'+p+'" xmlns:a="'+a+'" xmlns:r="'+r+'"><p:cSld><p:spTree>'+
  '<p:sp><p:spPr><a:xfrm><a:off x="914400" y="800000"/><a:ext cx="7200000" cy="1200000"/></a:xfrm></p:spPr>'+
  '<p:txBody><a:bodyPr/><a:p><a:r><a:rPr lang="en-US" sz="4000" b="1"><a:solidFill><a:srgbClr val="AA1234"/></a:solidFill><a:latin typeface="Georgia"/></a:rPr><a:t>BIG LWA venture</a:t></a:r></a:p></p:txBody></p:sp>'+
  '<p:pic><p:nvPicPr><p:cNvPr id="3" name="cover" descr="Venture logo"/></p:nvPicPr><p:blipFill><a:blip r:embed="rId2"/></p:blipFill><p:spPr><a:xfrm><a:off x="1000000" y="3000000"/><a:ext cx="3000000" cy="2000000"/></a:xfrm></p:spPr></p:pic>'+
  '</p:spTree></p:cSld></p:sld>');
zip.file('ppt/slides/_rels/slide1.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId2" Target="../media/image1.png" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"/><Relationship Id="rId3" Target="../notesSlides/notesSlide1.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide"/></Relationships>');
zip.file('ppt/notesSlides/notesSlide1.xml','<p:notes xmlns:p="'+p+'" xmlns:a="'+a+'"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Founder speaking notes</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:notes>');
zip.file('docProps/core.xml','<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>BIG LWA pitch</dc:title><dc:creator>BIG LWA</dc:creator></cp:coreProperties>');
zip.file('ppt/media/image1.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==','base64'));
const bytes=await zip.generateAsync({type:'nodebuffer'});
const file={name:'venture.pptx',size:bytes.length,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
const data=await w.BigLWAVisualPptx.load(file,JSZip);
assert.equal(data.slides.length,1);
assert.equal(data.slides[0].title,'BIG LWA venture');
assert.equal(data.slides[0].notes,'Founder speaking notes');
assert.equal(data.metadata.title,'BIG LWA pitch');
assert.equal(data.metadata.creator,'BIG LWA');
assert.equal(data.metadata.fileName,'venture.pptx');
assert.equal(data.binary.byteLength,bytes.length);
assert.equal(Buffer.compare(Buffer.from(data.binary),bytes),0,'original file is byte-for-byte retained');
const text=data.slides[0].scene.items.find(x=>x.kind==='text');
assert.equal(text.paragraphs[0].runs[0].font,'Georgia');
assert.equal(text.paragraphs[0].runs[0].color,'#AA1234');
assert.equal(text.paragraphs[0].runs[0].bold,true);
assert.equal(text.x,7.5,'object positioned as percent of original canvas');
const pic=data.slides[0].scene.items.find(x=>x.kind==='image');
assert(pic.src.startsWith('data:image/png;base64,'),'embedded source picture survives');
const target=w.document.querySelector('#slide-target');
w.BigLWAVisualPptx.paint(data.slides[0],target);
assert.equal(target.querySelectorAll('img').length,1,'picture is visible in slide DOM');
assert.equal(target.querySelector('.vs-layer-text span').style.fontFamily.includes('Georgia'),true);
assert(!target.innerHTML.includes('<script'),'imported text is inert');
const editor=readFileSync(new URL('./visualslidez.js',import.meta.url),'utf8');
assert(editor.includes('BigLWAVisualPptx.load(file,window.JSZip)'),'VisualSlidez uses full importer');
assert(editor.includes('BigLWAVisualPptx.restore(key())'),'Native archive restored after reload');
assert(editor.includes('BigLWAVisualPptx?.paint(current'),'Image/font scene displayed');
assert(editor.includes("sourcePptx=loaded.binary||null"),'Original source saved intact');
assert(editor.includes("data-original"),'Original source download visible');
assert(editor.includes("data-text-kind"),'Sqwip-style text presets are available');
dom.window.close();
console.log('PASS VisualSlidez: text, fonts, image, slide position, notes, metadata, and lossless PPTX archive');
