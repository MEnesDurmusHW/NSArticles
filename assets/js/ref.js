/* ===========================================
   NSArticles — Referral code tracking.
   Reads ?ref=CODE from the URL and fires a one-shot
   GoatCounter event so the owner can tell which shared
   link a visitor came from. Each code fires at most once
   per browser (stored in localStorage) to prevent inflation
   on refreshes or re-visits. The ?ref= param is stripped
   from the address bar after read so visitors don't pass
   the code along when re-sharing.
   =========================================== */
(function () {
  'use strict';

  var PARAM = 'ref';
  var SEEN_KEY = 'ns-ref-seen';
  var FIRST_KEY = 'ns-ref-first';
  var MAX_TRIES = 10;
  var RETRY_MS = 500;

  function isLocal() {
    var h = location.hostname;
    return location.protocol === 'file:' || !h ||
           h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' ||
           /^192\.168\./.test(h) || /^10\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h);
  }

  function sanitize(code) {
    if (!code) return '';
    return String(code).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  }

  function readSeen() {
    try {
      var raw = localStorage.getItem(SEEN_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }

  function writeSeen(arr) {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(arr)); } catch (e) {}
  }

  function fire(code, tries) {
    if (window.goatcounter && window.goatcounter.count) {
      window.goatcounter.count({ path: 'ref-' + code, event: true });
      return;
    }
    if (tries >= MAX_TRIES) return;
    setTimeout(function () { fire(code, tries + 1); }, RETRY_MS);
  }

  function cleanUrl() {
    if (!window.history || !history.replaceState) return;
    try {
      var url = new URL(location.href);
      if (!url.searchParams.has(PARAM)) return;
      url.searchParams.delete(PARAM);
      var qs = url.searchParams.toString();
      history.replaceState(null, '', url.pathname + (qs ? '?' + qs : '') + url.hash);
    } catch (e) {}
  }

  function run() {
    var params;
    try { params = new URLSearchParams(location.search); } catch (e) { return; }
    var code = sanitize(params.get(PARAM));
    if (!code) return;

    var seen = readSeen();
    if (seen.indexOf(code) === -1) {
      seen.push(code);
      writeSeen(seen);
      try {
        if (!localStorage.getItem(FIRST_KEY)) localStorage.setItem(FIRST_KEY, code);
      } catch (e) {}
      if (!isLocal()) fire(code, 0);
    }

    cleanUrl();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
