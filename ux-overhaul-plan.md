# UX Overhaul Plan — Manchester LMC

**Date:** 2026-03-04
**Status:** Approved
**Audited with:** ui-ux-pro-max v2.0.1
**Target style:** Accessible & Ethical / Swiss Modernism — clean, high-contrast, no decoration

---

## Design System

### Typography
- **Headings:** Figtree (weight 300–700)
- **Body:** Noto Sans (weight 300–700)
- **Google Fonts:** `https://fonts.google.com/share?selection.family=Figtree:wght@300;400;500;600;700|Noto+Sans:wght@300;400;500;700`
- **Rationale:** Healthcare-coded, accessible, trustworthy. Replaces Fraunces (too editorial/playful) + Inter.

### Colour Palette
| Token | Old | New | Usage |
|-------|-----|-----|-------|
| `--colour-primary` | `#0d3d56` | `#0891B2` | Primary brand, nav, headings |
| `--colour-secondary` | `#1a7fa0` | `#22D3EE` | Secondary accents, links |
| `--colour-accent` | `#e07b39` | `#22C55E` | CTA buttons, success states |
| `--colour-bg` | (white) | `#F0FDFA` | Page background |
| `--colour-text` | (dark) | `#134E4A` | Body text |

**Rationale:** Medical teal + health green. Warmer, more human, healthcare-coded. Removes the startup-orange accent.

### Style Principles
- No gradients (except optionally 1 subtle one on hero)
- No glassmorphism / backdrop-filter
- No decorative textures or noise
- No scroll-reveal animations
- No hover-lift transforms
- Solid colours, clear hierarchy, generous whitespace
- Single accent colour for CTAs
- WCAG AAA contrast target

---

## Phase 1: Strip AI-Slop Aesthetic

### 1a — Remove SVG noise grain texture
- **Files:** `src/assets/css/main.css` lines 604–611, 1281–1288
- **Action:** Delete `.hero-bg::after` and `.page-hero::after` noise texture rules
- **Result:** Clean solid-colour hero backgrounds

### 1b — Remove all glassmorphism
- **Files:** `src/assets/css/main.css` lines 281–283 (nav), 1193 (disclaimer); `src/assets/css/components.css` line 1445 (search)
- **Action:** Remove all `backdrop-filter: blur()` and `-webkit-backdrop-filter`. Replace with solid `background-color` at appropriate opacity (e.g. `rgba(255,255,255,0.97)`)
- **Result:** Crisp, fast-rendering backgrounds

### 1c — Strip all decorative gradients
- **Files:** `main.css` lines 90, 193, 215, 543, 595–600, 965, 983, 1049, 1234, 1275, 1374; `components.css` equivalent locations
- **Action:** Replace every `linear-gradient(135deg, ...)` with a flat solid colour from design tokens. Optionally keep 1 subtle gradient on the primary homepage hero only.
- **Result:** Clean, professional, flat design

### 1d — Remove all scroll-reveal animations
- **Files:** `src/assets/css/main.css` lines 959–974 (`.reveal`, `.reveal-delay-*`); `src/assets/js/main.js` lines 83–106 (IntersectionObserver)
- **Action:** Delete all `.reveal` and `.reveal-delay-1` through `.reveal-delay-5` CSS rules. Delete the IntersectionObserver JS block. Remove `.reveal` classes from all templates.
- **Result:** Content renders immediately. No artificial delays.

### 1e — Remove universal hover-lift effect
- **Files:** `src/assets/css/components.css` — 8+ component hover rules with `translateY(-4px)`
- **Action:** Remove all `transform: translateY(-4px)` hover effects. Replace with a subtle `border-color` or `background-color` shift on hover (single utility class).
- **Result:** Grounded, professional interactions. No floating cards.

---

## Phase 2: Eliminate JS Bloat

### 2a — Remove counter animation
- **Files:** `src/assets/js/main.js` lines 108–158
- **Action:** Delete the entire counter IIFE (easing function, requestAnimationFrame loop, performance.now timing). Display stats as static text in templates.
- **Saves:** ~50 lines

