// NS Articles — article metadata for carousel generation.
// To add a new article, append a new entry to NS_ARTICLES with:
//   slug:       filename without .html (used for export filenames)
//   title:      hero title
//   subtitle:   hero sub
//   sections:   ordered list of { num, heading, key }
//     - num:     section number (shown as "BÖLÜM 01")
//     - heading: the original question/section title (shown as caption)
//     - key:     one-line punchy takeaway (the visual hero of the slide)
//   quotes:     optional array of pull-quote slides interleaved between sections
//     - text:        the quote body
//     - attribution: optional source line (e.g. "Sonuç bölümünden")
//     - after:       0-based section index after which the quote appears
//                    (e.g. after: 2 places it between section 03 and section 04)
//   conclusion: single short paragraph to use as outro
//   cta:        final slide content. Either:
//                 - string → used as big body, title defaults to "OKUMAK İÇİN"
//                 - { title, body, footer } → three-tier layout:
//                     title  = small eyebrow (uppercase sans)
//                     body   = big brand / hero line
//                     footer = optional small muted tagline below

window.NS_ARTICLES = [
  {
    slug: 'the-science-of-doing-nothing',
    title: 'Hiçbir şey yapmamak, yapabileceğin en verimli şey olabilir.',
    subtitle: 'Beyin bilimi, psikoloji ve tıp araştırmalarının "boş vakit" hakkında söyledikleri.',
    sections: [
      {
        num: '01',
        heading: 'Sürekli kendini geliştirmek gerçekten işe yarıyor mu?',
        key: 'Durmak bilmeyen çaba, bir noktadan sonra geri tepiyor.',
      },
      {
        num: '02',
        heading: 'En son ne zaman hiçbir şey yapmadan durdun?',
        key: 'Her boş anı doldurduğunda, beynin yaratıcı modu hiç açılmıyor.',
      },
      {
        num: '03',
        heading: 'Beyin boşken gerçekten hiçbir şey yapmıyor mu?',
        key: 'Sen boşta sanırken beynin en kritik işini yapıyor: Default Mode Network.',
      },
      {
        num: '04',
        heading: 'Boş kalmak bize ne kazandırıyor?',
        key: 'En iyi fikirler duşta geliyorsa, bu tesadüf değil.',
      },
      {
        num: '05',
        heading: 'Sıkılmaktan neden bu kadar korkuyoruz?',
        key: 'Sıkılma zaman kaybı değil, yaratıcılığın başlangıcı.',
      },
      {
        num: '07',
        heading: 'Her işi planlamak neden geri teper?',
        key: 'Sevdiğin şeyi takvime yazdığın an, ödeve dönüşür.',
      },
    ],
    quotes: [
      {
        text: 'Beyin boşken sessiz değil; dağınık masasını toparlayan biri gibi.',
        attribution: 'Bölüm 03 · Default Mode Network',
        after: 2,
      },
    ],
    conclusion: 'Her şeyi bırakmak değil, her şeyin arasına biraz boşluk bırakmak. O boşluk kayıp zaman değil; belki de günün en değerli kısmı.',
    cta: {
      title: 'OKUMAK İÇİN',
      body: 'NS Articles',
      footer: 'Tam metin ve kaynaklar sitede.',
    },
  },
];
