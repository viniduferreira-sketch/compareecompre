import { createFileRoute } from "@tanstack/react-router";
import { getRouterInstance } from "@tanstack/react-start";
import {
  isSitemapRouteIncluded,
  sitemapPathForLocation,
  sitemapStaticPaths,
  sitemapXML,
  type SitemapEntry,
} from "@/lib/sitemap";

const BASE_URL = "https://compareecompre.com";
const PRODUCT_ROUTE_ID = "/produto/$id";

export const Route = createFileRoute("/sitemap.xml")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async () => {
        const router = await getRouterInstance();
        const entries: SitemapEntry[] = sitemapStaticPaths(router).map((path) => ({ path }));

        // Product pages are the site's main content: list every indexed offer.
        const productRoute = router.routesById[PRODUCT_ROUTE_ID];
        if (isSitemapRouteIncluded(productRoute)) {
          const { algoliasearch } = await import("algoliasearch");
          const applicationId = process.env["ALGOLIA_APPLICATION_ID"];
          const apiKey = process.env["ALGOLIA_API_KEY"];
          const indexName = process.env["ALGOLIA_INDEX_NAME"] ?? "produtos_mercado_livre";
          if (!applicationId || !apiKey) {
            throw new Error("Algolia credentials are required to build the sitemap");
          }
          const client = algoliasearch(applicationId, apiKey);
          let cursor: string | undefined;
          do {
            const response = await client.browse<{ objectID: string }>({
              indexName,
              browseParams: { attributesToRetrieve: ["objectID"], hitsPerPage: 1000 },
              cursor,
            });
            for (const hit of response.hits) {
              const location = router.buildLocation({
                to: "/produto/$id",
                params: { id: hit.objectID },
                search: () => ({}),
                hash: "",
              });
              const path = sitemapPathForLocation(router, location, PRODUCT_ROUTE_ID);
              if (path) entries.push({ path });
            }
            cursor = response.cursor;
          } while (cursor);
        }

        if (entries.length === 0) {
          return new Response(
            'No pages are included in this sitemap. Check route decisions and ancestor exclusions. Setting "exclude-subtree" on the root excludes the entire site.',
            { status: 404, headers: { "Cache-Control": "no-store" } },
          );
        }
        return new Response(sitemapXML(BASE_URL, entries), {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
