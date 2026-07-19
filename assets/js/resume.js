(function () {
  'use strict';

  var STORAGE_KEY = 'ns-pos-' + location.pathname;
  var TTL_MS = 7 * 24 * 60 * 60 * 1000;
  var MIN_SCROLL_HEIGHT = 1200;
  var SHOW_THRESHOLD = 0.15;
  var DISMISS_LOW = 0.05;
  var DISMISS_HIGH = 0.95;
  var SAVE_INTERVAL_MS = 1500;
  var AUTO_HIDE_MS = 12000;

  var savePending = false;
  var saveTimer = null;

  function maxScroll() {
    var doc = document.documentElement;
    return doc.scrollHeight - doc.clientHeight;
  }

  function loadPosition() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || typeof data.y !== 'number') return null;
      if (Date.now() - data.savedAt > TTL_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data.y;
    } catch (e) {
      return null;
    }
  }

  function savePosition() {
    savePending = false;
    var max = maxScroll();
    if (max < MIN_SCROLL_HEIGHT) return;
    var y = document.documentElement.scrollTop;
    var ratio = y / max;
    if (ratio < DISMISS_LOW || ratio > DISMISS_HIGH) {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        y: y,
        savedAt: Date.now()
      }));
    } catch (e) {}
  }

  function scheduleSave() {
    if (savePending) return;
    savePending = true;
    saveTimer = setTimeout(savePosition, SAVE_INTERVAL_MS);
  }

  function createPill(y) {
    var pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'resume-pill';
    pill.innerHTML =
      '<svg class="resume-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<line x1="12" y1="5" x2="12" y2="19"/>' +
        '<polyline points="6 13 12 19 18 13"/>' +
      '</svg>' +
      '<span class="resume-pill-text">Kaldığın yerden devam et</span>' +
      '<span class="resume-pill-close" role="button" aria-label="Kapat" tabindex="0">×</span>';
    document.body.appendChild(pill);

    requestAnimationFrame(function () {
      pill.classList.add('resume-pill-show');
    });

    var hideTimer = setTimeout(hide, AUTO_HIDE_MS);

    function hide() {
      clearTimeout(hideTimer);
      pill.classList.remove('resume-pill-show');
      setTimeout(function () { if (pill.parentNode) pill.remove(); }, 320);
    }

    pill.addEventListener('click', function (e) {
      if (e.target.classList && e.target.classList.contains('resume-pill-close')) {
        e.stopPropagation();
        try { localStorage.removeItem(STORAGE_KEY); } catch (err) {}
        hide();
        if (window.goatcounter && typeof window.goatcounter.count === 'function') {
          window.goatcounter.count({ path: 'resume-dismiss', event: true });
        }
        return;
      }
      window.scrollTo({ top: y, behavior: 'smooth' });
      hide();
      if (window.goatcounter && typeof window.goatcounter.count === 'function') {
        window.goatcounter.count({ path: 'resume-click', event: true });
      }
    });
  }

  function init() {
    var max = maxScroll();
    if (max < MIN_SCROLL_HEIGHT) return;

    var y = loadPosition();
    if (y !== null && y / max > SHOW_THRESHOLD) {
      createPill(y);
    }

    window.addEventListener('scroll', scheduleSave, { passive: true });
    window.addEventListener('beforeunload', function () {
      if (saveTimer) clearTimeout(saveTimer);
      savePosition();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        if (saveTimer) clearTimeout(saveTimer);
        savePosition();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
