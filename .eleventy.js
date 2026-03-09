import markdownIt from "markdown-it";
import { HtmlBasePlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
  // Rewrites absolute paths in HTML output to include pathPrefix.
  // Enabled when PATHPREFIX env var is set (e.g. in GitHub Actions).
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // ── Passthrough copies ──────────────────────────────────────
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/admin");

  // ── Markdown library ────────────────────────────────────────
  const md = markdownIt({ html: true, linkify: true, typographer: true });

  // ── Collections ─────────────────────────────────────────────
  eleventyConfig.addCollection("news", function (collectionApi) {
    return collectionApi
      .getFilteredByTag("news")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("featuredNews", function (collectionApi) {
    return collectionApi
      .getFilteredByTag("news")
      .filter((item) => item.data.featured === true)
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("vacancies", function (collectionApi) {
    return collectionApi
      .getFilteredByTag("vacancies")
      .filter((item) => item.data.active !== false)
      .sort((a, b) => {
        // Sort by closing date ascending (soonest first); no date goes last
        if (!a.data.closingDate && !b.data.closingDate) return 0;
        if (!a.data.closingDate) return 1;
        if (!b.data.closingDate) return -1;
        return new Date(a.data.closingDate) - new Date(b.data.closingDate);
      });
  });

  // ── Filters ─────────────────────────────────────────────────

  // "10 Feb 2026"
  eleventyConfig.addFilter("dateDisplay", function (date) {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  });

  // "2026-02-10"
  eleventyConfig.addFilter("dateISO", function (date) {
    return new Date(date).toISOString().slice(0, 10);
  });

  // "10 February 2026"
  eleventyConfig.addFilter("dateFull", function (date) {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  });

  // Limit array to first N items
  eleventyConfig.addFilter("limit", function (array, n) {
    return array.slice(0, n);
  });

  // Map category slug → badge CSS modifier class
  eleventyConfig.addFilter("badgeClass", function (category) {
    const map = {
      announcement: "badge--accent",
      "bma-gpc": "badge--primary",
      "nhs-policy": "badge--policy",
      local: "badge--secondary",
    };
    return map[category] || "badge--primary";
  });

  // Map category slug → display name
  eleventyConfig.addFilter("categoryName", function (category) {
    const map = {
      announcement: "Announcement",
      "bma-gpc": "BMA / GPC",
      "nhs-policy": "NHS Policy",
      local: "Local",
    };
    return map[category] || category;
  });

  eleventyConfig.addCollection("guidance", function (collectionApi) {
    return collectionApi
      .getFilteredByTag("guidance")
      .sort((a, b) => b.date - a.date);
  });

  // Map guidance category slug → badge CSS modifier class
  eleventyConfig.addFilter("guidanceBadgeClass", function (category) {
    const map = {
      "clinical": "badge--clinical",
      "contractual": "badge--contractual",
      "cqc": "badge--cqc",
      "legal": "badge--legal",
      "prescribing": "badge--prescribing",
      "workforce": "badge--workforce",
      "covid": "badge--accent",
      "collective-action": "badge--primary",
    };
    return map[category] || "badge--primary";
  });

  // Map guidance category slug → display name
  eleventyConfig.addFilter("guidanceCategoryName", function (category) {
    const map = {
      "clinical": "Clinical",
      "contractual": "Contractual",
      "cqc": "CQC",
      "legal": "Legal",
      "prescribing": "Prescribing",
      "workforce": "Workforce",
      "covid": "COVID / Pandemic",
      "collective-action": "Collective Action",
    };
    return map[category] || category;
  });

  // "January 2026" — used by the guidance document library
  eleventyConfig.addFilter("dateMonthYear", function (date) {
    return new Date(date).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  });

  // Map vacancy contract type slug → badge CSS modifier class
  eleventyConfig.addFilter("vacancyBadgeClass", function (contractType) {
    const map = {
      "gp-partner": "badge--primary",
      "salaried-gp": "badge--contractual",
      "locum": "badge--secondary",
      "practice-manager": "badge--accent",
      "nurse-ahp": "badge--clinical",
      "administrative": "badge--cqc",
      "other": "badge--primary",
    };
    return map[contractType] || "badge--primary";
  });

  // Map vacancy contract type slug → display label
  eleventyConfig.addFilter("vacancyLabel", function (contractType) {
    const map = {
      "gp-partner": "GP Partner",
      "salaried-gp": "Salaried GP",
      "locum": "Locum",
      "practice-manager": "Practice Manager",
      "nurse-ahp": "Nurse / AHP",
      "administrative": "Administrative",
      "other": "Other",
    };
    return map[contractType] || contractType;
  });

  // Render a markdown string to HTML
  eleventyConfig.addFilter("markdown", function (content) {
    return md.render(content || "");
  });

  // ── Config ──────────────────────────────────────────────────
  return {
    pathPrefix: process.env.PATHPREFIX || "/",
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
