/* P.Architecture+ site behaviour. No trackers, no external calls except the inquiry form (Google Apps Script) on the live site. */
(function () {
  'use strict';
  const INQUIRY_API_URL = ''; // live build sets the Apps Script /exec URL here (bookings + questions + schedule)
  const DEMO = document.documentElement.hasAttribute('data-demo');
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const P = window.PROJECTS || [];
  const IMG = n => (window.__IMG && window.__IMG[n]) || 'img/' + n + '.webp'; // the one-file phone preview supplies __IMG
  const byId = Object.fromEntries(P.map(p => [p.id, p]));
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const sess = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }, del(k) { try { sessionStorage.removeItem(k); } catch (e) {} } };

  /* ---------- theme: circle reveal from the toggle ---------- */
  const themeBtn = $('#themeBtn');
  const metaTheme = () => { $$('meta[name="theme-color"]').forEach(m => m.setAttribute('content', root.dataset.theme === 'dark' ? '#f6f6f5' : '#0c0e0e')); };
  metaTheme();
  themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    const apply = () => { root.dataset.theme = next; store.set('pa-theme', next); metaTheme(); };
    if (!document.startViewTransition || reduce) return apply();
    const r = themeBtn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(apply).ready.then(() => {
      root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] }, { duration: 650, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' });
    });
  });

  /* ---------- nav: hide on scroll down, highlight current section, mobile sheet ---------- */
  const nav = $('#nav'); let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY; nav.classList.toggle('hide', y > lastY && y > 300 && !sheet.classList.contains('open')); lastY = y;
  }, { passive: true });
  const links = $$('.nav ul a');
  const secIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id ? 'true' : 'false'));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['work', 'services', 'about', 'projects', 'process', 'contact'].forEach(id => { const s = document.getElementById(id); if (s) secIO.observe(s); });
  const sheet = $('#sheet'), menuBtn = $('#menuBtn');
  const setSheet = open => { sheet.classList.toggle('open', open); sheet.inert = !open; menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); document.body.style.overflow = open ? 'hidden' : ''; };
  menuBtn.addEventListener('click', () => setSheet(!sheet.classList.contains('open')));
  sheet.addEventListener('click', e => { if (e.target.closest('a,button')) setSheet(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.classList.contains('open')) { setSheet(false); menuBtn.focus(); } });

  /* ---------- marquees (Web Animations API, speed up while scrolling) ---------- */
  const marquees = $$('[data-marquee]').map(t => {
    const dir = Number(t.dataset.marquee) || -1;
    const a = t.animate({ transform: dir < 0 ? ['translateX(0)', 'translateX(-50%)'] : ['translateX(-50%)', 'translateX(0)'] }, { duration: t.closest('.places') ? 38000 : 46000, iterations: Infinity });
    if (reduce) a.pause();
    return a;
  });
  if (!reduce) {
    let boost = 0, raf = 0;
    addEventListener('scroll', () => { boost = 3.5; if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
    function tick() { boost *= 0.92; marquees.forEach(a => { a.playbackRate = 1 + boost; }); raf = boost > 0.02 ? requestAnimationFrame(tick) : 0; if (!raf) marquees.forEach(a => { a.playbackRate = 1; }); }
  }

  /* ---------- hero: subtle depth on pointer ---------- */
  const fig = $('#heroFig'), names = $('.hero-name');
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    let tx = 0, ty = 0, cx = 0, cy = 0, run = 0;
    $('#top').addEventListener('pointermove', e => { tx = (e.clientX / innerWidth - 0.5); ty = (e.clientY / innerHeight - 0.5); if (!run) run = requestAnimationFrame(step); });
    function step() { cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08; fig.style.transform = `translate3d(${cx * -18}px,${cy * -10}px,0)`; names.style.transform = `translate3d(${cx * 26}px,${cy * 12}px,0)`; run = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.001 ? requestAnimationFrame(step) : 0; }
  }

  /* ---------- typewriter headings (text stays in the HTML for SEO + screen readers) ---------- */
  const typeIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; typeIO.unobserve(e.target);
    const el = e.target, full = el.dataset.tw;
    if (reduce) return;
    el.setAttribute('aria-label', full);
    const vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
    const caret = document.createElement('span'); caret.className = 'caret'; caret.setAttribute('aria-hidden', 'true');
    el.textContent = ''; el.append(vis, caret);
    let i = 0; const t = setInterval(() => { vis.textContent = full.slice(0, ++i); if (i >= full.length) { clearInterval(t); setTimeout(() => caret.remove(), 2400); } }, Math.max(28, 900 / full.length));
  }), { threshold: 0.6 });
  $$('.tw').forEach(el => typeIO.observe(el));

  /* ---------- scroll reveals ---------- */
  if (window.gsap && window.ScrollTrigger && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    $$('.rv').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
    $$('.stack').forEach(s => gsap.from(s.children, { y: 60, rotate: 0, opacity: 0, stagger: 0.12, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 85%', once: true } }));
    gsap.to('#heroFig', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: true } });
  } else $$('.rv').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });

  /* ---------- coverflow ---------- */
  const flow = $('#flow'), cards = $$('.flow-card', flow); let cur = 0;
  function layout() {
    const n = cards.length, w = innerWidth < 700 ? 0.55 : 0.62;
    cards.forEach((c, i) => {
      let d = i - cur; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
      const ad = Math.abs(d), on = d === 0;
      c.style.transform = `translate(-50%,-50%) translateX(${d * w * 100}%) translateZ(${-ad * 160}px) rotateY(${d * -28}deg) scale(${on ? 1 : 0.86})`;
      c.style.zIndex = String(100 - ad); c.style.opacity = ad > 2 ? '0' : String(1 - ad * 0.22);
      c.style.filter = on ? 'none' : `grayscale(.5) brightness(${1 - ad * 0.12})`;
      c.setAttribute('aria-current', on ? 'true' : 'false'); c.tabIndex = on ? 0 : -1;
      c.setAttribute('aria-hidden', ad > 2 ? 'true' : 'false');
    });
    const p = byId[cards[cur].dataset.id];
    $('#flowTitle').textContent = p.name; $('#flowPlace').textContent = [p.place, p.kind].filter(Boolean).join(' · ');
    $('#flowDesc').textContent = p.desc; $('#flowCount').textContent = `${String(cur + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
  }
  const go = k => { cur = (k + cards.length) % cards.length; layout(); };
  $('#flowPrev').addEventListener('click', () => go(cur - 1));
  $('#flowNext').addEventListener('click', () => go(cur + 1));
  $('#flowOpen').addEventListener('click', () => openLB(cards[cur].dataset.id));
  cards.forEach((c, i) => c.addEventListener('click', () => { if (moved) return; i === cur ? openLB(c.dataset.id) : go(i); }));
  flow.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { go(cur - 1); cards[cur].focus(); } if (e.key === 'ArrowRight') { go(cur + 1); cards[cur].focus(); } });
  let sx = 0, moved = false, down = false;
  flow.addEventListener('pointerdown', e => { down = true; moved = false; sx = e.clientX; });
  addEventListener('pointerup', e => { if (!down) return; down = false; const dx = e.clientX - sx; if (Math.abs(dx) > 40) { moved = true; go(cur + (dx < 0 ? 1 : -1)); setTimeout(() => { moved = false; }, 50); } });
  addEventListener('resize', layout); layout();
  if (!reduce) { let auto = setInterval(() => go(cur + 1), 5200); const stop = () => { clearInterval(auto); auto = 0; }; ['pointerdown', 'focusin', 'mouseenter'].forEach(ev => flow.parentElement.addEventListener(ev, stop, { once: true })); new IntersectionObserver(es => { if (!es[0].isIntersecting && auto) { clearInterval(auto); auto = 0; } }).observe(flow); }

  /* ---------- project filters ---------- */
  const fbtns = $$('.filters button');
  fbtns.forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.filter; fbtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $$('#rows .row').forEach(r => { r.hidden = f !== 'all' && r.dataset.cat !== f; });
  }));
  $$('#rows .row button').forEach(b => b.addEventListener('click', () => openLB(b.closest('.row').dataset.id)));

  /* ---------- lightbox ---------- */
  const lb = $('#lb'), lbImg = $('#lbImg'); let lbP = null, lbI = 0, lbReturn = null;
  function showImg(i) {
    lbI = (i + lbP.imgs.length) % lbP.imgs.length; const id = lbP.imgs[lbI];
    lbImg.src = IMG(id); lbImg.alt = `${lbP.name}${lbP.place ? ', ' + lbP.place : ''}, view ${lbI + 1} of ${lbP.imgs.length}`;
    $$('#lbThumbs button').forEach((b, k) => b.setAttribute('aria-current', String(k === lbI)));
    const one = lbP.imgs.length < 2; $('#lbPrev').hidden = one; $('#lbNext').hidden = one;
  }
  function openLB(id) {
    lbP = byId[id]; if (!lbP) return; lbReturn = document.activeElement;
    $('#lbT').textContent = lbP.name; $('#lbP').textContent = [lbP.place, lbP.kind].filter(Boolean).join(' · ');
    const th = $('#lbThumbs'); th.textContent = '';
    lbP.imgs.forEach((im, k) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', `Show view ${k + 1}`); const i = document.createElement('img'); i.src = IMG(im + "-sm"); i.alt = ''; i.loading = 'lazy'; b.append(i); b.addEventListener('click', () => showImg(k)); th.append(b); });
    showImg(0); lb.showModal(); document.body.style.overflow = 'hidden';
  }
  $('#lbPrev').addEventListener('click', () => showImg(lbI - 1));
  $('#lbNext').addEventListener('click', () => showImg(lbI + 1));
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') showImg(lbI - 1); if (e.key === 'ArrowRight') showImg(lbI + 1); });
  let lsx = 0; lb.addEventListener('pointerdown', e => { lsx = e.clientX; }); lb.addEventListener('pointerup', e => { const dx = e.clientX - lsx; if (Math.abs(dx) > 50 && e.target.closest('.lb-stage')) showImg(lbI + (dx < 0 ? 1 : -1)); });
  lb.addEventListener('close', () => { document.body.style.overflow = ''; if (lbReturn) lbReturn.focus(); });
  lb.addEventListener('click', e => { if (e.target.closest('[data-close]')) lb.close(); });

  /* ---------- draggable principle cards ---------- */
  const board = $('#board');
  $$('.chip3d', board).forEach(c => {
    let x = 0, y = 0, r = Number(c.dataset.r) || 0;
    const place = () => { c.style.transform = `translate(${x}px,${y}px) rotate(${r}deg)`; };
    const init = () => { const bw = board.clientWidth, bh = board.clientHeight; x = Math.min(bw - c.offsetWidth - 10, bw * c.dataset.x / 100); y = Math.min(bh - c.offsetHeight - 10, bh * c.dataset.y / 100); place(); };
    init(); addEventListener('resize', init);
    let ox = 0, oy = 0, id = null;
    c.addEventListener('pointerdown', e => { id = e.pointerId; c.setPointerCapture(id); ox = e.clientX - x; oy = e.clientY - y; c.style.zIndex = String(Date.now() % 1e6); c.style.transition = 'none'; });
    c.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      const nx = e.clientX - ox, ny = e.clientY - oy; r = Math.max(-14, Math.min(14, (nx - x) * 0.8));
      x = Math.max(0, Math.min(board.clientWidth - c.offsetWidth, nx)); y = Math.max(0, Math.min(board.clientHeight - c.offsetHeight, ny)); place();
    });
    const end = e => { if (e.pointerId !== id) return; id = null; c.style.transition = 'transform .6s cubic-bezier(.2,1.6,.4,1)'; r = r * 0.25; place(); };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
  });
  if (!reduce) {
    const io = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; io.disconnect(); $$('.chip3d', board).forEach((c, i) => c.animate([{ opacity: 0, translate: '0 -80px' }, { opacity: 1, translate: '0 0' }], { duration: 900, delay: i * 140, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'backwards' })); }, { threshold: 0.4 });
    io.observe(board);
  }

  /* ---------- floating CTA hides near the contact section ---------- */
  const fc = $('#floatCta'), seen = { top: true, contact: false };
  const fcIO = new IntersectionObserver(es => { es.forEach(e => { seen[e.target.id] = e.isIntersecting; }); fc.classList.toggle('off', seen.top || seen.contact); }, { threshold: 0.35 });
  fcIO.observe($('#top')); fcIO.observe($('#contact')); fc.classList.add('off');

  /* ---------- booking + inquiry window ----------
     Book: pick meeting type → day → time (from the owner's Google Sheet), then details → saved to the Sheet + calendar + emails.
     Question: details only. In the preview (data-demo) the schedule is a labeled sample and nothing is sent. */
  const win = $('#win'), form = $('#inqForm'), err = $('#fErr'), send = $('#fSend'), pick = $('#pick'); let winReturn = null;
  const TZ = 'Asia/Manila', DRAFT = 'pa-inquiry-draft';
  const B = { mode: 'book', date: '', time: '', days: {}, sample: false, month: null, loading: null };
  const manilaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const dObj = d => new Date(d + 'T12:00:00+08:00');
  const fmtDay = (d, o) => dObj(d).toLocaleDateString('en-US', Object.assign({ timeZone: TZ }, o));
  const addDays = (d, n) => { const x = dObj(d); x.setUTCDate(x.getUTCDate() + n); return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(x); };
  const mtype = () => (form.ownerDocument.querySelector('input[name="mtype"]:checked') || {}).value || 'Online call';

  function sampleDays() { // preview only: Mon–Fri 10/1/3, Sat 10 AM, a few already "taken"
    const out = {}, today = manilaToday();
    for (let i = 1; i <= 45; i++) {
      const d = addDays(today, i), dow = dObj(d).getUTCDay();
      let t = dow === 0 ? [] : dow === 6 ? ['10:00 AM'] : ['10:00 AM', '1:00 PM', '3:00 PM'];
      t = t.filter((x, k) => (i + k) % 4 !== 0);
      if (t.length) out[d] = t;
    }
    return out;
  }
  function loadDays() {
    if (DEMO || !INQUIRY_API_URL) { B.days = sampleDays(); B.sample = true; return Promise.resolve(); }
    $('#cal').setAttribute('aria-busy', 'true'); $('#calNote').textContent = 'Loading available times…';
    return fetch(INQUIRY_API_URL + '?action=availability', { cache: 'no-store' }).then(r => r.json()).then(o => {
      if (!o.ok) throw new Error(o.error || 'unavailable');
      B.days = {}; (o.days || []).forEach(x => { if (x.t && x.t.length) B.days[x.d] = x.t; }); B.sample = false;
    }).catch(() => { B.days = {}; B.failed = true; });
  }
  function monthKey(d) { return d.slice(0, 7); }
  function renderCal() {
    const keys = Object.keys(B.days).sort(), today = manilaToday();
    const first = monthKey(today), last = keys.length ? monthKey(keys[keys.length - 1]) : first;
    if (!B.month || B.month < first) B.month = keys.length ? monthKey(keys[0]) : first;
    if (B.month > last) B.month = last;
    const [y, m] = B.month.split('-').map(Number);
    $('#calMonth').textContent = new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    $('#calPrev').disabled = B.month <= first; $('#calNext').disabled = B.month >= last;
    $('#calNote').textContent = B.failed ? 'We couldn\'t load the schedule right now. You can still send a question below.'
      : B.sample ? 'Sample schedule for this preview. On the live site, open days and times come from Arch. Patrick\'s Google Sheet.'
      : keys.length ? 'Days with open times are highlighted.' : 'No open times in the next few weeks. Please send a question instead.';
    const g = $('#calGrid'); g.textContent = '';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(n => { const s = document.createElement('span'); s.className = 'dow'; s.setAttribute('aria-hidden', 'true'); s.textContent = n.slice(0, 2); g.append(s); });
    const startDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(), nDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
    for (let i = 0; i < startDow; i++) g.append(document.createElement('span'));
    for (let k = 1; k <= nDays; k++) {
      const d = `${B.month}-${String(k).padStart(2, '0')}`, t = B.days[d] || [], b = document.createElement('button');
      b.type = 'button'; b.textContent = k; b.dataset.d = d;
      if (t.length) { b.className = 'open'; b.setAttribute('aria-label', `${fmtDay(d, { weekday: 'long', month: 'long', day: 'numeric' })}, ${t.length} ${t.length > 1 ? 'times' : 'time'} open`); b.addEventListener('click', () => { B.date = d; B.time = ''; renderCal(); }); }
      else { b.disabled = true; b.setAttribute('aria-label', `${fmtDay(d, { month: 'long', day: 'numeric' })}, not available`); }
      b.setAttribute('aria-pressed', String(d === B.date)); g.append(b);
    }
    const sl = $('#slots'); sl.textContent = '';
    if (B.date && B.days[B.date]) {
      const p = document.createElement('p'); p.textContent = fmtDay(B.date, { weekday: 'long', month: 'long', day: 'numeric' }) + ':'; sl.append(p);
      B.days[B.date].forEach(t => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.setAttribute('aria-pressed', String(t === B.time)); b.addEventListener('click', () => { B.time = t; renderCal(); $('#toDetails').focus(); }); sl.append(b); });
    }
    $('#toDetails').disabled = !(B.date && B.time);
    $('#cal').setAttribute('aria-busy', 'false');
  }
  $('#calPrev').addEventListener('click', () => { const [y, m] = B.month.split('-').map(Number); const d = new Date(Date.UTC(y, m - 2, 1)); B.month = d.toISOString().slice(0, 7); renderCal(); });
  $('#calNext').addEventListener('click', () => { const [y, m] = B.month.split('-').map(Number); const d = new Date(Date.UTC(y, m, 1)); B.month = d.toISOString().slice(0, 7); renderCal(); });

  const slotText = () => `${fmtDay(B.date, { weekday: 'short', month: 'short', day: 'numeric' })} · ${B.time} · ${mtype()}`;
  function showPick() { B.mode = 'book'; $('#winT').textContent = 'Book a consultation'; pick.hidden = false; form.hidden = true; $('#inqDone').hidden = true; $('#pErr').textContent = ''; renderCal(); }
  function showForm(mode) {
    B.mode = mode; pick.hidden = true; form.hidden = false; $('#inqDone').hidden = true; err.textContent = '';
    const book = mode === 'book';
    $('#winT').textContent = book ? 'Book a consultation' : 'Send a question';
    $('#picked').hidden = !book; if (book) $('#pickedText').textContent = slotText();
    $('#fIntro').firstChild.textContent = book ? 'A few details help me prepare for our meeting. Fields marked ' : 'Tell me about your project and I\'ll reply by email. Fields marked ';
    $('#fSendT').textContent = book ? 'Book consultation' : 'Send question';
    $('#fName').focus();
  }
  $('#toDetails').addEventListener('click', () => { if (B.date && B.time) showForm('book'); });
  $('#toInquiry').addEventListener('click', () => showForm('inquiry'));
  $('#changeSlot').addEventListener('click', () => { showPick(); const sel = $('#calGrid button[aria-pressed="true"]'); (sel || $('#calGrid button.open') || $('#calNext')).focus(); });

  try { const d = JSON.parse(sess.get(DRAFT) || 'null'); if (d) for (const [k, v] of Object.entries(d)) { const el = form.elements[k]; if (el && el.type !== 'checkbox') el.value = v; } } catch (e) {}
  form.addEventListener('input', () => { const d = {}; for (const el of form.elements) if (el.name && el.type !== 'checkbox' && el.name !== 'website') d[el.name] = el.value; sess.set(DRAFT, JSON.stringify(d)); });
  function openWin(mode) {
    winReturn = document.activeElement; if (sheet.classList.contains('open')) setSheet(false);
    win.showModal(); if (!reduce) win.animate([{ opacity: 0, transform: 'translateY(30px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.9,.3,1)' });
    if (mode === 'inquiry') return showForm('inquiry');
    B.failed = false; showPick();
    loadDays().then(() => { renderCal(); if (B.failed) $('#toInquiry').focus(); else (($('#calGrid button.open')) || $('#toInquiry')).focus(); });
  }
  $$('[data-book]').forEach(b => b.addEventListener('click', () => openWin('book')));
  $$('[data-inquire]').forEach(b => b.addEventListener('click', () => openWin('inquiry')));
  fc.addEventListener('click', e => { e.preventDefault(); openWin('book'); });
  win.addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target === win) win.close(); });
  win.addEventListener('close', () => { if (winReturn) winReturn.focus(); });

  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  form.addEventListener('submit', async e => {
    e.preventDefault(); err.textContent = '';
    $$('[aria-invalid]', form).forEach(el => el.removeAttribute('aria-invalid'));
    const bad = [];
    for (const el of form.elements) {
      if (!el.name || el.name === 'website') continue;
      const v = el.type === 'checkbox' ? el.checked : el.value.trim();
      if (el.required && !v) bad.push(el); else if (el.name === 'email' && !emailOk(v)) bad.push(el);
    }
    if (bad.length) {
      bad.forEach(el => el.setAttribute('aria-invalid', 'true'));
      err.textContent = bad.some(el => el.name === 'consent') && bad.length === 1 ? 'Please tick the consent box so we can reply to you.' : 'Please fill in the highlighted fields' + (bad.some(el => el.name === 'email' && el.value) ? ' (check your email address)' : '') + '.';
      bad[0].focus(); return;
    }
    const data = {}; for (const el of form.elements) if (el.name) data[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim();
    if (data.website) return; // bot
    const book = B.mode === 'book';
    if (book) Object.assign(data, { date: B.date, time: B.time, mtype: mtype() });
    send.disabled = true; $('#fSendT').textContent = 'Sending…';
    const first = data.name.split(' ')[0], when = book ? `${fmtDay(B.date, { weekday: 'long', month: 'long', day: 'numeric' })} at ${B.time} (Philippine time), ${data.mtype}` : '';
    try {
      if (DEMO || !INQUIRY_API_URL) {
        await new Promise(r => setTimeout(r, 700));
        $('#doneT').textContent = 'Preview only';
        $('#doneP').textContent = book ? `You picked ${when}. This is a private preview, so nothing was booked or sent.` : 'This is a private preview, so nothing was sent.';
        $('#doneNote').hidden = false; $('#doneNote').textContent = book ? 'On the live site, this booking goes straight into Arch. Patrick\'s Google Sheet and calendar, the time is taken off the schedule, and you get a confirmation email.' : 'On the live site, this goes straight to Arch. Patrick\'s email and Google Sheet, and you get a copy.';
      } else {
        const res = await fetch(INQUIRY_API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action: book ? 'book' : 'inquiry' }, data)) });
        const out = await res.json();
        if (!out.ok) {
          if (out.code === 'taken') { await loadDays(); B.time = ''; showPick(); $('#pErr').textContent = 'Sorry, that time was just taken. Please pick another one.'; return; }
          throw new Error(out.error || 'Something went wrong.');
        }
        $('#doneT').textContent = book ? `You're booked, ${first}!` : `Thank you, ${first}!`;
        $('#doneP').textContent = book ? `${when}. A confirmation is on its way to your email.` : 'Your question was sent. A copy is on its way to your email, and Arch. Patrick will reply to you there.';
        $('#doneNote').hidden = !book; $('#doneNote').textContent = book ? `Arch. Patrick will send the meeting details before your consultation. Need to change it? Just reply to the confirmation email. Ref ${out.ref}.` : '';
      }
      sess.del(DRAFT); form.reset(); B.date = ''; B.time = ''; form.hidden = true; pick.hidden = true; const done = $('#inqDone'); done.hidden = false; done.focus();
    } catch (x) {
      err.textContent = (x && x.message && x.message.length < 140 ? x.message : 'We couldn\'t send this.') + ' You can also email architectpatrickd@gmail.com.';
    } finally { send.disabled = false; $('#fSendT').textContent = B.mode === 'book' ? 'Book consultation' : 'Send question'; }
  });
})();
