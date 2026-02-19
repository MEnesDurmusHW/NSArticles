# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NSArticles is a static HTML article site. No build tools, no frameworks, no package manager — just standalone `.html` files served directly. Each article is a single self-contained file with inline `<style>` and (where needed) inline `<script>`.

## Architecture

- **`index.html`** — Landing page listing all articles as clickable cards
- **Article pages** — Each article is one HTML file at the repo root. New articles should follow the same pattern: self-contained HTML with inline CSS.
- **`the-science-of-doing-nothing-preview.html`** — Table-of-contents/preview page that links conceptually to the full article

There is no shared CSS or JS. Each file owns its own styles completely.

## Design Systems

Two visual themes are used across articles:

| Theme | Background | Fonts | Used in |
|-------|-----------|-------|---------|
| Dark | `#0f1117` | DM Sans + DM Serif Display | `index.html`, `kontrol-yanilgisi.html` |
| Light | `#FAF7F2` | Source Sans 3 + Playfair Display | `the-science-of-doing-nothing.html`, preview |
| Dark (variant) | `#0d0f12` | DM Sans + Playfair Display | `relationships.html` |

All fonts are loaded from Google Fonts CDN. Accent color is typically a warm brown/gold (`#c4956a`, `#96622F`, or `#e8a838` depending on theme).

## Conventions

- **Language**: All article content is in Turkish (`lang="tr"`)
- **Sections**: Articles use numbered sections (`01`, `02`, `03`...) with serif headings
- **Responsive breakpoints**: 768px (tablet), 480px (mobile), 360px (very small)
- **Texture overlay**: Dark-themed pages use a `.grain` div with an SVG noise filter for texture
- **Feedback**: Articles end with a feedback section linking to a Google Form
- **References**: `the-science-of-doing-nothing.html` uses `<a class="ref">` footnote links with a JS-powered back-navigation FAB button (`savePos`/`goBack`)

## Development

Open any `.html` file directly in a browser — no server or build step required. For live reload during development, any static file server works (e.g., `python3 -m http.server`).

## Adding a New Article

1. Create a new `.html` file at the repo root
2. Use one of the existing articles as a template (match the appropriate theme)
3. Add a card entry in `index.html` inside the `.articles` div
