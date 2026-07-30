---
description: Audit an article page against every NSArticles convention and report what is broken
argument-hint: [file.html] (defaults to files changed on this branch)
allowed-tools: Read, Grep, Glob, Bash(grep:*), Bash(perl:*), Bash(git:*), Bash(ls:*), Bash(open:*)
---

Audit NSArticles pages against the conventions in `CLAUDE.md`.

Target: `$ARGUMENTS`
If no file was given, audit the HTML files reported by `git status --porcelain`
plus any listed in `git diff --name-only main...HEAD`. If that set is empty,
say so and stop rather than auditing the whole site.

This is a **read-only audit**. Report findings; do not fix anything unless
asked in a follow-up.

## What to check

Skip whichever checks do not apply to the page type. Listing pages
(`index.html`, `all.html`) and utility pages (`404.html`, `article-carousel.html`,
`carousel-generator.html`) legitimately omit most article chrome.

### Content rules

1. **Em dash** — `grep -n '—' <file>`. Any hit in user-facing text is a defect.
2. **Emoji** — scan for characters in the emoji planes. Any hit is a defect.
3. **Presumptuous phrasing** — `grep -nE 'sanıyorsun|düşünüyorsun|biliyorsun ki'`.
   Flag anything that narrates the reader's inner state.
4. **References heading** — the visible heading must read `Kaynakça`, never
   `Kaynaklar`. Check the `<h2>`/`<h3>` text and the matching `toc-title`.
   The `id` may stay `kaynaklar`; it is not displayed.
5. **Bracketed citations** — inline refs must be bare numbers. Flag `[1]`-style
   markers inside `<a class="ref">`.
6. **Justification** — every body paragraph container needs `text-align: justify`,
   including quiz and post-quiz blocks. Hero subtitles, captions, list items,
   and single-line UI text must NOT be justified.
7. **Font consistency** — the article must use one body font throughout. Flag any
   block where body copy switches font family mid-article.
8. **Contrast** — flag `--text-muted` used on anything longer than a tiny
   decorative label (reading-time stamps, counts, eyebrows). Subtitles, captions,
   ledes, and body copy need `--text-dim` or darker.
9. **Term glossing** — check that specialist terms are explained at first use and
   that no gloss appears in a heading or inside the reference list.

### Structural chrome

10. **Head** — `<meta name="description">`, the full Open Graph block with
    absolute `og:url` and PNG `og:image`, favicon link, stylesheet link.
11. **Scripts** — article pages load `theme.js` plus deferred `share.js`,
    `analytics.js`, `toc.js`, `tooltip.js`, `progress.js`, `resume.js`,
    `references.js`, `ref.js`, `highlight.js`. Note that
    `guide-intermittent-16-8.html` intentionally omits `tooltip.js`; it has its
    own inline tooltip JS and loading the shared script would double-bind.
12. **GoatCounter** — the tracker snippet must be present on every page,
    immediately before `</head>`.
13. **Body chrome** — `.grain`, `home-toggle`, `theme-toggle`, `share-toggle`,
    bottom `home-logo`, and the `by M. Enes Durmuş` credit.
14. **TOC** — every `<h2>` should have a matching `toc-rail` entry, and every
    entry's `href` must resolve to an existing `id` on the page. Report both
    orphan entries and unlinked headings.
15. **Per-section share** — every article `<h2>` needs an `id` and a trailing
    `.heading-share` button calling `openShareSection(this)`.
16. **Continue block** — present, and positioned between the article body and
    the references. Verify its `href` points to a file that exists and that its
    stated reading time matches that file's `reading-time` meta.

### Reading time

17. `<meta name="word-count">` and `<meta name="reading-time">` exist on full
    articles. Recount the body (excluding head, scripts, styles, comments, and
    the chrome blocks listed in CLAUDE.md) at 220 wpm and flag a drift over 5%.
18. The `all.html` card shows `<span class="read-time">`, and the `index.html`
    entry shows `<span class="entry-time">` as the last child of its
    `<h2 class="entry-title">`. Both must match the article's meta.

### Listing pages

19. `index.html` entries stay in creation order with sequential `entry-number`
    values and no gaps. Index cards link to full articles, never to `*-preview.html`.
20. Nothing outside `all.html` links to `all.html`. It is a private archive:
    no in-article links, continuation cards, or footer logos may point at it.

## Report format

Group findings by severity:

- **Broken** — the page misbehaves for a reader (dead TOC anchor, missing script,
  wrong continue target, absent GoatCounter).
- **Rule violation** — the page works but breaks a documented site rule
  (em dash, emoji, wrong heading word, unjustified paragraph, contrast).
- **Drift** — stale derived data (reading time out of date, listing card
  disagrees with the article meta).

Give `file:line` for every finding. If a check passes cleanly across all audited
files, say so in one line instead of listing it per file. If everything passes,
say that plainly rather than inventing minor nitpicks.
