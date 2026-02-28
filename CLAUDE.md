# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NSArticles is a static HTML article site. No build tools, no frameworks, no package manager — just standalone `.html` files served directly. Each article has inline `<style>` and (where needed) inline `<script>`, but shares common styles via `styles.css` and theme logic via `theme.js`.

## Architecture

- **`index.html`** — Curated landing page (previews + key articles only)
- **`all.html`** — Full listing of all articles
- **`styles.css`** — Shared CSS: theme variables (light/dark), reset, grain overlay, theme toggle, divider, home logo
- **`theme.js`** — Dark/light mode toggle with localStorage persistence and system preference detection
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
- **References**: `the-science-of-doing-nothing.html` uses `<a class="ref">` footnote links with a JS-powered back-navigation FAB button (`savePos`/`goBack`)

## Page Footer

Every page (except `index.html`) must have these at the bottom, before `</body>`:

1. **Home logo**: `<a href="index.html" class="home-logo"><span>NS Articles</span></a>` — navigates back to the landing page
2. **Author credit**: `by M. Enes Durmuş` — displayed below or alongside the home logo

## Development

Open any `.html` file directly in a browser — no server or build step required. For live reload during development, any static file server works (e.g., `python3 -m http.server`).

## Adding a New Article

1. Create a new `.html` file at the repo root
2. Use one of the existing articles as a template
3. Add `<script src="theme.js"></script>` and `<link rel="stylesheet" href="styles.css">` in `<head>`
4. Add the grain overlay, theme toggle button, and home logo + author credit
5. Add a card entry in `index.html` (and `all.html`) inside the `.articles` div
