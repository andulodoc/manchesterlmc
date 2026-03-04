# Coding Rules

## 1. Semantics & Accessibility (A11y)
- Use semantic tags (`<article>`, `<nav>`, etc.) over `<div>`.
- Meet WCAG 2.1 AA: high contrast, `alt` text, and keyboard navigation.
- Maintain strict `h1`-`h6` hierarchy; no skipping levels.

## 2. CSS & Layout
- Use **CSS Variables** for branding and **Flexbox/Grid** for layout.
- Avoid fixed widths and float-based hacks.

## 3. Mobile-First Design
- Design for mobile first; ensure full legibility on small viewports.

## 4. Performance & Assets
- Use compressed **WebP** images.
- Minimize external libraries to keep the site lightweight.

## 5. Commits & Documentation
- Use imperative commits (e.g., `Add: GP guidance`).
- Comment complex Liquid logic or CSS workarounds.
