# TEST-NOTES.md — UI Mobile Polish Sprint

## Test Environment

- **Build**: Eleventy v3.1.2, 20 pages, 0 errors
- **Date**: 2026-03-09

## Pages Tested

### Homepage (`/`)
- [x] Hero section: "Member Login" pill has breathing room at 320–414px
- [x] Event items: stack vertically at ≤640px, date badge goes horizontal
- [x] "How we can help" icons: healthcare-themed SVGs render at all sizes
- [x] No horizontal scroll at 320px

### About (`/about/`)
- [x] Breadcrumb renders via reusable partial
- [x] "What We Do" icons replaced with medical alternatives
- [x] No layout shift from icon swap

### About / Funding (`/about/funding/`)
- [x] Multi-level breadcrumb: Home › About Us › How We're Funded
- [x] All 5 FAQ accordion items use native `<details>/<summary>`
- [x] Accordion opens/closes without JS
- [x] `--radius-md` (8px) corners — consistent boxy language

### Support (`/support/`)
- [x] Breadcrumb via reusable partial
- [x] Intro section uses CSS classes (no inline styles)
- [x] Confidence alert uses `.support-confidence-alert` class
- [x] Cameron Fund icon shows "£" not "$"
- [x] Key contact box has adequate padding at 375px
- [x] Section spacing consistent at mobile widths

### News listing (`/news/`)
- [x] Breadcrumb renders
- [x] Filter chips wired to `data-filter-group="news-list"` + `data-category` attributes
- [x] Clicking a category chip filters the list instantly
- [x] "All" chip resets the view
- [x] Active chip has visual highlight
- [x] No-results message shows when category has no items
- [x] `?category=slug` deep-link pre-selects the matching chip
- [x] Mobile compact layout: images hidden, list-style cards at ≤640px

### News post (`/news/*/`)
- [x] Page hero header with breadcrumb (Home › News › Title)
- [x] Meta shows category badge + date
- [x] Content constrained to ~70ch reading width
- [x] Back button padded and accessible
- [x] No oversized calendar icon

### Events (`/events/`)
- [x] Breadcrumb via reusable partial
- [x] Past meeting minutes accordion uses `<details>/<summary>`
- [x] Accordion functional without JS
- [x] Keyboard navigable (Tab to summary, Enter/Space to toggle)

### Contact (`/contact/`)
- [x] Breadcrumb converted from inline to reusable partial

### Guidance (`/guidance/`)
- [x] Breadcrumb converted from inline to reusable partial

### Members (`/members/`)
- [x] Breadcrumb converted from inline to reusable partial

### Vacancies (`/vacancies/`)
- [x] Breadcrumb converted from inline to reusable partial

## Viewports Checked

| Width | Represents | Checked |
|-------|-----------|---------|
| 320px | iPhone SE / small | Yes |
| 375px | iPhone 12 mini | Yes |
| 390px | iPhone 14 | Yes |
| 414px | iPhone 8 Plus | Yes |
| 640px | Breakpoint boundary | Yes |
| 768px | iPad portrait | Yes |
| 1024px | iPad landscape / small desktop | Yes |
| 1280px | Desktop | Yes |

## Accessibility Checks

- [x] Breadcrumbs: `<nav aria-label="Breadcrumb">`, `<ol>` list, `aria-current="page"` on current
- [x] Accordions: native `<details>/<summary>` — keyboard accessible by default
- [x] Filter chips: `aria-pressed` states, focusable
- [x] News no-results: uses `hidden` attribute (screen-reader respects)
- [x] Icons: decorative SVGs have `aria-hidden="true"`, Cameron Fund SVG has `<title>` element
- [x] Contrast: all text on design-token backgrounds meets WCAG AA (4.5:1)

## Known Limitations

- Filter deep-linking (`?category=slug`) does not update the URL when clicking chips (no pushState)
- News compact mobile layout hides images entirely — acceptable trade-off for information density
- `main.css` and `components.css` dev files were not updated (only `styles.css` is production)
