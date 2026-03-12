# Decap CMS Expansion Plan — Manchester LMC

## 1. Step-by-Step Implementation Plan

### Phase 1: Schema freeze & settings (Days 1–2)
- [ ] Finalise this plan with stakeholders
- [ ] Create `src/_data/settings/` directory for file-based settings
- [ ] Add `settings` files collection to Decap config (`site.json`, `navigation.json`)
- [ ] Migrate existing `src/_data/site.json` and `src/_data/nav.json` to the new settings path
- [ ] Update all templates to read from the new data path
- [ ] Verify build passes, all pages render correctly

### Phase 2: People collection (Days 3–4)
- [ ] Create `src/content/people/` folder
- [ ] Add `people` folder collection to Decap config
- [ ] Create Markdown files for all 12 current team members (3 officers, 6 committee, 3 admin)
- [ ] Add `people.json` directory data file (tags, permalink: false)
- [ ] Add `people` collection to `.eleventy.js` with sub-collections (`officers`, `committeeMembers`, `adminStaff`)
- [ ] Refactor `src/about/team.njk` to loop over the people collection instead of hardcoded HTML
- [ ] Verify team page renders identically

### Phase 3: Homepage data file (Day 5)
- [ ] Create `src/_data/homepage.json` (or `src/content/homepage.md`)
- [ ] Add `homepage` file collection to Decap config
- [ ] Extract homepage hero, stats, role cards, newsletter, and service cards into the data file
- [ ] Refactor `src/index.njk` to render from data
- [ ] Wire featured news via existing `collections.featuredNews` (no change needed)
- [ ] Verify homepage renders identically

### Phase 4: Pages collection with sections (Days 6–9)
- [ ] Define the 8 block types as Decap `types` within a `list` widget
- [ ] Add `pages` folder collection to Decap config
- [ ] Create a new layout `layouts/page.njk` that renders sections dynamically
- [ ] Create section partials: `partials/sections/markdown.njk`, `callout.njk`, `cards.njk`, `image.njk`, `columns.njk`, `faq.njk`, `button-row.njk`, `listing.njk`
- [ ] Migrate existing pages to the sections model:
  - `about/index.njk` → `src/content/pages/about.md`
  - `support/index.njk` → `src/content/pages/support.md`
  - `support/wellbeing.njk` → `src/content/pages/wellbeing.md`
  - `support/breach-report.njk` → `src/content/pages/breach-report.md`
  - `about/funding.njk` → `src/content/pages/funding.md`
  - `members/index.njk` → `src/content/pages/members.md`
  - `contact/index.njk` — keep as Nunjucks (has form logic), but add editable intro via frontmatter
- [ ] Create stub pages for any missing content: `representing-you.md`, `policies.md`
- [ ] Configure Eleventy to generate correct permalinks from `pages` collection
- [ ] Verify all URLs preserved

### Phase 5: Consistency pass on existing collections (Day 10)
- [ ] Add optional `seo` object (metaTitle, metaDescription) to news, events, vacancies, guidance
- [ ] Add `hint` text to any fields missing it
- [ ] Enable `publish_mode: editorial_workflow` in config
- [ ] Verify existing content still works after config changes

### Phase 6: Previews (Days 11–12)
- [ ] Create `src/admin/preview-templates/` directory
- [ ] Implement `NewsPreview`, `PagePreview`, `PersonPreview` as vanilla JS preview templates
- [ ] Register previews in `src/admin/index.html`
- [ ] Test in CMS admin UI

### Phase 7: UAT, training, deploy (Days 13–14)
- [ ] Editors test all collections in Decap admin
- [ ] Fix any UX issues, adjust help text
- [ ] Write 1-page editor training guide
- [ ] Deploy to production
- [ ] Monitor for broken links (run `npx linkinator _site`)

---

## 2. Proposed Repository Structure

