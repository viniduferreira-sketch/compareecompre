import { createServerFn } from '@tanstack/react-start';
import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { categoryContentSchema, CATEGORY_BLOG_SLUGS, selectBuyingGuides } from './category-content';
import { GENERAL_BLOG_GUIDES } from './blog-promotions';

export const getCategoryContent = createServerFn({ method: 'GET' })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().regex(/^[a-z0-9-]+$/).max(80) }).parse(input))
  .handler(async ({ data }) => {
    const { blogPublicClient, enrichArticles } = await import('./blog-public.server');
    const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !key) throw new Error('Conteúdo das categorias indisponível.');
    const db = blogPublicClient(url, key);
    const result = await db.from('category_content').select('slug,introduction,faq,guide_slugs').eq('slug', data.slug).maybeSingle();
    if (result.error) { console.error('Category content', result.error); throw new Error('Não foi possível carregar os textos desta categoria.'); }
    const content = result.data ? categoryContentSchema.parse(result.data) : null;
    const categories = await db.from('categorias').select('id').in('slug', [...(CATEGORY_BLOG_SLUGS[data.slug] ?? [])]);
    if (categories.error) throw new Error('Não foi possível carregar as categorias dos guias.');
    const now = new Date();
    const publicPosts = () => db.from('posts').select('*').eq('status', 'publicado').not('publicado_em', 'is', null).lte('publicado_em', now.toISOString()).order('publicado_em', { ascending: false });
    const [posts, general] = await Promise.all([
      categories.data?.length ? publicPosts().in('categoria_id', categories.data.map(c => c.id)).limit(4) : Promise.resolve({ data: [], error: null }),
      publicPosts().in('slug', [...GENERAL_BLOG_GUIDES]).limit(2),
    ]);
    if (posts.error || general.error) throw new Error('Não foi possível carregar os guias desta categoria.');
    const selected = selectBuyingGuides(posts.data ?? [], general.data ?? [], now.getTime());
    return { content, guides: await enrichArticles(db, selected) };
  });
export const categoryContentQuery = (slug: string) => queryOptions({ queryKey: ['category-content', slug], queryFn: () => getCategoryContent({ data: { slug } }), staleTime: 5 * 60_000 });