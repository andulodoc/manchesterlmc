# Manchester LMC — Eleventy Page Migration Plan

> This document is the single source of truth for migrating all remaining static HTML pages
> to Eleventy Nunjucks templates. Execute one Task Block at a time. After each block:
> 1. Verify the build (`npm run start`, visit URLs listed)
> 2. Update the Status column below
> 3. Commit: `git add -A && git commit -m "[commit message]"`
> 4. Ask the user whether to proceed to the next block or clear context

Status key: ⬜ Pending | 🔄 In Progress | ✅ Done

---

## Phase 1 — Infrastructure (COMPLETE — no work needed)

| Task | Status |
|------|--------|
| Eleventy 3 install + `.eleventy.js` config | ✅ Done |
| `base.njk`, `news-post.njk` layouts | ✅ Done |
| `nav.njk`, `footer.njk`, `contact-strip.njk`, `news-card.njk` partials | ✅ Done |
| `src/_data/site.json` global data | ✅ Done |
| `src/assets/` passthrough copy (CSS, JS, images) | ✅ Done |
| `src/news/index.njk` listing page | ✅ Done |
| `src/content/news/` markdown posts + news/featuredNews collections | ✅ Done |
| All Eleventy filters (dateDisplay, badgeClass, categoryName, etc.) | ✅ Done |

---

## Phase 2 — Page Migration

### Block 1 — Homepage

| Field | Value |
|-------|-------|
| **Status** | ⬜ Pending |
| **Source** | `index.html` |
| **Target** | `src/index.njk` |
| **Commit msg** | `Migrate homepage to Eleventy (src/index.njk)` |

**Front matter:**
```yaml
---
layout: layouts/base.njk
title: "Representing and Supporting General Practice in Manchester"
description: "Manchester LMC is the statutory representative body for approximately 400 GPs across 87 practices in Manchester."
mainClass: page-content
showContactStrip: true
showDisclaimer: true
---
```

**Steps:**
1. Read `index.html`
2. Extract everything inside `<main>...</main>` (do not include `<main>` tags — base.njk provides them)
3. Remove the duplicate `<html>`, `<head>`, `<nav>`, `<footer>`, `<script>` blocks
4. Replace hardcoded 3 news cards with dynamic loop:
   ```njk
   {% for article in collections.featuredNews | limit(3) %}
     {% include "partials/news-card.njk" %}
   {% endfor %}
   ```
5. Convert all internal links to clean root-relative URLs (see URL Mapping table)
6. Remove `assets/` prefix → `/assets/`

**Critical attributes to preserve (JS hooks):**
- `data-count`, `data-suffix`, `data-no-format` on stat counter elements
- `.reveal`, `.reveal-delay-1`, `.reveal-delay-2` classes on animated sections

**Verify:**
- `http://localhost:8080/` — hero, stats counter, role strip, 3 news cards, events, services, newsletter, CTA
- Counter animation fires on scroll into stats banner
- Nav links all use clean URLs (no `.html`)

---

### Block 2 — Contact

| Field | Value |
|-------|-------|
| **Status** | ⬜ Pending |
| **Source** | `contact/index.html` |
| **Target** | `src/contact/index.njk` |
| **Commit msg** | `Migrate contact page to Eleventy (src/contact/index.njk)` |

**Front matter:**
```yaml
---
layout: layouts/base.njk
title: Contact Us
description: "Contact Manchester LMC. Reach our team at Oak House, Beswick. Phone, email, and online contact form."
mainClass: page-contact
showContactStrip: false
showDisclaimer: true
---
```

**Steps:**
1. Read `contact/index.html`
2. Extract `<main>` inner content
3. Convert `../` relative paths to `/` root-relative
4. Preserve `data-ajax` on `<form>` tag

**Verify:**
- `http://localhost:8080/contact/` — form, address, hours visible
- No contact-strip at bottom (showContactStrip: false)

---

### Block 3 — About Section (3 pages)

| Field | Value |
|-------|-------|
| **Status** | ⬜ Pending |
| **Sources** | `about/index.html`, `about/team.html`, `about/funding.html` |
| **Targets** | `src/about/index.njk`, `src/about/team.njk`, `src/about/funding.njk` |
| **Commit msg** | `Migrate About section to Eleventy (about, team, funding pages)` |

**Front matter — `src/about/index.njk`:**
```yaml
---
layout: layouts/base.njk
title: About Manchester LMC
description: "About Manchester Local Medical Committee — our role, history, area coverage and relationship with the BMA."
mainClass: page-content
showContactStrip: true
showDisclaimer: true
---
```

