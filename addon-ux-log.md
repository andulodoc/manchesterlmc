# UI/UX Pro Max — Addon Log

## Session: Mobile Polish Sprint

### Query 1: Design System Generation
**Prompt**: `"healthcare medical committee professional service" --design-system -p "Manchester LMC"`
**Output**: Recommended "Accessible & Ethical" style (WCAG AAA), Social Proof-Focused pattern
**Applied**: Confirmed existing design tokens align well. Key takeaways:
- 44x44px touch targets (already met in nav)
- Clear focus rings 3-4px (already have 3px via `--colour-accent`)
- prefers-reduced-motion (already implemented)
- No neon colors, no heavy motion (matches existing conservative approach)

### Query 2: Healthcare Style Domain
**Prompt**: `"healthcare medical icons service" --domain style`
**Output**: Trust & Authority + Inclusive Design patterns recommended
**Applied**:
- Badge/credential display approach for stats
- Icon consistency (Lucide recommended as primary SVG set — matches existing Feather-style icons)
- Professional color scheme validation (blue/teal confirmed appropriate for healthcare)

### Query 3: UX Component Patterns
**Prompt**: `"accordion card filter tag breadcrumb" --domain ux`
**Output**: No direct results
**Fallback**: Used general UX guidelines from the design system for:

#### Accordion Pattern
- Use native `<details>/<summary>` for zero-JS fallback
- `aria-expanded` managed by browser natively
- Border-radius: use `--radius-md` (8px) for boxy feel, not `--radius-lg` (16px) which creates "fighting" corners with bold outlines
- Chevron rotation via CSS `details[open]` selector

#### Filter Tags Pattern
- `.filter-chip` already exists with `.active` state
- Add `role="group"` + `aria-label` to container
- Add `aria-pressed` to chips (already present in guidance filter)
- Active state: filled primary background + white text (already defined)

#### Breadcrumb Pattern
- `<nav aria-label="Breadcrumb">` wrapping `<ol>` with `<li>` items
- Separator: `›` via CSS `::before` or inline `<span aria-hidden="true">`
- Current page: `<span aria-current="page">` (not a link)
- Light text on dark hero backgrounds (already styled in `.page-hero .breadcrumb`)

### Query 4: News Layouts
**Prompt**: `"news listing card layout mobile responsive" --domain landing`
**Output**: Marketplace/Directory + Minimal Single Column patterns

**Proposed News Layout Variants**:

#### Variant A (Recommended): Compact List
- Remove 200px image area on mobile
- Show: Badge + Date (inline) → Title → Excerpt (2-line clamp) → Read more
- Horizontal rule separator between items
- Image only visible on ≥768px in a small 120px thumbnail column

#### Variant B: Dense Card Grid
- Reduce image height to 120px on mobile
- 2-column grid at ≥640px
- 3-column at ≥1024px (current)

**Chosen**: Variant A for mobile (≤768px), current card layout for desktop

### Query 5: Stack Guidelines
**Prompt**: `"layout responsive accessibility" --stack html-tailwind`
**Output**: Responsive padding scale: `px-4 > sm:px-6 > lg:px-8` (mapped to `--space-4 > --space-6 > --space-8`)
**Applied**: Use `--space-4` (1rem / 16px) on mobile, `--space-6` (1.5rem / 24px) on tablet+

### Query 6: Animation/Motion UX
**Prompt**: `"animation scroll reveal transition" --domain ux`
**Output**:
- Transitions: 150-300ms for micro-interactions ✓ (already using `--transition-base: 200ms`)
- prefers-reduced-motion: ✓ (already implemented)
- No continuous decorative animations ✓

---

## Icon Alternatives (Issues 3 & 4)

### Source: Lucide Icons (MIT License)
Chosen for consistency with existing Feather-style inline SVGs. Same 24x24 viewBox, stroke-based, `currentColor`.

### Homepage "How We Can Help" Icons

| Current Icon | Service | Alt 1 | Alt 2 | Alt 3 | Recommendation |
|-------------|---------|-------|-------|-------|---------------|
| File/document | Guidance Library | `book-open` | `library` | `file-search` | `book-open` — clearer "library" metaphor |
| Phone | GP Support | `shield-check` | `hand-helping` | `message-circle` | `shield-check` — conveys protection/trust |
| Heart | Wellbeing Hub | `heart-pulse` | `smile` | `brain` | `heart-pulse` — healthcare-specific |
| Briefcase | Vacancies | `stethoscope` | `user-plus` | `clipboard-list` | `stethoscope` — medical recruitment |
| Calendar | Events | `calendar-check` | `users` | `presentation` | `calendar-check` — confirmed events |
| Lock | Members Area | `key-round` | `user-check` | `lock-keyhole` | `lock-keyhole` — modern lock variant |

### About "What We Do" Icons

| Current Icon | Service | Alt 1 | Alt 2 | Alt 3 | Recommendation |
|-------------|---------|-------|-------|-------|---------------|
| Users group | Representation | `megaphone` | `scale` | `landmark` | `megaphone` — advocacy/voice |
| Phone | Confidential Advice | `shield-check` | `phone-call` | `lock` | `shield-check` — matches support page |
| File | Guidance & Resources | `book-open` | `file-text` | `library` | `book-open` — matches homepage |
| Heart | Wellbeing Support | `heart-pulse` | `hand-heart` | `activity` | `heart-pulse` — matches homepage |

### Cameron Fund Icon (Issue 6)
- **Current**: Dollar sign `$` SVG path (`M17 5H9.5...`)
- **Fix**: Replace with pound sterling `£` path
- **SVG**: Custom path for `£` symbol within 24x24 viewBox
