# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Manchester LMC website — representing and supporting general practice in Manchester. The site is transitioning from hand-authored static HTML to an **Eleventy (11ty) v3** static site generator using Nunjucks templates.

## Commands

```bash
npm run build   # Build the site to _site/
npm run start   # Build and serve with live reload (http://localhost:8080)
```

No linter or test runner is configured.

## Architecture

### Dual-layer structure (in transition)

The repo has two parallel layers:

- **Root-level HTML** (`index.html`, `about/`, `contact/`, `events/`, `guidance/`, `members/`, `news/`, `support/`, `vacancies/`) — hand-authored static pages that are the current published site. These reference `assets/css/` and `assets/js/` at the root.

- **`src/` (Eleventy source)** — the in-progress Eleventy build. When `npm run build` runs, Eleventy reads from `src/` and writes to `_site/`. The section subdirectories under `src/` (`src/about/`, `src/news/`, etc.) are currently empty stubs — pages are yet to be converted from root-level HTML to Eleventy Nunjucks templates.

The intent is for the Eleventy build to eventually replace the root-level static pages.

### Eleventy config (`.eleventy.js`)

- Input: `src/`, output: `_site/`
- Template engines: Nunjucks (`.njk`), Markdown (`.md`), HTML (`.html`)
- Passthrough copies: `src/assets/` → `_site/assets/`, `src/admin/` → `_site/admin/`
- Custom collections: `news` (all news posts by date desc), `featuredNews` (featured flag = true)
- Custom filters: `dateDisplay`, `dateISO`, `dateFull`, `dateFull`, `limit`, `badgeClass`, `categoryName`, `markdown`

### Templates (`src/_includes/`)

- `layouts/base.njk` — single base layout; accepts `title`, `description`, `mainClass`, `showContactStrip`, `showDisclaimer` front matter variables
- `partials/nav.njk`, `partials/footer.njk`, `partials/contact-strip.njk`, `partials/news-card.njk`

### Global data (`src/_data/site.json`)

Provides `site.*` variables throughout templates: name, tagline, url, contact details, social links, copyright.

### CSS (`src/assets/css/`)

Two files — no build step, plain CSS:
- `main.css` — custom properties (design tokens), reset, typography, layout utilities
- `components.css` — reusable component styles

Design tokens are defined as CSS custom properties on `:root` in `main.css`. Key colour vars: `--colour-primary` (#0d3d56), `--colour-secondary` (#1a7fa0), `--colour-accent` (#e07b39). Fonts: `Fraunces` (headings), `Inter` (body).

### JavaScript (`src/assets/js/main.js`)

Vanilla JS, no framework or bundler. Organised as self-executing IIFEs covering: sticky nav, mobile nav toggle, scroll-reveal animations, stat counters, tabs, accordions, news filtering, and the disclaimer overlay.

### News content (`src/content/news/`)

Markdown files tagged `news` are picked up by the `news` collection. Front matter should include `title`, `date`, `tags: [news]`, `category` (one of `announcement`, `bma-gpc`, `nhs-policy`, `local`), and optionally `featured: true`.

### Disclaimer overlay

Controlled by `showDisclaimer: true` in page front matter. The overlay HTML is rendered by `base.njk` and driven by JS in `main.js`. It uses `sessionStorage` to avoid showing again after acceptance.
