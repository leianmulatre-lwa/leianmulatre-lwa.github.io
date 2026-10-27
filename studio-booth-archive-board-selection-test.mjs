import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const modules=read('module-pages.js'),pinterest=read('pinterest-orbit.js'),
      styles=read('pinterest-boards.css'),home=read('index.html');
const check=(description,condition)=>{assert.ok(condition,description);console.log('PASS: '+description)};
check('Archive preview zooms the rotated image to fill the frame',
  /#studioApp #archive \.archive-photo-preview img\{[^}]*object-fit:cover;[^}]*rotate\(90deg\) scale\(1\.28\)/.test(modules));
check('Archive thumbnail remains in its own rounded 4:3 frame',
  /#studioApp #archive \.archive-photo-preview\{[^}]*aspect-ratio:4\/3;/.test(modules));
check('Photo Booth stage fits one camera-sized frame',
  /\.photobooth-stage\{[^}]*width:min\(100%,700px\);[^}]*max-height:460px;[^}]*aspect-ratio:3\/2;/.test(modules));
check('Photo Booth camera/image/preview all use the same viewport',
  /\.photobooth-stage video,\.photobooth-stage canvas,\.photobooth-stage img\{[^}]*height:100%;max-height:100%;object-fit:cover;/.test(modules));
check('Video Booth splits a compact video frame into equal side-by-side halves',
  /\.video-booth-preview\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\);[^}]*max-width:700px;[^}]*aspect-ratio:3\/2;/.test(modules));
check('New Pinterest multi-select activates from both saved and original pins',
  /panel\.classList\.toggle\('pn-selection-active',selectedBoardPins\.size>0\|\|selectedOriginalPins\.size>0\)/.test(pinterest));
check('Board and original pin checkboxes keep native selection input',
  pinterest.includes('data-pn-board-select=')&&pinterest.includes('data-pn-original-select='));
check('Selection pill is compact, hover/focus visible, and hidden otherwise',
  /#pinterestBoards \.pinterest-pin>\.pn-pin-check/.test(styles)&&
  /opacity:0!important/.test(styles)&&
  /\.pinterest-pin,\.pn-owned-pin-choice\):is\(:hover,:focus-within\)/.test(styles));
check('After first selection, every checkbox appears without extra Select labels',
  /#pinterestBoards\.pn-selection-active :is\(\.pinterest-pin,\.pn-owned-pin-choice\)>\.pn-pin-check/.test(styles)&&
  /#pinterestBoards\.pn-selection-active \.pn-pin-check span\{display:none!important\}/.test(styles));
check('Touch devices keep selection checkboxes available without hover',
  /@media\(hover:none\)/.test(styles));
check('Current site loads fresh module and Pinterest assets',
  home.includes('module-pages.js?v=20261026-archive-flat-gallery-7')&&
  home.includes('pinterest-orbit.js?v=20261025-pin-origin-1')&&
  pinterest.includes('pinterest-boards.css?v=20261022-hover-select-7'));
