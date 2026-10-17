// Term tooltips: hover on desktop (CSS), tap-to-toggle on mobile.
// Markup: <span class="term">TERM<span class="term-tip">açıklama.</span></span>
// CSS lives in styles.css (.term / .term-tip). No-ops on pages without .term spans.
// .term.stat-info (statistic "i" icons): on wide screens the tooltip is shifted
// back inside the viewport; on narrow screens CSS shows it as a bottom panel.
(function () {
  'use strict';
  function fitStatTip(el) {
    var tip = el.querySelector('.term-tip');
    if (!tip) return;
    el.style.removeProperty('--tip-shift');
    el.classList.remove('tip-below');
    if (window.matchMedia('(max-width: 600px)').matches) return;
    var r = tip.getBoundingClientRect();
    if (!r.width) return;
    var pad = 12;
    var vw = document.documentElement.clientWidth;
    var shift = 0;
    if (r.left < pad) shift = pad - r.left;
    else if (r.right > vw - pad) shift = (vw - pad) - r.right;
    if (shift) el.style.setProperty('--tip-shift', Math.round(shift) + 'px');
    if (r.top < 64) el.classList.add('tip-below');
  }
  function init() {
    var terms = document.querySelectorAll('.term');
    if (!terms.length) return;
    terms.forEach(function (el) {
      if (el.classList.contains('stat-info')) {
        el.addEventListener('mouseenter', function () { fitStatTip(el); });
        el.addEventListener('focusin', function () { fitStatTip(el); });
      }
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        document.querySelectorAll('.term.active').forEach(function (t) {
          if (t !== el) t.classList.remove('active');
        });
        el.classList.toggle('active');
      });
    });
    document.addEventListener('click', function () {
      document.querySelectorAll('.term.active').forEach(function (t) {
        t.classList.remove('active');
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
