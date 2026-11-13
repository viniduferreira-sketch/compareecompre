import { createServerFn } from '@tanstack/react-start';
import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { selectBuyingGuides } from './category-content';
import { GENERAL_BLOG_GUIDES } from './blog-promotions';

export const getStoreBuyingGuides = createServerFn({ method: 'GET' })
  .inputValidator((input: { categories: string[] }) => z.object({ categories: z.array(z.string().regex(/^[a-z0-9-]+$/).max(80)).max(10) }).parse(input))
  .handler(async ({ data }) => {
    const { blogPublicClient, enrichArticles } = await import('./blog-public.server');
    const url = process.env['SUPABASE_URL'], key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !key) throw new Error('Guias de compra indisponíveis.');
    const db = blogPublicClient(url, key);
    const categories = data.categories.length ? await db.from('categorias').select('id').in('slug', data.categories) : { data: [], error: null };
    if (categories.error) throw new Error('Não foi possível carregar as categorias dos guias.');
    const now = new Date();
    const posts = () => db.from('posts').select('*').eq('status','publicado').not('publicado_em','is',null).lte('publicado_em',now.toISOString()).order('publicado_em',{ascending:false});
    const [specific, general] = await Promise.all([
      categories.data?.length ? posts().in('categoria_id',categories.data.map(c=>c.id)).not('slug','in',`(${GENERAL_BLOG_GUIDES.join(',')})`).limit(4) : Promise.resolve({data:[],error:null}),
      posts().in('slug',[...GENERAL_BLOG_GUIDES]).limit(2),
    ]);
    if (specific.error || general.error) throw new Error('Não foi possível carregar os guias desta loja.');
    return enrichArticles(db, selectBuyingGuides(specific.data ?? [],general.data ?? [],now.getTime()));
  });
export const storeBuyingGuidesQuery = (categories: string[]) => queryOptions({ queryKey:['store-buying-guides',categories], queryFn:()=>getStoreBuyingGuides({data:{categories}}), staleTime:5*60_000 });