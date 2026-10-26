/* Waypoints: cookie consent + Google Analytics 4 (Oct 13, 2026).
   - GA_ID is filled in by build.js from GOOGLE-ANALYTICS-ID.txt. Empty = no banner, nothing loads.
   - Nothing from Google loads until the visitor taps "Accept". Reject is just as easy, and the choice can be changed anytime ("Cookie settings" in the footer).
   - The choice is saved on this device with the date, and asked again after 12 months.
   - Ads features stay off. We never send names, emails or form answers to Google: only page views and a few button events. */
(function () {
  var GA_ID = '';
  var KEY = 'wp-consent', YEAR = 365 * 864e5;
  window.wpTrack = function () {}; // pages call this; it only sends after consent
  if (!/^G-[A-Z0-9]{4,}$/.test(GA_ID)) return;

  function read() { try { var c = JSON.parse(localStorage.getItem(KEY)); return c && Date.now() - new Date(c.t).getTime() < YEAR ? c : null; } catch (e) { return null; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify({ a: a, t: new Date().toISOString(), v: 1 })); } catch (e) {} }
  function clearGa() { // remove Google Analytics cookies if someone changes their mind
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim(); if (!/^_ga/.test(n)) return;
      var h = location.hostname, parts = h.split('.');
      for (var i = 0; i < parts.length; i++) { var d = parts.slice(i).join('.'); document.cookie = n + '=; Max-Age=0; path=/; domain=' + d; document.cookie = n + '=; Max-Age=0; path=/; domain=.' + d; }
      document.cookie = n + '=; Max-Age=0; path=/';
    });
  }

  var loaded = false;
  function start() {
    if (loaded) return; loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    gtag('js', new Date());
    gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID; document.head.appendChild(s);
    window.wpTrack = function (name, params) { try { gtag('event', name, params || {}); } catch (e) {} };
  }

  // ---- banner ----
  var css = '.wpc{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;margin:0 auto;background:#FAF5EF;color:#3D332B;border:1px solid #E6D5C8;border-radius:18px;box-shadow:0 24px 50px -20px rgba(34,27,22,.45);padding:18px 18px 16px;font:400 15px/1.55 "DM Sans",system-ui,sans-serif}' +
    '.wpc h2{font:700 1rem/1.3 "DM Sans",system-ui,sans-serif;margin:0 0 6px}.wpc p{margin:0 0 12px}.wpc a{color:#A65A33}' +
    '.wpc .r{display:flex;gap:10px;flex-wrap:wrap}.wpc button{flex:1 1 140px;min-height:46px;border-radius:999px;font:700 .95rem "DM Sans",system-ui,sans-serif;cursor:pointer;border:2px solid #3D332B;background:#3D332B;color:#FAF5EF}' +
    '.wpc button.no{background:transparent;color:#3D332B}.wpc button:focus-visible,.wpc-set:focus-visible{outline:3px solid #C1774F;outline-offset:3px}' +
    '.wpc-set{background:none;border:0;padding:0;color:inherit;font:inherit;text-decoration:underline;cursor:pointer}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var me = document.querySelector('script[src$="consent.js"]'), base = me ? me.getAttribute('src').replace(/assets\/consent\.js$/, '') : '';
  var box = null;
  function hide() { if (box) { box.remove(); box = null; } }
  function show(focus) {
    if (box) return;
    box = document.createElement('section'); box.className = 'wpc'; box.setAttribute('aria-label', 'Cookie choice');
    box.innerHTML = '<h2>Can we count your visit?</h2><p>With your OK, we use Google Analytics to see which pages people view, so we can make this site better. No ads, and we never share your name or email. <a href="' + base + 'cookies/">Cookie Policy</a></p>' +
      '<div class="r"><button type="button" class="yes">Accept</button><button type="button" class="no">Reject</button></div>';
    box.querySelector('.yes').onclick = function () { save('granted'); hide(); start(); };
    box.querySelector('.no').onclick = function () { var was = loaded; save('denied'); hide(); clearGa(); if (was) location.reload(); };
    document.body.appendChild(box);
    if (focus) box.querySelector('.yes').focus();
  }
  function settingsLink() {
    var f = document.querySelector('footer'); if (!f || f.querySelector('.wpc-set')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'wpc-set'; b.textContent = 'Cookie settings';
    b.onclick = function () { show(true); };
    var p = document.createElement('p'); p.style.cssText = 'margin:10px 0 0;font-size:.85rem'; p.appendChild(b);
    (f.querySelector('.container,.wrap') || f).appendChild(p);
  }
  function init() {
    settingsLink();
    var c = read();
    if (c && c.a === 'granted') start(); else if (!c) show(false);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