### 2b — Replace search system with lightweight alternative
- **Files:** `src/assets/js/main.js` lines 352–562
- **Action:** Delete the entire Fuse.js search system (210 lines + CDN dependency). Replace with a lightweight `Ctrl+K` / click-to-open search using native `String.includes()` matching against a JSON index generated at build time by Eleventy. Target: <40 lines of JS, no external dependencies. This scales as documents are added.
- **Implementation sketch:**
  1. Add Eleventy collection that outputs `_site/search-index.json` (title, url, excerpt for each page)
  2. Simple modal (using `<dialog>`) with text input
  3. `fetch('/search-index.json')` on first open, filter with `.includes()`
  4. Render matching results as links
- **Saves:** ~170 lines net, eliminates Fuse.js CDN

### 2c — Simplify disclaimer to native `<dialog>`
- **Files:** `src/assets/js/main.js` lines 564–661; `src/_includes/layouts/base.njk` (disclaimer HTML)
- **Action:** Replace custom modal with native `<dialog>` element. Built-in focus trap, Esc to close, `::backdrop` for overlay. Keep sessionStorage persistence logic. Target: ~20 lines of JS.
- **Saves:** ~75 lines

### 2d — Replace accordion JS with native `<details>`
- **Files:** `src/assets/js/main.js` lines 209–232; templates using `.accordion` classes
- **Action:** Delete accordion IIFE. Replace markup with `<details><summary>` elements. Style with CSS only.
- **Saves:** ~24 lines JS + simpler, accessible-by-default markup

### 2e — Delete smooth scroll JS
- **Files:** `src/assets/js/main.js` lines 338–350
- **Action:** Delete the anchor click handler. `scroll-behavior: smooth` in CSS (`main.css:82`) already handles this.
- **Saves:** ~13 lines

### 2f — Simplify mobile nav scroll lock
- **Files:** `src/assets/js/main.js` lines 36–48
- **Action:** Replace `position: fixed` + `top` offset hack with `document.body.classList.toggle('nav-open')` and CSS `body.nav-open { overflow: hidden; }`. Two lines instead of twelve.
- **Saves:** ~10 lines

### Phase 2 totals
- **Before:** 662 lines JS
- **After:** ~200 lines JS (est.)
- **External deps removed:** Fuse.js CDN

---

## Phase 3: Consolidate CSS

### 3a — Reduce component classes from 235 to ~80–100
- **Files:** `src/assets/css/components.css`
- **Action:** Audit every class. Merge duplicates, delete single-use decorative classes, extract repeated patterns into utilities. Target: <800 lines.
- **Key merges:**
  - All card variants → single `.card` base + modifiers
  - All placeholder styles → single `.placeholder`
  - All section headers → single `.section-header`
  - All meta/date rows → single `.meta-row`

### 3b — Create utility classes for repeated patterns
- **Files:** `src/assets/css/components.css`
- **Action:** Extract these utilities:
  - `.hover-highlight` — subtle border/bg colour shift on hover (replaces 40+ translateY rules)
  - `.icon-xs` (12px), `.icon-sm` (16px), `.icon-md` (24px), `.icon-lg` (32px) — replaces 15+ icon sizing rules
  - `.placeholder` — generic image placeholder (replaces per-component placeholders)
  - `.flex-center` — `display: flex; align-items: center; justify-content: center` (replaces 15+ inline declarations)

### 3c — Merge placeholder styles
- **Files:** `src/assets/css/components.css`
- **Action:** `.news-card-image-placeholder` (17 lines) + `.profile-card-photo-placeholder` (13 lines) → single `.placeholder` class.
- **Saves:** ~20 lines

### 3d — Consolidate icon sizing
- **Files:** `src/assets/css/components.css`
- **Action:** Replace all per-component SVG sizing (`width: 14px; height: 14px;` etc.) with utility classes.
- **Saves:** ~30 lines

### 3e — Merge into single CSS file
- **Files:** `src/assets/css/main.css` + `src/assets/css/components.css`
- **Action:** After consolidation, merge into single `styles.css`. One file, one request, one source of truth.
- **Before:** 3,062 lines across 2 files
- **After:** ~1,200 lines in 1 file

---

## Phase 4: Fix Templates

### 4a — Data-driven navigation
- **Files:** `src/_includes/partials/nav.njk` (186 lines); new `src/_data/navigation.json`
- **Action:** Define nav structure in `navigation.json` (label, url, children). Single Nunjucks loop renders links once; CSS handles desktop/mobile visibility via breakpoints. No duplicate HTML.
- **Before:** 186 lines, every link written twice
- **After:** ~60 lines + data file