```
src/
├── _data/
│   ├── settings/
│   │   ├── site.json          ← global site info (editable via CMS)
│   │   └── navigation.json    ← header + footer nav (editable via CMS)
│   └── homepage.json          ← homepage content (editable via CMS)
├── _includes/
│   ├── layouts/
│   │   ├── base.njk
│   │   ├── news-post.njk
│   │   └── page.njk           ← NEW: renders sections[] dynamically
│   └── partials/
│       ├── nav.njk
│       ├── footer.njk
│       ├── contact-strip.njk
│       ├── news-card.njk
│       ├── breadcrumb.njk
│       ├── person-card.njk    ← NEW: reusable profile card
│       └── sections/          ← NEW: one partial per block type
│           ├── markdown.njk
│           ├── callout.njk
│           ├── cards.njk
│           ├── image.njk
│           ├── columns.njk
│           ├── faq.njk
│           ├── button-row.njk
│           └── listing.njk
├── content/
│   ├── news/          (existing — unchanged)
│   ├── events/        (existing — unchanged)
│   ├── vacancies/     (existing — unchanged)
│   ├── guidance/      (existing — unchanged)
│   ├── people/        ← NEW
│   │   ├── people.json
│   │   ├── chair.md
│   │   ├── deputy-chair.md
│   │   ├── treasurer.md
│   │   ├── member-north.md
│   │   ├── ...
│   │   └── nicola-holland.md
│   └── pages/         ← NEW
│       ├── pages.json
│       ├── about.md
│       ├── support.md
│       ├── wellbeing.md
│       ├── funding.md
│       ├── representing-you.md
│       ├── policies.md
│       └── breach-report.md
├── admin/
│   ├── index.html
│   ├── config.yml
│   └── preview-templates/     ← NEW
│       ├── NewsPreview.js
│       ├── PagePreview.js
│       └── PersonPreview.js
├── about/
│   └── team.njk       (kept — but now reads from people collection)
├── contact/
│   └── index.njk      (kept — form logic stays in template)
├── index.njk           (kept — now reads from homepage.json)
├── news/index.njk      (existing)
├── events/index.njk    (existing)
├── vacancies/index.njk (existing)
└── guidance/index.njk  (existing)
```

---

## 3. Complete Decap `config.yml`

