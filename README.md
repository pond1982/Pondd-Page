# Pondd's personal portfolio

A static personal CV, with a directory of released apps. The original CV's copy,
serif/terracotta theme, portrait, sections, anchors and editing controls are retained.

## App directory

- The 21 listings come from the UK App Store developer lookup linked in
  `data/apps.json`, checked on 12 November 2026.
- Each listing keeps the exact App Store URL and its verified website URL.
- Five website links point to existing Cloudflare Pages sites. Linking them here
  does not change their hosting or their contents.
- App icons are local, optimized copies of the app's App Store artwork. No
  third-party request is needed to render them.
- `apps.html` redirects to `index.html#apps` and provides a fallback link, so
  app-site footers can link to either directory address.
- All cards and links are static HTML. Search and the two category filters are
  optional JavaScript enhancements. Games uses the App Store's Games category;
  the other apps appear under Tools & learning.
- Search includes English and Thai names. The ReadSlip English alias is indexed
  alongside its official Thai App Store name.

To maintain the directory, verify the relevant live listings, edit
`data/apps.json`, then run `python3 scripts/build-app-directory.py`. The build
only replaces the marked directory block. Add optimized icons under
`assets/app-icons/` if an app is added. Update the hero shortcut count if the
number of apps changes.

## Local checks

No build process or JavaScript dependencies are required to host the site.
The development dependencies are only used for testing:

```sh
npm ci
npm test
```

This runs static checks for the inventory, links, project-relative assets,
unique IDs, original CV preservation, and a current generated section. It also
runs DOM tests for search, repeated filters, zero-results recovery, focus return,
progressive enhancement and accessible naming.

For actual browser, responsive layout and axe checks:

```sh
npx playwright install chromium
npm run test:browser
```

The browser check defaults to the local HTML file. To check a hosted branch
preview, use `BASE_URL=https://your-preview/Pondd-Page/ npm run test:browser`.
Screenshots and reports are written to `test-results/` and ignored by Git.
These checks focus on the new directory; they are not a full audit of the
unchanged legacy CV.

## Validation for this change

- All 21 website destinations returned HTTP 200 on 12 November 2026, including
  all five Cloudflare Pages destinations.
- Static and DOM tests passed, including byte-for-byte preservation of the
  original index after removing the three added integration points and the
  directory block.
- Manual browser QA passed on an unpublished preview at 320, 390 and 1365px
  viewport widths, with no directory overflow. Search, zero-results recovery
  and restoring all 21 apps were checked.
- The automated browser/axe suite was not executed because local Chromium
  cannot create sockets in this execution environment. Do not interpret the
  manual checks as a full automated accessibility audit.

Deployment uses the existing GitHub Pages site. Changes in this repository
do not alter the app-site repositories or their hosting.
