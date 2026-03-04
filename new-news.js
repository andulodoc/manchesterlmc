#!/usr/bin/env node
/**
 * new-news.js — scaffold a new news post for Manchester LMC
 * Usage: node new-news.js
 */

import { createInterface } from "readline";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const rl = createInterface({ input: process.stdin, output: process.stdout });

const ask = (question) =>
  new Promise((resolve) => rl.question(question, (a) => resolve(a.trim())));

const categories = [
  { value: "announcement", label: "Announcement" },
  { value: "bma-gpc", label: "BMA / GPC" },
  { value: "nhs-policy", label: "NHS Policy" },
  { value: "local", label: "Local" },
];

function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  console.log("\nCreate a new news post\n");

  // Title
  let title = "";
  while (!title) {
    title = await ask("Title (required): ");
    if (!title) console.log("  Title cannot be empty.");
  }

  // Category
  console.log("\nCategory:");
  categories.forEach((c, i) => console.log(`  ${i + 1}. ${c.label}`));
  let categoryIndex = -1;
  while (categoryIndex < 0) {
    const input = await ask("Choose 1–4: ");
    const n = parseInt(input, 10);
    if (n >= 1 && n <= categories.length) categoryIndex = n - 1;
    else console.log("  Please enter a number between 1 and 4.");
  }
  const category = categories[categoryIndex].value;

  // Featured
  const featuredInput = await ask("\nFeatured? (y/N): ");
  const featured = featuredInput.toLowerCase() === "y";

  rl.close();

  const date = todayISO();
  const slug = toSlug(title);
  const filename = `${date}-${slug}.md`;
  const dir = join(import.meta.dirname, "src", "content", "news");
  const filepath = join(dir, filename);

  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const content = `---
title: "${title.replace(/"/g, '\\"')}"
date: ${date}
category: ${category}
excerpt: ""
image: ""
featured: ${featured}
---

Write your news post content here.
`;

  writeFileSync(filepath, content, "utf8");

  console.log(`\nCreated: src/content/news/${filename}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
