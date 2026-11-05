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
- Resolve category artwork from category-named PNG/WebP files in public/categorias or assets/CDN pointers under src/assets/categorias, with neutral missing/broken-image placeholders; style-reference uploads are not embedded as product cutouts.
- Render category shortcuts as design-system links to the existing query-string search, with a reusable decorative SVG blob and tokenized colors; this preserves current search behavior without adding duplicate category routes.
- Measure the sticky header with ResizeObserver for anchor offsets; its height changes when search and navigation wrap on smaller screens.
- Homepage price-alert intake uses a validated public server function to write only to a private subscriber table; success follows persistence, duplicates are idempotent, and no subscriber data is exposed to visitors.
- Server-side Algolia access (sync, product Q&A, sitemap) goes through getAlgoliaIndexingConfig in src/lib/algolia-indexing.server.ts with the fixed index name; the connection key is gateway-only and fails as a direct Algolia key.
- Run Awin streaming ingestion in GitHub Actions, posting bounded batches to OIDC-verified server routes; persist before indexing and qualify Awin IDs to avoid collisions with other partners.
