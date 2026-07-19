# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NSArticles is a static HTML article site. No build tools, no frameworks, no package manager — just standalone `.html` files served directly. Each article has inline `<style>` and (where needed) inline `<script>`, but shares common styles via `styles.css` and theme logic via `theme.js`.

## Architecture

- **`index.html`** — Public-facing curated landing page (the only listing external readers should see)
- **`all.html`** — Private archive for the site owner and close friends only; lists every article including previews
- **`styles.css`** — Shared CSS: theme variables (light/dark), reset, grain overlay, theme toggle, share toggle, share modal, divider, home logo
- **`theme.js`** — Dark/light mode toggle with localStorage persistence and system preference detection
- **`share.js`** — Share button + modal (Web Share API, copy link, X, WhatsApp, QR code fallback). `openShare()` shares the page; `openShare({url, title})` or `openShareSection(btn)` shares a specific section. Modal handlers read from the active info, so per-section shares populate the correct URL, X/WhatsApp links, and QR code. Also fires GoatCounter events: `share-page` for the top-right button, `share-section-{id}` for per-heading buttons
- **`analytics.js`** — Scroll-depth tracker. Fires GoatCounter events at 25/50/75/100% page scroll thresholds (`scroll-25`, `scroll-50`, etc.). Loaded only on article pages (not on `index.html`, `all.html`, `404.html`, or carousel utility pages)
- **`toc.js`** — Table of Contents behavior. Mobile drawer toggle, scroll-spy active state for level-1 and level-2 entries, auto expand/collapse of nested children, Esc-to-close. Silently no-ops on pages without a `#toc-rail`. CSS for the rail/drawer lives in `styles.css`
- **`favicon.svg`** — Single SVG favicon at the repo root, accent-colored rounded square with "NS" mark. Uses `prefers-color-scheme` inside the SVG so it adapts to the browser's tab theme
- **`og-default.png`** — 1200×630 Open Graph image used as the social-share preview for every page. Branded NS Articles cover. Source design lives in `og-default.svg`; the PNG is what social platforms fetch (WhatsApp does not render SVG)
- **`tooltip.js`** — Term glossary tooltips. Hover-on-desktop / tap-to-toggle-on-mobile behavior for inline `<span class="term">` glossary terms. CSS for `.term`/`.term-tip` lives in `styles.css`. Silently no-ops on pages without `.term` spans (see *Term Glossary Tooltips*)
- **Article pages** — Each article is one HTML file at the repo root with page-specific inline styles that use CSS variables from `styles.css`

## Theme System

Light mode is the default. Dark mode is toggled via a fixed button (top-right, moon/sun icon). Theme preference is saved in `localStorage` under `ns-theme`.

| Mode | `--bg` | `--accent` |
|------|--------|------------|
| Light | `#FAF7F2` | `#96622F` |
| Dark | `#0f1117` | `#c4956a` |

Fonts (both modes): `--serif`: Playfair Display, `--sans`: DM Sans. Some pages override body font (e.g., Source Sans 3, Source Serif 4).

## Conventions

