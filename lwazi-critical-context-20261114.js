/* L’wazi public-interest context for specific high-risk, often sanitized
   subcultures. Authored sources and user-facing language remain stable if a
   free model is unavailable. Never label a person as an extremist for asking. */
(function(){
 'use strict';
 const SOURCES=Object.freeze([
  Object.freeze({name:'Solea & Sugiura · Crime, Media, Culture (2025)',url:'https://doi.org/10.1177/17416590251387245'}),
  Object.freeze({name:'Halpin et al. · Sociology of Health & Illness (2025)',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11896937/'})
 ]);
 function lookup(query){
  const q=String(query||'').toLowerCase().trim();
  if(!q||q.length>800)return null;
  if(!/\b(?:looks[\s-]?max+(?:ing|xing)?|softmaxxing|hardmaxxing|psl\s+(?:scale|rating)|sub[\s-]?5s?)\b/i.test(q))return null;
  const personal=/\b(?:i['’]?m|my|me|myself|should i|friend|partner|brother|sister|kid|teen|son|daughter)\b/.test(q);
  const caution='Looksmaxxing is not just skincare or grooming: research traces its ties to incel/blackpill and manosphere communities, which can promote misogyny, racist attractiveness hierarchies, pseudoscientific “PSL” ratings, shame and extreme or dangerous body-modification advice. Calling some practices “softmaxxing” does not erase that context.';
  const alternatives='Ordinary self-care is different. Better alternatives include health-focused exercise, affordable grooming or skin care you enjoy, supportive friendships and community, media literacy, and help with persistent body-image anxiety. Your body is not a ranking or a moral score.';
  const response=personal?
   'If this is affecting you or someone close to you, avoid appearance-scoring forums and extreme modification advice. '+caution+' '+alternatives:
   caution+' '+alternatives;
  return {kind:'critical-subculture',answer:response,
   sources:SOURCES.map(item=>({name:item.name,url:item.url}))};
 }
 window.BigLWACriticalContext=Object.freeze({lookup});
})();