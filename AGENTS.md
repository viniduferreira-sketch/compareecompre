<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep category names, search terms, image descriptions, blob token roles, shape variants and uploaded image paths in the typed category configuration; shortcut cards and header navigation consume it to avoid diverging categories.
- Normalize public merchant identity, logo and affiliate aliases through storefront-record; use one shared official-logo registry for cards, detail pages and store discovery to prevent inconsistent attribution.
- Discover active storefront merchants with availability-filtered Algolia facets; request candidates per merchant and interleave them so catalog size cannot dominate homepage rails.
- Resolve category artwork from category-named PNG/WebP files in public/categorias or assets/CDN pointers under src/assets/categorias, with neutral missing/broken-image placeholders; style-reference uploads are not embedded as product cutouts.
- Render category shortcuts as design-system links to the existing query-string search, with a reusable decorative SVG blob and tokenized colors; this preserves current search behavior without adding duplicate category routes.
- Measure the sticky header with ResizeObserver for anchor offsets; its height changes when search and navigation wrap on smaller screens.
- Homepage price-alert intake uses a validated public server function to write only to a private subscriber table; require explicit consent and generate its timestamp/version server-side to prevent forged evidence. Success follows persistence, duplicates are idempotent, and no subscriber data is exposed to visitors.
- Use a native required checkbox for waiting-list consent to preserve browser validation without introducing the Radix checkbox dependency into the homepage runtime.
- Server-side Algolia access (sync, product Q&A, sitemap) goes through getAlgoliaIndexingConfig in src/lib/algolia-indexing.server.ts with the fixed index name; the connection key is gateway-only and fails as a direct Algolia key.
- Run Awin streaming ingestion in GitHub Actions, posting bounded batches to OIDC-verified server routes; persist before indexing and qualify Awin IDs to avoid collisions with other partners.
- Lomadee sync uses one shared per-run request budget for brands, coupons and products, persisting merchant/page/item cursors and visiting authorized stores round-robin so large catalogs cannot starve other stores; product Custom links are reused only while the destination is unchanged.
- Coupons live separately from product search and retain partner source, official merchant identity, exact code, validity and provider-issued tracked links; only currently valid, authorized coupons are publicly readable.
- Use the shared BrandLogo home link for all visual brand placements, with a separate contrast asset for dark surfaces; browser icons are global root-head links to actual public files.
- Product-page store comparison runs client-side via the public Algolia key (title/EAN match, cheapest per store); ratings render only from real partner fields, never mocked.
- Outbound partner anchors use a nonblocking beacon to a validated same-origin public intake; an atomic database-wide 300/minute budget stores no visitor identifiers, and reports aggregate in PostgreSQL under admin-only RLS to avoid truncated client-side counts.
- Mercado Livre revalidation (src/lib/ml-revalidate.server.ts) only marks source="mercadolivre" records status="unavailable" after explicit API answers from /products/{id} and its /items list (the /items?ids= multiget is 403 for this token), never deletes, and aborts all writes when unavailable exceeds 30% of verified; the ML items list returns item_id, not id.
