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
- Algolia visitor queries run through the browser lite client; server indexing, object reads and sitemap browsing share a gateway-only server adapter to keep connection credentials private.
- Category synchronization stages a complete validated snapshot before source-scoped deletion on the primary index; replicas inherit changes and private category leases prevent overlapping executions.
- Price visibility uses shared freshness rules and both ISO and numeric synchronization timestamps so list filters, product markup and price structured data agree.
- Share currency formatting from a non-component module to keep offer cards compatible with React Fast Refresh.
- Scheduled sync returns completed category outcomes as JSON with explicit success and error counters; unexpected infrastructure exceptions retain HTTP errors.
