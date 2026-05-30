/* ===========================================
   NSArticles — Reader highlights, notes, and quote sharing.
   - Text selection inside an article shows a floating popover:
     [Vurgula] [Not] [Kopyala] [Paylaş]
   - Vurgula wraps the selection in <mark class="ns-hl"> and persists
     to localStorage keyed by article path (ns-marks-<path>).
   - Not opens an inline editor pinned to the highlight.
   - Paylaş hands off to share.js with a #:~:text= fragment URL and
     a "quote" field so X/WhatsApp/QR all include the excerpt.
   - Existing highlights re-render on load via fuzzy text matching
     (paragraph index + 24 chars of context before/after the snippet).
   - A bottom-left pill shows total highlight count and opens a panel
     listing every highlight on the page; click to scroll back to it.
   =========================================== */
(function () {
  'use strict';

  var STORAGE_PREFIX = 'ns-marks-';
  var CONTEXT_LEN = 24;
  var GAP = 10;
  var PARA_SELECTOR = 'p, blockquote, li';
  var EXCLUDE = '.toc-rail, .toc-list, .references, .references-collapse, ' +
                '.continue, .share-modal, .resume-pill, .back-fab, ' +
                '.feedback, .home-logo, .hl-popover, .hl-note-editor, ' +
                '.hl-pill, .hl-panel, .heading-share, footer';

  var marks = [];
  var paragraphs = [];
  var popoverEl = null;
  var noteEl = null;
  var pillEl = null;
  var panelEl = null;
  var pendingSel = null;
  var activeMarkId = null;
  var noteForMarkId = null;

  function isLocal() {
    var h = location.hostname;
    return location.protocol === 'file:' || !h ||
           h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' ||
           /^192\.168\./.test(h) || /^10\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h);
  }

  function trackEvent(name) {
    if (isLocal()) return;
    if (window.goatcounter && window.goatcounter.count) {
      window.goatcounter.count({ path: name, event: true });
    }
  }

  function key() { return STORAGE_PREFIX + location.pathname; }

  function readMarks() {
    try {
      var raw = localStorage.getItem(key());
      var p = raw ? JSON.parse(raw) : null;
      return Array.isArray(p) ? p : [];
    } catch (e) { return []; }
  }

  function writeMarks() {
    try {
      if (!marks.length) localStorage.removeItem(key());
      else localStorage.setItem(key(), JSON.stringify(marks));
    } catch (e) {}
  }

  function uuid() {
    return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function findParagraphs() {
    var raw = document.querySelectorAll(PARA_SELECTOR);
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var el = raw[i];
      if (el.closest(EXCLUDE)) continue;
      if ((el.textContent || '').trim().length < 8) continue;
      out.push(el);
    }
    return out;
  }

  function paraIndexFor(node) {
    if (!node) return -1;
    var el = node.nodeType === 1 ? node : node.parentNode;
    for (var i = 0; i < paragraphs.length; i++) {
      if (paragraphs[i] === el || paragraphs[i].contains(el)) return i;
    }
    return -1;
  }

  function offsetIn(para, node, off) {
    if (node === para) {
      var len = 0;
      for (var i = 0; i < off; i++) {
        var child = para.childNodes[i];
        if (child) len += (child.textContent || '').length;
      }
      return len;
    }
    var pos = 0;
    var walker = document.createTreeWalker(para, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      if (n === node) return pos + off;
      pos += n.nodeValue.length;
    }
    return -1;
  }

  function nodeInsideMark(node) {
    var el = node && (node.nodeType === 1 ? node : node.parentNode);
    return !!(el && el.closest && el.closest('mark.ns-hl'));
  }

  function getSelectionInfo() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
    var range = sel.getRangeAt(0);
    var text = sel.toString().replace(/\s+/g, ' ').trim();
    if (text.length < 3) return null;

    if (nodeInsideMark(range.startContainer) || nodeInsideMark(range.endContainer)) return null;
    try {
      if (range.cloneContents().querySelector('mark.ns-hl')) return null;
    } catch (e) {}

    var startPara = paraIndexFor(range.startContainer);
    var endPara = paraIndexFor(range.endContainer);
    if (startPara < 0 || endPara < 0 || startPara !== endPara) return null;

    var para = paragraphs[startPara];
    var startOff = offsetIn(para, range.startContainer, range.startOffset);
    var endOff = offsetIn(para, range.endContainer, range.endOffset);
    if (startOff < 0 || endOff < 0 || startOff >= endOff) return null;

    var paraText = para.textContent;
    var selectedText = paraText.slice(startOff, endOff);
    var leadWs = selectedText.match(/^\s+/);
    var trailWs = selectedText.match(/\s+$/);
    if (leadWs) { startOff += leadWs[0].length; selectedText = selectedText.slice(leadWs[0].length); }
    if (trailWs) { endOff -= trailWs[0].length; selectedText = selectedText.slice(0, -trailWs[0].length); }
    if (selectedText.length < 3) return null;

    return {
      paraIdx: startPara,
      text: selectedText,
      before: paraText.slice(Math.max(0, startOff - CONTEXT_LEN), startOff),
      after: paraText.slice(endOff, Math.min(paraText.length, endOff + CONTEXT_LEN)),
      startOff: startOff,
      endOff: endOff,
      rect: range.getBoundingClientRect()
    };
  }

  function wrapInPara(para, startOff, endOff, markId) {
    var walker = document.createTreeWalker(para, NodeFilter.SHOW_TEXT, null);
    var pos = 0;
    var startNode = null, startNodeOff = 0;
    var endNode = null, endNodeOff = 0;
    var n;
    while ((n = walker.nextNode())) {
      var len = n.nodeValue.length;
      if (startNode === null && pos + len > startOff) {
        startNode = n;
        startNodeOff = startOff - pos;
      }
      if (pos + len >= endOff) {
        endNode = n;
        endNodeOff = endOff - pos;
        break;
      }
      pos += len;
    }
    if (!startNode || !endNode) return false;

    var range = document.createRange();
    try {
      range.setStart(startNode, startNodeOff);
      range.setEnd(endNode, endNodeOff);
    } catch (e) { return false; }

    var mark = document.createElement('mark');
    mark.className = 'ns-hl';
    mark.setAttribute('data-mark-id', markId);
    try {
      range.surroundContents(mark);
    } catch (e) {
      try {
        var frag = range.extractContents();
        mark.appendChild(frag);
        range.insertNode(mark);
      } catch (e2) { return false; }
    }
    return true;
  }

  function findInPara(para, mark) {
    var text = para.textContent;
    var full = mark.before + mark.text + mark.after;
    var idx = text.indexOf(full);
    if (idx >= 0) return { start: idx + mark.before.length, end: idx + mark.before.length + mark.text.length };
    var lead = mark.before + mark.text;
    idx = text.indexOf(lead);
    if (idx >= 0) return { start: idx + mark.before.length, end: idx + mark.before.length + mark.text.length };
    var trail = mark.text + mark.after;
    idx = text.indexOf(trail);
    if (idx >= 0) return { start: idx, end: idx + mark.text.length };
    idx = text.indexOf(mark.text);
    if (idx >= 0) return { start: idx, end: idx + mark.text.length };
    return null;
  }

  function applyNoteIndicator(mark) {
    var el = document.querySelector('mark.ns-hl[data-mark-id="' + mark.id + '"]');
    if (!el) return;
    if (mark.note && mark.note.trim()) el.setAttribute('data-has-note', 'true');
    else el.removeAttribute('data-has-note');
  }

  function renderMark(mark) {
    var para = paragraphs[mark.paraIdx];
    var ok = false;
    if (para) {
      var loc = findInPara(para, mark);
      if (loc) ok = wrapInPara(para, loc.start, loc.end, mark.id);
    }
    if (!ok) {
      for (var i = 0; i < paragraphs.length; i++) {
        if (paragraphs[i] === para) continue;
        var loc2 = findInPara(paragraphs[i], mark);
        if (loc2 && wrapInPara(paragraphs[i], loc2.start, loc2.end, mark.id)) {
          mark.paraIdx = i;
          ok = true;
          break;
        }
      }
    }
    if (ok) applyNoteIndicator(mark);
    return ok;
  }

  function unrenderMark(markId) {
    var els = document.querySelectorAll('mark.ns-hl[data-mark-id="' + markId + '"]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var parent = el.parentNode;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
      parent.normalize && parent.normalize();
    }
  }

  function renderAll() {
    var dirty = false;
    for (var i = 0; i < marks.length; i++) {
      if (!renderMark(marks[i])) dirty = true;
    }
    if (dirty) writeMarks();
  }

  function textFragmentUrl(text) {
    var url = new URL(location.href);
    url.hash = '';
    url.searchParams.delete('ref');
    var clean = text.replace(/\s+/g, ' ').trim();
    var encoded;
    if (clean.length <= 80) {
      encoded = encodeURIComponent(clean);
    } else {
      var words = clean.split(' ');
      var k = Math.min(4, words.length);
      var first = words.slice(0, k).join(' ');
      var last = words.slice(-k).join(' ');
      encoded = encodeURIComponent(first) + ',' + encodeURIComponent(last);
    }
    return url.toString() + '#:~:text=' + encoded;
  }

  function findMark(id) {
    for (var i = 0; i < marks.length; i++) if (marks[i].id === id) return marks[i];
    return null;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (e) { reject(e); }
    });
  }

  function ensurePopover() {
    if (popoverEl) return popoverEl;
    popoverEl = document.createElement('div');
    popoverEl.className = 'hl-popover';
    popoverEl.setAttribute('role', 'toolbar');
    popoverEl.innerHTML =
      '<button type="button" data-act="highlight" aria-label="Vurgula">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h3l6-6"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4z"/></svg>' +
        '<span>Vurgula</span>' +
      '</button>' +
      '<button type="button" data-act="note" aria-label="Not ekle">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4z"/></svg>' +
        '<span>Not</span>' +
      '</button>' +
      '<button type="button" data-act="copy" aria-label="Kopyala">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
        '<span>Kopyala</span>' +
      '</button>' +
      '<button type="button" data-act="share" aria-label="Paylaş">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>' +
        '<span>Paylaş</span>' +
      '</button>' +
      '<span class="hl-extra" hidden>' +
        '<span class="hl-div"></span>' +
        '<button type="button" data-act="remove" aria-label="Vurguyu kaldır">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>' +
          '<span>Kaldır</span>' +
        '</button>' +
      '</span>';
    document.body.appendChild(popoverEl);

    popoverEl.addEventListener('mousedown', function (e) {
      e.preventDefault();
    });
    popoverEl.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      handleAction(btn.getAttribute('data-act'));
    });
    return popoverEl;
  }

  function positionPopover(rect) {
    ensurePopover();
    popoverEl.classList.add('is-open');
    var pw = popoverEl.offsetWidth;
    var ph = popoverEl.offsetHeight;
    var x = rect.left + rect.width / 2 - pw / 2;
    var y = rect.top - ph - GAP;
    if (y < 8) y = rect.bottom + GAP;
    x = Math.max(8, Math.min(x, window.innerWidth - pw - 8));
    popoverEl.style.left = x + 'px';
    popoverEl.style.top = y + 'px';
  }

  function hidePopover() {
    if (popoverEl) popoverEl.classList.remove('is-open');
    pendingSel = null;
    activeMarkId = null;
  }

  function showSelectionPopover(info) {
    commitAndHideNote();
    pendingSel = info;
    activeMarkId = null;
    ensurePopover();
    popoverEl.querySelector('.hl-extra').hidden = true;
    positionPopover(info.rect);
  }

  function showMarkPopover(markId, rect) {
    commitAndHideNote();
    pendingSel = null;
    activeMarkId = markId;
    ensurePopover();
    popoverEl.querySelector('.hl-extra').hidden = false;
    positionPopover(rect);
  }

  function addMarkFromSelection() {
    if (!pendingSel) return null;
    var mark = {
      id: uuid(),
      paraIdx: pendingSel.paraIdx,
      before: pendingSel.before,
      text: pendingSel.text,
      after: pendingSel.after,
      note: '',
      ts: Date.now()
    };
    var para = paragraphs[mark.paraIdx];
    if (!para) return null;
    var ok = wrapInPara(para, pendingSel.startOff, pendingSel.endOff, mark.id);
    if (!ok) return null;
    marks.push(mark);
    writeMarks();
    updatePill();
    return mark;
  }

  function handleAction(act) {
    var mark = activeMarkId ? findMark(activeMarkId) : null;
    var quote = mark ? mark.text : (pendingSel ? pendingSel.text : '');
    var title = (document.title || 'NS Articles').replace(/\s*—\s*NS Articles\s*$/, '');

    if (act === 'highlight') {
      var m = addMarkFromSelection();
      if (m) trackEvent('highlight-add');
      hidePopover();
      try { window.getSelection().removeAllRanges(); } catch (e) {}
      return;
    }
    if (act === 'note') {
      var target = mark || addMarkFromSelection();
      hidePopover();
      try { window.getSelection().removeAllRanges(); } catch (e) {}
      if (target) {
        showNoteEditor(target);
        trackEvent(mark ? 'note-edit' : 'note-add');
      }
      return;
    }
    if (act === 'copy') {
      if (quote) copyText(quote);
      hidePopover();
      try { window.getSelection().removeAllRanges(); } catch (e) {}
      trackEvent('highlight-copy');
      return;
    }
    if (act === 'share') {
      if (!quote) return hidePopover();
      var url = textFragmentUrl(quote);
      hidePopover();
      try { window.getSelection().removeAllRanges(); } catch (e) {}
      if (window.openShare) {
        window.openShare({ url: url, title: title, quote: quote });
      }
      trackEvent('highlight-share');
      return;
    }
    if (act === 'remove' && mark) {
      unrenderMark(mark.id);
      marks = marks.filter(function (x) { return x.id !== mark.id; });
      writeMarks();
      updatePill();
      hidePopover();
      trackEvent('highlight-remove');
    }
  }

  function ensureNoteEditor() {
    if (noteEl) return noteEl;
    noteEl = document.createElement('div');
    noteEl.className = 'hl-note-editor';
    noteEl.hidden = true;
    noteEl.innerHTML =
      '<textarea placeholder="Bu vurguya bir not ekle..." rows="3"></textarea>' +
      '<div class="hl-note-actions">' +
        '<button type="button" class="hl-note-delete">Vurguyu sil</button>' +
        '<button type="button" class="hl-note-save">Kaydet</button>' +
      '</div>';
    document.body.appendChild(noteEl);

    noteEl.addEventListener('mousedown', function (e) {
      if (e.target.tagName !== 'TEXTAREA') e.preventDefault();
    });
    return noteEl;
  }

  function showNoteEditor(mark) {
    ensureNoteEditor();
    var ta = noteEl.querySelector('textarea');
    ta.value = mark.note || '';
    noteForMarkId = mark.id;

    var el = document.querySelector('mark.ns-hl[data-mark-id="' + mark.id + '"]');
    if (!el) return;
    var rect = el.getBoundingClientRect();
    noteEl.hidden = false;
    requestAnimationFrame(function () {
      noteEl.classList.add('is-open');
      var nw = noteEl.offsetWidth, nh = noteEl.offsetHeight;
      var x = Math.max(8, Math.min(rect.left, window.innerWidth - nw - 8));
      var y = rect.bottom + 8;
      if (y + nh > window.innerHeight - 8) y = Math.max(8, rect.top - nh - 8);
      noteEl.style.left = x + 'px';
      noteEl.style.top = y + 'px';
      setTimeout(function () { ta.focus(); }, 80);
    });

    noteEl.querySelector('.hl-note-save').onclick = function () {
      commitAndHideNote();
    };
    noteEl.querySelector('.hl-note-delete').onclick = function () {
      var id = noteForMarkId;
      noteForMarkId = null;
      hideNoteEditor();
      if (!id) return;
      unrenderMark(id);
      marks = marks.filter(function (x) { return x.id !== id; });
      writeMarks();
      updatePill();
      trackEvent('highlight-remove');
    };
  }

  function commitAndHideNote() {
    if (!noteEl || noteEl.hidden || !noteForMarkId) return hideNoteEditor();
    var mark = findMark(noteForMarkId);
    var ta = noteEl.querySelector('textarea');
    if (mark && ta) {
      var v = ta.value.trim();
      if ((mark.note || '') !== v) {
        mark.note = v;
        writeMarks();
        applyNoteIndicator(mark);
        updatePill();
      }
    }
    hideNoteEditor();
  }

  function hideNoteEditor() {
    if (!noteEl) return;
    noteEl.classList.remove('is-open');
    noteForMarkId = null;
    setTimeout(function () { if (noteEl) noteEl.hidden = true; }, 180);
  }

  function ensurePill() {
    if (pillEl) return pillEl;
    pillEl = document.createElement('button');
    pillEl.type = 'button';
    pillEl.className = 'hl-pill';
    pillEl.setAttribute('aria-label', 'Vurgular ve notlar');
    pillEl.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h3l6-6"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4z"/></svg>' +
      '<span class="hl-pill-text">0 vurgu</span>';
    pillEl.addEventListener('click', togglePanel);
    document.body.appendChild(pillEl);
    return pillEl;
  }

  function updatePill() {
    ensurePill();
    var count = marks.length;
    var withNotes = 0;
    for (var i = 0; i < marks.length; i++) if (marks[i].note && marks[i].note.trim()) withNotes++;
    var label = count + ' vurgu' + (withNotes > 0 ? ' · ' + withNotes + ' not' : '');
    pillEl.querySelector('.hl-pill-text').textContent = label;
    if (count > 0) {
      pillEl.classList.add('is-show');
    } else {
      pillEl.classList.remove('is-show');
      closePanel();
    }
    if (panelEl && panelEl.classList.contains('is-open')) renderPanel();
  }

  function ensurePanel() {
    if (panelEl) return panelEl;
    panelEl = document.createElement('div');
    panelEl.className = 'hl-panel';
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-label', 'Vurgular ve notlar');
    panelEl.innerHTML =
      '<p class="hl-panel-title">Vurgular &amp; notlar</p>' +
      '<div class="hl-panel-list"></div>';
    document.body.appendChild(panelEl);
    return panelEl;
  }

  function renderPanel() {
    if (!panelEl) return;
    var list = panelEl.querySelector('.hl-panel-list');
    list.innerHTML = '';
    var sorted = marks.slice().sort(function (a, b) {
      if (a.paraIdx !== b.paraIdx) return a.paraIdx - b.paraIdx;
      return a.ts - b.ts;
    });
    if (sorted.length === 0) {
      list.innerHTML = '<p class="hl-panel-empty">Henüz vurgu yok. Bir cümleyi seçince ışıltılı bir kalem belirir.</p>';
      return;
    }
    for (var i = 0; i < sorted.length; i++) {
      (function (m) {
        var item = document.createElement('div');
        item.className = 'hl-panel-item';
        item.dataset.markId = m.id;
        var textHtml = '<p class="hl-panel-item-text">' + escapeHtml(m.text) + '</p>';
        var noteHtml = m.note && m.note.trim()
          ? '<p class="hl-panel-item-note">' + escapeHtml(m.note) + '</p>'
          : '';
        item.innerHTML = textHtml + noteHtml +
          '<button type="button" class="hl-panel-item-delete" aria-label="Sil">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>' +
          '</button>';
        item.addEventListener('click', function (e) {
          if (e.target.closest('.hl-panel-item-delete')) {
            e.stopPropagation();
            unrenderMark(m.id);
            marks = marks.filter(function (x) { return x.id !== m.id; });
            writeMarks();
            updatePill();
            return;
          }
          scrollToMark(m.id);
          closePanel();
        });
        list.appendChild(item);
      })(sorted[i]);
    }
  }

  function togglePanel() {
    if (!panelEl || !panelEl.classList.contains('is-open')) openPanel();
    else closePanel();
  }

  function openPanel() {
    ensurePanel();
    renderPanel();
    panelEl.classList.add('is-open');
  }

  function closePanel() {
    if (panelEl) panelEl.classList.remove('is-open');
  }

  function scrollToMark(id) {
    var el = document.querySelector('mark.ns-hl[data-mark-id="' + id + '"]');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('is-pulse');
    setTimeout(function () { el.classList.remove('is-pulse'); }, 2400);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function onSelectionEnd() {
    clearTimeout(onSelectionEnd._t);
    onSelectionEnd._t = setTimeout(function () {
      var info = getSelectionInfo();
      if (!info) {
        if (!activeMarkId) hidePopover();
        return;
      }
      showSelectionPopover(info);
    }, 50);
  }

  function onSelectionChange() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      if (!activeMarkId) {
        clearTimeout(onSelectionChange._t);
        onSelectionChange._t = setTimeout(function () {
          var s = window.getSelection();
          if (!s || s.isCollapsed) hidePopover();
        }, 30);
      }
    }
  }

  function onDocClick(e) {
    var markEl = e.target.closest && e.target.closest('mark.ns-hl');
    if (markEl) {
      e.preventDefault();
      e.stopPropagation();
      var id = markEl.getAttribute('data-mark-id');
      var rect = markEl.getBoundingClientRect();
      showMarkPopover(id, rect);
      return;
    }
    if (popoverEl && popoverEl.contains(e.target)) return;
    if (noteEl && !noteEl.hidden && noteEl.contains(e.target)) return;
    if (panelEl && panelEl.contains(e.target)) return;
    if (pillEl && pillEl.contains(e.target)) return;
    hidePopover();
    commitAndHideNote();
    closePanel();
  }

  function onScroll() {
    hidePopover();
  }

  function init() {
    paragraphs = findParagraphs();
    if (paragraphs.length === 0) return;
    marks = readMarks();
    renderAll();
    updatePill();

    document.addEventListener('mouseup', onSelectionEnd);
    document.addEventListener('touchend', onSelectionEnd);
    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('click', onDocClick, true);
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (noteEl && !noteEl.hidden) { commitAndHideNote(); return; }
      if (panelEl && panelEl.classList.contains('is-open')) { closePanel(); return; }
      hidePopover();
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', hidePopover);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