```yaml
backend:
  name: git-gateway
  branch: main

publish_mode: editorial_workflow

media_folder: src/assets/images/uploads
public_folder: /assets/images/uploads

# ─── Reusable field anchors ──────────────────────────────────────────
# (YAML anchors work in Decap config.yml)

_seo_fields: &seo_fields
  label: SEO Override
  name: seo
  widget: object
  collapsed: true
  required: false
  hint: "Leave blank to use the page title and description."
  fields:
    - { label: Meta Title, name: metaTitle, widget: string, required: false, hint: "Overrides the page title in search results. Max 60 chars." }
    - { label: Meta Description, name: metaDescription, widget: text, required: false, hint: "Overrides the description in search results. Max 155 chars." }
    - { label: Social Image, name: ogImage, widget: image, required: false, hint: "Image shown when shared on social media. 1200×630px recommended." }

# ─── Section block types (reused in pages + homepage) ────────────────
_section_types: &section_types
  - label: Rich Text
    name: markdown
    widget: object
    summary: "{{fields.heading}}"
    fields:
      - { label: Heading, name: heading, widget: string, required: false }
      - { label: Body, name: body, widget: markdown }

  - label: Callout
    name: callout
    widget: object
    summary: "{{fields.style}} — {{fields.text}}"
    fields:
      - label: Style
        name: style
        widget: select
        options:
          - { label: Info (blue), value: info }
          - { label: Warning (amber), value: warning }
          - { label: Success (green), value: success }
          - { label: Neutral (grey), value: neutral }
      - { label: Text, name: text, widget: markdown }

  - label: Cards
    name: cards
    widget: object
    summary: "{{fields.items.length}} cards"
    fields:
      - { label: Heading, name: heading, widget: string, required: false }
      - label: Items
        name: items
        widget: list
        fields:
          - { label: Title, name: title, widget: string }
          - { label: Text, name: text, widget: text }
          - { label: Link URL, name: link, widget: string, required: false }
          - { label: Icon, name: icon, widget: string, required: false, hint: "Optional icon name (e.g. shield, book, heart). Leave blank for no icon." }

  - label: Image
    name: image
    widget: object
    fields:
      - { label: Image, name: src, widget: image }
      - { label: Alt Text, name: alt, widget: string, hint: "Describe the image for screen readers." }
      - { label: Caption, name: caption, widget: string, required: false }

  - label: Two/Three Columns
    name: columns
    widget: object
    fields:
      - label: Columns
        name: count
        widget: select
        options: ["2", "3"]
        default: "2"
      - label: Column Content
        name: items
        widget: list
        max: 3
        fields:
          - { label: Content, name: body, widget: markdown }

  - label: FAQ / Accordion
    name: faq
    widget: object
    summary: "{{fields.items.length}} questions"
    fields:
      - { label: Heading, name: heading, widget: string, required: false }
      - label: Items
        name: items
        widget: list
        fields:
          - { label: Question, name: q, widget: string }
          - { label: Answer, name: a, widget: markdown }

  - label: Button Row
    name: button_row
    widget: object
    fields:
      - label: Buttons
        name: buttons
        widget: list
        fields:
          - { label: Label, name: label, widget: string }
          - { label: URL, name: url, widget: string }
          - label: Style
            name: style
            widget: select
            default: primary
            options:
              - { label: Primary, value: primary }
              - { label: Secondary, value: secondary }
              - { label: Outline, value: outline }

  - label: Listing (auto-populated)
    name: listing
    widget: object
    hint: "Pulls items from an existing collection. Rendered automatically at build time."
    fields:
      - label: Source
        name: source
        widget: select
        options:
          - { label: News, value: news }
          - { label: Events, value: events }
          - { label: Guidance, value: guidance }
          - { label: Vacancies, value: vacancies }
          - { label: People, value: people }
      - { label: Limit, name: limit, widget: number, default: 6, hint: "Max items to show." }
      - { label: Filter Tag, name: filterTag, widget: string, required: false, hint: "Optional. Only show items matching this tag (e.g. 'officer' for people, 'clinical' for guidance)." }

# ═══════════════════════════════════════════════════════════════════════
# COLLECTIONS
# ═══════════════════════════════════════════════════════════════════════

collections:

  # ─── Settings (file collection) ────────────────────────────────────
  - name: settings
    label: "⚙️ Settings"
    delete: false
    editor:
      preview: false
    files:

      - name: site
        label: Site Info
        file: src/_data/settings/site.json
        fields:
          - { label: Site Name, name: name, widget: string }
          - { label: Tagline, name: tagline, widget: string }
          - { label: URL, name: url, widget: string, hint: "Full site URL including https://" }
          - { label: Email, name: email, widget: string, pattern: ['^.+@.+\\..+$', "Must be a valid email address"] }
          - { label: Phone (main), name: phone1, widget: string }
          - { label: Phone (secondary), name: phone2, widget: string, required: false }
          - label: Address
            name: address
            widget: object
            fields:
              - { label: Line 1, name: line1, widget: string }
              - { label: Line 2, name: line2, widget: string, required: false }
              - { label: Line 3, name: line3, widget: string, required: false }
              - { label: City, name: city, widget: string }
              - { label: Postcode, name: postcode, widget: string }
          - { label: Twitter / X URL, name: twitter, widget: string, required: false }
          - { label: Facebook URL, name: facebook, widget: string, required: false }
          - { label: LinkedIn URL, name: linkedin, widget: string, required: false }
          - { label: Office Hours, name: officeHours, widget: string, hint: "e.g. Mon–Fri: 09:00–17:00" }
          - { label: Copyright Notice, name: copyright, widget: string }

      - name: navigation
        label: Navigation
        file: src/_data/settings/navigation.json
        fields:
          - label: Header Navigation
            name: headerNav
            widget: list
            summary: "{{fields.label}}"
            fields:
              - { label: Label, name: label, widget: string }
              - { label: URL, name: href, widget: string }
              - { label: Key, name: key, widget: string, hint: "URL identifier used for active-page highlighting, e.g. 'about'" }
              - { label: Mobile ID, name: mobileId, widget: string, required: false }
              - label: Dropdown Items
                name: dropdown
                widget: list
                required: false
                fields:
                  - { label: Label, name: label, widget: string }
                  - { label: URL, name: href, widget: string }

  # ─── Homepage (file collection) ────────────────────────────────────
  - name: homepage
    label: "🏠 Homepage"
    delete: false
    editor:
      preview: false
    files:
      - name: homepage
        label: Homepage Content
        file: src/_data/homepage.json
        fields:
          - label: Hero
            name: hero
            widget: object
            fields:
              - { label: Eyebrow, name: eyebrow, widget: string, default: "Manchester LMC" }
              - { label: Heading, name: heading, widget: string }
              - { label: Lead Text, name: lead, widget: text }
              - label: CTA Buttons
                name: ctas
                widget: list
                max: 2
                fields:
                  - { label: Label, name: label, widget: string }
                  - { label: URL, name: url, widget: string }
                  - { label: Style, name: style, widget: select, options: [primary, secondary], default: primary }

          - label: Role Cards
            name: roleCards
            widget: list
            hint: "The 'I am a…' cards below the hero."
            fields:
              - { label: Title, name: title, widget: string }
              - { label: Subtitle, name: subtitle, widget: string }
              - { label: Link URL, name: url, widget: string }

          - label: Statistics
            name: stats
            widget: list
            max: 4
            fields:
              - { label: Number, name: number, widget: string, hint: "e.g. 400+ or 87" }
              - { label: Label, name: label, widget: string }

          - label: Service Cards
            name: serviceCards
            widget: list
            hint: "The 'How We Support You' grid."
            fields:
              - { label: Title, name: title, widget: string }
              - { label: Description, name: text, widget: text }
              - { label: Link URL, name: url, widget: string }
              - { label: Link Text, name: linkText, widget: string, default: "Learn more" }

          - label: Newsletter
            name: newsletter
            widget: object
            fields:
              - { label: Title, name: title, widget: string }
              - { label: Description, name: description, widget: text }
              - { label: Issue Label, name: issueLabel, widget: string, hint: "e.g. Issue 42 · Winter 2025" }
              - { label: Download URL, name: downloadUrl, widget: string, required: false }
              - { label: Archive URL, name: archiveUrl, widget: string, required: false }

  # ─── News (existing — unchanged except adding SEO) ─────────────────
  - name: news
    label: News
    label_singular: News Post
    folder: src/content/news
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    extension: md
    fields:
      - { label: Title, name: title, widget: string }
      - { label: Date, name: date, widget: datetime, format: YYYY-MM-DD, date_format: DD/MM/YYYY, time_format: false }
      - label: Category
        name: category
        widget: select
        options:
          - { label: Announcement, value: announcement }
          - { label: BMA / GPC, value: bma-gpc }
          - { label: NHS Policy, value: nhs-policy }
          - { label: Local, value: local }
      - { label: Excerpt, name: excerpt, widget: text, hint: "Short summary shown on the news listing page." }
      - { label: Featured, name: featured, widget: boolean, default: false, hint: "Featured posts appear highlighted on the homepage." }
      - { label: Image, name: image, widget: image, required: false, hint: "Optional. Displayed at the top of the post and on the news listing card." }
      - { label: "Image Alt Text", name: imageAlt, widget: string, required: false, hint: "Describe the image for screen readers. Required if an image is uploaded." }
      - { label: Body, name: body, widget: markdown }
      - *seo_fields

  # ─── Events (existing — unchanged except adding SEO) ───────────────
  - name: events
    label: Events
    label_singular: Event
    folder: src/content/events
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    extension: md
    fields:
      - label: Type
        name: type
        widget: select
        hint: "Controls where this item appears on the Events page."
        options:
          - { label: "Event (card in Upcoming Events)", value: event }
          - { label: "Meeting Date (row in Meeting Calendar)", value: meeting-date }
          - { label: "Past Minutes (download in Minutes Archive)", value: past-minutes }
      - { label: Title, name: title, widget: string }
      - { label: Date, name: date, widget: datetime, format: YYYY-MM-DD, date_format: DD/MM/YYYY, time_format: false }
      - { label: Time, name: time, widget: string, required: false, hint: "e.g. 18:30–20:00. Not needed for past minutes." }
      - { label: Venue, name: venue, widget: string, required: false, hint: "e.g. Oak House, Manchester or Online — Teams link TBC. Not needed for past minutes." }
      - label: Format
        name: format
        widget: select
        required: false
        hint: "Used for events only. Controls the venue icon."
        options:
          - { label: In-person, value: in-person }
          - { label: Online, value: online }
          - { label: Hybrid, value: hybrid }
      - label: Audience
        name: audience
        widget: select
        required: false
        hint: "Used for events and meeting dates. Meeting dates use this to determine which calendar tab they appear in."
        options:
          - { label: "Partners / Salaried GPs", value: partners-salaried }
          - { label: Locum GPs, value: locum }
          - { label: All Roles, value: all-roles }
          - { label: Members Only, value: members-only }
          - { label: External, value: external }
      - { label: Description, name: description, widget: text, required: false, hint: "Short description. Used for events only." }
      - { label: "Link URL", name: registerUrl, widget: string, required: false, hint: "Registration link (events), join/papers link (meeting dates), or download URL." }
      - { label: "Link Label", name: registerLabel, widget: string, required: false, hint: "Button text, e.g. Register, Teams link, Member login, Download PDF." }
      - { label: "Download URL", name: downloadUrl, widget: string, required: false, hint: "For past minutes only — link to the PDF download." }
      - { label: Active, name: active, widget: boolean, default: true, hint: "Uncheck to hide without deleting." }
      - *seo_fields

  # ─── Vacancies (existing — unchanged except adding SEO) ────────────
  - name: vacancies
    label: Vacancies
    label_singular: Vacancy
    folder: src/content/vacancies
    create: true
    slug: "{{slug}}"
    extension: md
    fields:
      - { label: Job Title, name: title, widget: string }
      - { label: Practice Name, name: practice, widget: string }
      - { label: "Location / Postcode", name: location, widget: string }
      - label: Contract Type
        name: contractType
        widget: select
        options:
          - { label: GP Partner, value: gp-partner }
          - { label: Salaried GP, value: salaried-gp }
          - { label: Locum, value: locum }
          - { label: Practice Manager, value: practice-manager }
          - { label: "Nurse / AHP", value: nurse-ahp }
          - { label: Administrative, value: administrative }
          - { label: Other, value: other }
      - { label: "Sessions / Hours", name: sessions, widget: string, required: false, hint: "e.g. 6 sessions/week or Full-time (37.5 hrs/week)" }
      - { label: Salary, name: salary, widget: string, required: false, hint: "Leave blank if not specified." }
      - { label: Closing Date, name: closingDate, widget: datetime, format: YYYY-MM-DD, date_format: DD/MM/YYYY, time_format: false, required: false }
      - { label: "Application Contact Email", name: contactEmail, widget: string }
      - { label: Active, name: active, widget: boolean, default: true, hint: "Uncheck to hide this vacancy without deleting it." }
      - { label: Description, name: body, widget: markdown }
      - *seo_fields

  # ─── Guidance (existing — unchanged except adding SEO) ─────────────
  - name: guidance
    label: Guidance
    label_singular: Guidance Document
    folder: src/content/guidance
    create: true
    slug: "{{slug}}"
    extension: md
    fields:
      - { label: Title, name: title, widget: string }
      - label: Category
        name: category
        widget: select
        options:
          - { label: Clinical, value: clinical }
          - { label: Contractual, value: contractual }
          - { label: CQC, value: cqc }
          - { label: Legal, value: legal }
          - { label: Prescribing, value: prescribing }
          - { label: Workforce, value: workforce }
          - { label: "COVID / Pandemic", value: covid }
          - { label: Collective Action, value: collective-action }
      - { label: Date, name: date, widget: datetime, format: YYYY-MM-DD, date_format: DD/MM/YYYY, time_format: false, hint: "Used for the 'Month Year' display and sort order. Use the first of the month." }
      - label: File Type
        name: fileType
        widget: select
        options:
          - { label: PDF, value: pdf }
          - { label: Word, value: word }
      - { label: "Download URL", name: downloadUrl, widget: string, hint: "Paste a publicly shareable link to the document (OneDrive, SharePoint, Google Drive, Dropbox, etc.). Ensure the sharing permission is set to 'Anyone with the link can view' — links that require a login will not work for site visitors." }
      - *seo_fields

  # ─── People (NEW) ─────────────────────────────────────────────────
  - name: people
    label: People
    label_singular: Person
    folder: src/content/people
    create: true
    slug: "{{slug}}"
    extension: md
    fields:
      - { label: Name, name: title, widget: string, hint: "Full name, e.g. Dr Jane Smith" }
      - { label: Role / Title, name: role, widget: string, hint: "e.g. LMC Chair, Committee Member — North Manchester, Managing Director" }
      - label: Group
        name: group
        widget: select
        hint: "Determines which section they appear in on the team page."
        options:
          - { label: Executive Officer, value: officer }
          - { label: Committee Member, value: committee }
          - { label: Administrative Staff, value: admin }
      - { label: Photo, name: photo, widget: image, required: false }
      - { label: Bio, name: body, widget: markdown, hint: "A short biography — 2–3 sentences." }
      - { label: Email, name: email, widget: string, required: false, pattern: ['^.+@.+\\..+$', "Must be a valid email address"] }
      - { label: Phone, name: phone, widget: string, required: false }
      - label: Tags
        name: tags
        widget: list
        required: false
        hint: "Used for filtering on pages. e.g. prescribing, workforce, north-manchester"
      - { label: Sort Order, name: sortOrder, widget: number, default: 50, hint: "Lower numbers appear first. Officers: 1–10, Committee: 20–40, Admin: 50–70." }

  # ─── Pages (NEW — modular sections) ───────────────────────────────
  - name: pages
    label: Pages
    label_singular: Page
    folder: src/content/pages
    create: true
    slug: "{{slug}}"
    extension: md
    fields:
      - { label: Title, name: title, widget: string }
      - { label: Permalink, name: permalink, widget: string, hint: "The URL path for this page, e.g. /about/ or /support/wellbeing/. Must start and end with /." }
      - { label: Description, name: description, widget: text, hint: "Shown in search results and social shares." }
      - label: Hero
        name: hero
        widget: object
        required: false
        fields:
          - { label: Heading, name: heading, widget: string, required: false, hint: "Defaults to the page title if left blank." }
          - { label: Subheading, name: subheading, widget: text, required: false }
          - { label: Image, name: image, widget: image, required: false }
      - label: Breadcrumbs
        name: breadcrumbs
        widget: list
        required: false
        hint: "Breadcrumb trail. Last item should be the current page (no URL)."
        fields:
          - { label: Label, name: label, widget: string }
          - { label: URL, name: url, widget: string, required: false }
      - label: Sections
        name: sections
        widget: list
        types: *section_types
      - { label: Show Contact Strip, name: showContactStrip, widget: boolean, default: true }
      - { label: Navigation Order, name: order, widget: number, required: false, hint: "Controls sort order in auto-generated nav. Lower = first." }
      - { label: Hide from Navigation, name: hideFromNav, widget: boolean, default: false }
      - *seo_fields
```

