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

    if (!topTargets.length && !subTargets.length) return;

    var activeTopLink = null;
    var activeSubLink = null;

    function setActiveTop(link, key) {
      if (link !== activeTopLink) {
        topLinks.forEach(function (l) { l.classList.remove('active'); });
        if (link) link.classList.add('active');
        activeTopLink = link;
      }
      document.querySelectorAll('.toc-children').forEach(function (c) {
        c.classList.toggle('expanded', c.dataset.parent === key);
      });
      document.querySelectorAll('.toc-has-children').forEach(function (p) {
        p.classList.toggle('expanded', p.dataset.tocKey === key);
      });
    }

    function setActiveSub(link) {
      if (link === activeSubLink) return;
      subLinks.forEach(function (l) { l.classList.remove('active'); });
      if (link) link.classList.add('active');
      activeSubLink = link;
    }

    // Scroll-position based spy: the active heading is the last one whose top
    // has scrolled above an activation line near the top of the viewport.
    // Unlike a thin intersection band, this always resolves exactly one active
    // entry and updates correctly after click-jumps (which skip the band).
    function currentActive(targets) {
      if (!targets.length) return null;
      var line = window.innerHeight * 0.3;
      var chosen = targets[0];
      for (var i = 0; i < targets.length; i++) {
        if (targets[i].el.getBoundingClientRect().top <= line) chosen = targets[i];
        else break;
      }
      return chosen;
    }

    function update() {
      var top = currentActive(topTargets);
      if (top) setActiveTop(top.link, top.key);
      var sub = currentActive(subTargets);
      setActiveSub(sub ? sub.link : null);
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        update();
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('hashchange', function () { setTimeout(update, 60); });
    rail.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function () { setTimeout(update, 60); });
    });
    update();
  });
})();
