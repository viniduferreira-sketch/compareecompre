import { z } from 'zod';
import { GENERAL_BLOG_GUIDES } from './blog-promotions';
export const CATEGORY_BLOG_SLUGS: Record<string, readonly string[]> = {
  casa: ['casa-e-cozinha'], eletronicos: ['eletronicos', 'informatica', 'audio'],
  moda: ['moda-e-esporte'], esportes: ['moda-e-esporte'], beleza: ['beleza-e-saude'],
  celulares: ['celulares'], games: ['games'],
};
export function selectBuyingGuides<T extends { slug: string; status: string; publicado_em: string | null }>(categoryPosts: T[], generalPosts: T[], now = Date.now()) {
  const isPublic = (p: T) => p.status === 'publicado' && p.publicado_em && Date.parse(p.publicado_em) <= now;
  const selected = categoryPosts.filter(isPublic).filter(p => !GENERAL_BLOG_GUIDES.some(slug => slug === p.slug)).slice(0, 4);
  for (const slug of GENERAL_BLOG_GUIDES) {
    const post = generalPosts.find(p => p.slug === slug && isPublic(p));
    if (post && !selected.some(p => p.slug === post.slug)) selected.push(post);
  }
  return selected;
}
export const categoryContentSchema = z.object({
  slug: z.string(), introduction: z.string(),
  faq: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })),
  guide_slugs: z.array(z.string()),
});
export type CategoryContent = z.infer<typeof categoryContentSchema>;
export function showCategoryContent(page = 1) { return page === 1; }
export function selectCategoryGuides<T extends { slug: string; status: string; publicado_em: string | null }>(posts: T[], slugs: string[], now = Date.now()): T[] {
  const wanted = [...new Set(slugs)];
  return wanted.flatMap(slug => {
    const post = posts.find(p => p.slug === slug && p.status === 'publicado' && p.publicado_em && Date.parse(p.publicado_em) <= now);
    return post ? [post] : [];
  }).slice(0, 3);
}
export function categoryFaqHead(content: CategoryContent | null) {
  return content?.faq.length ? [{ type: 'application/ld+json', children: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: content.faq.map(item => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) }).replace(/</g, '\\u003c') }] : [];
}