**Note on YAML anchors:** Decap CMS supports standard YAML, so `&seo_fields` / `*seo_fields` and `&section_types` / `*section_types` will work. If you hit issues with the `types` anchor specifically, inline the block definitions directly.

---

## 4. Example Frontmatter

### `src/content/pages/about.md`
```yaml
---
title: About Manchester LMC
permalink: /about/
description: "Manchester LMC is the statutory representative body for GPs in Manchester — representing and supporting general practice since 1911."
hero:
  heading: About Manchester LMC
  subheading: "Your voice in primary care since 1911"
breadcrumbs:
  - label: About Us
showContactStrip: true
order: 1
hideFromNav: false
sections:
  - type: markdown
    heading: Who We Are
    body: >
      Manchester Local Medical Committee (LMC) is the statutory representative
      body for approximately 400 GPs across 87 practices in Manchester. We are
      independent of the NHS and funded by a voluntary levy paid by GP practices.

  - type: cards
    heading: What We Do
    items:
      - title: Represent
        text: "We speak for GPs at ICB, NHS England, and BMA forums."
        link: /about/representing-you/
      - title: Support
        text: "Confidential advice on contracts, complaints, CQC, and wellbeing."
        link: /support/
      - title: Inform
        text: "Guidance documents, newsletters, and educational events."
        link: /guidance/

  - type: callout
    style: info
    text: >
      **Elections**: LMC committee members are elected by the GPs they represent.
      Vacancies are advertised via email and on the website.

  - type: listing
    source: people
    limit: 3
    filterTag: officer
---
```

