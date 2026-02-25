import markdownIt from "markdown-it";

export default function (eleventyConfig) {
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

  // Render a markdown string to HTML
  eleventyConfig.addFilter("markdown", function (content) {
    return md.render(content || "");
  });

  // ── Config ──────────────────────────────────────────────────
  return {
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
