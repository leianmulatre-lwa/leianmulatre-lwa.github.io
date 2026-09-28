/* Keeps the connected sources (Instagram, TikTok, Pinterest) in the studio feed.
 *
 * The feed page is rebuilt from markup every time it is opened, which throws away
 * whatever the last source inserted. A source that only re-rendered on the click that
 * opened the feed therefore looked empty on every visit afterwards, and a post made
 * from the composer wiped the source items with no way back.
 *
 * Each source registers a marker class and a render function. When the page changes we
 * re-render any source whose items are no longer present, which covers both a replaced
 * list and a list whose contents were overwritten. Checking for the marker rather than
 * observing our own insertions keeps this from looping.
 */
(function () {
  'use strict';
  if (window.BIGLWAFeedMount) return;

  var sources = [];
  var queued = false;

  function sweep() {
    queued = false;
    var list = document.getElementById('feedPageList');
    if (!list) return;
    sources.forEach(function (source) {
      if (list.querySelector('.' + source.marker)) return;
      try {
        source.render(list);
      } catch (error) {
        /* One source failing must not stop the others from appearing. */
        console.error('BIGLWA feed: ' + source.name + ' render isolated:', error);
      }
    });
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sweep);
  }

  window.BIGLWAFeedMount = function (name, marker, render) {
    sources.push({ name: name, marker: marker, render: render });
    schedule();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }

  /* Observing the whole document is blunt, but the feed list is replaced by an
     innerHTML rewrite of an ancestor rather than swapped, so watching the list itself
     would miss the common case. Sources are few and the sweep is a single class check. */
  var observer = new MutationObserver(schedule);
  var attach = function () {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };
  if (document.documentElement) attach();
  else document.addEventListener('DOMContentLoaded', attach, { once: true });
}());
