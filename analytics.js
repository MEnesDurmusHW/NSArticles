/* ===========================================
   NSArticles — Scroll-depth tracking.
   Fires GoatCounter events when reader passes 25/50/75/100% of the page.
   =========================================== */
(function () {
  'use strict';

  var thresholds = [25, 50, 75, 100];
  var hit = {};
  var ticking = false;

  function track(pct) {
    if (window.goatcounter && window.goatcounter.count) {
      window.goatcounter.count({ path: 'scroll-' + pct, event: true });
    }
  }

  function measure() {
    ticking = false;
    var doc = document.documentElement;
    var total = doc.scrollHeight - window.innerHeight;
    if (total < 200) return;
    var pct = (window.scrollY / total) * 100;
    for (var i = 0; i < thresholds.length; i++) {
      var t = thresholds[i];
      if (!hit[t] && pct >= t) {
        hit[t] = true;
        track(t);
      }
    }
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(measure);
  }, { passive: true });

  window.addEventListener('load', measure);
})();
