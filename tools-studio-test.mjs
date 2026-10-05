// The Tools page must open on a drop area that works out what a file is, offer the
// conversions that suit it, and be straight about what needs a hosted converter instead.
import { readFileSync } from "node:fs";

const tools = readFileSync(new URL("./tools-studio.js", import.meta.url), "utf8");
const pages = readFileSync(new URL("./module-pages.js", import.meta.url), "utf8");

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}`); }
}

console.log("=== DROP A FILE AT THE TOP, IT SORTS ITSELF OUT ===");
check("the drop area is the first thing on the page", tools.indexOf('id="toolDrop"') < tools.indexOf('id="toolGroups"'));
check("a file can be dropped on it", tools.includes("drop.addEventListener('drop'"));
check("a file can also be chosen", tools.includes('id="toolFile" type="file" multiple hidden'));
check("the drop area is clickable and reachable by keyboard", tools.includes("drop.addEventListener('keydown'"));
check("the area says the type is worked out for you", tools.includes("BIGLWA works out what it is and offers the conversions that suit it."));

console.log("\n=== THE TYPE IS DETECTED, NOT GUESSED FROM THE NAME ALONE ===");
check("the extension is read", tools.includes("const ext=(name.split('.').pop()||'')"));
check("the first bytes are read", tools.includes("reader.readAsArrayBuffer(file.slice(0,count))"));
check("a signature table exists", tools.includes("const SIGNATURES = ["));
check("MP4/MOV are spotted by their ftyp box", tools.includes("==='ftyp'"));
check("MP3 is spotted by ID3 or a frame sync", tools.includes("==='ID3'"));
check("PNG, JPEG, GIF and WebP are spotted", tools.includes("==='RIFF'") && tools.includes("==='GIF'") && tools.includes("b[0]===0x89"));
check("PDF is spotted", tools.includes("==='%PDF-'"));
check("archives are spotted", tools.includes("==='PK'") && tools.includes("==='7z'"));
check("a mismatch cannot be trusted over the signature", /for\(const sig of SIGNATURES\)/.test(tools));
check("the extension is only a first guess", tools.includes("let kind=BY_EXTENSION[ext]||null;"));
check("an unrecognised file still gets an answer", tools.includes("kind:kind||'unknown'"));
check("the kind is reported back", tools.includes("meta.push('Recognised as '+kind)"));
check("video and audio are measured before being offered", tools.includes("probeMedia(file,kind)") && tools.includes("probeImage(file)"));
check("the size, dimensions and length are shown", tools.includes("sizeText(file.size)") && tools.includes("extra.width+' × '+extra.height+' px'") && tools.includes("durationText(extra.seconds)"));

console.log("\n=== CONVERSIONS THAT FIT THE FILE ===");
check("video is offered MP4, MOV, MP3, WAV, WebM and compression", ["mp4","mov","mp3","wav","webm","compress","shrink"].every(op => tools.includes("op:'"+op+"'")));
check("MP4 uses H.264 and faststart", tools.includes("'libx264'") && tools.includes("'+faststart'"));
check("MOV really is MOV, not a renamed MP4", tools.includes("mov:{label:'MOV video',ext:'mov',type:'video/quicktime'"));
check("MP4 to MP3 drops the video track", tools.includes("mp3:{label:'MP3 audio only'") && tools.includes("'-vn'"));
check("compression really scales the frame", tools.includes("scale=-2:720") && tools.includes("scale=-2:480"));
check("audio is offered MP3, M4A, OGG and WAV", ["mp3","small","wav","m4a","ogg"].every(op => tools.includes("op:'"+op+"'")));
check("a smaller MP3 really lowers the bitrate", tools.includes("'libmp3lame','-b:a','96k'"));
check("images are offered JPEG, PNG and WebP", tools.includes("jpeg:{label:'JPEG'") && tools.includes("png:{label:'PNG'") && tools.includes("webp:{label:'WebP'"));
check("a smaller image really lowers the quality", tools.includes("convertImage(file,IMAGE_TARGETS.webp,0.72)"));
check("PDF compression is offered for a PDF", tools.includes("label:'Compress PDF'"));
check("the offer follows the file, not a fixed list", tools.includes("if(kind==='video')local=[") && tools.includes("else if(kind==='audio')local=[") && tools.includes("else if(kind==='image')local=["));

console.log("\n=== IT REALLY CONVERTS ===");
check("FFmpeg is loaded", tools.includes("@ffmpeg/ffmpeg@0.12.10") && tools.includes("window.FFmpegWASM&&window.FFmpegWASM.FFmpeg"));
check("the core is served as a blob so cross-origin is allowed", tools.includes("blobUrl(FFMPEG_CORE+'/ffmpeg-core.js'") && tools.includes("'/ffmpeg-core.wasm'"));
check("the file is written in and the result read out", tools.includes("ff.writeFile(input") && tools.includes("ff.readFile(output)"));
check("the inputs are cleaned up afterwards", tools.includes("ff.deleteFile(input)"));
check("a failed engine load is not left cached forever", tools.includes("enginePromise=null;throw error"));
check("an image really goes through a canvas", tools.includes("createImageBitmap(file)") && tools.includes("canvas.toBlob(resolve,target.mime,quality)"));
check("a WAV header is written out in full", tools.includes("ascii(0,'RIFF')") && tools.includes("ascii(36,'data')"));
check("a failure is said out loud rather than swallowed", tools.includes("did not work: ") && tools.includes("console.error('BIGLWA Tools"));

console.log("\n=== STRAIGHT ABOUT WHAT A BROWSER CANNOT DO ===");
check("a hosted converter is offered for every kind", ["archive","document","font","video","audio","image","unknown"].every(k => tools.includes(k+":{label:")));
check("archives are sent out rather than pretended", tools.includes("Opening and rebuilding zip, rar and 7z files needs a server-side tool."));
check("a named directory of converters is offered", tools.includes("const ONLINE_TOOLS = ["));
check("each entry says what it is good at", tools.includes("best:'Almost anything to almost anything'"));
check("outbound links are safe", (tools.match(/rel="noopener nofollow"/g)||[]).length >= 2);
check("leaving the device is said plainly", tools.includes("your file leaves this device"));
check("a YouTube or SoundCloud link is handed to Cobalt", tools.includes("cobalt.tools/"));
check("no watermark claim is faked", tools.includes("does not scrape or re-encode other people's posts") && tools.includes("save them from the app"));
check("a link must be a real link", tools.includes("That needs to be a full link starting with https://"));

console.log("\n=== WIRED INTO THE PAGE ===");
check("the Tools module mounts the studio", pages.includes("mod.mountToolsStudio($('#toolStudio',body)"));
check("the download helper is passed in", pages.includes("{downloadBlob}"));
check("a load failure is shown, not swallowed", pages.includes("Tools could not start"));
check("the old separate tool cards are gone", !pages.includes("id=\"pdfForm\"") && !pages.includes("id=\"ytForm\"") && !pages.includes("id=\"vidFile\""));
check("the drop area is styled as a drop area", pages.includes(".tool-drop{") && pages.includes("border:2px dashed"));
check("the drop area reacts to a file over it", pages.includes(".tool-drop.is-over{"));
check("progress has a bar", pages.includes(".tool-progress span{") && tools.includes("id=\"toolProgressBar\"") && tools.includes("barEl.style.width=Math.round(fraction*100)+'%'"));
check("the card copy matches what the page now does", pages.includes("Drop any file and it is sorted out automatically"));
check("the module description matches too", pages.includes("Drop a file and it works out what to offer"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);