- **Language**: All article content is in Turkish (`lang="tr"`)
- **Sections**: Articles use numbered sections (`01`, `02`, `03`...) with serif headings
- **Responsive breakpoints**: 768px (tablet), 480px (mobile), 360px (very small)
- **Grain overlay**: `.grain` div is on every page, auto-visible only in dark mode
- **Feedback**: Articles end with a feedback section linking to a Google Form
- **References**: Articles use `<a class="ref">` footnote links with a JS-powered back-navigation FAB button (`savePos`/`goBack`). Inline reference numbers must NOT have square brackets — use `1` not `[1]`. The references list at the end of the article is **auto-collapsed** by `references.js` — see *Collapsable References*
- **References heading wording**: The visible heading for the reference list is **always "Kaynakça"**, never "Kaynaklar". The site uses numbered inline citations (`1`, `2`, …) each mapped to a matching entry in the list, and the standard Turkish heading for that pattern is "Kaynakça". Applies to the `<h2>`/`<h3>` heading text and the matching TOC `toc-title`. (The section's `id` may stay `kaynaklar` — it is an invisible anchor, not displayed text.)
- **Per-section share**: Each `<h2>` in an article body must end with `<button class="heading-share" type="button" aria-label="Bu bölümü paylaş" onclick="openShareSection(this)">…three-dot share SVG…</button>` and have an `id` (so `openShareSection` can build the anchor URL). The button is hidden on desktop and revealed on heading hover; on touch devices it stays visible at low opacity. Skip on listing pages and tooling pages (`index.html`, `all.html`, `404.html`, carousel pages)
- **No em dashes**: Never use the em dash character (—) in article content or any user-facing text. Restructure the sentence, use a comma, or use a period instead
- **One body font per article**: Pick a single body font (`var(--sans)` or one explicit serif) and use it consistently across ALL body content of that article: hero subtitle, intro paragraphs, sections, sidebars, quiz/interactive blocks, callouts, post-quiz continuation, footer text. Headings can use `var(--serif)` (Playfair) and small UI labels can use a mono font, but body copy must not switch fonts mid-article. If you load a font in the `<link>` tag, every place it appears must follow the same rule
- **Justified body text**: All body paragraphs in articles must use `text-align: justify`. Apply it to every paragraph container in the article, including quiz/interactive blocks and post-quiz continuation sections. Do NOT justify hero subtitles, captions, list items, or single-line UI text
- **Text contrast**: `--text-muted` (#9E9A92 light) is only ~2.7:1 on the cream background — too light to read. Use it ONLY for tiny decorative labels (reading-time stamps, counts, eyebrows). Any text meant to actually be read — subtitles, descriptive phrases, captions, ledes, body copy — must use at least `--text-dim` (#6B665E, ~5:1). For longer or italic serif passages (e.g. hero ledes), go darker still (`#4A443C` light / `#c2bfb8` dark). When unsure, go darker. Same logic in dark mode: don't put readable text in `--text-muted` (#555a66)

## Page Chrome

Every page (article, gallery, preview) must include the same top-right toolbar and bottom-center signature.

**Top-left button** (fixed, single button):

- **Home toggle**: `<a class="home-toggle" href="index.html" aria-label="Ana sayfaya dön">NS</a>` — sticky serif "NS" mark that returns to the landing page. Use `href="../index.html"` from subdirectories. Styles live in `styles.css`. Skip on `index.html` itself and on pure tooling pages (`article-carousel.html`, `carousel-generator.html`).

**Top-right toolbar** (fixed, right-to-left in this order):

1. **Theme toggle**: `<button class="theme-toggle" onclick="toggleTheme()" aria-label="Tema değiştir">` with moon + sun SVGs. Requires `<script src="theme.js"></script>` in `<head>`.
2. **Share toggle**: `<button class="share-toggle" onclick="openShare()" aria-label="Bu sayfayı paylaş" type="button">` with the three-dot share SVG (placed immediately after `theme-toggle`). Requires `<script src="share.js" defer></script>` in `<head>`. Styles already live in `styles.css`; `share.js` auto-creates the modal on first open.

**Favicon** (in `<head>` of every page): `<link rel="icon" type="image/svg+xml" href="favicon.svg">` (use `../favicon.svg` from subdirectories).

**Open Graph / social previews** (in `<head>` of every page) — required for WhatsApp, X, LinkedIn, Telegram, Slack link previews:

```html
<meta name="description" content="{page description}">
<meta property="og:type" content="article">          <!-- "website" for index/all/404/templates index -->
<meta property="og:site_name" content="NS Articles">
<meta property="og:locale" content="tr_TR">
<meta property="og:title" content="{page title}">
<meta property="og:description" content="{page description}">
<meta property="og:url" content="https://menesdurmushw.github.io/NSArticles/{path}">
<meta property="og:image" content="https://menesdurmushw.github.io/NSArticles/og-default.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="NS Articles">
<meta name="twitter:card" content="summary_large_image">
```

Rules: `og:url` and `og:image` must be absolute (full `https://...`). WhatsApp ignores SVG — keep `og:image` pointing to the PNG. WhatsApp caches scraped previews for ~7 days; if you change a page's OG meta, force a refetch via `https://developers.facebook.com/tools/debug/`. Per-article values: take `og:title` from the page `<title>` (drop the " — NS Articles" suffix) and `og:description` from the hero subtitle / lede.

**Bottom-center signature** (except `index.html`), before `</body>`:

1. **Home logo**: `<a href="index.html" class="home-logo"><span>NS Articles</span></a>` — navigates back to the landing page
2. **Author credit**: `by M. Enes Durmuş` — displayed below or alongside the home logo

Pages in subdirectories (e.g. `templates/`) use `../theme.js`, `../share.js`, `../styles.css`, `../index.html` for the home logo.

Utility/tooling pages (e.g. `article-carousel.html`, `carousel-generator.html`) do not need the share button.

## Development

Open any `.html` file directly in a browser — no server or build step required. For live reload during development, any static file server works (e.g., `python3 -m http.server`).

## Listing Pages

- **`index.html`** is the only public-facing landing page. All external readers, social shares, in-article navigation, and the home toggle (`NS` mark, top-left) must point here. Curated; only selected articles appear; no "Preview" suffix in card titles
- **`all.html`** is a private/internal archive for the site owner and close friends. It lists every article including previews and tooling pages. **Do NOT direct external readers here** — no in-article links, continuation cards, footer logos, or share suggestions should point to `all.html`. Use it as a personal index only
- Both pages: still receive new article entries when adding articles, but `all.html` is the master archive while `index.html` is the curated public face

## Adding a New Article

1. Create a new `.html` file at the repo root
2. Use one of the existing articles as a template
3. In `<head>`: load `<script src="theme.js"></script>`, `<script src="share.js" defer></script>`, `<script src="analytics.js" defer></script>`, `<script src="toc.js" defer></script>`, `<script src="tooltip.js" defer></script>`, `<link rel="icon" type="image/svg+xml" href="favicon.svg">`, the Open Graph block (see Page Chrome), `<link rel="stylesheet" href="styles.css">`, and the GoatCounter snippet right before `</head>` (see Analytics)
4. In `<body>`: add the grain overlay, home toggle (top-left), theme toggle and share toggle (top-right), and home logo + author credit at the bottom
5. Add a card entry in `all.html` (and `index.html` if curated) inside the `.articles` div — do NOT append "Preview" to the card title in `all.html`
6. For full articles only: compute word count + reading time and add `<meta name="word-count">` / `<meta name="reading-time">` to the article's `<head>`, plus the visible `~X dk` element on its listing card(s) (see *Reading Time*)
7. **Open the new file in the browser** (`open <file>.html`) so the user can immediately review it

## Table of Contents

Every article with `<h2>` sections gets a sticky TOC. On desktop (≥1200px) it renders as a left-edge rail with thin markers and active-section scroll-spy. On mobile it collapses into a drawer behind a hamburger button placed in the top-left (next to the home toggle). Backdrop tap, Esc key, or any in-rail link click closes the drawer on mobile.

**Required pieces on each TOC-enabled article**:

1. `<script src="toc.js" defer></script>` in `<head>` (already part of the standard chrome listed in *Adding a New Article*)
2. The toggle button + backdrop + nav rail markup, inserted right after the `share-toggle` button:

```html
<button class="toc-toggle" onclick="toggleToc()" aria-label="İçindekiler" aria-expanded="false" type="button">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="4" y1="7" x2="20" y2="7"/>
    <line x1="4" y1="12" x2="20" y2="12"/>
    <line x1="4" y1="17" x2="14" y2="17"/>
  </svg>
</button>

<div class="toc-backdrop" onclick="closeToc()" aria-hidden="true"></div>

<nav class="toc-rail" id="toc-rail" aria-label="İçindekiler">
  <div class="toc-list">
    <a href="#h01" class="toc-row toc-level-1">
      <span class="toc-marker"></span>
      <span class="toc-num">01</span>
      <span class="toc-title">Section title</span>
    </a>
    <!-- repeat for each h2 -->
  </div>
</nav>
```

**Entry rules**:
- `href` points to the anchor id of the heading or its wrapping section (`#h01`, `#s01`, etc. — whatever id exists on the target element)
- `toc-num` is a short label like `01`, `02`. Use `·` for an unnumbered closing section like *Kapanış*
- `toc-title` should be a *shortened* version of the full `<h2>` text. Long titles truncate with ellipsis, so prefer 1-3 words that capture the section's gist. Look at `willpower-design-flaw.html` for examples
- For nested sub-sections (`<h3 class="sub-heading">`), wrap the parent level-1 entry as `toc-has-children`, attach a chevron, and add a sibling `<div class="toc-children" data-parent="...">` containing `toc-level-2` entries. Scroll-spy auto-expands the active section's children
- Optional `<div class="toc-group-label">…</div>` rows inside `toc-children-inner` create italic group headings within nested sub-sections

**Skip TOC on**:
- Listing pages: `index.html`, `all.html`
- Utility pages: `404.html`, `article-carousel.html`, `carousel-generator.html`
- Preview pages and any article without `<h2>` sections (nothing meaningful to point at)

`toc.js` silently no-ops when `#toc-rail` is absent, so loading the script on a non-TOC page is harmless but unnecessary.

## Analytics

The site uses [GoatCounter](https://www.goatcounter.com/) — privacy-friendly, no cookies, no banner required. Dashboard: `nsdurmus.goatcounter.com`.

**Tracker snippet** (required on EVERY page, including listing and utility pages, placed right before `</head>`):

```html
<script data-goatcounter="https://nsdurmus.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
```

**Custom events fired by the site**:
- `share-page` — top-right share button click
- `share-section-{id}` — per-heading share button click (the `id` is the `<h2>`'s id attribute)
- `scroll-25`, `scroll-50`, `scroll-75`, `scroll-100` — reader passes scroll-depth threshold (article pages only)

**Self-exclusion**:
- IP filter: GoatCounter dashboard → Settings → Ignore IPs
- Per-device flag: visit `https://menesdurmushw.github.io/NSArticles/?skipgc=t` once on each browser. `all.html` exposes a discreet "İzlemeyi kapat" link near the home logo for this purpose

**Skip `analytics.js`** on `index.html`, `all.html`, `404.html`, and tooling pages (`article-carousel.html`, `carousel-generator.html`). The GoatCounter pageview tracker must still be present on all of them.

## Reading Time

Every **full** article (not preview / not utility page) carries two metadata tags in its `<head>`, inserted right after `<meta name="description">`:

```html
<meta name="word-count" content="2653">
<meta name="reading-time" content="12">
```

`reading-time` is in whole minutes, computed at **220 words per minute** (Turkish reader pace) and rounded to nearest, floored at 1. Word counting excludes `<head>`, scripts, styles, comments, and the standard chrome blocks (`toc-rail`, `share-toggle`, `theme-toggle`, `home-toggle`, `home-logo`, `grain`, `back-fab`, `references`, `feedback`, `track-optout`). The values are not user-visible on the article page itself — they're just baked-in source-of-truth data that `view-source` reveals.

**Listing pages** surface the reading time on cards:

- `all.html` cards use `<span class="read-time">12 dk</span>`, inserted after `<p class="desc">` and before `<span class="arrow">`. Style: 12px, `var(--text-muted)`, `margin-top: 14px`. Only cards that link directly to a full article get this — preview and utility cards on `all.html` do **not** show reading time
- `index.html` entries use `<span class="entry-time">12 dk</span>` placed as the **last child of `<h2 class="entry-title">`**, immediately after the title text. It flows inline at the end of the title, vertically centered against the title's x-height (small, uppercase, dim). Every entry on `index.html` shows a reading time. **Index cards link directly to the full article** (not to a preview), so the time is just the full article's reading time.

Reading times are only ever **computed from full articles**, never from preview pages.

**Display format** (no leading `~` symbol):
- Under 60 minutes: `X dk` (e.g. `12 dk`)
- 60 minutes or more: `X sa Y dk` (e.g. `1 sa 23 dk`), or `X sa` if remainder is zero

**When adding a new full article**, after the content is finalized, compute its word count and update three places:
1. Insert `<meta name="word-count">` and `<meta name="reading-time">` into the article's `<head>`
2. Add `<span class="read-time">X dk</span>` to its card in `all.html` (only if the card links to the full article, not the preview)
3. If curated to `index.html`, append `<span class="entry-time">X dk</span>` as the last child of the card's `<h2 class="entry-title">`. Index cards always link to the full article (`href="article-name.html"`, not `*-preview.html`)

The counting logic and bulk updater live as ad-hoc scripts; re-run the counter when an article's body changes substantially (>5%).

## Reading Progress Bar

A thin accent-colored bar fixed across the top of every article page that fills left-to-right as the reader scrolls. Provides a physical sense of "how much is left".

- **File**: `progress.js` — IIFE that auto-injects `<div class="read-progress">` at the start of `<body>` on `DOMContentLoaded`, then listens for `scroll` (rAF-throttled, passive) and `resize` to update `width` as a percent of `scrollHeight - clientHeight`. Re-entry safe (skips if a `.read-progress` element already exists).
- **CSS**: `.read-progress` lives in `styles.css` — `position: fixed; top: 0; left: 0; height: 2px; background: var(--accent); z-index: 200; transition: width 0.12s ease-out`
- **Load on**: every article page (full + preview) via `<script src="progress.js" defer></script>` in `<head>`
- **Skip on**: `index.html`, `all.html`, `404.html`, `article-carousel.html`, `carousel-generator.html`

The bar element is auto-created — articles do not need any markup. Just including the script is enough.

## Resume Reading

When a reader leaves a long page partway through and returns, a pill appears at the bottom-right offering to scroll them back to where they left off. Reduces the "I lost my place" friction.

- **File**: `resume.js` — IIFE that throttle-saves the current `scrollTop` to `localStorage` under `ns-pos-<pathname>` as `{y, savedAt}`. On load, reads the value: if `Date.now() - savedAt < 7 days` and the saved position is past 15% of total scroll, injects a floating pill `<button class="resume-pill">`. Click → smooth-scrolls to saved y; × → clears entry and hides pill. Auto-hides after 12 s.
- **Storage hygiene**: positions below 5% or above 95% of total scroll clear the entry (treats "at the top" and "near the end" as no-resume-needed). 7-day TTL prunes lazily on access.
- **Page-too-short guard**: skips activation when `scrollHeight - clientHeight < 1200px` (short pages don't need resume).
- **CSS**: `.resume-pill`, `.resume-pill-show`, `.resume-pill-icon`, `.resume-pill-text`, `.resume-pill-close` in `styles.css`
- **GoatCounter events**: `resume-click` when the pill is used; `resume-dismiss` when explicitly closed via ×
- **Load on**: every article page (same scope as `progress.js`) via `<script src="resume.js" defer></script>` in `<head>`

## Referral Codes

When sharing a link 1-to-1 (a friend, a specific group), append `?ref=CODE` to the URL. On arrival the site fires a custom GoatCounter event `ref-CODE` so the owner can see in the dashboard whether that specific person opened the link. The code is owner-generated (any short string like `alice`, `kerem-x`, `mar26-ali`) — `ref.js` does not generate anything.

- **File**: `ref.js` — reads `?ref=CODE` from `location.search`, sanitises it (`[A-Za-z0-9_-]`, max 64 chars), and fires `goatcounter.count({ path: 'ref-<code>', event: true })`. Stores the code in `localStorage` under `ns-ref-seen` (JSON array of all codes ever seen on this browser) so each code fires **at most once per browser** — refreshing or revisiting the same `?ref=alice` link does not re-fire. The first code ever seen is also stored under `ns-ref-first` as a flat string. After read, the `ref` param is stripped from the URL via `history.replaceState` so visitors don't carry the code along when re-sharing.
- **GoatCounter retry**: because the GoatCounter snippet is `async`, `window.goatcounter.count` may not yet exist on `DOMContentLoaded`. The script retries up to 10 times at 500 ms intervals.
- **Localhost guard**: same `isLocal()` check as `analytics.js` / `share.js` — `file://`, `localhost`, `127.x`, private RFC1918 ranges all skip the event (storage still records the code so a later production visit doesn't re-fire).
- **Load on**: every article page (same scope as `progress.js` / `resume.js` / `references.js`) via `<script src="ref.js" defer></script>` in `<head>`. Also safe to load on listing pages (`index.html`, `all.html`) if you want to share a code-tagged link to the landing page

**Usage**:
1. Pick a code per recipient: e.g. `alice`, `ahmet42`, `mar26-grup`
2. Send `https://menesdurmushw.github.io/NSArticles/argument.html?ref=alice` (any page works)
3. In the GoatCounter dashboard, the event `ref-alice` appears under *Events* on first open
4. To reset tracking on your own browser during testing: `localStorage.removeItem('ns-ref-seen')` in DevTools

## Collapsable References

The references list at the end of every article is auto-wrapped in a `<details>` element and presented collapsed by default. The summary shows the heading (e.g. "Kaynaklar") and the count of references (e.g. "32"). Clicking the summary toggles open/closed. Clicking any inline ref link (`<a class="ref" href="#ref-N">`) anywhere in the article auto-expands the collapsed details before the browser jumps to the citation — the reader never lands on a hidden anchor.

- **File**: `references.js` — runs on `DOMContentLoaded`, scans the document for `<ol>` elements that either (a) have at least one `<li id="ref-*">` child, or (b) carry the `references` class. For each candidate it walks backward to find the nearest preceding heading (`h2`/`h3`/`h4`) whose text matches `/Kaynak/i`, then wraps the (heading + ol) pair into a `<details class="references-collapse" data-refs>` with a generated `<summary>` containing chevron + label + count
- **Heading preservation**: the original heading's `id` (used by TOC anchors) is moved to the `<details>` element, so TOC links continue to scroll to the right place. Any `.heading-share` button inside the heading is moved into the summary (hover-revealed)
- **Auto-expand triggers**:
  1. **Initial load with `#ref-N` hash** — opens all refs details then re-scrolls to the anchor
  2. **Click on `<a href="#ref-*">`** — capture-phase handler opens details before browser anchor jump, so layout is correct when the jump happens
  3. **`hashchange` to `#ref-*`** — also re-opens
- **CSS**: `details.references-collapse`, `.ref-summary`, `.ref-summary-chevron`, `.ref-summary-label`, `.ref-count`, `.ref-summary-share` in `styles.css`. Chevron rotates 90° via `[open]` selector
- **Skip thresholds**: lists with fewer than 3 items aren't wrapped (probably not a real bibliography)
- **Load on**: every article page (same scope as `progress.js` / `resume.js`) via `<script src="references.js" defer></script>` in `<head>`

The conversion is dynamic — articles' HTML markup is **not** touched. The original `<h2>Kaynakça</h2>` + `<ol>` (or `<div class="references">` wrapper) markup stays as-is in source; the script reshapes it at runtime. This means new articles don't need any special markup for the collapse behavior — just write the references the same way (any heading containing "Kaynak" followed by an `<ol>`) and the script handles the rest.

## Highlights, Notes, and Quote Sharing

Readers can highlight any prose passage, attach a private note, copy or share it. Highlights persist per-article in `localStorage` and re-render on revisit. Sharing produces a URL with a `#:~:text=` fragment so the recipient lands on the exact quoted passage; the share modal also gains a quoted-excerpt blockquote and uses the quote in X/WhatsApp share text.

- **File**: `highlight.js` — IIFE that on `DOMContentLoaded`:
  1. Builds a paragraph index of the article body (`p, blockquote, li`) excluding chrome (`.toc-rail, .references-collapse, .continue, .feedback, .home-logo, footer, ...` etc.)
  2. Reads saved marks from `localStorage` under `ns-marks-<pathname>` (JSON array of `{id, paraIdx, before, text, after, note, ts}`) and re-renders them by walking text content
  3. Listens for `mouseup` / `touchend` and shows a floating popover above the selection with `[Vurgula] [Not] [Kopyala] [Paylaş]`. Existing-highlight clicks add a `[Kaldır]` button
  4. Maintains a bottom-left `.hl-pill` (`N vurgu · M not`) that opens a `.hl-panel` listing every highlight on the page with paragraph context + note; clicking an entry smooth-scrolls to it and pulses the highlight twice
- **Persistence strategy**: marks store the highlighted text + 24 chars of context before/after + paragraph index. Re-rendering tries `before+text+after` first, then partial matches, then bare text. This survives small edits to the article body. If a mark cannot be re-located, it stays in storage but doesn't render (won't lose data on a transient script bug)
- **Same-paragraph only**: v1 ignores selections that span multiple paragraphs (the popover doesn't appear). Selections that overlap an existing `mark.ns-hl` are also ignored — the reader has to remove the old one first
- **Quote URL format**: `<page>.html#:~:text=<encoded>` for selections ≤ 80 chars, or `#:~:text=<first 4 words>,<last 4 words>` for longer ones (text fragment directive, native in Chromium/Safari 16.4+; non-supporting browsers just open the page without scrolling)
- **share.js handoff**: the popover's `[Paylaş]` action calls `window.openShare({ url, title, quote })`. `share.js` accepts a `quote` field, shows it as a `<blockquote class="share-quote">` in the modal, swaps the title to "Bu alıntıyı paylaş", and includes the quote in X/WhatsApp text as `"…" — title`. QR re-renders to the fragment URL
- **GoatCounter events**: `highlight-add`, `highlight-remove`, `highlight-copy`, `highlight-share`, `note-add`, `note-edit`
- **CSS**: `mark.ns-hl`, `.hl-popover`, `.hl-note-editor`, `.hl-pill`, `.hl-panel`, `.share-quote` in `styles.css`. Highlight uses an accent-tinted gradient under the text baseline; notes add an inset accent border under the highlight. Pulse keyframe `ns-hl-pulse` fires on scroll-to-mark from the panel
- **Load on**: every article page (full + preview) via `<script src="highlight.js" defer></script>` in `<head>`. The script no-ops on pages where `findParagraphs()` returns empty, so loading on a listing/utility page is harmless but unnecessary. Skip on `index.html`, `all.html`, `404.html`, `article-carousel.html`, `carousel-generator.html`

The script is purely additive — articles don't need any new markup. Just include the script tag (same scope as `analytics.js` / `progress.js` etc.).

## Spoiler Blur (Interactive Experiment Answers)

When an article contains an interactive quiz/experiment and the surrounding prose reveals its answer (e.g. the paragraph right after a "guess the number" card states the correct value), that prose starts **blurred** so the reader isn't spoiled before playing. A pill button sits on top of the blur so the reader can still opt out and read immediately.

**Markup** (per-article, wraps the spoiling paragraph(s)):

```html
<div class="spoiler" data-spoiler-for="{experiment-card-id}">
  <button class="spoiler-btn" type="button">Deneyin cevabı içinde · yine de göster</button>
  <div class="spoiler-content">
    <p>…paragraph that reveals the answer…</p>
  </div>
</div>
```

**Behavior**:
- `.spoiler-content` is blurred (`filter: blur(7px)`, reduced opacity, `user-select: none`, `pointer-events: none`)
- Clicking `.spoiler-btn` adds `.revealed` to the wrapper → blur transitions away, button disappears
- Completing the linked interactive (matched via `data-spoiler-for` = the experiment card's `id`) auto-reveals the spoiler from the experiment's completion handler
- First used in `behavioral-economics-02.html`; CSS + JS live inline in that article (not shared files yet). If a third article needs it, consider extracting to a shared script

**When to use**: only when body text genuinely gives away an interactive's answer. Don't blur content that merely discusses the same topic.

## Term Glossary Tooltips

Hard or specialist terms in article body prose get a brief explanation **at their first use** so a general reader is never stranded. Two formats, chosen by length:

- **Short/simple terms** → inline parenthetical in plain Turkish, e.g. `glikoz (kandaki şeker)`. Keep it 2-6 words.
- **Longer/technical terms** → a hover (desktop) / tap (mobile) tooltip using the shared pattern:

```html
<span class="term">TERM<span class="term-tip">Kısa açıklama cümlesi.</span></span>
```

Rules:
- Explain only the **first** occurrence of each term in the body; leave later mentions untouched.
- Never explain inside headings, the Kaynakça/references list, or page chrome. Explain where the term first appears in prose.
- Tooltip text uses normal punctuation (it lives in element text, not an attribute), so quotes/parentheses are safe. Prefer this over `<abbr title="">` for anything non-trivial.
- Use `.term-left` / `.term-right` modifier classes on the outer span when a tooltip would clip off the left/right screen edge (mostly inside tables).
- **No em dashes** in the explanation text (site-wide rule).

Infra:
- **CSS**: `.term`, `.term .term-tip`, `.term-left`, `.term-right` live in `styles.css` (global, so every page that links `styles.css` gets it).
- **JS**: `tooltip.js` wires tap-to-toggle on mobile (desktop uses pure CSS `:hover`). Load via `<script src="tooltip.js" defer></script>` in `<head>`, same scope as the other article scripts. No-ops when no `.term` spans exist.
- **Exception**: `guide-intermittent-16-8.html` predates the shared infra and still carries its own inline `.term` CSS + inline tooltip JS. Do NOT add `tooltip.js` there (it would double-bind click handlers). New articles should always use the shared `tooltip.js` instead of inlining.

When adding a new article, gloss its hard terms at first use following this pattern and include `tooltip.js`.

## End-of-Article Continuation

Every full article ends with a hand-picked "next read" entry pointing at one specific other article. The selection is **static markup** — there is no JS that picks the next article. This file documents the rule; the actual link in code is hard-coded per article so adds/renames are explicit.

The continuation is presented as a **TOC-entry pattern**, not a card: chrome-free typographic navigation row with a small uppercase label, the next article's serif title, a one-line meta footer (category · reading time), and an accent arrow on the right. The entire row is one `<a>`. A small three-dot dingbat (`· · ·`) section break is rendered after the block via `.continue::after`.

**Selection rule** (apply in order, first match wins):

1. **Series article**: link to the next chapter of the same series. Label reads `Bölüm N`. If the next chapter doesn't exist yet, use the **coming-soon** variant (`<div class="continue-toc continue-toc-pending">`, no `href`, arrow becomes inert "Yakında" text, meta becomes `Hazırlanıyor`).
2. **Same category**: link to another article that shares the closest tag/category (`data-cat` from `index.html`). Label reads `Sıradaki yazı`.
3. **Closest topical match**: if no same-category sibling exists, link to the topically nearest article. Label still `Sıradaki yazı`.
4. **Skip entirely**: some articles don't get a continue block when no good match exists (currently `illusion-of-control.html` and `argument.html`). The decision is editorial — quality of the recommendation outranks completeness.

**Guide pages** (`guide-ketogenic.html`, `guide-intermittent-16-8.html`, `guide-intermittent-4-3.html`) are a special case: each cross-links to **both** other guides as stacked TOC entries inside one `<section class="continue">`. Each entry uses label `Bir rehber`. The `.continue-toc + .continue-toc` rule adds a thin divider between adjacent entries.

**No "Diğer makaleler" link inside the continue block.** That secondary nav belongs in footer chrome, not paired with the primary next-read action (the two are not peers).

**Markup template** (single next entry):

```html
<section class="continue" aria-label="Sıradaki okuma">
  <a class="continue-toc" href="next-article.html">
    <span class="continue-toc-label">Sıradaki yazı</span>
    <span class="continue-toc-leader" aria-hidden="true"></span>
    <span class="continue-toc-end">
      <h3 class="continue-toc-title">Next article title</h3>
      <p class="continue-toc-meta">Kategori · X dk</p>
    </span>
    <span class="continue-toc-arrow" aria-hidden="true">→</span>
  </a>
</section>
```

The `.continue-toc-leader` span is a legacy slot for an earlier horizontal-leader-dot layout; it's currently `display: none` and can stay as a no-op for markup stability (or be omitted).

**Markup variants**:
- **Coming-soon**: replace the `<a class="continue-toc">` with `<div class="continue-toc continue-toc-pending">` (no `href`). The arrow span content becomes `Yakında` (rendered as muted caps via the pending CSS) and the meta becomes `Hazırlanıyor`.
- **Multi-card** (guides): stack multiple `<a class="continue-toc">` siblings directly inside `<section class="continue">`. The `.continue-toc + .continue-toc` selector adds the inter-entry divider.

**Insertion point** — the continue block sits between the article body and the references, **above** the (collapsed) references list:

- For articles with a `<!-- Kaynakça -->` comment, `<div class="references">`, `<div class="conclusion" id="kaynak*">`, or a `<h2>Kaynak…</h2>`-style heading: insert the section **immediately before** the first such anchor.
- For articles with no references at all (`illusion-of-control.html`, guides with empty `references` divs): insert before `<div class="feedback">` if present, else before the bottom `<a class="home-logo">` / `<div class="home-logo">` chrome.
- Final source order: article body → **continue** → references (auto-collapsed) → feedback → home chrome.

**When adding a new full article**:
1. Pick its "next" using the selection rule above.
2. Insert the appropriate `<section class="continue">` markup using the TOC-entry template.
3. If this new article makes sense as someone else's "next", consider updating the source article's continue block to point here (optional — only when the new pick is clearly better).

## Git

- Do NOT add `Co-Authored-By` or any AI attribution lines to commit messages
