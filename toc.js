/* ===========================================
   NSArticles — Table of Contents (TOC) behavior.
   - Mobile drawer toggle + backdrop + Esc to close
   - Auto-close drawer on link tap (mobile only)
   - Scroll-spy active state for level-1 and level-2 entries
   - Auto expand/collapse of nested children based on scroll position
   - Manual chevron toggle for nested sections

   Silently no-ops on pages without a #toc-rail.
   =========================================== */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var rail = document.getElementById('toc-rail');
    if (!rail) return;

    var backdrop = document.querySelector('.toc-backdrop');
    var btn = document.querySelector('.toc-toggle');

    function open() {
      rail.classList.add('open');
      if (backdrop) backdrop.classList.add('open');
      if (btn) btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      rail.classList.remove('open');
      if (backdrop) backdrop.classList.remove('open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    function toggle() {
      if (rail.classList.contains('open')) close();
      else open();
    }

    window.toggleToc = toggle;
    window.closeToc = close;

    window.toggleChildren = function (key) {
      var parent = document.querySelector('[data-toc-key="' + key + '"]');
      var children = document.querySelector('.toc-children[data-parent="' + key + '"]');
      if (!parent || !children) return;
      var willOpen = !children.classList.contains('expanded');
      children.classList.toggle('expanded', willOpen);
      parent.classList.toggle('expanded', willOpen);
    };

    rail.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function () {
        if (window.innerWidth < 1200) setTimeout(close, 120);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    if (!('IntersectionObserver' in window)) return;

    var topLinks = rail.querySelectorAll('.toc-level-1[href^="#"]');
    var subLinks = rail.querySelectorAll('.toc-level-2[href^="#"]');

    var topTargets = [];
    topLinks.forEach(function (a) {
      var el = document.querySelector(a.getAttribute('href'));
      if (el) topTargets.push({ el: el, link: a, key: a.getAttribute('href').slice(1) });
    });
    var subTargets = [];
    subLinks.forEach(function (a) {
      var el = document.querySelector(a.getAttribute('href'));
      if (el) subTargets.push({ el: el, link: a });
    });

    function setActiveTop(link, key) {
      topLinks.forEach(function (l) { l.classList.remove('active'); });
      if (link) link.classList.add('active');
      document.querySelectorAll('.toc-children').forEach(function (c) {
        c.classList.toggle('expanded', c.dataset.parent === key);
      });
      document.querySelectorAll('.toc-has-children').forEach(function (p) {
        p.classList.toggle('expanded', p.dataset.tocKey === key);
      });
    }

    function setActiveSub(link) {
      subLinks.forEach(function (l) { l.classList.remove('active'); });
      if (link) link.classList.add('active');
    }

    var topIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var match = topTargets.find(function (t) { return t.el === e.target; });
          if (match) setActiveTop(match.link, match.key);
        }
      });
    }, { rootMargin: '-25% 0px -65% 0px', threshold: 0 });
    topTargets.forEach(function (t) { topIo.observe(t.el); });

    var subIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var match = subTargets.find(function (t) { return t.el === e.target; });
          if (match) setActiveSub(match.link);
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    subTargets.forEach(function (t) { subIo.observe(t.el); });
  });
})();
