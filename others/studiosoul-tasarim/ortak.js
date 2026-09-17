/* ============================================================
   ORTAK.JS — sunum yardımcıları
   1. Şablonlardan 8 ekranlık karuseli kurar
   2. Klavye (← → Home End 1-8 T), oklar, noktalar, tema anahtarı
   3. Durum çubuğu, home göstergesi, alt menü (6 sekme, sırası sabit)
   4. Düello süre göstergesini gerçekten geri saydırır
   Tasarım kararı içermez; görünüm tamamen her yönün CSS'inden gelir.

   Sayfa şunu tanımlar:
     window.EKRANLAR = [[sablonId, baslik, aciklama], ...]
   ============================================================ */
(function () {
  'use strict';

  /* ---------- ikonlar (tek çizgi seti; dolgu/kalınlık CSS'ten) ---------- */
  var IK = {
    derslerim: '<rect x="2.5" y="4.5" width="19" height="15" rx="3"/><path d="M10 9.4v5.2l4.4-2.6z" class="ik-dolgu"/>',
    quiz:      '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M9.2 9.3a2.8 2.8 0 1 1 3.4 2.75c-.5.12-.8.55-.8 1.05v.6"/><circle cx="11.8" cy="16.7" r="1" class="ik-dolgu"/>',
    muzik:     '<path d="M9 17.5V6.2l10-1.9v11"/><circle cx="6.6" cy="17.6" r="2.6" class="ik-dolgu"/><circle cx="16.6" cy="15.7" r="2.6" class="ik-dolgu"/>',
    etkinlik:  '<rect x="3.2" y="5" width="17.6" height="15.2" rx="3"/><path d="M3.2 9.6h17.6M8 3.2v3.4M16 3.2v3.4"/>',
    siralama:  '<rect x="3.4" y="12.4" width="4.6" height="7.8" rx="1.4"/><rect x="9.7" y="7.2" width="4.6" height="13" rx="1.4"/><rect x="16" y="10" width="4.6" height="10.2" rx="1.4"/>',
    profilim:  '<circle cx="12" cy="8.2" r="3.7"/><path d="M4.9 20.1c.5-3.6 3.5-5.7 7.1-5.7s6.6 2.1 7.1 5.7"/>'
  };

  var SEKME = [
    ['derslerim', 'Derslerim'],
    ['quiz',      'Quiz'],
    ['muzik',     'Müzik'],
    ['etkinlik',  'Etkinlik'],
    ['siralama',  'Sıralama'],
    ['profilim',  'Profilim']
  ];

  function svg(inner, cls) {
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
           'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  }

  /* ---------- durum çubuğu içeriği ---------- */
  var DURUM =
    '<span>9:41</span>' +
    '<span class="sag">' +
      '<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true">' +
        '<rect x="0" y="8" width="3" height="4" rx="1"/><rect x="4.4" y="5.6" width="3" height="6.4" rx="1"/>' +
        '<rect x="8.8" y="3" width="3" height="9" rx="1"/><rect x="13.2" y="0" width="3" height="12" rx="1"/>' +
      '</svg>' +
      '<svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true">' +
        '<path d="M8 11.4 5.5 8.6a3.8 3.8 0 0 1 5 0L8 11.4Z"/>' +
        '<path d="M2.6 5.6a8.2 8.2 0 0 1 10.8 0l-1.5 1.7a6 6 0 0 0-7.8 0L2.6 5.6Z" opacity=".95"/>' +
        '<path d="M.3 2.9a11.6 11.6 0 0 1 15.4 0L14.2 4.6a9.4 9.4 0 0 0-12.4 0L.3 2.9Z" opacity=".95"/>' +
      '</svg>' +
      '<svg width="26" height="13" viewBox="0 0 26 13" fill="none" aria-hidden="true">' +
        '<rect x=".7" y=".7" width="21" height="11.6" rx="3.4" stroke="currentColor" stroke-opacity=".38" stroke-width="1.1"/>' +
        '<rect x="2.4" y="2.4" width="15.4" height="8.2" rx="2.1" fill="currentColor"/>' +
        '<path d="M23.4 4.4c1.1.5 1.1 3.7 0 4.2V4.4Z" fill="currentColor" fill-opacity=".45"/>' +
      '</svg>' +
    '</span>';

  var OK_SOL   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5 8 12l7 7"/></svg>';
  var OK_SAG   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>';
  var Z_EKSI   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M5 12h14"/></svg>';
  var Z_ARTI   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';

  /* ---------- durum ---------- */
  var ray, kutular = [], aktif = 0, tema = 'acik';
  var elSayacAd, elSayacNo, elSol, elSag, elNoktalar, elTemaBtn = {};
  var elZEksi, elZArti, elZOran;

  var OLCEK_MIN = 0.34, OLCEK_MAX = 1.5;
  var olcek = 1;
  var elle = false;   /* kullanıcı boyutu kendi seçtiyse otomatik sığdırma karışmaz */

  /* ============================================================
     1. Karuseli kur
     ============================================================ */
  function karuseliKur() {
    ray = document.getElementById('raylar');
    if (!ray || !window.EKRANLAR) return false;

    tema = document.body.dataset.tema || 'acik';

    window.EKRANLAR.forEach(function (e, i) {
      var sablon = document.getElementById(e[0]);
      if (!sablon) return;

      var kutu = document.createElement('div');
      kutu.className = 'ekran-kutu';
      kutu.innerHTML =
        '<div class="telefon-yuva"><div class="telefon"><div class="ekran ' + tema + '"></div></div></div>' +
        '<p class="ekran-etiket"><i>' + String(i + 1).padStart(2, '0') + '</i>' +
        '<b>' + e[1] + '</b>' + (e[2] || '') + '</p>';
      kutu.querySelector('.ekran').appendChild(sablon.content.cloneNode(true));
      ray.appendChild(kutu);
      kutular.push(kutu);
    });
    return kutular.length > 0;
  }

  /* ============================================================
     2. Kumanda çubuğu
     ============================================================ */
  function kumandaKur() {
    var k = document.getElementById('kumanda');
    if (!k) return;

    k.innerHTML =
      '<span class="k-sayac"><b id="k-ad"></b><span id="k-no"></span></span>' +
      '<span class="k-noktalar" id="k-noktalar" role="tablist" aria-label="Ekranlar"></span>' +
      '<span class="k-ipucu"><kbd>←</kbd><kbd>→</kbd> ekran<span style="opacity:.45">·</span>' +
        '<kbd>+</kbd><kbd>−</kbd> boyut<span style="opacity:.45">·</span><kbd>T</kbd> tema</span>' +
      '<span class="k-zoom" role="group" aria-label="Boyut">' +
        '<button type="button" id="k-eksi" aria-label="Küçült">' + Z_EKSI + '</button>' +
        '<button class="oran" type="button" id="k-oran" title="Ekrana sığdır">100%</button>' +
        '<button type="button" id="k-arti" aria-label="Büyüt">' + Z_ARTI + '</button>' +
      '</span>' +
      '<span class="k-tema" role="group" aria-label="Tema">' +
        '<button type="button" id="k-acik">Açık</button>' +
        '<button type="button" id="k-koyu">Koyu</button>' +
      '</span>' +
      '<span class="k-oklar">' +
        '<button class="k-ok" type="button" id="k-sol" aria-label="Önceki ekran">' + OK_SOL + '</button>' +
        '<button class="k-ok" type="button" id="k-sag" aria-label="Sonraki ekran">' + OK_SAG + '</button>' +
      '</span>';

    elSayacAd  = document.getElementById('k-ad');
    elSayacNo  = document.getElementById('k-no');
    elSol      = document.getElementById('k-sol');
    elSag      = document.getElementById('k-sag');
    elNoktalar = document.getElementById('k-noktalar');
    elZEksi    = document.getElementById('k-eksi');
    elZArti    = document.getElementById('k-arti');
    elZOran    = document.getElementById('k-oran');
    elTemaBtn.acik = document.getElementById('k-acik');
    elTemaBtn.koyu = document.getElementById('k-koyu');

    elZEksi.addEventListener('click', function () { elleOlcek(olcek - 0.1); });
    elZArti.addEventListener('click', function () { elleOlcek(olcek + 0.1); });
    elZOran.addEventListener('click', function () { sigdir(); });

    elNoktalar.innerHTML = kutular.map(function (_, i) {
      return '<button class="k-nokta" type="button" role="tab" data-i="' + i + '" ' +
             'aria-label="' + (i + 1) + '. ekran"></button>';
    }).join('');

    elNoktalar.addEventListener('click', function (ev) {
      var b = ev.target.closest('.k-nokta');
      if (b) git(parseInt(b.dataset.i, 10));
    });
    elSol.addEventListener('click', function () { git(aktif - 1); });
    elSag.addEventListener('click', function () { git(aktif + 1); });
    elTemaBtn.acik.addEventListener('click', function () { temaAyarla('acik'); });
    elTemaBtn.koyu.addEventListener('click', function () { temaAyarla('koyu'); });

    temaAyarla(tema, true);
    tazele();
  }

  function git(i, ani) {
    i = Math.max(0, Math.min(kutular.length - 1, i));
    kutular[i].scrollIntoView({ behavior: ani ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
    aktif = i;
    tazele();
  }

  /* ---------- boyut ---------- */
  function olcekAyarla(v, sessiz) {
    olcek = Math.min(OLCEK_MAX, Math.max(OLCEK_MIN, Math.round(v * 100) / 100));
    document.documentElement.style.setProperty('--olcek', olcek);
    if (elZOran) elZOran.textContent = Math.round(olcek * 100) + '%';
    if (elZEksi) elZEksi.disabled = olcek <= OLCEK_MIN + 0.001;
    if (elZArti) elZArti.disabled = olcek >= OLCEK_MAX - 0.001;
    /* ölçek değişince aktif kart ortada kalsın */
    if (!sessiz && kutular.length) requestAnimationFrame(function () { git(aktif, true); });
  }

  /* kullanıcı eliyle büyüttü/küçülttü: bundan sonra otomatik sığdırma karışmaz */
  function elleOlcek(v) {
    elle = true;
    olcekAyarla(v);
    try { localStorage.setItem('vd-olcek', String(olcek)); } catch (e) {}
  }

  /* pencereye sığdır: telefon tamamen görünsün */
  function sigdir() {
    elle = false;
    try { localStorage.removeItem('vd-olcek'); } catch (e) {}
    var kumandaY = 92;
    var etiketY  = 44;
    var bosluk   = 30;
    var y = (window.innerHeight - kumandaY - etiketY - bosluk) / 860;
    var x = ((ray ? ray.clientWidth : window.innerWidth) - 40) / 406;
    olcekAyarla(Math.min(y, x, 1.2));
  }

  function tazele() {
    var e = window.EKRANLAR[aktif] || ['', '', ''];
    if (elSayacAd) elSayacAd.textContent = e[1];
    if (elSayacNo) elSayacNo.textContent = (aktif + 1) + ' / ' + kutular.length;
    if (elSol) elSol.disabled = aktif === 0;
    if (elSag) elSag.disabled = aktif === kutular.length - 1;

    kutular.forEach(function (k, i) { k.classList.toggle('aktif', i === aktif); });
    if (elNoktalar) {
      Array.prototype.forEach.call(elNoktalar.children, function (n, i) {
        n.setAttribute('aria-current', i === aktif ? 'true' : 'false');
      });
    }
  }

  function temaAyarla(yeni, sessiz) {
    tema = yeni;
    document.querySelectorAll('.ekran').forEach(function (el) {
      el.classList.toggle('acik', yeni === 'acik');
      el.classList.toggle('koyu', yeni === 'koyu');
    });
    if (elTemaBtn.acik) {
      elTemaBtn.acik.setAttribute('aria-pressed', String(yeni === 'acik'));
      elTemaBtn.koyu.setAttribute('aria-pressed', String(yeni === 'koyu'));
    }
    if (!sessiz) { /* tema değişince başka bir şey gerekmiyor */ }
  }

  /* ---------- kaydırmayı izle: ortaya en yakın kart aktif ---------- */
  function kaydirmaIzle() {
    if (!ray) return;
    var bekliyor = false;
    ray.addEventListener('scroll', function () {
      if (bekliyor) return;
      bekliyor = true;
      requestAnimationFrame(function () {
        bekliyor = false;
        var merkez = ray.scrollLeft + ray.clientWidth / 2;
        var enIyi = 0, enKisa = Infinity;
        kutular.forEach(function (k, i) {
          var m = k.offsetLeft + k.offsetWidth / 2;
          var d = Math.abs(m - merkez);
          if (d < enKisa) { enKisa = d; enIyi = i; }
        });
        if (enIyi !== aktif) { aktif = enIyi; tazele(); }
      });
    }, { passive: true });
  }

  /* ---------- klavye ---------- */
  function klavyeKur() {
    document.addEventListener('keydown', function (ev) {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      var hedef = ev.target;
      if (hedef && /^(input|textarea|select)$/i.test(hedef.tagName)) return;

      if (ev.key === 'ArrowRight')      { ev.preventDefault(); git(aktif + 1); }
      else if (ev.key === 'ArrowLeft')  { ev.preventDefault(); git(aktif - 1); }
      else if (ev.key === 'Home')       { ev.preventDefault(); git(0); }
      else if (ev.key === 'End')        { ev.preventDefault(); git(kutular.length - 1); }
      else if (ev.key === 't' || ev.key === 'T' || ev.key === 'g' || ev.key === 'G') {
        ev.preventDefault(); temaAyarla(tema === 'acik' ? 'koyu' : 'acik');
      }
      else if (ev.key === '+' || ev.key === '=') { ev.preventDefault(); elleOlcek(olcek + 0.1); }
      else if (ev.key === '-' || ev.key === '_') { ev.preventDefault(); elleOlcek(olcek - 0.1); }
      else if (ev.key === '0') { ev.preventDefault(); sigdir(); }
      else if (/^[1-9]$/.test(ev.key)) { ev.preventDefault(); git(parseInt(ev.key, 10) - 1); }
    });
  }

  /* ============================================================
     3. Ekran içi kurulum
     ============================================================ */
  function ekranlariKur() {
    document.querySelectorAll('.ekran').forEach(function (ekran) {
      if (!ekran.querySelector('.durum')) {
        var d = document.createElement('div');
        d.className = 'durum';
        d.innerHTML = DURUM;
        ekran.appendChild(d);
      }
      if (!ekran.querySelector('.home-bar')) {
        var h = document.createElement('div');
        h.className = 'home-bar';
        ekran.appendChild(h);
      }
    });

    document.querySelectorAll('.tab-bar').forEach(function (bar) {
      if (bar.childElementCount) return;
      var secili = bar.dataset.secili || 'quiz';
      bar.setAttribute('role', 'tablist');
      bar.innerHTML = SEKME.map(function (s) {
        var a = s[0] === secili;
        return '<span class="tab' + (a ? ' secili' : '') + '" role="tab"' + (a ? ' aria-selected="true"' : '') + '>' +
               svg(IK[s[0]]) + '<span>' + s[1] + '</span><i class="tab-im" aria-hidden="true"></i></span>';
      }).join('');
    });
  }

  /* ============================================================
     4. Düello süre sayacı
     Eşikler brief'ten: 15 sn soru, 7 sn altı turuncu, 3 sn altı kırmızı.
     ============================================================ */
  function sureleriBaslat() {
    var yavas = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('[data-sure]').forEach(function (kok) {
      var bar    = kok.querySelector('.sure-dolu');
      var yazi   = kok.querySelector('.sure-yazi');
      var toplam = parseFloat(kok.dataset.sure) || 15;
      var kalan  = parseFloat(kok.dataset.baslangic || toplam);

      /* gösterge iki biçimde olabilir: düz çubuk (genişlik) ya da SVG yayı */
      var yay = 0;
      if (bar && window.SVGElement && bar instanceof SVGElement && bar.getTotalLength) {
        yay = bar.getTotalLength();
        bar.style.strokeDasharray = yay;
      }

      function ciz() {
        var tam  = Math.max(0, Math.ceil(kalan));
        var oran = Math.max(0, kalan) / toplam;
        if (bar) {
          if (yay) bar.style.strokeDashoffset = yay * (1 - oran);
          else     bar.style.width = (oran * 100) + '%';
        }
        if (yazi) yazi.textContent = tam + ' saniye';
        kok.classList.toggle('sure-uyari',  kalan < 7 && kalan >= 3);
        kok.classList.toggle('sure-kritik', kalan < 3);
      }

      ciz();
      if (yavas) return;
      setInterval(function () {
        kalan -= 0.1;
        if (kalan <= 0) kalan = toplam;   /* sunum için döngüye alır */
        ciz();
      }, 100);
    });

    document.querySelectorAll('[data-rakip-durum]').forEach(function (el) {
      var ad = el.dataset.rakipDurum, i = 0;
      setInterval(function () {
        i ^= 1;
        el.classList.toggle('cevapladi', !!i);
        var t = el.querySelector('.rakip-yazi');
        if (t) t.textContent = i ? ad + ' cevapladı' : ad + ' düşünüyor';
      }, 4200);
    });
  }

  /* ============================================================ */
  function kur() {
    if (karuseliKur()) {
      kumandaKur();
      kaydirmaIzle();
      klavyeKur();

      /* açılışta ekrana sığdır; kullanıcı daha önce eliyle bir boyut seçtiyse onu koru */
      var kayitli = null;
      try { kayitli = localStorage.getItem('vd-olcek'); } catch (e) {}
      if (kayitli) { elle = true; olcekAyarla(parseFloat(kayitli), true); }
      else sigdir();

      /* pencere boyutu değişince kendiliğinden yeniden sığdır */
      var zaman;
      window.addEventListener('resize', function () {
        clearTimeout(zaman);
        zaman = setTimeout(function () {
          if (elle) git(aktif, true);
          else sigdir();
        }, 160);
      });
    }
    ekranlariKur();
    sureleriBaslat();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();
})();
