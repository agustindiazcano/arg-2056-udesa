# Current state
- Branch: task/readme-banner, based on task/search-icon-references.
- Generated docs/assets/readme-banner.png from test/2026_10_30_0va_Kleki.png and test/2026_10_30_0va_Kleki (1).png (the two newest images dated 2026-10-30).
- Built-in image generation; black wide banner, Argentina 2056 above institutional logos; inspected visually.
- README embeds the banner above its heading; source images unchanged.
- Previous changes: navbar badge removed, RIGI projects scroll enabled, search SVG, all 111 Data URLs in README.
- Local tests not run. Previous CI failed in web npm test; GitHub log access returned HTTP 403.
- Server last checked HTTP 200 at http://localhost:5174/.
- Next: push banner branch, read CI; PR only after checks pass.
