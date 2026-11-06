/* Quick look / Full story — behaviour shared by the case studies.
   - mode switch (remembers the choice; #full in the URL forces the full story)
   - before/after slider with keyboard + touch + mouse
   - annotation dots that explain the decisions                              */
(function(){
  var KEY = 'cs-mode', body = document.body;

  /* ── mode switch ── */
  var btns = [].slice.call(document.querySelectorAll('.ql-switch button'));
  function setMode(m, quiet){
    body.classList.remove('mode-quick','mode-full'); body.classList.add('mode-' + m);
    btns.forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-mode') === m ? 'true' : 'false'); });
    if(!quiet){ try{ localStorage.setItem(KEY, m); }catch(e){} }
  }
  var start = 'quick';
  try{ if(localStorage.getItem(KEY) === 'full') start = 'full'; }catch(e){}
  if(/(^|[#&])full\b/.test(location.hash)) start = 'full';
  setMode(start, true);
  btns.forEach(function(b){ b.addEventListener('click', function(){ setMode(b.getAttribute('data-mode')); }); });
  [].forEach.call(document.querySelectorAll('[data-go-full]'), function(el){
    el.addEventListener('click', function(e){
      e.preventDefault(); setMode('full');
      var t = document.querySelector('section.cs:not(.ql)'); if(t) t.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  });

  /* ── before / after ── */
  var ba = document.querySelector('.ql-ba'); if(!ba) return;
  var handle = ba.querySelector('.ql-handle'), dots = [].slice.call(ba.querySelectorAll('.ql-dot')), note = document.querySelector('.ql-note');
  var pct = 50, dragging = false;
  function setP(p){
    pct = Math.max(0, Math.min(100, p)); ba.style.setProperty('--p', pct + '%');
    handle.setAttribute('aria-valuenow', Math.round(pct));
    dots.forEach(function(d){ d.classList.toggle('hid', parseFloat(d.style.left) < pct + 2); });   // a dot hides while the "before" covers it
  }
  function fromEvent(e){ var r = ba.getBoundingClientRect(); setP((e.clientX - r.left) / r.width * 100); }
  ba.addEventListener('pointerdown', function(e){
    if(e.target.closest('.ql-dot')) return;
    dragging = true; stopSweep(); try{ ba.setPointerCapture(e.pointerId); }catch(_){}
    fromEvent(e);
  });
  ba.addEventListener('pointermove', function(e){ if(dragging) fromEvent(e); });
  ['pointerup','pointercancel'].forEach(function(t){ ba.addEventListener(t, function(){ dragging = false; }); });
  handle.addEventListener('keydown', function(e){
    var step = e.shiftKey ? 15 : 5;
    if(e.key === 'ArrowLeft'){ stopSweep(); setP(pct - step); e.preventDefault(); }
    if(e.key === 'ArrowRight'){ stopSweep(); setP(pct + step); e.preventDefault(); }
    if(e.key === 'Home'){ setP(0); e.preventDefault(); } if(e.key === 'End'){ setP(100); e.preventDefault(); }
  });

  /* annotation dots */
  function showNote(i){
    var d = dots[i]; if(!d || !note) return;
    dots.forEach(function(x){ x.classList.remove('on'); }); d.classList.add('on');
    note.querySelector('b').textContent = (i + 1) + ' · ' + d.getAttribute('data-t');
    note.querySelector('p').textContent = d.getAttribute('data-d');
    note.classList.remove('swap'); void note.offsetWidth; note.classList.add('swap');
  }
  dots.forEach(function(d, i){
    d.addEventListener('click', function(e){ e.stopPropagation(); showNote(i); });
    d.addEventListener('mouseenter', function(){ showNote(i); });
    d.addEventListener('pointerdown', function(e){ e.stopPropagation(); });
  });

  /* a one-time sweep when it scrolls into view, so it's obvious the slider moves */
  var sweepId = 0, swept = false;
  function stopSweep(){ if(sweepId){ cancelAnimationFrame(sweepId); sweepId = 0; } swept = true; }
  function sweep(){
    if(swept) return; swept = true;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches; if(reduce) return;
    var t0 = null, from = 94, to = 50, dur = 1500;
    setP(from);
    (function step(ts){
      if(t0 === null) t0 = ts; var k = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      setP(from + (to - from) * e); if(k < 1) sweepId = requestAnimationFrame(step); else sweepId = 0;
    })(performance.now());
  }
  handle.setAttribute('role','slider'); handle.setAttribute('tabindex','0'); handle.setAttribute('aria-valuemin','0'); handle.setAttribute('aria-valuemax','100');
  handle.setAttribute('aria-label','Compare the old site (left) with the new site (right)');
  setP(50); showNote(0);
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting && body.classList.contains('mode-quick')){ io.disconnect(); sweep(); } }); }, { threshold:.55 });
    io.observe(ba);
  }
})();
