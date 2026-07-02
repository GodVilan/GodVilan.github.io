/* main.js — extracted from design-reference.html: project slider, intro overlay, project modal, scroll-reveal, Medium feed */
(function () {
  var rail = document.getElementById('projectRail');
  if (!rail) return;
  var wrap = rail.closest('.rail-wrap');
  var prev = wrap.querySelector('.rail-arrow.prev');
  var next = wrap.querySelector('.rail-arrow.next');
  var dotsWrap = document.getElementById('railDots');
  var cards = [].slice.call(rail.querySelectorAll('.card'));
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var beh = RM ? 'auto' : 'smooth';
  function step() { return cards[0].offsetWidth + 18; }
  cards.forEach(function (c, i) {
    var b = document.createElement('button');
    b.setAttribute('aria-label', 'Go to project ' + (i + 1));
    b.addEventListener('click', function () { rail.scrollTo({ left: Math.round(i * step()), behavior: beh }); });
    dotsWrap.appendChild(b);
  });
  var dots = [].slice.call(dotsWrap.children);
  function update() {
    var x = rail.scrollLeft, max = rail.scrollWidth - rail.clientWidth;
    wrap.classList.toggle('at-start', x <= 4);
    wrap.classList.toggle('at-end', x >= max - 4);
    if (prev) prev.disabled = x <= 4;
    if (next) next.disabled = x >= max - 4;
    var idx = Math.min(dots.length - 1, Math.round(x / step()));
    dots.forEach(function (d, i) { d.classList.toggle('on', i === idx); });
  }
  if (prev) prev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: beh }); });
  if (next) next.addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: beh }); });
  rail.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
  // drag-to-scroll (desktop)
  var down = false, sx = 0, sl = 0, moved = false;
  rail.addEventListener('pointerdown', function (e) { down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add('dragging'); });
  window.addEventListener('pointermove', function (e) { if (!down) return; var d = e.clientX - sx; if (Math.abs(d) > 5) moved = true; rail.scrollLeft = sl - d; });
  window.addEventListener('pointerup', function () { if (down) { down = false; rail.classList.remove('dragging'); } });
  rail.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  // keyboard
  rail.setAttribute('tabindex', '0'); rail.setAttribute('role', 'group'); rail.setAttribute('aria-label', 'Projects — use arrow keys to scroll');
  rail.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); rail.scrollBy({ left: step(), behavior: beh }); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); rail.scrollBy({ left: -step(), behavior: beh }); }
  });
})();

(function () {
  var intro = document.getElementById('intro');
  function announceDone() { try { window.dispatchEvent(new Event('intro:done')); } catch (e) { } }
  if (!intro) { announceDone(); return; }
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  // Plays once per session. Reduced-motion users and returning visitors skip it entirely.
  var seenIntro = false;
  try { seenIntro = !!sessionStorage.getItem('intro_seen'); } catch (e) { }
  if (RM || seenIntro) { intro.parentNode && intro.remove(); announceDone(); return; }
  try { sessionStorage.setItem('intro_seen', '1'); } catch (e) { }
  document.documentElement.classList.add('intro-lock');
  document.body.classList.add('intro-lock');
  var done = false;
  function finish() {
    if (done) return; done = true;
    intro.classList.add('done');
    document.documentElement.classList.remove('intro-lock');
    document.body.classList.remove('intro-lock');
    var brand = document.querySelector('.brand');
    if (brand) brand.classList.add('arrive');   // nav logo "receives" the name
    setTimeout(function () { intro && intro.parentNode && intro.remove(); announceDone(); }, 640);
  }
  var timer = setTimeout(finish, 2200);
  function skip() { clearTimeout(timer); finish(); }
  var b = document.getElementById('introSkip');
  if (b) b.addEventListener('click', function (e) { e.stopPropagation(); skip(); });
  intro.addEventListener('click', skip);
  window.addEventListener('keydown', function h() { window.removeEventListener('keydown', h); skip(); });
  window.addEventListener('wheel', function h() { window.removeEventListener('wheel', h); skip(); }, { passive: true });
  window.addEventListener('touchmove', function h() { window.removeEventListener('touchmove', h); skip(); }, { passive: true });
})();

