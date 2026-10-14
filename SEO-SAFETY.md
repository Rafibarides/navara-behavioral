# SEO preview and recovery plan

Baseline captured October 13, 2026:
- Main source: 79691403e9eee6b9f94d9cac9f5f4a50760c3e04
- Live gh-pages artifact: ff728889338bd1d4216040450dd401d1f10e3913

This branch is preview-only. Do not merge or deploy without Nisan's explicit "go live" after reviewing the page-by-page previews.

Scope: preserve the current React components, visual design, wording, media and existing route URLs. Generate HTML route documents during the production build, set page-specific metadata and structured data, expose crawlable service links, add sitemap/robots, and return a real not-found page.

Validation: production build; desktop and 390px iPhone screenshots before/after for all nine routes; direct-load and JavaScript-off checks; per-route title, description and canonical; no booking/form submission. Preview on a private review page, never on the production domain.

Recovery: before any approved release, re-check that main and gh-pages have not changed. Preserve source and deployed artifact commits in remote backup branches. If a release causes a regression, restore the prior source and publish the saved gh-pages artifact; verify the live site and links. Do not assume a revert alone is deployed until the deployment finishes and live checks pass.
