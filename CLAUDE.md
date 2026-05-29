# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NSArticles is a static HTML article site. No build tools, no frameworks, no package manager — just standalone `.html` files served directly. Each article has inline `<style>` and (where needed) inline `<script>`, but shares common styles via `styles.css` and theme logic via `theme.js`.

## Architecture

- **`index.html`** — Curated landing page (previews + key articles only)
- **`all.html`** — Full listing of all articles
- **`styles.css`** — Shared CSS: theme variables (light/dark), reset, grain overlay, theme toggle, share toggle, share modal, divider, home logo
- **`theme.js`** — Dark/light mode toggle with localStorage persistence and system preference detection
- **`share.js`** — Share button + modal (Web Share API, copy link, X, WhatsApp, QR code fallback). `openShare()` shares the page; `openShare({url, title})` or `openShareSection(btn)` shares a specific section. Modal handlers read from the active info, so per-section shares populate the correct URL, X/WhatsApp links, and QR code. Also fires GoatCounter events: `share-page` for the top-right button, `share-section-{id}` for per-heading buttons
- **`analytics.js`** — Scroll-depth tracker. Fires GoatCounter events at 25/50/75/100% page scroll thresholds (`scroll-25`, `scroll-50`, etc.). Loaded only on article pages (not on `index.html`, `all.html`, `404.html`, or carousel utility pages)
- **`toc.js`** — Table of Contents behavior. Mobile drawer toggle, scroll-spy active state for level-1 and level-2 entries, auto expand/collapse of nested children, Esc-to-close. Silently no-ops on pages without a `#toc-rail`. CSS for the rail/drawer lives in `styles.css`
- **`favicon.svg`** — Single SVG favicon at the repo root, accent-colored rounded square with "NS" mark. Uses `prefers-color-scheme` inside the SVG so it adapts to the browser's tab theme
- **`og-default.png`** — 1200×630 Open Graph image used as the social-share preview for every page. Branded NS Articles cover. Source design lives in `og-default.svg`; the PNG is what social platforms fetch (WhatsApp does not render SVG)
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
- **References**: Articles use `<a class="ref">` footnote links with a JS-powered back-navigation FAB button (`savePos`/`goBack`). Inline reference numbers must NOT have square brackets — use `1` not `[1]`
- **Per-section share**: Each `<h2>` in an article body must end with `<button class="heading-share" type="button" aria-label="Bu bölümü paylaş" onclick="openShareSection(this)">…three-dot share SVG…</button>` and have an `id` (so `openShareSection` can build the anchor URL). The button is hidden on desktop and revealed on heading hover; on touch devices it stays visible at low opacity. Skip on listing pages and tooling pages (`index.html`, `all.html`, `404.html`, carousel pages)
- **No em dashes**: Never use the em dash character (—) in article content or any user-facing text. Restructure the sentence, use a comma, or use a period instead
- **One body font per article**: Pick a single body font (`var(--sans)` or one explicit serif) and use it consistently across ALL body content of that article: hero subtitle, intro paragraphs, sections, sidebars, quiz/interactive blocks, callouts, post-quiz continuation, footer text. Headings can use `var(--serif)` (Playfair) and small UI labels can use a mono font, but body copy must not switch fonts mid-article. If you load a font in the `<link>` tag, every place it appears must follow the same rule
- **Justified body text**: All body paragraphs in articles must use `text-align: justify`. Apply it to every paragraph container in the article, including quiz/interactive blocks and post-quiz continuation sections. Do NOT justify hero subtitles, captions, list items, or single-line UI text

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

- **`all.html`**: Lists every article. Preview pages use "— Preview" suffix in the card title and the "Önizleme" tag
- **`index.html`**: Curated landing page — only selected articles appear here. Do NOT use "Preview" suffix in card titles on this page

## Adding a New Article

1. Create a new `.html` file at the repo root
2. Use one of the existing articles as a template
3. In `<head>`: load `<script src="theme.js"></script>`, `<script src="share.js" defer></script>`, `<script src="analytics.js" defer></script>`, `<script src="toc.js" defer></script>`, `<link rel="icon" type="image/svg+xml" href="favicon.svg">`, the Open Graph block (see Page Chrome), `<link rel="stylesheet" href="styles.css">`, and the GoatCounter snippet right before `</head>` (see Analytics)
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
- `index.html` entries use `<span class="entry-time">12 dk</span>` placed as the **last child of `<h2 class="entry-title">`**, immediately after the title text. It flows inline at the end of the title, vertically centered against the title's x-height (small, uppercase, dim). **Every** entry on `index.html` shows a reading time, including cards that link to a `*-preview.html` page — in those cases display the **full article's** time, not the preview's. The index is curated and signals what the reader is committing to when they go past the preview

Reading times are only ever **computed from full articles**, never from preview pages.

**Display format** (no leading `~` symbol):
- Under 60 minutes: `X dk` (e.g. `12 dk`)
- 60 minutes or more: `X sa Y dk` (e.g. `1 sa 23 dk`), or `X sa` if remainder is zero

**When adding a new full article**, after the content is finalized, compute its word count and update three places:
1. Insert `<meta name="word-count">` and `<meta name="reading-time">` into the article's `<head>`
2. Add `<span class="read-time">X dk</span>` to its card in `all.html` (only if the card links to the full article, not the preview)
3. If curated to `index.html`, append `<span class="entry-time">X dk</span>` as the last child of the card's `<h2 class="entry-title">` — even if the card links to the preview, use the **full article's** time

The counting logic and bulk updater live as ad-hoc scripts; re-run the counter when an article's body changes substantially (>5%).

## Git

- Do NOT add `Co-Authored-By` or any AI attribution lines to commit messages
