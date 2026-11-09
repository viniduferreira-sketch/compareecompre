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
- Mercado Livre quality rules (src/lib/ml-quality.ts, thresholds in ML_QUALITY_CONFIG) mark records quality_status approved/rejected without deleting; sold_quantity does not exist in any ML payload, so demand = category best-sellers (/highlights/MLB/category/{id}), buy_box_winner, or >=3 competing sellers; seller reputation comes from /users/{seller_id} cached per run.
- Normalize partner GTIN/model through product-identifiers; partner_catalog JSON and Algolia store the same fields. Identifier facets merge with existing settings, and admin inventory uses one cursor page per server invocation to avoid long-running scans.
- Popularity uses shared pure scoring and server-only click aggregates; admin recalculation patches only scores in cursor pages. group_key uses store+parent, with title fallback only for demonstrated Nike variants and singleton IDs elsewhere; ranking and distinct settings are applied separately.
- Persist discard reason counts on each idempotent import batch and aggregate for admin reports; NULL denotes unrecorded historical reasons, and duplicate rows are reported separately without changing acceptance or skipped semantics.
- Apply the shared adult-content policy before writing or generating affiliate links in every partner importer; Awin batches must also pass the admin-managed merchant allowlist, with an empty or unreadable list failing closed rather than importing everyone.
- Awin per-store rules (src/lib/awin-rules.ts) run after allowlist, adult content and BRL: persisted admin-editable exclusions precede inclusions and match merchant_category only in both simulation and import; per-import store limits use a database counter keyed by import/batch/store so retries never double-count. The workflow pre-sorts rows by GTIN/stock/image so the limit keeps the best rows. Allowlist hides use reversible quality_status marks, never deletion.
- Admin pages nest under the authenticated admin layout; its loader checks the existing admin-protected history function before rendering children, and action handlers retain their own role checks. Shared confirmation controls gate UI writes without replacing existing operations.
