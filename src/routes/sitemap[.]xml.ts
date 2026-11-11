import { createFileRoute } from "@tanstack/react-router";
import { getRouterInstance } from "@tanstack/react-start";
import {
  isSitemapRouteIncluded,
  sitemapPathForLocation,
  sitemapStaticPaths,
  sitemapXML,
  type SitemapEntry,
} from "@/lib/sitemap";

import {PRODUCT_CATEGORIES} from '@/lib/category-pages';

const PRODUCT_ROUTE_ID = "/produto/$id";

export const Route = createFileRoute("/sitemap.xml")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async ({ request }) => {
        const baseURL = 'https://compareecompre.com';
        const router = await getRouterInstance();
        const entries: SitemapEntry[] = sitemapStaticPaths(router).map((path) => ({ path }));

        for(const category of PRODUCT_CATEGORIES)entries.push({path:`/categoria/${category.slug}`});

        // Product pages are the site's main content: list every indexed offer.
        const productRoute = router.routesById[PRODUCT_ROUTE_ID];
        if (isSitemapRouteIncluded(productRoute)) {
          const { getAlgoliaIndexingConfig } = await import("@/lib/algolia-indexing.server");
          const { client, indexName } = getAlgoliaIndexingConfig();
          let cursor: string | undefined;
          do {
            const response = await client.browse<{ objectID: string }>({
              indexName,
              browseParams: { attributesToRetrieve: ["objectID"], hitsPerPage: 1000, cursor },
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

        const {blogPublicClient}=await import('@/lib/blog-public.server');
        const db=blogPublicClient(process.env['SUPABASE_URL']!,process.env['SUPABASE_PUBLISHABLE_KEY']!);
        const now=new Date().toISOString();
        for(let offset=0;;offset+=500){
          const posts=await db.from('posts').select('slug,atualizado_em').in('status',['publicado','agendado']).lte('publicado_em',now).order('id').range(offset,offset+499);
          if(posts.error)throw new Error('Não foi possível listar os artigos no sitemap.');
          for(const post of posts.data??[])entries.push({path:`/blog/${post.slug}`,lastmod:post.atualizado_em});
          if((posts.data?.length??0)<500)break;
        }
        for(const [table,prefix] of [['categorias','categoria'],['tags','tag']] as const){
          for(let offset=0;;offset+=500){
            const rows=await db.from(table).select('slug').order('id').range(offset,offset+499);
            if(rows.error)throw new Error('Não foi possível listar as seleções do Blog no sitemap.');
            for(const row of rows.data??[])entries.push({path:`/blog/${prefix}/${row.slug}`});
            if((rows.data?.length??0)<500)break;
          }
        }
        if (entries.length === 0) {
          return new Response(
            'No pages are included in this sitemap. Check route decisions and ancestor exclusions. Setting "exclude-subtree" on the root excludes the entire site.',
            { status: 404, headers: { "Cache-Control": "no-store" } },
          );
        }
        return new Response(sitemapXML(baseURL, entries), {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
