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
    '#feedPageList>.module-list-item{--accent:#8a7a6c;position:relative;overflow:hidden;',
    'border:1px solid rgba(80,70,64,.14);border-left:4px solid var(--accent);border-radius:16px;',
    'background:#fffdf9;padding:0;box-shadow:0 10px 22px -14px var(--accent),0 1px 2px rgba(48,43,40,.06)}',
    '#feedPageList>.module-list-item>div{padding:11px 13px 13px}',
    '#feedPageList>.module-list-item small{display:block;font:600 11px/1.4 system-ui;',
    'letter-spacing:.03em;text-transform:uppercase;color:#8a7a6c}',
    '#feedPageList>.module-list-item b{display:block;margin:5px 0 0;font:600 15px/1.45 system-ui;',
    'color:#2f2a27;overflow-wrap:anywhere}',
    /* Connected pictures are square too, so a board of member posts and connected
       accounts sits on one even grid instead of stepping with each photo's shape. */
    '#feedPageList>.module-list-item img,#feedPageList>.module-list-item video{',
    'border-radius:0!important;aspect-ratio:1/1;object-fit:cover;width:100%;max-height:none}',
    /* The source used to be named in text on the card. The coloured edge and the glow
       around it say which account it came from, so the name is no longer drawn. */
    '#feedPageList>.module-list-item>div>small{display:none}',
    /* Green means one thing across the whole wall: this opens the original somewhere else.
       The dot sits in front of the label so the colour is readable even where the link
       text is truncated on a narrow column. */
    '#feedPageList .biglwa-view-site{display:inline-flex;align-items:center;gap:6px;',
    'margin-top:9px;padding:6px 12px;border-radius:999px;font:700 11px/1 system-ui;',
    'letter-spacing:.02em;text-decoration:none;background:rgba(31,142,74,.1);',
    'border:1px solid rgba(31,142,74,.34);color:#1f7a45}',
    '#feedPageList .biglwa-view-site::before{content:"";width:8px;height:8px;border-radius:50%;',
    'flex:0 0 8px;background:#1f8e4a;box-shadow:0 0 0 3px rgba(31,142,74,.16)}',
    '#feedPageList .biglwa-view-site:hover{background:rgba(31,142,74,.16);color:#166238}',
    '#feedPageList .biglwa-view-site:focus-visible{outline:2px solid #1f8e4a;outline-offset:2px}',
    /* A gradient lip along the top edge, so a card is identifiable as a source at a
       glance even when the picture behind it is pale. */
    '#feedPageList>.module-list-item::before{content:"";display:block;height:3px;',
    'background:linear-gradient(90deg,var(--accent),transparent)}'
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
      /* Every source writes its own "view on X" link in a slightly different place, and the
         shape of the card differs with it, so the link is found here instead of in each
         source. It is marked green, which is the one meaning that never changes. */
      var links = node.querySelectorAll('a[href][target="_blank"]');
      Array.prototype.forEach.call(links, function (link) {
        link.classList.add('biglwa-view-site');
      });
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
