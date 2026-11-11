import { createServerFn } from '@tanstack/react-start';
import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { categoryContentSchema, selectCategoryGuides } from './category-content';

export const getCategoryContent = createServerFn({ method: 'GET' })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().regex(/^[a-z0-9-]+$/).max(80) }).parse(input))
  .handler(async ({ data }) => {
    const { blogPublicClient, enrichArticles } = await import('./blog-public.server');
    const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !key) throw new Error('Conteúdo das categorias indisponível.');
    const db = blogPublicClient(url, key);
    const result = await db.from('category_content').select('slug,introduction,faq,guide_slugs').eq('slug', data.slug).maybeSingle();
    if (result.error) { console.error('Category content', result.error); throw new Error('Não foi possível carregar os textos desta categoria.'); }
    if (!result.data) return { content: null, guides: [] };
    const content = categoryContentSchema.parse(result.data);
    const slugs = [...new Set(content.guide_slugs)].slice(0, 100);
    if (!slugs.length) return { content, guides: [] };
    const now = new Date();
    const posts = await db.from('posts').select('*').in('slug', slugs).eq('status', 'publicado').not('publicado_em', 'is', null).lte('publicado_em', now.toISOString());
    if (posts.error) { console.error('Category guides', posts.error); throw new Error('Não foi possível carregar os guias desta categoria.'); }
    const selected = selectCategoryGuides(posts.data ?? [], slugs, now.getTime());
    return { content, guides: await enrichArticles(db, selected) };
  });
export const categoryContentQuery = (slug: string) => queryOptions({ queryKey: ['category-content', slug], queryFn: () => getCategoryContent({ data: { slug } }), staleTime: 5 * 60_000 });