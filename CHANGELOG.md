# Changelog

## 2026-03-09 — UI Mobile Polish Sprint

### Fixed
- **#1** Homepage hero "Member Login" pill no longer sits on the bottom edge at mobile (≤480px) — added `padding-bottom` to `.hero` and `.hero-content`
- **#2** Homepage upcoming events no longer crushed into narrow column — stacks vertically at ≤640px with horizontal date badge
- **#5** Support page section spacing normalised — removed inline styles, added CSS component classes
- **#6** Cameron Fund icon now shows "£" instead of "$" — replaced SVG path data
- **#7** Support page "Key contact" box has proper padding at narrow widths — new `.key-contact-box` component class
- **#9** News page filter tags now work — wired `data-filter-group` and `data-category` attributes to match JS handler; added no-results display and `?category=slug` deep-linking
- **#11** Events page "Past meeting minutes" accordion now functional — converted from `<button>` to native `<details>/<summary>`
- **#13** Funding page "Common Questions" accordion uses `--radius-md` (8px) instead of `--radius-lg` (16px) — consistent boxy design language; also converted to native `<details>/<summary>`

### Changed
- **#3** Homepage "How we can help" icons replaced with healthcare-appropriate alternatives: book-open (guidance), shield-check (GP support), heart-pulse (wellbeing), stethoscope (vacancies), calendar-check (events), keyhole pattern (members)
- **#4** About page "What We Do" icons replaced: megaphone (representation), shield-check (advice), book-open (guidance), heart-pulse (wellbeing)
- **#8** News page mobile layout — images hidden at ≤640px, compact list-style cards for better information density
- **#10** News post template redesigned — page hero header, breadcrumb, category badge + date meta, constrained 70ch prose width, padded back button

### Added
- **#12** Reusable breadcrumb partial (`src/_includes/partials/breadcrumb.njk`) with `<nav aria-label>`, `<ol>` semantics, `aria-current="page"` — deployed to all 10 internal pages (about, about/funding, support, news, events, contact, guidance, members, vacancies + news posts)
- Section hero component (`.section-hero`) for consistent internal page headers
- `.support-intro`, `.support-intro-lead`, `.support-confidence-alert`, `.key-contact-box` CSS component classes
- News filter no-results message with `#news-no-results` element
- News post full CSS: `.news-post-header`, `.news-post-content`, `.news-post-footer`

### Technical
- All accordion instances now use native `<details>/<summary>` (zero-JS, keyboard accessible)
- Inline styles extracted to CSS classes across support page
- `styles.css` is the single production CSS file (~2929 lines); `main.css`/`components.css` are unused dev files
