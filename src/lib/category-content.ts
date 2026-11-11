import { z } from 'zod';
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