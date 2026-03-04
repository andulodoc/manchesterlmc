# UI/UX Evolution Plan — Manchester LMC
**Generated:** 2026-03-04
**Audited by:** ui-ux-pro-max v2.0.1 + manual codebase analysis
**Design authority:** Accessible & Ethical — WCAG AAA, government/healthcare pattern
**Stack:** Vanilla HTML/CSS/JS (Eleventy 11ty v3, Nunjucks)

---

## Executive Summary

The Manchester LMC site has a solid technical foundation: a well-structured CSS custom property system, SVG icons throughout, a skip link, ARIA labels on navigation, and a coherent spacing scale. The Eleventy architecture is clean and maintainable.

However, the audit identified **6 critical accessibility gaps**, **5 high-priority UX/performance issues**, and **6 medium/low improvements** that collectively represent meaningful risk for a public-sector healthcare site that must meet WCAG 2.1 AA (and ideally AAA) standards.

---

## Priority Matrix

| Priority | Count | Category |
|----------|-------|----------|
| 🔴 Critical | 6 | Accessibility / Compliance |
| 🟠 High | 5 | Performance / UX Consistency |
| 🟡 Medium | 5 | Typography / Color / Visual |
| 🟢 Low | 3 | Enhancement / SEO |

---

## 🔴 CRITICAL — Accessibility & Compliance

### C-1: No `prefers-reduced-motion` support
**Rationale:** NHS/government sites serve users with vestibular disorders. Failing to honour `prefers-reduced-motion` violates WCAG 2.3.3 (AAA) and is poor practice at AA. The scroll-reveal fade/translate and the stat counter animations are the offenders.

**Files affected:**
- `src/assets/css/main.css` (lines 954–970, `.reveal` block)
- `src/assets/js/main.js` (scroll reveal IIFE and stat counter IIFE)

**Implementation snippet — CSS:**
```css
/* Add at end of main.css */
@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Implementation snippet — JS (stat counter guard):**
```js
// Wrap counter animation in a motion check
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  // Set final values immediately, skip animation
  counters.forEach(el => {
    el.textContent = el.dataset.count + (el.dataset.suffix || '');
  });
  return;
}
```

---

### C-2: Disclaimer modal — missing focus trap and role=alertdialog
**Rationale:** When the disclaimer overlay opens, keyboard focus is not trapped inside it. A user can Tab past the modal into hidden page content. This breaks WCAG 2.1 SC 2.1.2 (No Keyboard Trap) *in reverse* — the trap must work *in*, not just *out*. Additionally, because this is a blocking prompt requiring a decision, `role="alertdialog"` is semantically more correct than `role="dialog"`.

**Files affected:**
- `src/_includes/layouts/base.njk` (line 39, `role="dialog"`)
- `src/assets/js/main.js` (disclaimer IIFE)

**Implementation snippet — HTML:**
```html
<!-- Change role="dialog" to role="alertdialog" -->
<div id="disclaimer-overlay" class="disclaimer-overlay"
     role="alertdialog"
     aria-modal="true"
     aria-labelledby="disclaimer-title"
     aria-describedby="disclaimer-desc">
```

**Implementation snippet — JS (focus trap):**
```js
// In the disclaimer open handler, after showing the overlay:
const focusable = overlay.querySelectorAll(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);
const first = focusable[0];
const last = focusable[focusable.length - 1];
first.focus();