**Front matter — `src/about/team.njk`:**
```yaml
---
layout: layouts/base.njk
title: Our Team
description: "Meet the Manchester LMC team — our elected committee members, officers, and administrative staff."
mainClass: page-team
showContactStrip: true
showDisclaimer: true
permalink: /about/team/
---
```

**Front matter — `src/about/funding.njk`:**
```yaml
---
layout: layouts/base.njk
title: "How We're Funded"
description: "How Manchester LMC is funded — levy model, locum subscription, and our constitution."
mainClass: page-funding
showContactStrip: false
showDisclaimer: true
permalink: /about/funding/
---
```

**Steps:**
1. Read each source file, extract `<main>` inner content
2. Internal links in about pages: `../index.html` → `/`, `team.html` → `/about/team/`, `funding.html` → `/about/funding/`, `funding.html#constitution` → `/about/funding/#constitution`
3. Preserve `id="constitution"` anchor on funding page
4. **Update `src/_includes/partials/nav.njk`** — change both the desktop dropdown AND mobile sub-menu:
   - `/about/team.html` → `/about/team/`
   - `/about/funding.html` → `/about/funding/`

**Verify:**
- `http://localhost:8080/about/` — overview, history, coverage map
- `http://localhost:8080/about/team/` — team cards
- `http://localhost:8080/about/funding/` — funding content, `#constitution` anchor works
- Nav About dropdown links go to correct clean URLs

---

### Block 4 — Support Section (3 pages)

| Field | Value |
|-------|-------|
| **Status** | ⬜ Pending |
| **Sources** | `support/index.html`, `support/wellbeing.html`, `support/breach-report.html` |
| **Targets** | `src/support/index.njk`, `src/support/wellbeing.njk`, `src/support/breach-report.njk` |
| **Commit msg** | `Migrate Support section to Eleventy (support, wellbeing, breach-report pages)` |

**Front matter — `src/support/index.njk`:**
```yaml
---
layout: layouts/base.njk
title: "What We Can Do For You"
description: "Manchester LMC provides confidential, expert support for GPs and practice staff — GMC investigations, CQC visits, employment matters, and more."
mainClass: page-support
showContactStrip: true
showDisclaimer: true
---
```

**Front matter — `src/support/wellbeing.njk`:**
```yaml
---
layout: layouts/base.njk
title: Wellbeing Hub
description: "Manchester LMC Wellbeing Hub — mental health support, peer networks, crisis lines, free apps, and financial assistance for GPs."
mainClass: page-wellbeing
showContactStrip: true
showDisclaimer: true
permalink: /support/wellbeing/
---
```

**Front matter — `src/support/breach-report.njk`:**
```yaml
---
layout: layouts/base.njk
title: Report a Contractual Breach
description: "Report a contractual breach to Manchester LMC. All reports treated in strict confidence."
mainClass: page-breach-report
showContactStrip: false
showDisclaimer: true
permalink: /support/breach-report/
---
```

**Steps:**
1. Read each source file, extract `<main>` inner content
2. Preserve `data-ajax` on `<form>` in breach-report.njk
3. Preserve `id="confidential"` on the confidential advisory card in support/index.njk
4. Internal links: `wellbeing.html` → `/support/wellbeing/`, `breach-report.html` → `/support/breach-report/`
5. **Update `src/_includes/partials/nav.njk`** (desktop + mobile):
   - `/support/wellbeing.html` → `/support/wellbeing/`
   - `/support/breach-report.html` → `/support/breach-report/`
6. **Update `src/_includes/partials/footer.njk`**:
   - Same URL fixes for breach-report and wellbeing links

**Verify:**
- `http://localhost:8080/support/` — service cards, `#confidential` anchor
- `http://localhost:8080/support/wellbeing/` — resource sections
- `http://localhost:8080/support/breach-report/` — form, button disables on submit
- Nav Support dropdown uses clean URLs

---

### Block 5 — Guidance

| Field | Value |
|-------|-------|
| **Status** | ⬜ Pending |
| **Source** | `guidance/index.html` |
| **Target** | `src/guidance/index.njk` |
| **Commit msg** | `Migrate Guidance page to Eleventy (src/guidance/index.njk)` |

**Front matter:**
```yaml
---
layout: layouts/base.njk
title: Resource Library
description: "Searchable guidance, policies, and clinical resources for Manchester GPs and practice staff."
mainClass: page-content
showContactStrip: true
showDisclaimer: true
---
```

