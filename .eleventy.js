import markdownIt from "markdown-it";
import feather from "feather-icons";
import { HtmlBasePlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
  // Rewrites absolute paths in HTML output to include pathPrefix.
  // Enabled when PATHPREFIX env var is set (e.g. in GitHub Actions).
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // ── Icon shortcode (Feather Icons) ────────────────────────────
  eleventyConfig.addShortcode("icon", function (name, size, style) {
    const icon = feather.icons[name];
    if (!icon) return `<!-- icon "${name}" not found -->`;
    const opts = {
      width: size || 24,
      height: size || 24,
      "aria-hidden": "true",
    };
    if (style === "fill") {
      opts.fill = "currentColor";
      opts.stroke = "none";
    }
    return icon.toSvg(opts);
  });

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

  // All active events tagged "events", sorted by date ascending
  eleventyConfig.addCollection("events", function (collectionApi) {
    return collectionApi
      .getFilteredByTag("events")
      .filter((item) => item.data.active !== false)
      .sort((a, b) => a.date - b.date);
  });

  // Sub-collections filtered by type
  eleventyConfig.addCollection("upcomingEvents", function (collectionApi) {
    return collectionApi
      .getFilteredByTag("events")
      .filter((item) => item.data.active !== false && item.data.type === "event")
      .sort((a, b) => a.date - b.date);
  });

  eleventyConfig.addCollection("meetingDates", function (collectionApi) {
    return collectionApi
      .getFilteredByTag("events")
      .filter((item) => item.data.active !== false && item.data.type === "meeting-date")
      .sort((a, b) => a.date - b.date);
  });

  eleventyConfig.addCollection("pastMinutes", function (collectionApi) {
    return collectionApi
      .getFilteredByTag("events")
      .filter((item) => item.data.active !== false && item.data.type === "past-minutes")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("guidance", function (collectionApi) {
    return collectionApi
      .getFilteredByTag("guidance")
      .sort((a, b) => b.date - a.date);
  });

  // People collection — all, sorted by sortOrder then title
  eleventyConfig.addCollection("people", function (collectionApi) {
    return collectionApi
      .getFilteredByTag("people")
      .sort((a, b) => (a.data.sortOrder || 99) - (b.data.sortOrder || 99));
  });

  eleventyConfig.addCollection("officers", function (collectionApi) {
    return collectionApi
      .getFilteredByTag("people")
      .filter((item) => item.data.group === "officer")
      .sort((a, b) => (a.data.sortOrder || 99) - (b.data.sortOrder || 99));
  });

  eleventyConfig.addCollection("committeeMembers", function (collectionApi) {
    return collectionApi
      .getFilteredByTag("people")
      .filter((item) => item.data.group === "committee")
      .sort((a, b) => (a.data.sortOrder || 99) - (b.data.sortOrder || 99));
  });

  eleventyConfig.addCollection("adminStaff", function (collectionApi) {
    return collectionApi
      .getFilteredByTag("people")
      .filter((item) => item.data.group === "admin")
      .sort((a, b) => (a.data.sortOrder || 99) - (b.data.sortOrder || 99));
  });

  // Pages collection
  eleventyConfig.addCollection("pages", function (collectionApi) {
    return collectionApi
      .getFilteredByTag("pages")
      .sort((a, b) => (a.data.order || 99) - (b.data.order || 99));
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

  // Extract day number from a date (e.g. 25)
  eleventyConfig.addFilter("dateDay", function (date) {
    return new Date(date).getDate();
  });

  // Extract short month from a date (e.g. "Feb")
  eleventyConfig.addFilter("dateMonthShort", function (date) {
    return new Date(date).toLocaleDateString("en-GB", { month: "short" });
  });

  // Extract year from a date (e.g. 2025)
  eleventyConfig.addFilter("dateYear", function (date) {
    return new Date(date).getFullYear();
  });

  // Group an array of items by year (returns array of {year, items})
  eleventyConfig.addFilter("groupByYear", function (items) {
    const groups = {};
    for (const item of items) {
      const year = new Date(item.date).getFullYear();
      if (!groups[year]) groups[year] = { year, items: [] };
      groups[year].items.push(item);
    }
    return Object.values(groups).sort((a, b) => b.year - a.year);
  });

  // Map event audience slug → badge CSS modifier class
  eleventyConfig.addFilter("audienceBadgeClass", function (audience) {
    const map = {
      "partners-salaried": "badge--primary",
      "locum": "badge--secondary",
      "all-roles": "badge--accent",
      "members-only": "badge--primary",
      "external": "badge--accent",
    };
    return map[audience] || "badge--primary";
  });

  // Map event audience slug → display label
  eleventyConfig.addFilter("audienceLabel", function (audience) {
    const map = {
      "partners-salaried": "Partners / Salaried GPs",
      "locum": "Locum GPs",
      "all-roles": "All Roles",
      "members-only": "Members Only",
      "external": "External",
    };
    return map[audience] || audience;
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
