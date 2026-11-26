import { appendFileSync } from 'node:fs';
import { basename, join } from 'node:path';

// Bind the uploaded artwork in the packaged site. An absent theme keeps its
// existing interactive preview, including while the other theme has artwork.
export function installOrbitIdleArt(destination, publishedPaths) {
  const themes = [
    ['body:not(.night-mode)', /aether.*\.gif$/i],
    ['body.night-mode', /^(?:841666uly00b1|nether).*\.gif$/i]
  ];
  const rules = [];
  for (const [theme, pattern] of themes) {
    const file = publishedPaths.find(path => pattern.test(basename(path)));
    if (!file) continue;
    const url = '/' + file.split('/').map(encodeURIComponent).join('/');
    rules.push(theme+' #studioApp #orbit{--orbit-block:url("'+url+'")}');
  }
  if (rules.length) appendFileSync(join(destination,'orbit-space-20261114.css'),
    '\n@media (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference){\n'+rules.join('\n')+'\n}\n');
}
