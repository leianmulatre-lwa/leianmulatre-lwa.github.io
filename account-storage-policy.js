/* Explicit private data allowlist. Never sync OAuth tokens, provider sessions or caches. */
(()=>{'use strict';
const keys=['biglwaLibraryCatalogV1','biglwaMapPins','biglwaMapMode','biglwaDepopPath','biglwaArchiveFilters','biglwaGamesPreview','biglwaCalendarView','biglwaCalendarSelected','biglwaCustomRooms','biglwaActiveRoom','biglwaPolitcNominationsV1','biglwaPolitcVotingState','biglwaPolitcVotingZip','biglwaDYKIndex','biglwaDYKScore'];
const modules=['projects','closet','trophies','calendar','stream','connect','library'];
keys.push(...modules.map(k=>'biglwaModule_'+k));
const prefixes=['biglwaProjectCanvas:v1:','biglwaProjectZoom:v1:','biglwaStreamLastPlayedV1:','biglwaAvatarWidgetVisibility:v2:'];
function canonical(key,uid){
 key=String(key);
 if(keys.includes(key))return key;
 for(const prefix of prefixes)if(key.startsWith(prefix)&&[uid,'guest'].includes(key.slice(prefix.length)))return prefix.slice(0,-1);
 return null;
}
function accepted(key){return keys.includes(key)||prefixes.some(p=>key===p.slice(0,-1))}
function validValue(value){return value===null||(typeof value==='string'&&new TextEncoder().encode(value).length<=500000&&!/blob:|data:(?:image|video|audio)\//i.test(value))}
window.BigLWAStoragePolicy=Object.freeze({keys,prefixes,canonical,accepted,validValue});
})();
