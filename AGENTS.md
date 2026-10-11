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

- Keep category names, search terms, Lucide fallbacks and uploaded image paths in the typed category configuration; both shortcut cards and header navigation consume it to avoid diverging categories.
- Resolve category artwork from category-named PNG/WebP assets or CDN pointers under src/assets/categorias, with Lucide fallbacks; this accepts user uploads without changing navigation or drawing custom artwork.
- Measure the sticky header with ResizeObserver for anchor offsets; its height changes when search and navigation wrap on smaller screens.
