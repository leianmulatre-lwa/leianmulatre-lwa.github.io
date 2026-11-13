import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const read=name=>readFileSync(new URL('./'+name,import.meta.url),'utf8');
const map=read('map-app.html');
const studio=read('module-pages.js');
const planner=read('map-lwa-experience-20261113.js');
const css=read('map-lwa-experience-20261113.css');
const router=read('map-lwa-router-20261113.js');
const extras=read('lwazi-discovery-extras.js');
test('map source parses, preserves Leaflet marker and private pin flows',()=>{
  for(const [name,src] of [
    ['map-lwa-experience-20261113.js',planner],
    ['module-pages.js',studio],
    ['map-lwa-router-20261113.js',router],
    ['lwazi-discovery-extras.js',extras]
  ])assert.doesNotThrow(()=>new vm.Script(src,{filename:name}));
  const inline=[...map.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  assert.ok(inline.length>=2,'Leaflet and app initialization preserved');
  for(let i=0;i<inline.length;i++)assert.doesNotThrow(()=>
    new vm.Script(inline[i][1],{filename:'map-app-inline-'+i+'.js'}));
  for(const expected of ['biglwaMapPins','window.BigLWAAccountStorage.ready',
    'mapSafetyOverlay','withdrawPublicPin','data-unpublish','L.map(',
    'L.marker(','L.control.layers','BigLWAMapBridge','biglwa:map-ready-local'])
    assert.ok(map.includes(expected),expected+' must remain supported');
});
test('OpenFreeMap is progressive and keeps safe classic fallback',()=>{
  assert.match(map,/https:\/\/tiles\.openfreemap\.org\/styles\//);
  assert.match(map,/maplibre-gl@5\.24\.1/);
  assert.match(map,/@maplibre\/maplibre-gl-leaflet@0\.1\.4/);
  assert.match(map,/baseLayers=\{Street:street,Satellite:satellite,Hybrid:hybrid,Terrain:terrain\}/);
  assert.match(map,/console\.info\('\[BIG LWA Map\] OpenFreeMap vector unavailable/);
  assert.match(map,/Map © OpenFreeMap · © OpenStreetMap contributors/);
  assert.match(map,/cyclosm-lite\/\{z\}\/\{x\}\/\{y\}\.png/);
  assert.match(map,/Mapped bike lanes · not live/);
});
test('map stays in Studio, uses height messaging rather than another page',()=>{
  assert.match(studio,/src="\/map-app\.html\?embed=1/);
  assert.match(studio,/data\.type==='biglwa:map-height'/);
  assert.match(studio,/data\.type==='biglwa:map-ready'/);
  assert.match(studio,/status\.hidden=true/);
  assert.match(planner,/type:'biglwa:map-height'/);
  assert.match(planner,/appendChild\(fullscreen\)/);
  assert.doesNotMatch(studio,/Map opened in Studio\. Your account session remains on the main page\./);
});
test('pin editor is larger; preview still distinct',()=>{
  assert.match(css,/body\.embedded #pinForm/);
  assert.match(css,/body\.embedded aside>\.saved/);
  assert.match(css,/body\.preview \.map-plan/);
  assert.match(css,/body\.embedded #pinForm>label:has\(#pinNotes\)/);
  assert.match(map,/Pins stay private until you choose to publish/);
});
test('route interface is labeled, private, and does not pretend to have live ETA',()=>{
  assert.match(planner,/straight-line distance/);
  assert.match(planner,/not a street route or ETA/);
  assert.match(planner,/BigLWAMapRouteProvider/);
  assert.doesNotMatch(planner,/google\.com\/maps/);
  assert.doesNotMatch(extras,/window\.open\(/);
  assert.match(extras,/biglwa:lwazi-map-trip/);
  assert.match(router,/biglwa:lwazi-route-status/);
  assert.match(router,/polyline6/);
  assert.match(router,/valhalla1\.openstreetmap\.de/);
  assert.match(map,/biglwaMapOpenFreeMapOnboarded/);
  assert.match(css,/map-provider-indicator/);
  assert.match(planner,/Use my location for this trip/);
  assert.match(planner,/fromGps=\{lat:pos\.coords\.latitude,lng:pos\.coords\.longitude\}/);
  assert.match(planner,/event\.origin!==location\.origin\|\|event\.source!==window\.parent/);
  assert.match(planner,/row\.url/);
  assert.match(planner,/u\.protocol==='https:'/);
});
