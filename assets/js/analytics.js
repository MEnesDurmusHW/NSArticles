/* ===========================================
   NSArticles — Scroll-depth tracking.
   Fires GoatCounter events when reader passes 25/50/75/100% of the page.
   =========================================== */
(function () {
  'use strict';

  var thresholds = [25, 50, 75, 100];
  var hit = {};
  var ticking = false;

  function isLocal() {
    var h = location.hostname;
    return location.protocol === 'file:' || !h ||
           h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' ||
           /^192\.168\./.test(h) || /^10\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h);
  }

  function track(pct) {
    if (isLocal()) return;
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