(function () {
  var overlay = document.getElementById('projModal'), body = document.getElementById('modalBody'), x = document.getElementById('modalX'), last = null;
  function open(art) {
    last = art; body.innerHTML = art.querySelector('.detail').innerHTML; overlay.hidden = false;
    document.documentElement.classList.add('intro-lock'); document.body.classList.add('intro-lock'); x.focus(); overlay.scrollTop = 0;
  }
  function close() { overlay.hidden = true; document.documentElement.classList.remove('intro-lock'); document.body.classList.remove('intro-lock'); if (last) last.focus(); }
  [].forEach.call(document.querySelectorAll('#projectRail .card'), function (art) {
    art.addEventListener('click', function () { open(art); });
    art.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(art); } });
  });
  x.addEventListener('click', close);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !overlay.hidden) close(); });
  // Focus trap: keep Tab / Shift+Tab cycling inside the open modal.
  overlay.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || overlay.hidden) return;
    var f = overlay.querySelectorAll('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    var first = f[0], lastEl = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
  });
})();

(function () {
  var els = [].slice.call(document.querySelectorAll('.io'));
  if (!('IntersectionObserver' in window) || !els.length) { els.forEach(function (e) { e.classList.add('in'); }); return; }
  var ob = new IntersectionObserver(function (ents) {
    ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); ob.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  els.forEach(function (e) { ob.observe(e); });
})();

/* Writing section: pulls latest Medium posts live and hides the whole section if none.
   Posts come from our own serverless proxy (api/medium.js), so the site no longer
   depends on a third-party public proxy. The endpoint returns the same shape rss2json
   used: { status:"ok", items:[{title,link,pubDate,description,content}] }. */
(function () {
  var ENDPOINT = '/api/medium';
  var sec = document.getElementById('writing'), grid = document.getElementById('mediumPosts'), allBtn = document.getElementById('mediumAll');
  if (!sec || !grid) return;
  function strip(h) { var d = document.createElement('div'); d.innerHTML = h || ''; return (d.textContent || '').replace(/\s+/g, ' ').trim(); }
  function fmt(d) { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return ''; } }
  fetch(ENDPOINT)
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d || d.status !== 'ok' || !d.items || !d.items.length) return;
      grid.innerHTML = d.items.slice(0, 6).map(function (p) {
        var ex = strip(p.description).slice(0, 120);
        var mins = Math.max(1, Math.round(strip(p.content || p.description).split(' ').length / 200));
        return '<a class="post" href="' + p.link + '" target="_blank" rel="noopener">'
          + '<div class="post-meta">' + fmt(p.pubDate) + ' &middot; ' + mins + ' min read</div>'
          + '<div class="post-title">' + p.title + '</div>'
          + '<div class="post-ex">' + ex + '&hellip;</div>'
          + '<div class="post-cta">Read on Medium &rarr;</div></a>';
      }).join('');
      sec.hidden = false;
      if (allBtn) allBtn.style.display = 'inline-flex';
      [].forEach.call(sec.querySelectorAll('.io'), function (e) { e.classList.add('in'); });
    })
    .catch(function () {/* leave section hidden */ });
})();

/* Sri — grounded RAG assistant panel.
   Real fetch() calls to /api/ask (Claude Haiku over /knowledge-base), renders the returned
   source filenames as a citation under each answer, with typing indicator and quick-ask chips.
   Auto-opens once per visitor (localStorage), then collapses to a bubble + "Ask me" nudge. */
