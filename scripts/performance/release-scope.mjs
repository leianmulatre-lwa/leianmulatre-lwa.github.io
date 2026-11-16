#!/usr/bin/env node
/* Read-only Pages release scope inventory.
 * This never copies, deletes, stages or deploys files.
 * A directory in candidate_exclusions is NOT proven safe to exclude.
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname||path.dirname(new URL(import.meta.url).pathname),'../..');
const tracked=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'buffer'})
 .toString('utf8').split('\0').filter(Boolean);
const groups=[
 {label:'vendor-source-not-public-runtime',paths:['third_party/','composer/','guzzle/','Net/','Math/','Handler/','Services/','apiclient-services/']},
 {label:'external-site-mirrors-review-provenance',paths:['www-tokportal-com/','igexport-com/','ssstik-io/','igcomment-com/','o-storyclone-com/']},
 {label:'developer-documentation-and-tests',paths:['docs/','seo-audits/','qa/','evals/','.github/','scripts/']},
 {label:'historical-screenshots',paths:['screenshots/']},
 {label:'archive-needs-reference-scan',paths:['archive/']}
];
const results=groups.map(group=>{
 const matches=tracked.filter(file=>group.paths.some(prefix=>file.startsWith(prefix)));
 const sizes=matches.map(file=>{try{return fs.statSync(path.join(root,file)).size}catch{return 0}});
 return {name:group.label,paths:group.paths,trackedFiles:matches.length,
   trackedBytes:sizes.reduce((a,b)=>a+b,0),
   warning:'Review-only. This classification does NOT prove a path can be dropped from an HTML, CSS, import or dynamic route.'};
});
const size=tracked.reduce((sum,file)=>{try{return sum+fs.statSync(path.join(root,file)).size}catch{return sum}},0);
const possible=results.reduce((sum,r)=>sum+r.trackedBytes,0);
const result={
 kind:'source-only-release-scope-review',
 uploadArtifact:'The existing GitHub Pages workflow runs actions/upload-pages-artifact with path: .',
 currentTrackedBytes:size,
 candidateGroups:results,
 reviewOnlyCandidateBytes:possible,
 possibleReductionPercent:Number((possible/size*100).toFixed(1)),
 reminder:'None of the candidate directories have been removed. Build-time native editors, historical assets and dynamic imports need per-route verification. This is NOT the current page download size.',
 next:'Construct a release allowlist in a non-deploying dry run, compare HTML references plus runtime network traces, then change Pages artifact path after signed-in and signed-out smoke tests.'
};
if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2));
else{
 console.log('BIG LWA release scope review — no files removed or copied.');
 for(const g of results)console.log(g.name+': '+g.trackedFiles+' files / '+(g.trackedBytes/1e6).toFixed(2)+' MB (review only)');
 console.log('Review-only candidates: '+(possible/1e6).toFixed(2)+' MB / '+result.possibleReductionPercent+'% of tracked source.');
 console.log('These figures are not guaranteed artifact savings. Build a verified allowlist before excluding anything.');
}