**Steps:**
1. Read `guidance/index.html`, extract `<main>` inner content
2. **Critical JS hooks — preserve exactly:**
   - `id="guidance-filter"` on the outer filter wrapper
   - `id="document-list"` on the document cards container
   - `id="results-count"` on the count paragraph
   - `data-doc`, `data-category`, `data-title` attributes on every document card
3. If there's an inline `<style>` block in the `<head>` with `#document-list` styles, move those rules to `src/assets/css/components.css` instead

**Verify:**
- `http://localhost:8080/guidance/` — document list renders
- Search input filters documents live
- Category chip "Clinical" shows only clinical docs
- Results count updates

---

### Block 6 — Events

| Field | Value |
|-------|-------|
| **Status** | ⬜ Pending |
| **Source** | `events/index.html` |
| **Target** | `src/events/index.njk` |
| **Commit msg** | `Migrate Events page to Eleventy (src/events/index.njk)` |

**Front matter:**
```yaml
---
layout: layouts/base.njk
title: "Events & Meetings"
description: "Upcoming events, meetings, and educational sessions from Manchester LMC."
mainClass: page-events
showContactStrip: true
showDisclaimer: true
---
```

**Steps:**
1. Read `events/index.html`, extract `<main>` inner content
2. Preserve `id="meetings"` anchor (referenced from nav "Meeting Dates" dropdown link)
3. Convert `../` paths to root-relative

**Verify:**
- `http://localhost:8080/events/` — event list, date badges visible
- Nav "Meeting Dates" link → `/events/#meetings` scrolls correctly

---

### Block 7 — Members

| Field | Value |
|-------|-------|
| **Status** | ⬜ Pending |
| **Source** | `members/index.html` |
| **Target** | `src/members/index.njk` |
| **Commit msg** | `Migrate Members area to Eleventy (src/members/index.njk)` |

**Front matter:**
```yaml
---
layout: layouts/base.njk
title: Members Area
description: "Manchester LMC subscriber area — access agenda papers, meeting minutes, the open forum, and exclusive member resources."
mainClass: page-members
showContactStrip: false
showDisclaimer: true
---
```

**Steps:**
1. Read `members/index.html`, extract `<main>` inner content
2. **Critical JS hooks — preserve exactly:**
   - `data-tabs` attribute on the outer tab container
   - `.tab-list` class on the button row
   - `data-tab="[panel-id]"` on each `.tab-btn`
   - `id="[panel-id]"` on each `.tab-panel`
   - `id="register"` anchor (nav utility bar "Register" button links here)
3. If there is a large inline `<style>` block in `<head>`, move those styles to `src/assets/css/components.css`

**Verify:**
- `http://localhost:8080/members/` — login/register tabs render
- Tab switcher works (click Register tab)
- Nav "Register" button → `/members/#register` jumps to register tab section

---

### Block 8 — Vacancies

| Field | Value |
|-------|-------|
| **Status** | ⬜ Pending |
| **Source** | `vacancies/index.html` |
| **Target** | `src/vacancies/index.njk` |
| **Commit msg** | `Migrate Vacancies page to Eleventy (src/vacancies/index.njk)` |

**Front matter:**
```yaml
---
layout: layouts/base.njk
title: Vacancies
description: "GP and primary care vacancies across Manchester. Browse current roles or post a vacancy for your practice."
mainClass: page-vacancies
showContactStrip: true
showDisclaimer: true
---
```

**Steps:**
1. Read `vacancies/index.html`, extract `<main>` inner content
2. **Critical JS hooks — preserve exactly:**
   - `data-filter-group` on the filter container
   - `data-category` attributes on vacancy items
   - `id="vacancy-auth-gate"` and `id="vacancy-form"` on the Post a Vacancy section
   - `id="post"` anchor (nav dropdown "Post a Vacancy" links here)
3. Convert `../` paths to root-relative

**Verify:**
- `http://localhost:8080/vacancies/` — job listings, filter chips
- `#post` anchor scrolls to Post a Vacancy section
- Auth gate is shown (login prompt), form is hidden — this is expected (frontend simulation)

---

## Phase 3 — Cleanup (Block 9)

| Field | Value |
|-------|-------|
| **Status** | ⬜ Pending |
| **Commit msg** | `Move legacy HTML to _legacy/, update search-index.json for clean URLs` |

**Run only after ALL Blocks 1–8 are ✅ Done.**