### `src/content/pages/funding.md`
```yaml
---
title: How We're Funded
permalink: /about/funding/
description: "How Manchester LMC is funded through the voluntary GP levy."
hero:
  heading: How We're Funded
breadcrumbs:
  - label: About Us
    url: /about/
  - label: How We're Funded
showContactStrip: true
order: 3
sections:
  - type: markdown
    heading: The LMC Levy
    body: >
      Manchester LMC is funded by a voluntary levy paid by GP practices.
      The levy is collected quarterly via NHS England payroll deduction.

  - type: faq
    heading: Common Questions
    items:
      - q: "How much is the levy?"
        a: "The current levy rate is set annually by the LMC committee."
      - q: "Is the levy compulsory?"
        a: "No. The levy is voluntary but the vast majority of practices contribute."

  - type: button_row
    buttons:
      - label: View Constitution (PDF)
        url: "#constitution"
        style: primary
      - label: Contact the Treasurer
        url: "mailto:treasurer@manchesterlmc.co.uk"
        style: outline
---
```

### `src/content/people/nicola-holland.md`
```yaml
---
title: Nicola Holland
role: Managing Director
group: admin
photo: ""
email: nicola.holland@manchesterlmc.co.uk
phone: ""
tags: []
sortOrder: 50
---

Nicola leads the day-to-day management of Manchester LMC. She is the first point of contact for member enquiries, advises on contractual and operational matters, and supports the committee officers.
```

