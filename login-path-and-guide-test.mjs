import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {Script} from 'node:vm';

const read=name=>readFileSync(new URL('./'+name,import.meta.url),'utf8');
const home=read('index.html'),session=read('session-restore.js'),
  onboarding=read('studio-onboarding.js'),modules=read('module-pages.js');
const archive=Buffer.from([1,2,3,4,5].map(i=>read('site-'+i+'.txt')).join(''),'base64');
const legacy=gunzipSync(archive).toString('utf8');
for(const [file,source] of [['session-restore.js',session],['studio-onboarding.js',onboarding],['module-pages.js',modules]]){
  assert.doesNotThrow(()=>new Script(source,{filename:file}),file+' must parse');
}
const inline=home.match(/<noscript>[\s\S]*?<\/noscript><script>([\s\S]*?)<\/script><\/body>/);
assert.ok(inline,'site has an inline startup script');
assert.doesNotThrow(()=>new Script(inline[1]),'startup must parse');

function sourceString(name){
  const match=home.match(new RegExp('const '+name+'=("(?:\\\\.|[^"\\\\])*");'));
  assert.ok(match,name+' is installed in the actual HTML patch');
  return JSON.parse(match[1]);
}
const originalLogin=sourceString('oldLoginPath');
const privateLogin=sourceString('preservePrivatePath');
const originalStudio=sourceString('oldStudioPath');
const privateStudio=sourceString('preserveStudioPath');
assert.ok(legacy.includes(originalLogin),'legacy login router has exact patch target');
assert.ok(legacy.includes(originalStudio),'legacy Studio router has exact patch target');
assert.notEqual(originalLogin,privateLogin);
assert.notEqual(originalStudio,privateStudio);

function invoke(statement,path,search=''){
  const calls=[],location={pathname:path,search};
  const history={replaceState(...args){calls.push(args.at(-1))}};
  new Function('location','history','URLSearchParams',statement)(location,history,URLSearchParams);
  return calls;
}
for(const query of ['?panel=map','?panel=politc','?view=orbit','?view=tools']){
  assert.deepEqual(invoke(privateLogin,'/studio',query),[],'sign-out must not destroy original Studio deep link '+query);
  assert.deepEqual(invoke(privateStudio,'/studio',query),[],'sign-in must preserve Studio deep link '+query);
}
assert.deepEqual(invoke(privateLogin,'/privacy'),['/'],'ordinary login navigation remains canonical');
assert.deepEqual(invoke(privateLogin,'/'),[],'login root stays on root');
assert.deepEqual(invoke(privateStudio,'/'),['/studio'],'signed-in homepage returns to Studio');
assert.deepEqual(invoke(privateStudio,'/studio','?route=unknown'),['/studio'],'unrecognized query cleaned');
assert.ok(home.includes("location.hostname.toLowerCase()==='www.biglwa.com'"),
  'www host redirects before initializing a different Firebase auth origin');
assert.ok(home.includes("location.replace('https://biglwa.com'+location.pathname+location.search+location.hash)"),
  'canonical origin retains path, query and fragment');
assert.ok(session.includes('await auth.authStateReady()'));
assert.ok(session.includes("authPromise=null;throw error"),'temporary CDN error can be retried');
assert.ok(session.includes("login.classList.remove('is-active')") && session.includes("studio.classList.add('is-active')"),
  'verified Firebase user gets a Studio screen without a second login');
assert.ok(!session.includes('finishAuth(null)'), 'network error never signs out user');

assert.ok(onboarding.includes('ⓘ Site guide · symbols & tools'),'sidebar guide survives removing pink card');
assert.ok(onboarding.includes("data.tourStart") || onboarding.includes("start.dataset.tourStart=''"),'pink card has explicit tour action');
assert.ok(onboarding.includes('red/yellow/green') || onboarding.includes('Red removes or deletes'),'tutorial explains colored controls');
assert.ok(onboarding.includes('Orbit → Archive') && onboarding.includes('NOT posted publicly'),
  'tutorial explains private imports vs public publishing');
