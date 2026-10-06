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
    'instagram-feed-item': { accent: '#f28c28', rim:'#a52a0c', glow:'#962fbf', hot:'#fa7e1e', label: 'Instagram' },
    'tiktok-feed-item': { accent: '#111111', rim:'#111111', glow:'#25f4ee', hot:'#fe2c55', label: 'TikTok' },
    'pinterest-feed-item': { accent: '#e60023', rim:'#e60023', glow:'#ff3554', hot:'#9f0018', label: 'Pinterest' },
    'facebook-feed-item': { accent: '#1877f2', rim:'#1877f2', glow:'#5aa0ff', label: 'Facebook' },
    'youtube-feed-item': { accent: '#d0202f', rim:'#d0202f', glow:'#fff6ec', hot:'#ff0033', label: 'YouTube' },
    'soundcloud-feed-item': { accent: '#e2622a', rim:'#ff5500', glow:'#ffb13b', hot:'#c93f00', label: 'SoundCloud' }
  };
  var FALLBACK = { accent: '#8a7a6c', rim:'#a52a0c', glow:'#d95f6d', label: 'Source' };
  function shadowFor(look) {
    if (look.label === 'YouTube') return '0 0 0 2px '+look.rim+',3px 3px 0 '+look.glow+',0 13px 28px -16px '+look.rim;
    if (look.label === 'Instagram') return '3px 3px 0 '+look.rim+',-2px 9px 22px -15px '+look.glow+',8px 14px 26px -18px '+look.hot;
    if (look.label === 'TikTok') return '3px 3px 0 '+look.rim+',-2px 8px 20px -14px '+look.glow+',8px 13px 24px -16px '+look.hot;
    if (look.hot) return '3px 3px 0 '+look.rim+',0 12px 25px -16px '+look.glow+',0 0 18px -12px '+look.hot;
    return '3px 3px 0 '+look.rim+',0 12px 25px -16px '+look.glow;
  }

  var STYLE = [
    /* Connected-account cards use the same shell as the Collective Feed cards: warm
       paper, soft border, rounded corners, and an offset rim tinted with the source's
       own colour. */
    '#feedPageList>.module-list-item:not(.biglwa-instagram-card){position:relative;min-width:0;overflow:visible;',
    'border:1px solid #dfd4ca;border-radius:18px;background:#f1e9e1;padding:0;',
    'box-shadow:var(--feed-card-shadow,3px 3px 0 var(--feed-card-rim,#bd3f47),0 12px 24px -16px rgba(216,95,109,.3));display:block;width:100%;}',
    '#feedPageList>.module-list-item:not(.biglwa-instagram-card)>div{padding:11px 13px 13px}',
    '#feedPageList>.module-list-item:not(.biglwa-instagram-card) small{display:block;font:600 11px/1.4 system-ui;',
    'letter-spacing:.03em;text-transform:uppercase;color:#8a7a6c}',
    '#feedPageList>.module-list-item:not(.biglwa-instagram-card) b{display:block;margin:5px 0 0;font:600 15px/1.45 system-ui;',
    'color:#2f2a27;overflow-wrap:anywhere}',
    /* Images inherit the same rounded top edge as the new cards and keep their
       natural ratio instead of being forced into a fixed preview. */
    '#feedPageList>.module-list-item:not(.biglwa-instagram-card) img,#feedPageList>.module-list-item:not(.biglwa-instagram-card) video{',
    'display:block;width:100%;height:auto;max-height:none!important;aspect-ratio:auto;',
    'object-fit:contain;border-radius:17px 17px 0 0!important;background:#efe7dd}',
    '#feedPageList>.module-list-item:not(.biglwa-instagram-card)>div:has(> img),#feedPageList>.module-list-item:not(.biglwa-instagram-card)>div:has(> video){padding:0}',
    '#feedPageList>.module-list-item:not(.biglwa-instagram-card)>div:has(> img)>small,#feedPageList>.module-list-item:not(.biglwa-instagram-card)>div:has(> video)>small{padding:11px 13px 0}',
    '#feedPageList>.module-list-item:not(.biglwa-instagram-card)>div:has(> img)>b,#feedPageList>.module-list-item:not(.biglwa-instagram-card)>div:has(> video)>b{padding:0 13px}',
    '#feedPageList>.module-list-item:not(.biglwa-instagram-card)>div:has(> img)>a,#feedPageList>.module-list-item:not(.biglwa-instagram-card)>div:has(> video)>a{margin:10px 13px 13px}',
    /* Keep the user-data metadata and outbound link, but remove the old source stripe. */
    '#feedPageList>.module-list-item:not(.biglwa-instagram-card)::before{content:none}',
    '#feedPageList>.module-list-item:not(.biglwa-instagram-card) .module-action{border-radius:999px}'
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
      node.style.setProperty('--feed-card-rim', look.rim || look.accent);
      node.style.setProperty('--feed-card-shadow', shadowFor(look));
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