(function () {
  var panel = document.getElementById('sriPanel'), dock = document.getElementById('sriDock'),
    body = document.getElementById('sriBody'), field = document.getElementById('sriField');
  if (!panel || !dock || !body || !field) return;
  var busy = false;
  var MAX_Q = 1000; // must match MAX_QUESTION_CHARS in api/ask.js

  function scroll() { body.scrollTop = body.scrollHeight; }
  function openPanel() {
    panel.classList.remove('hidden'); dock.classList.add('hidden');
    setTimeout(function () { try { field.focus(); } catch (e) { } }, 260);
  }
  function closePanel() { panel.classList.add('hidden'); dock.classList.remove('hidden'); }

  function userMsg(txt) {
    var d = document.createElement('div'); d.className = 'sri-msg user'; d.textContent = txt;
    body.appendChild(d); scroll();
  }
  // safe markdown → DOM (no innerHTML on model text)
  function sriInline(parent, str) {
    var re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g, last = 0, m;
    while ((m = re.exec(str))) {
      if (m.index > last) parent.appendChild(document.createTextNode(str.slice(last, m.index)));
      var tok = m[0], el;
      if (tok[0] === '`') { el = document.createElement('code'); el.textContent = tok.slice(1, -1); }
      else if (tok.slice(0, 2) === '**') { el = document.createElement('strong'); el.textContent = tok.slice(2, -2); }
      else { el = document.createElement('em'); el.textContent = tok.slice(1, -1); }
      parent.appendChild(el); last = re.lastIndex;
    }
    if (last < str.length) parent.appendChild(document.createTextNode(str.slice(last)));
  }
  function sriRender(container, text) {
    var lines = String(text).replace(/\r\n/g, '\n').split('\n'), i = 0;
    while (i < lines.length) {
      if (!lines[i].trim()) { i++; continue; }
      if (/^\s*[-*]\s+/.test(lines[i])) {
        var ul = document.createElement('ul');
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          var li = document.createElement('li'); sriInline(li, lines[i].replace(/^\s*[-*]\s+/, '')); ul.appendChild(li); i++;
        }
        container.appendChild(ul); continue;
      }
      if (/^\s*\d+\.\s+/.test(lines[i])) {
        var ol = document.createElement('ol');
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          var li = document.createElement('li'); sriInline(li, lines[i].replace(/^\s*\d+\.\s+/, '')); ol.appendChild(li); i++;
        }
        container.appendChild(ol); continue;
      }
      var p = document.createElement('p'), first = true;
      while (i < lines.length && lines[i].trim() && !/^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        if (!first) p.appendChild(document.createElement('br'));
        sriInline(p, lines[i]); first = false; i++;
      }
      container.appendChild(p);
    }
  }
  function botMsg(text, sources) {
    var d = document.createElement('div'); d.className = 'sri-msg bot';
    sriRender(d, text);   // markdown → real nodes; still no innerHTML on model output
    if (sources && sources.length) {
      var c = document.createElement('div'); c.className = 'sri-cite';
      var tick = document.createElement('span'); tick.className = 'tick'; tick.textContent = '✓';
      c.appendChild(tick);
      c.appendChild(document.createTextNode(' source: ' + sources.join(', ')));
      d.appendChild(c);
    }
    body.appendChild(d); scroll();
  }
  function typing() {
    var d = document.createElement('div'); d.className = 'sri-typing';
    d.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(d); scroll(); return d;
  }

  function ask(q) {
    if (busy || !q) return; busy = true;
    userMsg(q); var t = typing();
    fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q })
    })
      .then(function (r) {
        return r.json().then(function (j) { return { ok: r.ok, status: r.status, data: j }; },
          function () { return { ok: false, status: r.status, data: null }; });
      })
      .then(function (res) {
        t.remove();
        if (res.ok && res.data && typeof res.data.answer === 'string') {
          botMsg(res.data.answer, res.data.sources || []);
        } else if (res.status === 429) {
          // friendly rate-limit message
          botMsg('I’m getting a lot of questions right now — give me a minute, then try again.', []);
        } else if (res.status === 400) {
          // backend rejected the input (e.g. too long / empty)
          botMsg('That question is a bit too long for me — could you shorten it and try again?', []);
        } else {
          // backend-error fallback (network, 5xx, missing key)
          botMsg('Sorry, I couldn’t reach my knowledge base just now. Please try again in a moment, or contact Srikanth directly.', []);
        }
      })
      .catch(function () { t.remove(); botMsg('Sorry, something went wrong on my end. Please try again shortly.', []); })
      .then(function () { busy = false; try { field.focus(); } catch (e) { } });
  }
  function send() {
    var v = field.value.trim();
    if (!v) return;
    if (v.length > MAX_Q) v = v.slice(0, MAX_Q); // input length cap (also enforced by maxlength + backend)
    field.value = '';
    ask(v);
  }

  document.getElementById('sriBubble').addEventListener('click', openPanel);
  document.getElementById('sriClose').addEventListener('click', closePanel);
  document.getElementById('sriSend').addEventListener('click', send);
  field.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); send(); } });
  [].forEach.call(panel.querySelectorAll('.sri-chip'), function (ch) {
    ch.addEventListener('click', function () { ask(ch.getAttribute('data-q')); });
  });

  // Auto-open once per visitor; afterwards start collapsed as a bubble + nudge.
  var seen = false;
  try { seen = !!localStorage.getItem('sri_seen'); } catch (e) { }
  if (!seen) {
    try { localStorage.setItem('sri_seen', '1'); } catch (e) { }
    // Open only after the intro overlay has fully cleared (or immediately-ish if it never ran).
    var opened = false;
    function autoOpen() { if (opened) return; opened = true; setTimeout(openPanel, 700); }
    if (document.getElementById('intro')) {
      window.addEventListener('intro:done', autoOpen, { once: true });
      setTimeout(autoOpen, 6000); // safety net if the event never fires
    } else {
      autoOpen();
    }
  } else {
    dock.classList.remove('hidden');
  }
})();
/* ---- hero: live agent trace terminal ---- */
(function () {
  var body = document.getElementById('traceBody');
  if (!body) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // scenarios grounded in the real knowledge base
  var runs = [
    {
      q: 'does he have production MLOps?', steps: [
        { l: 'planner', v: 'decompose · route' },
        { l: 'retrieve', v: 'fraud-detection.md', file: true },
        { l: 'critic', v: 'grounded · self-check' },
        { l: 'answer', v: 'CI/CD → MLflow → FastAPI on EC2', ans: true }
      ]
    },
    {
      q: "what's his strongest agent project?", steps: [
        { l: 'planner', v: 'decompose · route' },
        { l: 'retrieve', v: 'evidence-review.md', file: true },
        { l: 'tools', v: 'rank lookup' },
        { l: 'answer', v: 'VLM adjudicator · top 1% (16 / 1,773)', ans: true }
      ]
    },
    {
      q: 'is he available to hire?', steps: [
        { l: 'planner', v: 'route' },
        { l: 'retrieve', v: 'status.md', file: true },
        { l: 'answer', v: 'AI Engineer / ML · US · available now', ans: true }
      ]
    }
  ];

  var timers = [], running = false, idx = 0;
  function after(ms, fn) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function stepLine(s) {
    var d = document.createElement('div');
    d.className = 'trace-line' + (s.ans ? ' answer' : '');
    var val = s.file ? '<span class="file">' + s.v + '</span>' : '<span class="val">' + s.v + '</span>';
    var ok = s.ans ? '  <span class="ok">✓ cited</span>' : '';
    d.innerHTML = '<span class="lbl">' + s.l + '</span><span class="arw">▸ </span>' + val + ok; // author-constant content only
    return d;
  }

  function renderStatic(run) {
    body.innerHTML = '';
    var q = document.createElement('div'); q.className = 'trace-line';
    var head = document.createElement('span'); head.className = 'p'; head.textContent = '> visitor: ';
    var qt = document.createElement('span'); qt.className = 'q'; qt.textContent = '"' + run.q + '"';
    q.appendChild(head); q.appendChild(qt); body.appendChild(q);
    run.steps.forEach(function (s) { body.appendChild(stepLine(s)); });
  }

  if (reduce) { renderStatic(runs[0]); return; }

  function typeQuestion(run, done) {
    body.innerHTML = '';
    var line = document.createElement('div'); line.className = 'trace-line';
    var head = document.createElement('span'); head.className = 'p'; head.textContent = '> visitor: ';
    var q = document.createElement('span'); q.className = 'q';
    var caret = document.createElement('span'); caret.className = 'trace-caret';
    line.appendChild(head); line.appendChild(document.createTextNode('"'));
    line.appendChild(q); line.appendChild(caret);
    body.appendChild(line);
    var txt = run.q, i = 0;
    (function tick() {
      if (!running) return;
      if (i <= txt.length) { q.textContent = txt.slice(0, i); i++; after(30, tick); }
      else { caret.remove(); line.appendChild(document.createTextNode('"')); after(360, done); }
    })();
  }

  function revealSteps(run, done) {
    var s = 0;
    (function next() {
      if (!running) return;
      if (s < run.steps.length) {
        var node = stepLine(run.steps[s]);
        node.style.opacity = '0'; body.appendChild(node);
        requestAnimationFrame(function () { node.style.transition = 'opacity .28s ease'; node.style.opacity = '1'; });
        s++; after(520, next);
      } else { after(2200, done); }
    })();
  }

  function loop() {
    if (!running) return;
    var run = runs[idx % runs.length];
    typeQuestion(run, function () { revealSteps(run, function () { idx++; loop(); }); });
  }

  running = true; loop();

  // pause when scrolled out of view
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting && !running) { running = true; loop(); }
        else if (!e.isIntersecting && running) { running = false; clearTimers(); }
      });
    }, { threshold: 0.1 }).observe(body);
  }
})();