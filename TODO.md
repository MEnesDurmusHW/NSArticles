# TODO

## Bölüm altbaşlıkları (section sub-line) — tüm makalelere yay

Her bölüm başlığının (`<h2>`) altına, bölüme uygun bir altbaşlık eklenebilir.
Amaç: okuyucuyu içeride tutmak, makalenin değerini "satmak" (preview'ler
kaldırıldığı için bu işi artık makalenin kendisi yapmalı). Clickbait değil.

### Üç durum — her bölüm için ayrı ayrı seç

1. **Keyword** (`<p class="section-kw">`) — isimli kavram/çalışma taşıyan,
   bilim-yoğun bölümler. Sans, accent, kompakt; etiket gibi.
   Örn: `Default Mode Network · Raichle, 2001`
2. **Cümle-dek** (`<p class="section-dek">`) — somut bir payoff/ipucu olan
   bölümler. İtalik serif, sönük; altbaşlık gibi. Cevabın ucunu gösterir,
   ideal olarak ikinci bir soru değil.
   Örn: `Neden en iyi fikirler duşta gelir?`
3. **Boş** — başlık zaten güçlü/yeterli ya da içeride görsel (cascade vb.) var.
   Giriş/çerçeveleme bölümleri genelde boş kalmalı.

### Seçim ilkesi
- Başlık zaten merak sorusuysa, altbaşlık onu **tekrar etmemeli**.
- Keyword = net isimli kavram/çalışma varsa (güvenilirlik + merak).
- Cümle-dek = somut ipucu/payoff varsa.
- Hiçbiri yoksa boş bırak. **Mecbur değiliz.**
- Kurallar: em dash yok, emoji yok, tek gövde fontu, justify gövde metni.

### Stil/altyapı
- [ ] `.section-dek` ve `.section-kw` şu an `the-science-of-doing-nothing.html`
      içinde inline. Birden çok makaleye yayılınca bunları `styles.css`'e taşı
      (ortak kural), her makalede yeniden tanımlama.
- `text-wrap: balance` başlık + dek'te (2. satıra düşünce dengeli dağılım).
- Çubuk (sol accent border) KULLANMA — alıntı gibi duruyor, kaldırıldı.

### Referans (tamamlandı)
- [x] **the-science-of-doing-nothing.html** — şablon. Sonuç:
  - 01 boş · 02 boş · 03 keyword · 04 dek · 05 dek · 06 boş · 07 keyword · 08 dek

### Uygulanacak makaleler (her biri için bölüm-bölüm değerlendir)
- [ ] behavioral-economics-01.html  (h2: 9)
- [ ] brain-memory-story-machine.html  (h2: 7)
- [ ] breadcrumbing.html  (h2: 6)
- [ ] emotional-skills.html  (h2: 7)
- [ ] evolutionary-mismatch-body.html  (h2: 8)
- [ ] evolutionary-mismatch-mind.html  (h2: 5)
- [ ] evolutionary-mismatch-reality.html  (h2: 4)
- [ ] willpower-design-flaw.html  (h2: 6)

### Kapsam dışı / atla
- relationships.html — gerek yok (konu zaten merak uyandırıyor).
- illusion-of-control.html — `<h2>` bölüm yapısı yok.
- preview / listeleme / araç sayfaları (index, all, 404, carousel...) — yok.

### İş akışı (makale başına)
1. Makaleyi oku, her bölümün çekirdek kavramını/çalışmasını çıkar.
2. Her bölüm için 3 durumdan birini seç (keyword / dek / boş) + metni yaz.
3. Onay için tabloyu paylaş (keyword + dek kolonları yan yana), birlikte seç.
4. Uygula, tarayıcıda aç, gözden geçir.
