import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { buyingTopic } from './product-buying';

export const getBuyingGuide = createServerFn({ method: 'GET' })
  .inputValidator((input: { title: string }) => z.object({ title: z.string().max(2000) }).parse(input))
  .handler(async ({ data }) => {
    const topic = buyingTopic(data.title);
    const url = process.env['SUPABASE_URL'], key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!topic || !url || !key) return null;
    const { blogPublicClient } = await import('./blog-public.server');
    const result = await blogPublicClient(url, key).from('posts').select('titulo,slug')
      .eq('slug', `como-escolher-${topic[0]}`).eq('status', 'publicado')
      .lte('publicado_em', new Date().toISOString()).maybeSingle();
    if (result.error) { console.error('Buying guide unavailable', result.error.code); return null; }
    return result.data;
  });