### `src/content/people/chair.md`
```yaml
---
title: "Dr [Chair Name]"
role: LMC Chair
group: officer
photo: ""
email: chair@manchesterlmc.co.uk
phone: ""
tags:
  - officer
  - leadership
sortOrder: 1
---

GP Partner at [Practice], Manchester. Elected Chair since [year]. Leads LMC representation at ICB and NHS England forums and chairs the quarterly partners meeting.
```

---

## 5. Migration Checklist & Risk Log

### Migration Checklist

| Current file | New file | Permalink | Notes |
|---|---|---|---|
| `src/_data/site.json` | `src/_data/settings/site.json` | n/a | Move file; update template refs from `site.*` to `settings.site.*` |
| `src/_data/nav.json` | `src/_data/settings/navigation.json` | n/a | Move file; update nav partial to read `settings.navigation.headerNav` |
| `src/index.njk` (hardcoded content) | `src/_data/homepage.json` + refactored `index.njk` | `/` | Extract strings to JSON; template reads from `homepage.*` |
| `src/about/team.njk` (hardcoded profiles) | `src/content/people/*.md` + refactored `team.njk` | `/about/team/` | Create 12 people files; template loops over collection |
| `src/about/index.njk` | `src/content/pages/about.md` | `/about/` | Convert content to sections frontmatter |
| `src/about/funding.njk` | `src/content/pages/funding.md` | `/about/funding/` | Preserve `#constitution` anchor |
| `src/support/index.njk` | `src/content/pages/support.md` | `/support/` | Preserve `#partner`, `#salaried` etc. anchors |
| `src/support/wellbeing.njk` | `src/content/pages/wellbeing.md` | `/support/wellbeing/` | |
| `src/support/breach-report.njk` | `src/content/pages/breach-report.md` | `/support/breach-report/` | Form HTML → markdown block or keep as Nunjucks partial |
| `src/members/index.njk` | `src/content/pages/members.md` | `/members/` | Netlify Identity widget needs special handling |
| `src/contact/index.njk` | Keep as `.njk` (complex form) | `/contact/` | Add editable intro fields in frontmatter only |
| News listing (`src/news/index.njk`) | **No change** | `/news/` | |
| Events listing (`src/events/index.njk`) | **No change** | `/events/` | |
| Vacancies listing (`src/vacancies/index.njk`) | **No change** | `/vacancies/` | |
| Guidance listing (`src/guidance/index.njk`) | **No change** | `/guidance/` | |

