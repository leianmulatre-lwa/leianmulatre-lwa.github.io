import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

// Bind the uploaded artwork in the packaged site. An absent theme keeps its
// existing interactive preview, including while the other theme has artwork.
export function installOrbitIdleArt(destination, publishedPaths) {
  const themes = [
    ['body:not(.night-mode)', 'assets/orbit/better-aether-portal.gif'],
    ['body.night-mode', 'assets/orbit/841666uly00b1(2).gif']
  ];
  const rules = [];
  for (const [theme, file] of themes) {
    if (!publishedPaths.includes(file)) continue;
    const url = '/' + file.split('/').map(encodeURIComponent).join('/') + '?v=20261127-10';
    rules.push(theme+' #studioApp #orbit{--orbit-block:url("'+url+'")}');
  }
  if (rules.length) appendFileSync(join(destination,'orbit-space-20261114.css'),
    '\n'+rules.join('\n')+'\n');
}