### 9a — Move root HTML to `_legacy/`

Create `_legacy/` at project root and move:
```
index.html           → _legacy/index.html
about/               → _legacy/about/
contact/             → _legacy/contact/
events/              → _legacy/events/
guidance/            → _legacy/guidance/
members/             → _legacy/members/
news/                → _legacy/news/
support/             → _legacy/support/
vacancies/           → _legacy/vacancies/
```

### 9b — Update `src/assets/js/search-index.json`

Replace all page URLs with clean root-relative paths:

| Old URL | New URL |
|---------|---------|
| `index.html` or `./index.html` | `/` |
| `about/index.html` | `/about/` |
| `about/team.html` | `/about/team/` |
| `about/funding.html` | `/about/funding/` |
| `contact/index.html` | `/contact/` |
| `support/index.html` | `/support/` |
| `support/wellbeing.html` | `/support/wellbeing/` |
| `support/breach-report.html` | `/support/breach-report/` |
| `guidance/index.html` | `/guidance/` |
| `events/index.html` | `/events/` |
| `members/index.html` | `/members/` |
| `vacancies/index.html` | `/vacancies/` |
| `news/index.html` | `/news/` |

### 9c — Final nav.njk + footer.njk audit

Check that no `.html` extension links remain anywhere in:
- `src/_includes/partials/nav.njk`
- `src/_includes/partials/footer.njk`

**Verify (final):**
1. `npm run build` — zero errors
2. `_site/` structure: clean URL directories for every section
3. Search overlay returns results, clicking a result navigates correctly
4. Run `grep -r "\.html" _site/` — should return no internal page links with `.html`

---

## URL Mapping (Quick Reference)

| Old (static HTML) | New (Eleventy clean URL) |
|---|---|
| `/` or `/index.html` | `/` |
| `/about/index.html` | `/about/` |
| `/about/team.html` | `/about/team/` |
| `/about/funding.html` | `/about/funding/` |
| `/contact/index.html` | `/contact/` |
| `/support/index.html` | `/support/` |
| `/support/wellbeing.html` | `/support/wellbeing/` |
| `/support/breach-report.html` | `/support/breach-report/` |
| `/guidance/index.html` | `/guidance/` |
| `/events/index.html` | `/events/` |
| `/members/index.html` | `/members/` |
| `/vacancies/index.html` | `/vacancies/` |
| `/news/index.html` | `/news/` ← already done |
| `/news/[slug].html` | `/news/[slug]/` ← already done |

---

## Anchor IDs Referenced from Nav/Footer (must preserve in migrated pages)

| ID | Page | Used in |
|----|------|---------|
| `#confidential` | `src/support/index.njk` | nav Support dropdown, footer |
| `#constitution` | `src/about/funding.njk` | nav About dropdown |
| `#meetings` | `src/events/index.njk` | nav Events dropdown |
| `#post` | `src/vacancies/index.njk` | nav Vacancies dropdown |
| `#register` | `src/members/index.njk` | nav utility bar Register button |

---

## JS Hooks That Must Be Preserved Verbatim

| Feature | Page | Required attributes/IDs |
|---------|------|------------------------|
| Counter animation | Homepage | `data-count`, `data-suffix`, `data-no-format` |
| Scroll reveal | All pages | `.reveal`, `.reveal-delay-1`, `.reveal-delay-2` |
| Guidance filter | Guidance | `id="guidance-filter"`, `id="document-list"`, `id="results-count"`, `data-doc`, `data-category`, `data-title` |
| Tab switcher | Members | `data-tabs`, `.tab-list`, `.tab-btn[data-tab]`, `.tab-panel[id]`, `id="register"` |
| Vacancy auth gate | Vacancies | `id="vacancy-auth-gate"`, `id="vacancy-form"`, `id="post"` |
| Vacancy filter | Vacancies | `data-filter-group`, `data-category` on items |
| Ajax forms | Contact, Breach report | `data-ajax` on `<form>` |

---

## Reference Files (read before each block)

- `src/_includes/layouts/base.njk` — master layout; understand front matter vars before writing any page
- `src/news/index.njk` — canonical already-migrated page; use as format template
- `src/assets/js/main.js` — all JS feature hooks documented as IIFEs; read before any page with JS features
- `src/_includes/partials/nav.njk` — must update sub-page links after Block 3 (About) and Block 4 (Support)
- `src/_includes/partials/footer.njk` — must update sub-page links after Block 4 (Support)
