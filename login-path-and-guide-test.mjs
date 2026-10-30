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
assert.deepEqual(invoke(privateLogin,'/imani'),[],'login gate keeps a public profile address instead of erasing it');
assert.deepEqual(invoke(privateLogin,'/sam.kalina','?preview=1'),[],'login gate keeps dotted usernames and explicit preview');
assert.deepEqual(invoke(privateLogin,'/theme.css'),['/'],'login gate still rejects file-like paths');
assert.deepEqual(invoke(privateLogin,'/'),[],'login root stays on root');
assert.deepEqual(invoke(privateStudio,'/'),['/studio'],'signed-in homepage returns to Studio');
assert.deepEqual(invoke(privateStudio,'/studio','?route=unknown'),['/studio'],'unrecognized query cleaned');
assert.deepEqual(invoke(privateStudio,'/imani'),[],'a public profile address is never rewritten to Studio');
assert.deepEqual(invoke(privateStudio,'/sam.kalina'),[],'dotted usernames keep their public profile address');
assert.deepEqual(invoke(privateStudio,'/sam.kalina','?preview=1'),[],'explicit preview keeps the profile address and query');
assert.deepEqual(invoke(privateStudio,'/theme.css'),['/studio'],'file-like paths still return to Studio');
assert.deepEqual(invoke(privateStudio,'/affidavit'),['/studio'],'reserved static routes are not treated as profiles');
assert.ok(home.includes("location.hostname.toLowerCase()==='www.biglwa.com'"),
  'www host redirects before initializing a different Firebase auth origin');
assert.ok(home.includes("location.replace('https://biglwa.com'+location.pathname+location.search+location.hash)"),
  'canonical origin retains path, query and fragment');
assert.ok(session.includes('await auth.authStateReady()'));
assert.ok(session.includes("authPromise=null;throw error"),'temporary CDN error can be retried');
assert.ok(session.includes("login.classList.remove('is-active')") && session.includes("studio.classList.add('is-active')"),
  'verified Firebase user gets a Studio screen without a second login');
assert.ok(!session.includes('finishAuth(null)'), 'network error never signs out user');

assert.ok(onboarding.includes('skeletonKeyLauncher')&&onboarding.includes('openSkeleton'),'Toolbar Skeleton Keys reopens the dismissed Studio card');
assert.ok(!onboarding.includes("start.dataset.tourStart=''"),'Removed site-tour button stays removed');
assert.ok(onboarding.includes('red/yellow/green') || onboarding.includes('Red removes or deletes'),'tutorial explains colored controls');
assert.ok(onboarding.includes('Orbit → Archive') && onboarding.includes('NOT posted publicly'),
  'tutorial explains private imports vs public publishing');
assert.ok(onboarding.includes('observer.observe(document.documentElement,{subtree:true,childList:true})'),
  'tutorial reattaches after the Studio replaces its layout');
assert.ok(modules.includes('left:50%!important;top:37%!important'),'Journal initial lowered');
assert.ok(home.includes('studio-onboarding.js?v='));
assert.ok(home.includes('session-restore.js?v=20261028-initial-logout-fix-1') && session.includes('let lastConfirmedUid=null'),'Initial signed-out auth resolves visibly');
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
  return {tagName:tag.toUpperCase(),style:{setProperty(){}},children:[],
    append(...children){this.children.push(...children)},setAttribute(){}};
 }
});
const bare=maker({name:'UCLA',src:'/assets/supporters/ucla.png'});
assert.equal(bare.tagName,'SPAN','supporters without links remain nonclickable containers');
assert.ok(bare.className.includes('supporter-logo-tile'));
assert.equal(bare.children.length,1,'logo tile must carry exactly one image');
assert.equal(bare.children[0].tagName,'IMG','logo graphics remain real image assets');
assert.equal(bare.children[0].src,'/assets/supporters/ucla.png');
assert.ok(!brand.includes('background: rgba(248, 243, 236, .92);'),
  'original white supporter tile declarations removed rather than overridden');
