# Decap CMS Setup Plan

_Approved: 2026-03-09_

## How Decap CMS works with Netlify

Decap CMS is a git-based CMS. When an editor saves content:
1. The CMS calls **Netlify's Git Gateway**, which commits the file change to GitHub on your behalf
2. GitHub notifies Netlify, which triggers a build and deploys the updated site
3. Content is live in roughly 1–2 minutes

There is no database. All content lives in the git repo as Markdown or YAML files.

---

## File hosting for Guidance downloads

**Decision: SharePoint.**

The Guidance library links to PDFs and Word docs hosted in SharePoint. The CMS manages metadata only (title, category, date, download URL). Editors upload files to SharePoint as normal, copy the shareable link, and paste it into the CMS. Binary files are never committed to the git repo.

---

## Phase 1 — Infrastructure

_All sections depend on this. Do this first._

**Files to create:**
- `src/admin/index.html` — loads Decap CMS UI from CDN
- `src/admin/config.yml` — defines what the CMS can edit

**Netlify dashboard steps (one-time):**
1. Enable **Netlify Identity** — handles who can log in to the CMS
2. Enable **Git Gateway** — allows the CMS to commit to GitHub; editors never need a GitHub account
3. Invite yourself as a user via Netlify Identity
4. Optionally: add the Netlify Identity widget script to `src/_includes/layouts/base.njk` so the `/admin` login works from the live site

---

## Phase 2 — News

_Lowest effort. News is already Markdown files with the right front matter._

**No structural changes needed.** Already data-driven via the `news` Eleventy collection in `src/content/news/`.

**CMS fields:**
- Title
- Date
- Category (dropdown: Announcement / BMA-GPC / NHS Policy / Local)
- Excerpt
- Featured (toggle)
- Body (rich text Markdown editor)

---

## Phase 3 — Vacancies

_Moderate effort. Currently hard-coded HTML cards._

**Structural changes required:**
- Create `src/content/vacancies/` folder — one Markdown file per vacancy
- Create `src/content/vacancies/vacancies.json` data cascade (layout, tags, permalink)
- Add a `vacancies` collection to `.eleventy.js`
- Refactor `src/vacancies/index.njk` to loop over the collection

**CMS fields:**
- Job title
- Practice name
- Location / postcode
- Contract type (dropdown: GP Partner / Salaried GP / Locum / Practice Manager / Nurse & AHP / Administrative / Other)
- Sessions or hours
- Salary (optional)
- Closing date
- Description (rich text)
- Contact email
- Active (toggle — allows hiding a vacancy without deleting it)

**Note:** The "Post a Vacancy" submission form on the page is a separate flow for practices to submit enquiries. Admin reviews submissions and publishes approved vacancies via the CMS.

---

## Phase 4 — Guidance

_Moderate effort. Currently hard-coded document cards._

**Structural changes required:**
- Create `src/content/guidance/` folder — one Markdown file per document (front matter only, no body)
- Create `src/content/guidance/guidance.json` data cascade
- Add a `guidance` collection to `.eleventy.js`
- Refactor `src/guidance/index.njk` to loop over the collection

**CMS fields:**
- Title
- Category (dropdown: Clinical / Contractual / CQC / Legal / Prescribing / Workforce / Collective Action)
- Date
- File type (dropdown: PDF / Word)
- Download URL (SharePoint shareable link)

---

## Phase 5 — Events

_Highest effort. Most complex page, multiple content types._

Split into three sub-collections:

### 5a — Upcoming events (event cards)

**Structural changes required:**
- Create `src/content/events/` folder — one Markdown file per event
- Create `src/content/events/events.json` data cascade
- Add an `events` Eleventy collection to `.eleventy.js`
- Refactor the upcoming events section in `src/events/index.njk` to loop over the collection

**CMS fields:**
- Title
- Date
- Time (e.g. 18:30–20:00)
- Venue (or "Online — Teams link TBC")
- Format (dropdown: In-person / Online / Hybrid)
- Audience badge (dropdown: Partners / Salaried GPs / Locum GPs / All Roles / Members Only / External)
- Description
- Registration / join link (optional)

### 5b — Meeting calendar

**Storage:** YAML data file at `src/_data/meetings.yaml` — structured list of dates per meeting type (Partners, Locum, External).

**CMS:** Decap CMS file collection targeting `src/_data/meetings.yaml`.

**Structural changes required:**
- Create `src/_data/meetings.yaml` with the recurring date data currently hard-coded in the template
- Refactor the meeting calendar tab panels in `src/events/index.njk` to loop over the YAML data

### 5c — Past meeting minutes

**Storage:** YAML data file at `src/_data/minutes.yaml` — list of years, each containing downloadable minutes with a SharePoint link.

**CMS:** Decap CMS file collection targeting `src/_data/minutes.yaml`.

**Structural changes required:**
- Create `src/_data/minutes.yaml` with the minutes data currently hard-coded in the accordion
- Refactor the minutes accordion in `src/events/index.njk` to loop over the YAML data

**Recommended order:** Complete 5a first (upcoming events). 5b and 5c can follow independently.

---

## Sequence summary

| Phase | Section | Effort | Dependencies |
|---|---|---|---|
| 1 | Infrastructure | 1–2 hours | Netlify site must be live |
| 2 | News | 1–2 hours | Phase 1 |
| 3 | Vacancies | Half day | Phase 1 |
| 4 | Guidance | Half day | Phase 1 |
| 5a | Events — upcoming | Half day | Phase 1 |
| 5b | Events — meeting calendar | 2–3 hours | Phase 1 |
| 5c | Events — past minutes | 2–3 hours | Phase 1 |
