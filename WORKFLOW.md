# Navara Website — Things to Remember

Keep these in mind before changing or shipping the site.

## Assets

- Copy new images and media into the repo (usually `navara-site/public/` or `navara-site/public/assets/`).
- Do not leave assets only in Downloads or outside the project — they will not deploy.
- Match existing naming and format when possible (e.g. staff headshots as square images served from `public/`).

## Site data

- Put content (team bios, titles, photo paths, section copy) in `navara-site/SiteData.json`.
- Prefer updating that JSON over hardcoding new staff or text in components.
- Keep field names and structure consistent with existing entries (`photo`, `name`, `position`, `introSentence`, `fullText`, etc.).

## Before making changes

- Read the existing code and data first.
- Follow the current design language, palette, and component patterns.
- Prefer the smallest change that matches how the site already works.

## Git and deploy

1. Commit your changes.
2. Push to the remote.
3. Then deploy (`npm run deploy` from `navara-site`).

Do not deploy before commit and push — otherwise the live site and the repo can get out of sync.