### Template changes required

1. **`.eleventy.js`**: Add `people` collection (sorted by `sortOrder`), add sub-collections `officers`/`committeeMembers`/`adminStaff` filtered by `group`. Add `pages` collection.
2. **`partials/nav.njk`**: Change data source from `nav` to `settings.navigation.headerNav`.
3. **`partials/footer.njk`**: Change data source from `site` to `settings.site`.
4. **`layouts/base.njk`**: Update `site.*` refs to `settings.site.*`.
5. **New `layouts/page.njk`**: Loop over `sections[]`, include the matching partial from `partials/sections/`.
6. **`about/team.njk`**: Replace hardcoded HTML with loops over people sub-collections.
7. **`index.njk`**: Replace hardcoded strings with `homepage.*` data references.

### Risk Log

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Broken internal links after migration | Medium | High | Set `permalink` explicitly in every page frontmatter; run `npx linkinator _site` after build |
| `site.*` data references missed in templates | Medium | Medium | Global find-replace; build-test; Nunjucks will throw on undefined |
| YAML anchor `*section_types` not parsed by Decap | Low | High | If broken, inline the types array directly in the pages collection config |
| Editorial workflow merge conflicts | Low | Medium | Train editors to avoid editing same content simultaneously; Decap handles git branching |
| Existing news/events content broken by new SEO fields | Very Low | High | New `seo` field is `required: false` with defaults; existing content unaffected |
| Complex pages (contact form, members auth) don't fit sections model | Medium | Low | Keep these as Nunjucks templates; only add frontmatter fields for editable text |
| Large images uploaded without optimisation | Medium | Low | Add `hint` text reminding editors to keep images under 500KB; consider adding Netlify image transform later |

---

## 6. Preview Template Scaffolding

### Where to register

In `src/admin/index.html`, add script tags after the Decap CMS script loads:

```html
<script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
<script src="/admin/preview-templates/PagePreview.js"></script>
<script src="/admin/preview-templates/NewsPreview.js"></script>
<script src="/admin/preview-templates/PersonPreview.js"></script>
```

### `src/admin/preview-templates/PagePreview.js`

```js
const PagePreview = createClass({
  render() {
    const entry = this.props.entry;
    const title = entry.getIn(['data', 'title'], '');
    const hero = entry.getIn(['data', 'hero']);
    const sections = entry.getIn(['data', 'sections']);

    return h('div', { className: 'page-content' },
      // Hero
      h('section', { className: 'page-hero' },
        h('div', { className: 'container' },
          h('h1', {}, hero?.getIn(['heading']) || title),
          hero?.getIn(['subheading']) && h('p', {}, hero.getIn(['subheading']))
        )
      ),
      // Sections
      sections && sections.map((section, i) => {
        const type = section.getIn(['type']);
        switch (type) {
          case 'markdown':
            return h('section', { key: i, className: 'section' },
              h('div', { className: 'container' },
                section.getIn(['heading']) && h('h2', {}, section.getIn(['heading'])),
                h('div', { dangerouslySetInnerHTML: {
                  __html: this.props.widgetFor('sections.' + i + '.body') || ''
                }})
              )
            );
          case 'callout':
            return h('div', {
              key: i,
              className: 'alert alert--' + section.getIn(['style'], 'info')
            }, this.props.widgetFor('sections.' + i + '.text'));
          case 'faq':
            return h('section', { key: i, className: 'section' },
              h('div', { className: 'container' },
                section.getIn(['heading']) && h('h2', {}, section.getIn(['heading'])),
                section.getIn(['items'])?.map((item, j) =>
                  h('details', { key: j },
                    h('summary', {}, item.getIn(['q'])),
                    h('p', {}, item.getIn(['a']))
                  )
                )
              )
            );
          default:
            return h('div', { key: i, style: { padding: '1rem', background: '#f0f0f0', margin: '0.5rem 0' } },
              h('em', {}, '[' + type + ' block — preview not yet available]')
            );
        }
      })
    );
  }
});

CMS.registerPreviewTemplate('pages', PagePreview);
```

### `src/admin/preview-templates/NewsPreview.js`

```js
const NewsPreview = createClass({
  render() {
    const entry = this.props.entry;
    return h('article', { className: 'page-content' },
      h('header', { style: { padding: '2rem', borderBottom: '1px solid #eee' } },
        h('span', { className: 'badge' }, entry.getIn(['data', 'category'], '')),
        h('h1', {}, entry.getIn(['data', 'title'], '')),
        h('p', { style: { color: '#666' } }, entry.getIn(['data', 'excerpt'], ''))
      ),
      h('div', { style: { padding: '2rem' } }, this.props.widgetFor('body'))
    );
  }
});

CMS.registerPreviewTemplate('news', NewsPreview);
```

