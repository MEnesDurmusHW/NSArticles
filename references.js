(function () {
  'use strict';

  function findRefsHeading(ol) {
    var node = ol;
    var seen = new Set();
    while (node && node.tagName !== 'BODY') {
      var sib = node.previousElementSibling;
      while (sib) {
        if (seen.has(sib)) break;
        seen.add(sib);
        if (/^H[234]$/.test(sib.tagName) && /Kaynak/i.test(sib.textContent)) {
          return sib;
        }
        var inner = sib.querySelector('h2, h3, h4');
        if (inner && /Kaynak/i.test(inner.textContent)) return inner;
        sib = sib.previousElementSibling;
      }
      node = node.parentElement;
    }
    return null;
  }

  function plainText(node) {
    var clone = node.cloneNode(true);
    clone.querySelectorAll('button, .heading-share, svg').forEach(function (el) {
      el.remove();
    });
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function wrapOl(ol) {
    if (ol.closest('details[data-refs]')) return;
    var heading = findRefsHeading(ol);
    if (!heading) return;

    var count = ol.querySelectorAll(':scope > li').length;
    if (count < 3) return;

    // Normalize the label across all articles. Source articles may have
    // used "Kaynaklar" or "Kaynakça" interchangeably; we always render
    // "Kaynakça" (the academic-standard Turkish term for bibliography).
    var label = 'Kaynakça';

    var details = document.createElement('details');
    details.className = 'references-collapse';
    details.setAttribute('data-refs', '');

    if (heading.id) {
      details.id = heading.id;
    }

    var summary = document.createElement('summary');
    summary.className = 'ref-summary';
    summary.innerHTML =
      '<span class="ref-summary-chevron" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<polyline points="9 6 15 12 9 18"/>' +
        '</svg>' +
      '</span>' +
      '<span class="ref-summary-label">' + escapeHtml(label) + '</span>' +
      '<span class="ref-count">' + count + '</span>';

    var hShare = heading.querySelector('.heading-share');
    if (hShare) {
      hShare.classList.add('ref-summary-share');
      summary.appendChild(hShare);
    }

    details.appendChild(summary);

    heading.parentNode.insertBefore(details, heading);
    heading.remove();

    details.appendChild(ol);
  }

  function collectCandidates() {
    var candidates = [];
    document.querySelectorAll('ol').forEach(function (ol) {
      if (ol.closest('details[data-refs]')) return;
      var hasRefIds = !!ol.querySelector('li[id^="ref-"]');
      var hasRefClass = ol.classList.contains('references');
      if (!hasRefIds && !hasRefClass) return;
      candidates.push(ol);
    });
    return candidates;
  }

  function expandAllRefs() {
    document.querySelectorAll('details[data-refs]').forEach(function (d) {
      d.open = true;
    });
  }

  function scrollToHashAnchor() {
    var target = document.querySelector(location.hash);
    if (target) {
      requestAnimationFrame(function () {
        target.scrollIntoView({ block: 'start' });
      });
    }
  }

  function init() {
    collectCandidates().forEach(wrapOl);

    if (location.hash && /^#ref-/.test(location.hash)) {
      expandAllRefs();
      scrollToHashAnchor();
    }
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#ref-"]');
    if (!a) return;
    expandAllRefs();
  }, true);

  window.addEventListener('hashchange', function () {
    if (/^#ref-/.test(location.hash)) {
      expandAllRefs();
      scrollToHashAnchor();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