assert.ok(onboarding.includes('observer.observe(document.documentElement,{subtree:true,childList:true})'),
  'tutorial reattaches after the Studio replaces its layout');
assert.ok(modules.includes('left:50%!important;top:37%!important'),'Journal initial lowered');
assert.ok(home.includes('studio-onboarding.js?v=20261014-studio-guide-3'));
assert.ok(home.includes('session-restore.js?v=20261014-auth-screen-repair-5'));
console.log('PASS · canonical auth origin, preserved login paths and Studio panels');
console.log('PASS · successful auth restores Studio; user-initiated logout unaffected');
console.log('PASS · pink card guide, sidebar relaunch, Orbit explanation, journal offset');


const pinterest=read('pinterest-orbit.js'), supporters=read('policy-card-cohesion.js'), brand=read('brand-policy.css');
const nStart=pinterest.indexOf('function notice(text){'),nEnd=pinterest.indexOf('// A Pinterest token expiring',nStart);
assert.ok(nStart>0&&nEnd>nStart,'Pinterest notice handler exists');
const nSource=pinterest.slice(nStart,nEnd);
function pinterestToastCount(uid,studioActive,loginActive){
  const appended=[];
  const document={
    getElementById(id){
      if(id==='studioApp')return {classList:{contains:()=>studioActive}};
      if(id==='loginPage')return {classList:{contains:()=>loginActive}};
      if(id==='pinterestNotice')return appended[0]||null;
      return null;
    },
    createElement(){return {setAttribute(){},style:{cssText:''},remove(){},textContent:''}},
    body:{append(el){appended.push(el)}}
  };
  const f=new Function('document','authUid','render','setTimeout','clearTimeout',
    'let message="";'+nSource+'\nnotice("Pinterest session expired. Please reconnect");');
  f(document,uid,()=>{},()=>1,()=>{});
  return appended.length;
}
assert.equal(pinterestToastCount('uid',false,true),0,'expired Pinterest cannot show a popup on login screen');
assert.equal(pinterestToastCount('',true,false),0,'anonymous visitor never receives provider popup');
assert.equal(pinterestToastCount('uid',true,false),1,'a signed-in Studio can show a requested Pinterest notice');
assert.ok(pinterest.includes('},{silent:true})'),'Pinterest startup restore never emits foreground notices');
assert.ok(session.includes('guardLoginScreen()')&&session.includes('auth.currentUser?.uid===lastConfirmedUid'),
  'Firebase-verified owner repairs any late legacy login repaint');
assert.ok(home.includes("getAuth(getApps()[0] || initializeApp(firebaseConfig))"),
  'legacy login reuses the same Firebase app as Orbit and session restore');
assert.ok(home.includes("import { initializeApp, getApps }"),
  'legacy Firebase import installs the getApps deduplication patch');

const sStart=supporters.indexOf('const makeSupporterLogo = (supporter) => {');
const sEnd=supporters.indexOf('const makeSupporterSection',sStart);
assert.ok(sStart>0&&sEnd>sStart);
const maker=new Function('document',supporters.slice(sStart,sEnd)+'\nreturn makeSupporterLogo;')({
 createElement(tag){
  return {tagName:tag.toUpperCase(),style:{setProperty(){}},append(){},
    setAttribute(){}};
 }
});
const bare=maker({name:'UCLA',src:'/assets/supporters/ucla.png'});
assert.equal(bare.tagName,'IMG','supporters without links render as bare PNGs, not white cards');
assert.ok(bare.className.includes('supporter-logo-image'));
assert.ok(!brand.includes('background: rgba(248, 243, 236, .92);'),
  'original white supporter tile declarations removed rather than overridden');
assert.ok(home.includes('policy-card-cohesion.js?v=20261014-bare-supporter-png-5'));
assert.ok(home.includes('brand-policy.css?v=20261014-logo-alpha-no-tiles-8'));
assert.ok(home.includes('pinterest-orbit.js?v=20261014-silent-login-25'));
console.log('PASS · Pinterest login popup gating, Firebase race guard and bare supporter PNG renderer');
