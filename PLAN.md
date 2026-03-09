# UI Mobile Polish — Implementation Plan

## Stack Summary

| Layer | Technology |
|-------|-----------|
| **SSG** | Eleventy v3, Nunjucks + Markdown |
| **CSS** | Plain CSS with custom properties (no preprocessor, no Tailwind) |
| **JS** | Vanilla JS (IIFEs), no framework or bundler |
| **Fonts** | Figtree (headings) + Noto Sans (body) — self-hosted WOFF2 |
| **Icons** | Inline SVG (Feather-style, stroke-based, `currentColor`) |
| **Production CSS** | `src/assets/css/styles.css` (single consolidated file) |
| **Deploy** | Netlify (Netlify Identity + CMS) |

## Design Tokens (Key)

- Colours: `--colour-primary: #0891B2`, `--colour-secondary: #22D3EE`, `--colour-accent: #22C55E`
- Spacing: `--space-1` (0.25rem) through `--space-24` (6rem)
- Radii: `--radius-sm: 4px`, `--radius-md: 8px`, `--radius-lg: 16px`, `--radius-xl: 24px`, `--radius-pill: 9999px`
- Breakpoints: 480px, 640px, 768px, 900px, 1024px (used in existing media queries)
- Shadows: `--shadow-sm` through `--shadow-xl`

## Risk Areas

- `styles.css` is 2000+ lines consolidated; changes must be surgical
- Events page uses `<button class="accordion-btn">` but no `<details>` element → needs conversion to native `<details>/<summary>` for issue #11
- News filter chips exist in HTML but the JS only handles `[data-filter-group]` attribute — news page uses `news-filters` class instead
- No funding page exists yet → issue #13 deferred to About page FAQ/accordion styling

---

## Implementation Plan

### Issue 1 — Homepage hero "Member Login" pill mobile padding
- **File**: `src/assets/css/styles.css`
- **Fix**: Add `padding-bottom: var(--space-8)` to `.hero` at ≤480px; ensure `.hero-actions` has bottom breathing room
- **Acceptance**: ≤414px → ≥16-24px padding below pill, no overlap, no desktop regression

### Issue 2 — Homepage events mobile layout
- **File**: `src/assets/css/styles.css`
- **Fix**: At ≤640px, stack `.event-item` vertically; make event content full-width; position CTA below content
- **Acceptance**: ≤414px → single-column stack, clear hierarchy, no empty gutters

### Issue 3 & 4 — Icon alternatives (Home "How we can help" + About "What we do")
- **Deliverable**: Document 3 icon candidates per icon in `addon-ux-log.md`
- **Action**: Replace current generic icons with healthcare-appropriate Lucide alternatives
- **Acceptance**: Documented source/license/rationale; inline SVG; contrast verified

### Issue 5 — Support page spacing
- **File**: `src/support/index.njk`, `src/assets/css/styles.css`
- **Fix**: Remove inline `style` attributes; use `.section` spacing consistently; reduce gap after alert box
- **Acceptance**: Consistent 24-40px section spacing on mobile; no oversized gaps

### Issue 6 — Cameron Fund "$" → "£"
- **File**: `src/support/index.njk`
- **Fix**: Replace dollar-sign SVG path with pound-sterling path
- **Acceptance**: Shows "£" clearly at all sizes; accessible title updated

### Issue 7 — Support "Key contact" box padding
- **File**: `src/support/index.njk`, `src/assets/css/styles.css`
- **Fix**: Convert inline styles to component class; ensure internal padding at ≤375px
- **Acceptance**: Clear breathing room; no text collisions at narrow widths

### Issue 8 — News page layout
- **File**: `src/news/index.njk`, `src/assets/css/styles.css`, `src/_includes/partials/news-card.njk`
- **Fix**: Add compact list variant for mobile; reduce image prominence; improve information density
- **Acceptance**: 2 layout variants documented; primary chosen; improved scannability

### Issue 9 — News filter tags functionality
- **File**: `src/news/index.njk`, `src/assets/js/main.js`
- **Fix**: Add `data-filter-group="news-list"` to filter container; ensure JS picks up chips; add active state + ARIA
- **Acceptance**: Click filters instantly; "All" resets; active highlighted; keyboard focusable

### Issue 10 — News post template redesign
- **File**: `src/_includes/layouts/news-post.njk`, `src/assets/css/styles.css`
- **Fix**: Add page hero with breadcrumb; constrain content width; proper spacing; well-padded back button
- **Acceptance**: No oversized calendar icon; ~65-75ch reading width; consistent spacing; back button padded

### Issue 11 — Events accordion (past minutes)
- **File**: `src/events/index.njk`, `src/assets/css/styles.css`
- **Fix**: Convert `<button class="accordion-btn">` to native `<details>/<summary>` pattern matching existing CSS; add ARIA
- **Acceptance**: Functional toggle; keyboard nav; consistent border/radius; no visual clashes

### Issue 12 — Breadcrumbs
- **File**: `src/_includes/partials/breadcrumb.njk` (new), affected page templates
- **Fix**: Create reusable breadcrumb partial with `<nav aria-label="Breadcrumb"><ol>` semantics; add to all internal pages
- **Acceptance**: Semantic HTML; "Home" clickable; `aria-current="page"`; visually consistent

### Issue 13 — Funding/FAQ accordion styling
- **Note**: No standalone funding page exists. Applied to About page and Events page accordion styles.
- **Fix**: Align `.accordion` border-radius with boxy design language (use `--radius-md` not `--radius-lg`)
- **Acceptance**: Consistent corner style; clear heading hierarchy

---

## Test Plan

### Viewports
320px, 360px, 375px, 390px, 414px, 768px, 1024px, 1280px

### Accessibility
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Focus order matches visual order
- Screen reader: landmarks, breadcrumbs, accordions, filters
- Contrast ≥ WCAG AA (4.5:1 for text)

### Pages to verify
Home, About, About/Funding, Support, News (list + single post), Events, Contact, Guidance, Members, Vacancies

---

## Commit Log

| Commit | Issues | Description |
|--------|--------|-------------|
| `8ba95ef` | #1, #2, #8, #10, #12, #13 | CSS — hero mobile padding, event mobile layout, news styles, post template, breadcrumb, accordion radius |
| `1dfe867` | #6, #9, #10, #11, #12 | Templates — breadcrumb partial, news filters, post layout, accordion, £ icon |
| `22c7ad2` | #3, #4, #5, #7 | Icons and support page spacing |
| `edb1a99` | #12, #13 | Funding page breadcrumb + accordion to native details/summary |
| `72ec7b3` | #12 | Breadcrumb consistency — contact, guidance, members, vacancies |

## Acceptance Criteria Status

| Issue | Status | Commit(s) |
|-------|--------|-----------|
| #1 Hero pill mobile | Done | `8ba95ef` |
| #2 Events mobile | Done | `8ba95ef` |
| #3 Home icons | Done | `22c7ad2` |
| #4 About icons | Done | `22c7ad2` |
| #5 Support spacing | Done | `22c7ad2` |
| #6 Cameron Fund £ | Done | `1dfe867` |
| #7 Key contact padding | Done | `22c7ad2` |
| #8 News layout | Done | `8ba95ef` |
| #9 News filters | Done | `1dfe867` |
| #10 News post template | Done | `8ba95ef`, `1dfe867` |
| #11 Events accordion | Done | `1dfe867` |
| #12 Breadcrumbs | Done | `8ba95ef`, `1dfe867`, `edb1a99`, `72ec7b3` |
| #13 Accordion radius | Done | `8ba95ef`, `edb1a99` |
