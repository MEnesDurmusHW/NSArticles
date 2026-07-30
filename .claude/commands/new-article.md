---
description: Scaffold a new full article with every piece of site chrome CLAUDE.md requires
argument-hint: <slug> "<Title>" [topic notes]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(open:*), Bash(grep:*), Bash(perl:*), Bash(ls:*)
---

Create a new full article for NSArticles. Arguments: `$ARGUMENTS`

The first token is the file slug (`brain-memory-story-machine` → `brain-memory-story-machine.html`).
The quoted string is the article title. Anything after that is topic guidance.
If the slug or title is missing, ask for it before writing any file.

`willpower-design-flaw.html` is the structural reference. Read its `<head>` and
chrome blocks before writing, and mirror them. `CLAUDE.md` is the authority on
every rule below; consult it when a detail here is ambiguous.

## Procedure

Work through these in order. Do not skip a step because it looks minor;
the whole point of this command is that the tail-end steps get forgotten.

### 1. Head

Build `<head>` with, in this order:

- `<meta name="description">` with the article's one-line pitch
- The Open Graph block (see *Page Chrome* in CLAUDE.md). `og:type` is `article`.
  `og:url` is the absolute `https://menesdurmushw.github.io/NSArticles/<slug>.html`.
  `og:title` is the page title without the ` — NS Articles` suffix.
  `og:image` stays the PNG, never the SVG.
- `<link rel="icon" type="image/svg+xml" href="favicon.svg">`
- `<link rel="stylesheet" href="assets/css/styles.css">`
- Scripts: `theme.js` (not deferred), then deferred `share.js`, `analytics.js`,
  `toc.js`, `tooltip.js`, `progress.js`, `resume.js`, `references.js`,
  `ref.js`, `highlight.js`
- The GoatCounter snippet as the last thing before `</head>`

Leave the `word-count` / `reading-time` metas out for now. They come in step 6.

### 2. Body chrome

- `.grain` overlay
- `home-toggle` (top-left), `theme-toggle` + `share-toggle` (top-right)
- TOC toggle button, backdrop, and `#toc-rail` nav
- `home-logo` + `by M. Enes Durmuş` at the bottom
- Feedback section linking to the Google Form (copy the URL from a sibling article)

### 3. Content

Write the article in Turkish (`lang="tr"`). Non-negotiable rules:

- **No em dashes.** Restructure, or use a comma or a period. A hook enforces this.
- **No emojis.** Same hook.
- **One body font** across every block: hero subtitle, intro, sections, sidebars,
  callouts, quiz blocks, post-quiz text. Headings may use `var(--serif)`.
- **Justify** every body paragraph, including interactive blocks. Do not justify
  hero subtitles, captions, list items, or single-line UI text.
- **Contrast**: `--text-muted` is only for tiny decorative labels. Anything meant
  to be read uses `--text-dim` or darker.
- Numbered sections (`01`, `02`, …) with serif headings.
- Every `<h2>` needs an `id` and a trailing `.heading-share` button.
- Never guess the reader's inner state. No "sanıyorsun", "düşünüyorsun",
  "biliyorsun ki". Describe a concrete scene or state a fact instead.
- Emphasis dosage: bold the numbers, at most one verbal emphasis per paragraph.
- Gloss hard terms at **first use only**: short ones as a plain parenthetical,
  longer ones as `<span class="term">TERM<span class="term-tip">…</span></span>`.
  Never inside headings or the reference list.

### 4. References

Heading text is always **Kaynakça**, never "Kaynaklar" (the `id` may stay
`kaynaklar`). Inline citations are bare numbers with no square brackets:
`1`, not `[1]`. `references.js` collapses the list at runtime, so write plain
`<h2>` + `<ol>` markup and add nothing special.

### 5. Continue block

Pick the next read using the selection rule in CLAUDE.md (next chapter of the
same series → same category → closest topical match → skip). Insert
`<section class="continue">` **between the article body and the references**.
Use the pending variant if the target chapter does not exist yet.

### 6. Reading time

Count body words, excluding `<head>`, scripts, styles, comments, and the chrome
blocks listed in CLAUDE.md. Divide by 220, round to nearest, floor at 1. Then:

1. Add `<meta name="word-count">` and `<meta name="reading-time">` right after
   `<meta name="description">`
2. Add `<span class="read-time">X dk</span>` to the `all.html` card
3. If curated, add `<span class="entry-time">X dk</span>` as the **last child**
   of the `index.html` entry's `<h2 class="entry-title">`

Format: `X dk` under an hour, `X sa Y dk` at or above it. No leading `~`.

### 7. Listing pages

- `all.html`: add a card. No "Preview" suffix in the title.
- `index.html`: only if curated. **Append to the END** of `.entries` with the
  next sequential `entry-number`. Never insert mid-list, never renumber, not
  even to group a series together.
- Index cards link to the full article, never to a preview.

### 8. Open it

Run `open <slug>.html` so the result can be reviewed immediately.

## Before reporting done

State explicitly which of steps 1-8 you completed and which you skipped, and why.
If you could not pick a sensible continue target, say so rather than linking
something weak.
