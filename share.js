/* ===========================================
   NSArticles — Share button & modal.
   - Native share sheet via Web Share API where available.
   - Fallback modal: copy link, X / WhatsApp, QR code.
   =========================================== */
(function () {
  'use strict';

  var modal = null;
  var qrRendered = false;

  function $(sel, root) { return (root || document).querySelector(sel); }

  function pageInfo() {
    var url = location.href;
    var title = document.title || 'NS Articles';
    return { url: url, title: title };
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('copy failed'));
      } catch (e) { reject(e); }
    });
  }

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Paylaş');
    modal.hidden = true;
    modal.innerHTML =
      '<div class="share-backdrop" data-close></div>' +
      '<div class="share-panel" role="document">' +
        '<button class="share-close" type="button" data-close aria-label="Kapat">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        '</button>' +
        '<h3 class="share-title">Bu yazıyı paylaş</h3>' +
        '<p class="share-page-title"></p>' +
        '<div class="share-url-row">' +
          '<input type="text" class="share-url" readonly>' +
          '<button type="button" class="share-copy">Kopyala</button>' +
        '</div>' +
        '<div class="share-actions">' +
          '<button type="button" class="share-action" data-action="native" hidden>' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/></svg>' +
            '<span>Paylaş</span>' +
          '</button>' +
          '<a class="share-action" data-action="x" target="_blank" rel="noopener noreferrer">' +
            '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' +
            '<span>X (Twitter)</span>' +
          '</a>' +
          '<a class="share-action" data-action="whatsapp" target="_blank" rel="noopener noreferrer">' +
            '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.057 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.436-9.884 9.889-9.884 2.64.001 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884zm8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.473-8.413z"/></svg>' +
            '<span>WhatsApp</span>' +
          '</a>' +
          '<button type="button" class="share-action" data-action="qr">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20v1"/></svg>' +
            '<span>QR Kod</span>' +
          '</button>' +
        '</div>' +
        '<div class="share-qr" hidden>' +
          '<div class="share-qr-frame"></div>' +
          '<p class="share-qr-hint">Telefon kameranızla okutun</p>' +
        '</div>' +
        '<p class="share-status" aria-live="polite"></p>' +
      '</div>';
    document.body.appendChild(modal);

    modal.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (!modal.hidden && e.key === 'Escape') close();
    });

    $('.share-copy', modal).addEventListener('click', function () {
      var input = $('.share-url', modal);
      copyToClipboard(input.value).then(function () {
        flash('Bağlantı kopyalandı');
        input.select();
      }, function () {
        flash('Kopyalanamadı, manuel kopyalayın');
      });
    });

    $('[data-action="native"]', modal).addEventListener('click', function () {
      var info = pageInfo();
      if (navigator.share) {
        navigator.share({ title: info.title, url: info.url }).catch(function () {});
      }
    });

    $('[data-action="qr"]', modal).addEventListener('click', function () {
      var qrBox = $('.share-qr', modal);
      qrBox.hidden = !qrBox.hidden;
      if (!qrBox.hidden && !qrRendered) renderQR();
    });

    return modal;
  }

  function flash(msg) {
    var el = $('.share-status', modal);
    if (!el) return;
    el.textContent = msg;
    clearTimeout(flash._t);
    flash._t = setTimeout(function () { el.textContent = ''; }, 2400);
  }

  function renderQR() {
    if (!window.QRCode) return;
    var info = pageInfo();
    var frame = $('.share-qr-frame', modal);
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var svg = window.QRCode.toSVG(info.url, {
      ecLevel: 'M',
      quietZone: 2,
      color: isDark ? '#e8e6e1' : '#1A1A1E',
      background: 'transparent'
    });
    frame.innerHTML = svg;
    qrRendered = true;
  }

  function open() {
    var info = pageInfo();
    ensureModal();
    $('.share-page-title', modal).textContent = info.title;
    $('.share-url', modal).value = info.url;
    var nativeBtn = $('[data-action="native"]', modal);
    nativeBtn.hidden = !navigator.share;
    var x = $('[data-action="x"]', modal);
    x.href = 'https://twitter.com/intent/tweet?text=' +
             encodeURIComponent(info.title) + '&url=' + encodeURIComponent(info.url);
    var wa = $('[data-action="whatsapp"]', modal);
    wa.href = 'https://wa.me/?text=' + encodeURIComponent(info.title + ' — ' + info.url);
    $('.share-qr', modal).hidden = true;
    qrRendered = false;
    $('.share-status', modal).textContent = '';
    modal.hidden = false;
    document.documentElement.classList.add('share-open');
    setTimeout(function () { modal.classList.add('is-open'); }, 10);
  }

  function close() {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('share-open');
    setTimeout(function () { modal.hidden = true; }, 200);
  }

  window.openShare = function () {
    var info = pageInfo();
    // On mobile / supported browsers, prefer the native sheet directly.
    if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      navigator.share({ title: info.title, url: info.url }).catch(function () { open(); });
      return;
    }
    open();
  };
})();
