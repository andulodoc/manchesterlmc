# Manchester LMC

Website for Manchester Local Medical Committee — representing and supporting general practice in Manchester.

Built with [Eleventy (11ty) v3](https://www.11ty.dev/) and Nunjucks templates.

## Prerequisites

- **Node.js** v18 or later — [nodejs.org](https://nodejs.org)
- **npm** v9 or later (bundled with Node)

## Setup

The project files are already available locally. Navigate to the project directory and install dependencies:

```bash
cd manchesterlmc
npm install
```

## Common Commands

| Command | What it does |
|---------|-------------|
| `npm run build` | Build the site to `_site/` |
| `npm run start` | Build, serve at `http://localhost:8080`, and watch for changes |

The dev server reloads automatically when you edit templates, content, CSS, or JS.

## Adding a News Post

Use the interactive scaffolding script:

```bash
node new-news.js
```

You'll be prompted for a title, category, and whether the post should be featured. The script writes a dated Markdown file to `src/content/news/` and prints the path so you can open it straight away.

## Tests

No automated test suite is configured. After making changes, verify the build succeeds:

```bash
npm run build
```

Then review the output in `_site/`, or use `npm run start` and check `http://localhost:8080` in a browser.
