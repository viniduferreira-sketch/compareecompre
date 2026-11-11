import { expect, it } from 'vitest';
import { categoryFaqHead, selectCategoryGuides, showCategoryContent } from './category-content';
it('shows editorial content on page one, including filtered page one, never page two or three', () => {
  expect(showCategoryContent()).toBe(true); expect(showCategoryContent(1)).toBe(true);
  expect(showCategoryContent(2)).toBe(false); expect(showCategoryContent(3)).toBe(false);
});
const now = Date.parse('2026-11-11T07:00:00Z');
const post = (slug: string, status = 'publicado', publicado_em: string | null = '2026-11-10T00:00:00Z') => ({ slug, status, publicado_em });
it('ignores missing, draft, scheduled, future and undated guide slugs', () => {
  const posts = [post('live'), post('draft', 'rascunho'), post('future', 'publicado', '2027-01-01T00:00:00Z'), post('scheduled', 'agendado'), post('undated', 'publicado', null)];
  expect(selectCategoryGuides(posts, ['missing', 'draft', 'future', 'scheduled', 'undated', 'live'], now).map(p => p.slug)).toEqual(['live']);
});
it('preserves requested guide order, deduplicates and caps at three', () => {
  expect(selectCategoryGuides(['a', 'b', 'c', 'd'].map(s => post(s)), ['c', 'c', 'a', 'b', 'd'], now).map(p => p.slug)).toEqual(['c', 'a', 'b']);
});
it('returns an empty selection when no requested post is public', () => {
  expect(selectCategoryGuides([post('draft', 'rascunho')], ['draft', 'missing'], now)).toEqual([]);
});
it('maps exactly the visible question and answer into FAQPage and safely escapes script content', () => {
  const scripts = categoryFaqHead({ slug: 'casa', introduction: '', guide_slugs: [], faq: [{ question: 'O preço inclui o frete?', answer: 'Confira na loja. </script>' }] });
  expect(JSON.parse(scripts[0]?.children || '{}').mainEntity[0]).toEqual({ '@type': 'Question', name: 'O preço inclui o frete?', acceptedAnswer: { '@type': 'Answer', text: 'Confira na loja. </script>' } });
  expect(scripts[0]?.children.includes('</script>')).toBe(false);
  expect(categoryFaqHead(null)).toEqual([]);
});