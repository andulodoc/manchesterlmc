# Fix Plan — 6 Post-Migration Issues

## Context
After the Eleventy migration, six issues were identified through browser testing. This plan addresses each one with targeted, minimal fixes.

---

## Issue 1 — Hero: Large space below CTA buttons

**Root cause:** `src/assets/css/main.css` is missing CSS rules for `.hero-inner` and `.hero-visual`. Without them, both divs are `display: block`, so `.hero-visual` (the decorative logo mark) stacks vertically below `.hero-content`, creating visible dead space in the hero. The original static site's CSS had these rules; they were never ported.

**Fix:** Add to `src/assets/css/main.css` (after the existing `.hero-content` rule):
```css
.hero-inner {
  display: flex;
  align-items: center;
  gap: var(--space-12);
}
.hero-visual {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-logo-mark {
  width: 220px;
  height: 220px;
  opacity: 0.18;
  filter: brightness(10);
}
@media (max-width: 768px) {
  .hero-visual { display: none; }
}
```
This gives a two-column hero (text + decorative logo mark) on desktop, hidden on mobile. The low opacity and brightness-filter make it a subtle background accent.

---

## Issue 2 — Homepage: Only 1 featured news card shown

**Root cause:** Only 1 markdown file exists in `src/content/news/` with `featured: true`. The `collections.featuredNews` loop correctly limits to 3, but there's only 1 item to show. The "very large arrow" is the `link-arrow` "All News" anchor in the section header, which visually expands when the grid below it is nearly empty.

**Fix:** Add 2 more news markdown files to `src/content/news/`, both with `featured: true`, matching the placeholder articles from the old static HTML:

**`src/content/news/2026-02-10-manchester-icb-february-update.md`**
```yaml
title: "Manchester ICB Meeting — February 2026 Update"
date: 2026-02-10
tags: [news]
category: local
featured: true
excerpt: "Key outcomes from the February ICB meeting, including updates on integrated neighbourhood teams, ARRS funding allocations, and CQC inspections."
```

**`src/content/news/2026-02-05-collective-action-nhse-requests.md`**
```yaml
title: "Collective Action: Guidance on NHSE Requests"
date: 2026-02-05
tags: [news]
category: nhs-policy
featured: true
excerpt: "Following the BMA ballot result, Manchester LMC has issued guidance on participating in collective action and responding to NHSE data requests."
```

---

## Issue 3 — News listing: Placeholder items lost

**Root cause:** Same as Issue 2. The news listing page uses `collections.news` (all items tagged `news`). With only 1 markdown file, only 1 card appears.

**Fix:** The 2 new markdown files added in Issue 2 fix this too (they are tagged `[news]`), giving 3 total items on the news listing page. Add body content to each file so the news post detail pages are meaningful.

---

## Issue 4 — New SVG bee and staff logo missing

**Root cause:** Two different `logo.svg` files exist:
- `src/assets/images/logo.svg` (909 bytes) — simple shield + text, 160×48 viewBox. Used by Eleventy build.
- `assets/images/logo.svg` (2505 bytes) — circular badge with 2 honeybees + caduceus staff, 200×200 viewBox. Used by old static site — this is the "new" logo the user refers to.

The Eleventy passthrough only copies from `src/assets/`, so the bee logo is never published.

Additionally, `nav.njk` was updated during migration to use `width="160" height="48"` (matching the shield format), but the bee logo is a square icon that needs `width="44" height="44"`.

**Fix:**
1. Overwrite `src/assets/images/logo.svg` with the content of `assets/images/logo.svg` (the bee + staff circular logo).
2. In `src/_includes/partials/nav.njk`: change `width="160" height="48"` → `width="44" height="44"` on the logo `<img>`.
3. In `src/index.njk`: the `<img src="/assets/images/logo.svg" class="hero-logo-mark">` in `.hero-visual` will now use the new circular logo, which works well as a decorative accent in the hero.

---

## Issue 5 — Hamburger: menu not visible after scrolling (iOS scroll-through bug)

**Root cause:** The mobile nav JS uses `body.style.overflow = 'hidden'` to lock body scroll when the menu opens. On iOS Safari, this has no effect — touch-scroll events pass through to the body even with `overflow: hidden`, so the user can scroll the page behind the open menu. The menu IS there (position: fixed, top: 72px, full height) but the page scrolling behind it makes the experience broken.

**Fix:** Update the mobile nav toggle IIFE in `src/assets/js/main.js` to use the standard iOS scroll-lock technique:
```javascript
// When opening:
const scrollY = window.scrollY;
body.style.position = 'fixed';
body.style.top = `-${scrollY}px`;
body.style.width = '100%';
body.dataset.scrollY = scrollY;

// When closing:
const savedY = parseInt(body.dataset.scrollY || '0', 10);
body.style.position = '';
body.style.top = '';
body.style.width = '';
window.scrollTo(0, savedY);
```
This replaces the `body.style.overflow` approach and works across all browsers including iOS Safari. The nav stays fixed; body scroll is truly locked.

---

## Issue 6 — Search: button missing from mobile menu

**Root cause:** The search trigger button (`.nav-search-btn`) is only in `.nav-utility` (desktop), which is hidden at ≤1024px breakpoint. The mobile nav (`.nav-mobile`) has no search trigger. The search JS uses `querySelector` (single element), so even adding a second button would not be wired up.

**Fix:**
1. In `src/_includes/partials/nav.njk`: add a search button to the `.nav-mobile-utility` section:
```html
<button class="nav-search-btn btn btn--outline" aria-label="Search site" style="justify-content:center;gap:var(--space-2);">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  Search
</button>
```

2. In `src/assets/js/main.js`: change the search overlay trigger from `querySelector` to `querySelectorAll`:
```javascript
// Before:
const searchBtn = document.querySelector('.nav-search-btn');
if (searchBtn) searchBtn.addEventListener('click', openOverlay);

// After:
document.querySelectorAll('.nav-search-btn').forEach(btn => {
  btn.addEventListener('click', openOverlay);
});
```
The search overlay closes the mobile nav automatically since clicking `.nav-search-btn` fires `openOverlay` which renders the overlay on top of everything.

---

## Files to modify

| File | Issue(s) |
|------|----------|
| `src/assets/css/main.css` | 1 |
| `src/content/news/2026-02-10-manchester-icb-february-update.md` | 2, 3 (create) |
| `src/content/news/2026-02-05-collective-action-nhse-requests.md` | 2, 3 (create) |
| `src/assets/images/logo.svg` | 4 (overwrite) |
| `src/_includes/partials/nav.njk` | 4, 6 |
| `src/assets/js/main.js` | 5, 6 |

---

## Verification

After changes, run `npm run start` and check:
1. `/` — hero shows text left + circular bee logo right (desktop), no dead space below buttons; mobile shows only text (no logo)
2. `/` — "Latest News" section shows 3 news cards
3. `/news/` — news listing shows 3 articles
4. Nav: bee+staff circular logo appears at 44×44 in nav bar (all pages)
5. Mobile: open nav, tap Search — search overlay appears
6. Mobile: scroll page down, tap hamburger — menu opens, page body is locked (no scroll-through)