### 4b — Data-driven contact strip
- **Files:** `src/_includes/partials/contact-strip.njk` (52 lines)
- **Action:** Loop over contact items from `site.json` instead of hardcoding. Add contact items array to site data.
- **Before:** 52 lines, 4 hardcoded blocks
- **After:** ~15 lines

### 4c — Icon partial system
- **Files:** `src/_includes/partials/nav.njk`, `contact-strip.njk`, `footer.njk`
- **Action:** Create `src/_includes/icons/` directory with individual `.njk` files per icon (chevron, phone, email, location, clock, external-link). Use `{% include "icons/chevron.njk" %}` instead of inline SVG.
- **Benefit:** Single source of truth per icon. Change once, applies everywhere. Eliminates 17 duplicate chevron SVGs in nav alone.

---

## Phase 5: Typography & Colour

### 5a — Switch fonts to Figtree + Noto Sans
- **Files:** `src/_includes/layouts/base.njk` (Google Fonts link); `src/assets/css/main.css` (`:root` tokens)
- **Action:**
  1. Update Google Fonts `<link>` to load Figtree + Noto Sans
  2. Update CSS tokens: `--font-heading: 'Figtree', sans-serif` and `--font-body: 'Noto Sans', sans-serif`
  3. Verify all heading/body usage inherits correctly

### 5b — Update colour palette
- **Files:** `src/assets/css/main.css` (`:root` design tokens)
- **Action:** Update colour custom properties:
  ```css
  :root {
    --colour-primary: #0891B2;
    --colour-secondary: #22D3EE;
    --colour-accent: #22C55E;
    --colour-bg: #F0FDFA;
    --colour-text: #134E4A;
  }
  ```
  Derive shade variants (light, dark, hover) from new base colours. Verify WCAG AAA contrast ratios for all text/background combinations.

---

## Phase 6: Architectural Cleanup

### 6a — Remove root-level legacy assets
- **Files:** Root `/assets/css/`, `/assets/js/`, root HTML files
- **Action:** Once Eleventy build (`_site/`) is confirmed as the production path, delete root-level asset directories and static HTML pages. Single source of truth in `src/`.
- **Prerequisite:** Verify deployment pipeline reads from `_site/`

### 6b — Preload or self-host fonts
- **Files:** `src/_includes/layouts/base.njk`
- **Action:** Either:
  - (Preferred) Self-host font files in `src/assets/fonts/`, use `@font-face` declarations, eliminate Google Fonts external dependency
  - Or add `<link rel="preload" as="font" crossorigin>` for critical font weights
- **Benefit:** Faster render, no third-party dependency, GDPR-friendly

### 6c — Add structured data (JSON-LD)
- **Files:** `src/_includes/layouts/base.njk`, `src/_includes/layouts/news-post.njk`
- **Action:**
  1. Add `Organization` JSON-LD to `base.njk` (name, address, phone, url)
  2. Add `Article` JSON-LD to `news-post.njk` (headline, datePublished, author, description)
- **Benefit:** SEO, rich search results, Google Knowledge Panel eligibility

---

## Implementation Order

| Priority | Phase | Estimated Impact |
|----------|-------|------------------|
| 1 | Phase 5 — Typography & Colour | Sets the new visual foundation |
| 2 | Phase 1 — Strip AI-Slop | Removes decorative noise |
| 3 | Phase 2 — Eliminate JS Bloat | Halves JS payload |
| 4 | Phase 3 — Consolidate CSS | Halves CSS payload |
| 5 | Phase 4 — Fix Templates | Improves maintainability |
| 6 | Phase 6 — Architectural Cleanup | Final polish |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| CSS lines | 3,062 | ~1,200 |
| JS lines | 662 | ~200 |
| Component classes | 235 | ~80–100 |
| External JS deps | Fuse.js | None |
| Gradient instances | 11 | 0–1 |
| Backdrop blur instances | 3 | 0 |
| Scroll animations | Every section | None (or hero only) |
| Nav template lines | 186 | ~60 |
| Font loading | External Google Fonts | Self-hosted |
| Structured data | None | Organization + Article |
