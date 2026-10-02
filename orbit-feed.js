/* Keeps the connected sources (Instagram, TikTok, Pinterest, Facebook) in the studio feed,
 * and dresses each source's cards in that source's colour.
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
 *
 * The colour lives here rather than in the four source clients because it is a property of
 * the board, not of any one client: every source card is the same kind of object, so one
 * place owns the border, the glow, and the corner label. A source added later gets a colour
 * by naming itself once at registration.
 */
(function () {
  'use strict';
  if (window.BIGLWAFeedMount) return;

  /* Keyed on the marker rather than the display name, so a source registers with the same
     word it uses for its own state. Anything unknown falls back to the board colour.
     These are the same values feed-view.js uses for a member's own posts, chosen there by
     the `source` field instead of a class. The two have to agree or one account would be
     two different colours on the same board. */
  var ACCENTS = {
    'instagram-feed-item': { accent: '#c13584', label: 'Instagram' },
    'tiktok-feed-item': { accent: '#0f8f95', label: 'TikTok' },
    'pinterest-feed-item': { accent: '#cf4632', label: 'Pinterest' },
    'facebook-feed-item': { accent: '#1877f2', label: 'Facebook' },
    'youtube-feed-item': { accent: '#d0202f', label: 'YouTube' },
    'soundcloud-feed-item': { accent: '#e2622a', label: 'SoundCloud' }
  };
  var FALLBACK = { accent: '#8a7a6c', label: 'Source' };

  var STYLE = [
    /* Connected-account cards use the same shell as the new Collective Feed cards:
       warm paper, soft border, rounded corners, and the six-colour offset rim. */
    '#feedPageList>.module-list-item{position:relative;min-width:0;overflow:visible;',
    'border:1px solid #dfd4ca;border-radius:16px;background:#f1e9e1;padding:0;',
    'box-shadow:3px 3px 0 #bd3f47;display:block;width:100%;}',
    '#feedPageList>.module-list-item:nth-child(6n+1){box-shadow:3px 3px 0 #bd3f47}',
    '#feedPageList>.module-list-item:nth-child(6n+2){box-shadow:3px 3px 0 #d77b30}',
    '#feedPageList>.module-list-item:nth-child(6n+3){box-shadow:3px 3px 0 #d1ad2f}',
    '#feedPageList>.module-list-item:nth-child(6n+4){box-shadow:3px 3px 0 #4e8f61}',
    '#feedPageList>.module-list-item:nth-child(6n+5){box-shadow:3px 3px 0 #416fa9}',
    '#feedPageList>.module-list-item:nth-child(6n+6){box-shadow:3px 3px 0 #7955a0}',
    '#feedPageList>.module-list-item>div{padding:11px 13px 13px}',
    '#feedPageList>.module-list-item small{display:block;font:600 11px/1.4 system-ui;',
    'letter-spacing:.03em;text-transform:uppercase;color:#8a7a6c}',
    '#feedPageList>.module-list-item b{display:block;margin:5px 0 0;font:600 15px/1.45 system-ui;',
    'color:#2f2a27;overflow-wrap:anywhere}',
    /* Images inherit the same rounded top edge as the new cards and keep their
       natural ratio instead of being forced into a fixed preview. */
    '#feedPageList>.module-list-item img,#feedPageList>.module-list-item video{',
    'display:block;width:100%;height:auto;max-height:none!important;aspect-ratio:auto;',
    'object-fit:contain;border-radius:15px 15px 0 0!important;background:#efe7dd}',
    '#feedPageList>.module-list-item>div:has(> img),#feedPageList>.module-list-item>div:has(> video){padding:0}',
    '#feedPageList>.module-list-item>div:has(> img)>small,#feedPageList>.module-list-item>div:has(> video)>small{padding:11px 13px 0}',
    '#feedPageList>.module-list-item>div:has(> img)>b,#feedPageList>.module-list-item>div:has(> video)>b{padding:0 13px}',
    '#feedPageList>.module-list-item>div:has(> img)>a,#feedPageList>.module-list-item>div:has(> video)>a{margin:10px 13px 13px}',
    /* Keep the user-data metadata and outbound link, but remove the old source stripe. */
    '#feedPageList>.module-list-item::before{content:none}',
    '#feedPageList>.module-list-item .module-action{border-radius:999px}'
  ].join('');

  function installStyle() {
    if (document.getElementById('biglwaFeedSourceStyle')) return;
    var style = document.createElement('style');
    style.id = 'biglwaFeedSourceStyle';
    style.textContent = STYLE;
    (document.head || document.documentElement).appendChild(style);
  }

  var sources = [];
  var queued = false;

  /* Painting is separate from rendering so it also runs for cards that survived a sweep,
     which is the case after a rebuild replaced the list with markup that still carried a
     marker class. Every card is painted, not just the first: a source commonly renders a
     dozen of them and a board where only the top one had a colour would look broken.
     Only the colour is set on the card. A label element used to be added here, and it is
     gone: the accent along the edge and the glow identify the account without a name. */
  function paint(source, nodes) {
    var look = ACCENTS[source.marker] || FALLBACK;
    Array.prototype.forEach.call(nodes, function (node) {
      node.style.setProperty('--accent', look.accent);
      /* A label left on a card by an older build is taken off rather than left hidden. */
      var stale = node.querySelector('.biglwa-feed-src');
      if (stale) stale.remove();
    });
  }

  function sweep() {
    queued = false;
    var list = document.getElementById('feedPageList');
    if (!list) return;
    installStyle();
    sources.forEach(function (source) {
      var nodes = list.querySelectorAll('.' + source.marker);
      if (!nodes.length) {
        try {
          source.render(list);
        } catch (error) {
          /* One source failing must not stop the others from appearing. */
          console.error('BIGLWA feed: ' + source.name + ' render isolated:', error);
          return;
        }
        nodes = list.querySelectorAll('.' + source.marker);
      }
      if (nodes.length) paint(source, nodes);
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