### `src/admin/preview-templates/PersonPreview.js`

```js
const PersonPreview = createClass({
  render() {
    const entry = this.props.entry;
    const photo = entry.getIn(['data', 'photo']);
    return h('div', { className: 'profile-card', style: { maxWidth: '360px', padding: '1.5rem' } },
      photo && h('img', { src: this.props.getAsset(photo).toString(), style: { width: '100%', borderRadius: '8px' } }),
      h('div', { className: 'profile-card-role' }, entry.getIn(['data', 'role'], '')),
      h('div', { className: 'profile-card-name' }, entry.getIn(['data', 'title'], '')),
      h('div', {}, this.props.widgetFor('body')),
      entry.getIn(['data', 'email']) && h('a', { href: 'mailto:' + entry.getIn(['data', 'email']) }, entry.getIn(['data', 'email']))
    );
  }
});

CMS.registerPreviewTemplate('people', PersonPreview);
```

### Preview phases
- **Phase 1 (now):** News, People, Pages (basic section rendering)
- **Phase 2 (later):** Refine Pages preview to match site CSS exactly (load site stylesheet in preview), add Events preview, add cards/columns/listing previews

---

## 7. Editor Training Notes

### Manchester LMC — Decap CMS Editor Guide

**Accessing the CMS**
1. Go to `manchesterlmc.co.uk/admin/`
2. Log in with your Netlify Identity credentials (email + password)
3. You'll see the content dashboard with all collections on the left sidebar

**Creating / Editing Content**

| To do this… | Go to… |
|---|---|
| Post a news article | News → New News Post |
| Add a team member | People → New Person |
| Edit the homepage hero | Homepage → Homepage Content |
| Change the phone number | Settings → Site Info |
| Add a nav dropdown item | Settings → Navigation |
| Create or edit a page | Pages → select or create |
| Add a vacancy | Vacancies → New Vacancy |
| Add an event / meeting | Events → New Event |
| Upload a guidance doc | Guidance → New Guidance Document |

**Building a Page with Sections**

Pages use a modular "sections" system. When editing a page:
1. Scroll to the **Sections** area
2. Click **Add section** and choose a block type
3. Fill in the fields for that block
4. Drag sections to reorder them
5. Available block types: Rich Text, Callout, Cards, Image, Columns, FAQ, Button Row, Listing

**The Editorial Workflow**

All changes go through Draft → In Review → Ready → Published:
1. **Save** puts your work in Draft (only you can see it)
2. Move to **In Review** when you want someone to check it
3. Move to **Ready** when approved
4. **Publish** pushes it live (triggers a site rebuild, takes ~1 minute)

**Common Pitfalls**
- **Images**: Keep under 500KB. Use JPEG for photos, PNG for logos/graphics, SVG where available
- **Download URLs**: For guidance documents, ensure the sharing link works in an incognito window. Links requiring login will not work for visitors
- **Permalinks on Pages**: Must start and end with `/` (e.g., `/about/funding/`). Changing a permalink after publish will break existing bookmarks
- **People sort order**: Officers should be 1–10, Committee 20–40, Admin 50–70. Within a group, lower numbers appear first
- **Don't delete, deactivate**: For vacancies and events, uncheck "Active" instead of deleting — this preserves the record

**Roles & Permissions**

| Role | Can do |
|---|---|
| Editor | Create, edit, submit for review |
| Admin | All of the above + publish, manage users |

Roles are managed in **Netlify → Identity → Users**. Only admins should have publish permissions.

**Need Help?**
Contact the site administrator or email info@manchesterlmc.co.uk.

---

## 8. Acceptance Criteria

- [ ] All site content (homepage, about, support, funding, team, etc.) is editable from Decap CMS admin
- [ ] Homepage hero, stats, role cards, service cards, and newsletter section are driven by `homepage.json`
- [ ] Navigation and footer are editable via Settings → Navigation and Settings → Site Info
- [ ] People collection contains all 12 team members; team page renders from collection data
- [ ] Pages collection supports all 8 block types; at least 5 pages migrated
- [ ] Existing 4 collections (news, events, vacancies, guidance) are unchanged and functional
- [ ] No broken URLs — all existing permalinks preserved
- [ ] Editorial workflow enabled — changes go through draft/review/publish cycle
- [ ] Preview templates render for news, pages, and people
- [ ] At least one non-technical editor has successfully created and published content
- [ ] Site builds cleanly (`npm run build` exits 0)
- [ ] All help text is present on non-obvious fields