overlay.addEventListener('keydown', function trapFocus(e) {
  if (e.key !== 'Tab') return;
  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
```

---

### C-3: Muted text colour contrast may fail WCAG AA
**Rationale:** `--colour-muted: #5a6e7f` on `--colour-white: #ffffff` yields a contrast ratio of approximately **4.4:1** — fractionally below the WCAG AA minimum of 4.5:1 for normal text. This colour is used extensively: `.nav-logo-sub`, `.news-card-excerpt`, `.event-desc`, `.form-hint`, `.filter-results-count`, `.accordion-panel`, and more.

**Files affected:**
- `src/assets/css/main.css` (line 17, `:root` definition)

**Implementation snippet:**
```css
/* Before */
--colour-muted: #5a6e7f;

/* After — darkened slightly to achieve ~4.6:1 contrast on white */
--colour-muted: #536374;
```

> **Verification:** Use the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) with `#536374` on `#ffffff` before committing.

---

### C-4: Footer bottom text contrast critically low
**Rationale:** `.footer-bottom` uses `color: rgba(255,255,255,0.45)` on `--colour-primary-dark: #082b3d`. At ~45% opacity white on a near-black background, the effective contrast is approximately **3.8:1** — failing AA for normal-sized text (copyright notice, policy links). The `rgba(255,255,255,0.65)` used for `.footer-col ul a` also falls below 4.5:1.

**Files affected:**
- `src/assets/css/main.css` (lines 921–930, `.footer-bottom`)

**Implementation snippet:**
```css
/* Before */
.footer-bottom { color: rgba(255, 255, 255, 0.45); }
.footer-col ul a { color: rgba(255, 255, 255, 0.65); }

/* After */
.footer-bottom { color: rgba(255, 255, 255, 0.62); }    /* ~4.5:1 on #082b3d */
.footer-col ul a { color: rgba(255, 255, 255, 0.78); }  /* ~5.5:1 on #082b3d */
```

---

### C-5: News filter chip state — colour is the only indicator
**Rationale:** Active filter chips (`.filter-chip.active`) use background/border colour alone to distinguish the selected state. Users with colour-blindness or on high-contrast systems cannot distinguish active from inactive without a secondary indicator (e.g., bold weight, checkmark icon, or underline). This fails WCAG 1.4.1 (Use of Color).

**Files affected:**
- `src/assets/css/components.css` (lines 892–896, `.filter-chip.active`)
- `src/assets/js/main.js` (filter chip toggle, add `aria-pressed`)

**Implementation snippet — CSS:**
```css
.filter-chip.active {
  background-color: var(--colour-primary);
  border-color: var(--colour-primary);
  color: var(--colour-white);
  font-weight: 700;          /* ADD: weight change as second indicator */
}
```

**Implementation snippet — JS:**
```js
// When toggling chips, also toggle aria-pressed
chip.setAttribute('aria-pressed', chip.classList.contains('active') ? 'true' : 'false');
```

---

### C-6: Missing `aria-live` region for filter results
**Rationale:** When a user applies a news/guidance filter, the results count updates visually (`filter-results-count`) but is never announced to screen readers. This breaks WCAG 4.1.3 (Status Messages).

**Files affected:**
- `src/assets/css/components.css` (`.filter-results-count`, line 898)
- Corresponding Nunjucks template that renders the filter (guidance/news pages)

**Implementation snippet — HTML:**
```html
<!-- Add role and aria-live to the results count element -->
<p class="filter-results-count"
   role="status"
   aria-live="polite"
   aria-atomic="true">
  Showing 12 resources
</p>
```

---

## 🟠 HIGH — Performance & UX Consistency

### H-1: Images missing lazy loading and alt text audit
**Rationale:** Images in news cards, profile cards, and the hero logo mark lack `loading="lazy"`. On a content-heavy page this delays LCP (Largest Contentful Paint). Additionally, the logo in `nav.njk` uses `alt=""` (decorative) which is acceptable since the parent `<a>` has `aria-label="Manchester LMC home"` — but this should be documented as intentional.

**Files affected:**
- `src/_includes/partials/news-card.njk`
- `src/_includes/partials/nav.njk` (line 7)
- Any template rendering `profile-card-photo img`, `featured-article-image img`

**Implementation snippet:**
```html
<!-- news-card.njk -->
<img src="{{ article.data.image }}"
     alt="{{ article.data.imageAlt or article.data.title }}"
     loading="lazy"
     decoding="async"
     width="400" height="200">
```

---

### H-2: Undefined CSS variable `--radius` in components.css
**Rationale:** Line 1652 of `components.css` references `border-radius: var(--radius)` inside `.member-resource-item`. This variable is never defined in `:root` — only `--radius-sm`, `--radius-md`, `--radius-lg`, etc. exist. This silently falls back to `0`, giving `.member-resource-item` square corners inconsistently with the rest of the design.

**Files affected:**
- `src/assets/css/components.css` (line 1652)

**Implementation snippet:**
```css
/* Before */
.member-resource-item {
  border-radius: var(--radius);   /* BUG: undefined */
}

/* After */
.member-resource-item {
  border-radius: var(--radius-md);  /* consistent with other cards */
}
```

---

### H-3: Extensive inline styles in index.njk break maintainability
**Rationale:** `src/index.njk` contains numerous inline `style=""` attributes for layout (`display:flex`, `gap:var(--space-4)`, `flex-shrink:0`, `align-self:center`, `border-color:rgba(...)`, `color:rgba(...)`). Inline styles override the cascade, cannot be overridden by media queries or user stylesheets, and prevent theming. They also violate a strict Content Security Policy.

**Files affected:**
- `src/index.njk` (lines 152, 173, 195, 217, 313–315, 322, 331, 335–343)
- `src/assets/css/components.css` or `main.css` (add the missing utility classes)

**Implementation snippet — extract to CSS:**
```css
/* Add to components.css */
.events-list { display: flex; flex-direction: column; gap: var(--space-4); }
.event-register-btn { flex-shrink: 0; align-self: center; }
.newsletter-actions { display: flex; gap: var(--space-4); flex-wrap: wrap; margin-top: var(--space-6); }
.newsletter-issue-label { font-size: 0.8125rem; color: rgba(255,255,255,0.6); }
```

```html
<!-- index.njk — replace inline styles with classes -->
<div class="events-list">
  <div class="event-item reveal">
    ...
    <a href="/events/" class="btn btn--outline btn--sm event-register-btn">Register</a>
  </div>
</div>
```

---

### H-4: Mixed spacing approach in components.css (members section)
**Rationale:** The members-area components (`.members-layout`, `.auth-tab-btn`, `.member-resource-item`, `.benefit-row`) use hardcoded `rem` values (`2rem`, `0.75rem 1.5rem`, `1rem`, `0.75rem`) instead of the CSS custom property scale (`--space-*`). This breaks the design token system, making global spacing adjustments impossible.

**Files affected:**
- `src/assets/css/components.css` (lines 1605–1707)

**Implementation snippet:**
```css
/* Before */
.members-layout { gap: 2rem; }
.auth-tab-btn { padding: 0.75rem 1.5rem; }
.member-resource-item { gap: 1rem; padding: 1rem; }
.benefit-row { gap: 0.75rem; padding: 0.75rem 0; }

/* After */
.members-layout { gap: var(--space-8); }
.auth-tab-btn { padding: var(--space-3) var(--space-6); }
.member-resource-item { gap: var(--space-4); padding: var(--space-4); }
.benefit-row { gap: var(--space-3); padding: var(--space-3) 0; }
```

---

### H-5: Social section is a non-functional placeholder
**Rationale:** The "Follow Us on X (Twitter)" section in `index.njk` renders a static grey box. This is visually prominent and occupies significant scroll-depth real estate while delivering no value. A full section just to say "we have a Twitter" is negative UX — it erodes trust and signals an incomplete site. Either implement the X timeline widget properly, or replace with a "Recent Updates" static posts panel or remove the section entirely.

**Files affected:**
- `src/index.njk` (lines 328–344)

**Recommended action:** Replace with a hand-curated "Recent Updates" or "In the News" section, or remove. If the X embed is wanted, use the [official Twitter publish widget](https://publish.twitter.com/).

**Minimal replacement snippet:**
```html
<!-- Replace the grey placeholder section with a proper recent-updates strip -->
<section class="section" aria-labelledby="updates-heading">
  <div class="container">
    <div class="section-header section-header--center">
      <span class="section-eyebrow">Social</span>
      <h2 id="updates-heading">Find Us Online</h2>
    </div>
    <div class="flex-center gap-4" style="flex-wrap:wrap;">
      <a href="https://twitter.com/manchesterlmc" class="btn btn--outline" target="_blank" rel="noopener noreferrer">
        <!-- X/Twitter SVG icon -->
        Follow @ManchesterLMC
      </a>
    </div>
  </div>
</section>
```

---

## 🟡 MEDIUM — Typography, Color & Visual Hierarchy

### M-1: Font pairing — consider a more institutional option
**Rationale:** The current pairing (Fraunces serif heading + Inter sans-serif body) is visually distinctive and well-executed. However, ui-ux-pro-max recommends **Lexend + Source Sans 3** for government/healthcare — Lexend was specifically designed to reduce visual crowding and improve reading speed (backed by research), making it a stronger choice for an NHS-adjacent audience including GPs who may be time-pressured and reading dense clinical/legal content. This is a considered choice, not a bug.

**Files affected:**
- `src/assets/css/main.css` (lines 7, 29–30)
- `src/_includes/layouts/base.njk` (lines 10–12)

**Implementation snippet (if adopting):**
```css
/* main.css — replace font import */
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');

/* Update custom properties */
--font-heading: 'Lexend', system-ui, sans-serif;
--font-body:    'Source Sans 3', system-ui, -apple-system, sans-serif;
```

> **Note:** Fraunces is not wrong — the decision to change or keep should factor in brand identity. If Fraunces is intentional brand positioning, keep it and document the exception.

---

### M-2: Hero lead text opacity below recommended threshold
**Rationale:** `.hero-lead` uses `color: rgba(255, 255, 255, 0.82)` on a dark navy gradient. At 82% opacity white on `#082b3d`, the contrast ratio is approximately **9.2:1** — technically passing AA. However, the `--colour-secondary: #1a7fa0` (cyan-blue) text in some contexts on `--colour-neutral: #f2f6f9` (very light blue-grey) achieves only ~**3.5:1** — failing AA for normal text. Specifically `a { color: var(--colour-secondary) }` on the neutral background sections.

**Files affected:**
- `src/assets/css/main.css` (line 115, link colour)

**Implementation snippet:**
```css
/* Darken secondary for link use on light backgrounds */
a {
  color: var(--colour-primary);        /* #0d3d56 → ~8:1 on white, ~7:1 on neutral */
  text-decoration: underline;          /* also add underline for accessibility */
  text-decoration-color: rgba(13, 61, 86, 0.3);
}
a:hover {
  color: var(--colour-secondary);
  text-decoration-color: var(--colour-secondary);
}
```

---

### M-3: Card hover transforms may cause layout instability
**Rationale:** Multiple card types (`.card`, `.news-card`, `.service-card`, `.profile-card`) use `transform: translateY(-4px)` on hover alongside `box-shadow`. While `transform` is GPU-accelerated and correct, the `-4px` Y shift can cause adjacent cards in a grid to visually "collide" with neighbours and may trigger layout recalculations on older browsers. The ui-ux-pro-max rule **"Stable hover states"** flags this pattern.

**Files affected:**
- `src/assets/css/components.css` (lines 161–165, 186–189, 395–400, 911–916)

**Implementation snippet:**
```css
/* Option A: Reduce shift to 2px (less jarring) */
.card:hover,
.news-card:hover,
.service-card:hover,
.profile-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Option B: Shadow only, no translate (most stable) */
.card:hover { box-shadow: var(--shadow-xl); transform: none; }
```

---

### M-4: Missing Open Graph and canonical meta tags
**Rationale:** The base layout has no `og:title`, `og:description`, `og:image`, `og:type`, `twitter:card`, or `<link rel="canonical">`. When articles or pages are shared on social media or indexed by search engines, no rich preview is generated. For a healthcare body sharing clinical updates and news, this is a missed opportunity.

**Files affected:**
- `src/_includes/layouts/base.njk` (head block, after line 8)

**Implementation snippet:**
```html
<!-- Add to <head> in base.njk -->
<link rel="canonical" href="{{ site.url }}{{ page.url }}">
<meta property="og:title" content="{% if title %}{{ title }} — {% endif %}{{ site.name }}">
<meta property="og:description" content="{{ description or site.tagline }}">
<meta property="og:type" content="website">
<meta property="og:url" content="{{ site.url }}{{ page.url }}">
<meta name="twitter:card" content="summary">
<meta name="twitter:site" content="@manchesterlmc">
```

---

### M-5: Role card hover uses `transform: translateY(-4px)` without `cursor: pointer`
**Rationale:** `.role-card` elements are `<a>` tags so they inherit pointer cursor from the browser default — good. However, the `.filter-chip` elements are `<button>` elements styled without explicit `cursor: pointer` in some browser resets. Verify `cursor: pointer` is present (it is in the current CSS — this is a **pass**). Document as confirmed.

**Status: PASS** — no change needed.

---

## 🟢 LOW — Enhancement

### L-1: Stat counter animation starts visually from "0" in DOM
**Rationale:** The stat counter elements render `0` in HTML (`<div class="stat-number" data-count="400">0</div>`). If JS is slow to execute or disabled, users see "0" for all statistics. Additionally, when JavaScript runs, the count-up starts immediately on scroll, but there's no check for whether the element is already in-viewport on page load.

**Files affected:**
- `src/index.njk` (lines 97–110, stat-number elements)
- `src/assets/js/main.js` (stat counter IIFE)

**Implementation:** Render initial values in the data-count format and let JS enhance. Add `tabindex="0"` to stat items so screen readers announce final values.

---

### L-2: Breadcrumb not rendered with structured data
**Rationale:** The `page-hero` component has `.breadcrumb` CSS styles but no `BreadcrumbList` JSON-LD schema. Adding schema improves search result display (rich snippets) and helps Google understand the site hierarchy.

**Files affected:**
- `src/_includes/layouts/base.njk` (scripts block)
- Inner page templates that use `page-hero`

**Implementation snippet (in base.njk):**
```html
{% if breadcrumbs %}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {% for crumb in breadcrumbs %}
    {
      "@type": "ListItem",
      "position": {{ loop.index }},
      "name": "{{ crumb.name }}",
      "item": "{{ site.url }}{{ crumb.url }}"
    }{% if not loop.last %},{% endif %}
    {% endfor %}
  ]
}
</script>
{% endif %}
```

---

### L-3: Search overlay — no results returned to screen readers
**Rationale:** The search overlay (`.search-overlay`) is a sophisticated component with keyboard hints, result icons, and a results list. However, search results are rendered dynamically without an `aria-live` region, so screen reader users cannot hear results as they appear.

**Files affected:**
- `src/assets/css/components.css` (`.search-results`, line 1468)
- `src/assets/js/main.js` (search IIFE)

**Implementation snippet:**
```html
<!-- Add role and aria-live to the results container -->
<div class="search-results" role="listbox" aria-live="polite" aria-label="Search results">
  <!-- results rendered here -->
</div>
```

---

## Phase 3: Implementation Workflow

For **each change** in this plan, follow this workflow:

### Step 1 — Local Development
```bash
# Start the dev server with live reload
npm run start
# Site available at http://localhost:8080
```

### Step 2 — Verification Checklist
After implementing each change, verify in `_site/`:

```bash
# Build production output
npm run build

# Check _site/ folder was generated
ls _site/
```

**Browser checks:**
- [ ] Test at 375px (iPhone SE), 768px (iPad), 1024px (laptop), 1440px (desktop)
- [ ] Test with browser DevTools → Rendering → "Emulate prefers-reduced-motion: reduce"
- [ ] Run Chrome Lighthouse Accessibility audit (target ≥ 95)
- [ ] Test keyboard navigation: Tab through all interactive elements
- [ ] Verify focus ring visible on all focusable elements
- [ ] Check colour contrast with DevTools → CSS Overview or axe extension

**Screen reader test (recommended):**
- macOS: VoiceOver (Cmd+F5) + Safari
- Windows: NVDA + Firefox (free)

### Step 3 — Git Operations

```bash
# Stage specific files only (never git add -A for a site with credentials risk)
git add src/assets/css/main.css src/assets/js/main.js

# Commit with descriptive message
git commit -m "fix(a11y): add prefers-reduced-motion support for reveal and counters"

# Additional commits per logical change group:
git commit -m "fix(a11y): increase muted text contrast to pass WCAG AA"
git commit -m "fix(a11y): add focus trap and alertdialog role to disclaimer modal"
git commit -m "fix(a11y): add aria-pressed and weight indicator to filter chips"
git commit -m "fix(css): replace undefined --radius variable with --radius-md"
git commit -m "refactor(css): migrate members-section hardcoded values to spacing scale"
git commit -m "refactor(template): extract inline styles from index.njk to CSS classes"
git commit -m "feat(seo): add Open Graph and canonical meta tags to base layout"
git commit -m "fix(a11y): add loading=lazy and decoding=async to content images"

# Push to main branch (confirm before executing)
git push origin main
```

---

## Audit Passes — No Action Needed

The following items were checked and found to be correctly implemented:

| Check | Status | Detail |
|-------|--------|--------|
| Skip link | ✅ PASS | Present, correct CSS show-on-focus pattern (`src/assets/css/main.css:992`) |
| Logo alt text | ✅ PASS | `alt=""` is correct — parent `<a>` has `aria-label` |
| ARIA on nav | ✅ PASS | `role="navigation"`, `aria-label="Main navigation"` present |
| SVG icons | ✅ PASS | All icons use inline SVG with `aria-hidden="true"` |
| No emoji icons | ✅ PASS | Zero emoji used as UI elements |
| Focus-visible ring | ✅ PASS | `:focus-visible` with 3px accent outline defined |
| Mobile touch targets | ✅ PASS | Hamburger 40×40px, nav buttons ≥44px |
| Keyboard Escape for mobile nav | ✅ PASS | `keydown` Escape handler present in main.js |
| Z-index scale | ✅ PASS | `--z-nav: 100`, `--z-overlay: 200`, `--z-modal: 300` defined |
| Viewport meta tag | ✅ PASS | `width=device-width, initial-scale=1` present |
| Body font size | ✅ PASS | 16px base, 1rem body — meets minimum |
| Line height | ✅ PASS | `line-height: 1.6` on body (within 1.5–1.75 guideline) |
| Transition duration | ✅ PASS | `--transition-fast: 150ms`, `--transition-base: 200ms` |
| Cursor pointer on buttons | ✅ PASS | All `.btn`, `.filter-chip`, `.accordion-btn` have `cursor: pointer` |
| Form labels | ✅ PASS | `.form-label` uses `display: block` with `for` attribute pattern |
| `sr-only` class | ✅ PASS | Properly defined clip-rect technique |

---

## Recommended Implementation Order

```
Week 1 (Critical fixes, no visual change):
  C-1 → prefers-reduced-motion
  C-3 → muted text contrast (#536374)
  C-4 → footer opacity contrast
  H-2 → fix undefined --radius CSS variable

Week 2 (Accessibility + UX):
  C-2 → disclaimer focus trap
  C-5 → filter chip aria-pressed + font-weight
  C-6 → aria-live on filter results
  H-1 → lazy loading + alt text audit

Week 3 (Maintainability):
  H-3 → extract inline styles from index.njk
  H-4 → members section spacing variables
  M-4 → Open Graph / canonical meta

Week 4+ (Enhancement, optional):
  M-1 → font pairing consideration (requires design approval)
  M-2 → link colour on neutral backgrounds
  M-3 → card hover stability
  H-5 → social section replacement
  L-1, L-2, L-3 → low-priority enhancements
```

---

*This plan was generated by reading the actual source files and cross-referencing against ui-ux-pro-max v2.0.1 design principles. All line numbers reference the state of the codebase as of the audit date. Re-audit after implementing changes.*