assert.ok(home.includes('policy-card-cohesion.js?v=20261026-expanded-supporters-1'));
assert.ok(home.includes('brand-policy.css?v='));

assert.ok(/const brandPolicyCss=`<link rel="stylesheet" href="\/brand-policy\.css\?v=[^"]+">/.test(home),
  'login explicitly loads the current cache-busted supporter carousel stylesheet');
const pureWhiteLogin=brand.slice(brand.indexOf('/* Login supporter marquee · true-white logo gallery.'));
assert.ok(pureWhiteLogin.startsWith('/* Login supporter marquee · true-white logo gallery.'),
  'login-specific white ribbon rules are installed after legacy gradient');
assert.ok(pureWhiteLogin.includes('#loginPage .login-supporters .supporter-viewport{') &&
  pureWhiteLogin.includes('background:#ffffff!important;') &&
  pureWhiteLogin.includes('background-image:none!important;'),
  'login supporter ribbon is truly solid white rather than ivory gradient');
assert.ok(pureWhiteLogin.includes('-webkit-mask-image:none!important;') &&
  pureWhiteLogin.includes('mask-image:none!important;'),
  'no dark translucent edge fade is applied to the white ribbon');
assert.ok(!pureWhiteLogin.includes('.public-page-footer .supporter-viewport'),
  'public footer carousel styling remains unchanged');
assert.ok(brand.includes('animation: biglwa-supporter-marquee'),
  'logo carousel still moves after changing the background');

assert.ok(home.includes('pinterest-orbit.js?v=20261028-oauth-return-2'),'current Pinterest imports include original Pins and board thumbnails');
console.log('PASS · Pinterest login popup gating, Firebase race guard and bare supporter PNG renderer');

/* Step 3 visually colors the actual three "o" letters without changing the
 * text a screen reader or copy-and-paste user encounters. */
assert.ok(onboarding.includes('"visual":"colored-dots-title"'));
const colorStart=onboarding.indexOf(' function renderTourTitle(root,step){');
const colorEnd=onboarding.indexOf(' function renderSymbolKey(root){',colorStart);
assert.ok(colorStart>=0&&colorEnd>colorStart,'tutorial has DOM-based colored-letter renderer');
function node(tag){return {tagName:tag,children:[],textContent:'',className:'',
 replaceChildren(...children){this.children=[...children];this.textContent=''},
 append(...children){this.children.push(...children)}}}
const dom={createElement:tag=>node(tag),createTextNode:s=>({tagName:'#text',textContent:s})};
const renderHeading=new Function('document',onboarding.slice(colorStart,colorEnd)+'\nreturn renderTourTitle;')(dom);
const heading=node('h2');
renderHeading(heading,{title:'The three colored dots',visual:'colored-dots-title'});
assert.equal(heading.children.map(child=>child.textContent).join(''),'The three colored dots');
const colored=heading.children.filter(child=>(child.className||'').includes('tour-dot-letter'));
assert.deepEqual(colored.map(child=>[child.textContent,child.className]),[
 ['o','tour-dot-letter tour-dot-red'],
 ['o','tour-dot-letter tour-dot-yellow'],
 ['o','tour-dot-letter tour-dot-green']
]);
assert.ok(onboarding.includes('#biglwaTutorialDialog h2 .tour-dot-red{color:#d95762}'));
assert.ok(onboarding.includes('#biglwaTutorialDialog h2 .tour-dot-yellow{color:#e0b92e}'));
assert.ok(onboarding.includes('#biglwaTutorialDialog h2 .tour-dot-green{color:#56ae77}'));
assert.ok(onboarding.includes('font:inherit;letter-spacing:inherit;line-height:inherit'),
 'colored characters inherit the original title font and layout');
renderHeading(heading,{title:'Another tutorial step'});
assert.equal(heading.textContent,'Another tutorial step','normal titles remain plain text');
console.log('PASS · three o letters are red, yellow, green in unchanged heading typography');
