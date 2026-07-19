// Term tooltips: hover on desktop (CSS), tap-to-toggle on mobile.
// Markup: <span class="term">TERM<span class="term-tip">açıklama.</span></span>
// CSS lives in styles.css (.term / .term-tip). No-ops on pages without .term spans.
(function () {
  'use strict';
  function init() {
    var terms = document.querySelectorAll('.term');
    if (!terms.length) return;
    terms.forEach(function (el) {
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
