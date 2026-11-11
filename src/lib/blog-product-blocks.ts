import { relatedOffer, type RelatedHit } from './related-products';
import { sameRailProduct, validProductImage } from './rail-products';
import type { Offer } from './search-offers.functions';

export const BLOG_PRODUCT_DEFAULT_MIN_PRICE = 30;
export const BLOG_PRODUCT_MAX_QUANTITY = 6;
export const BLOG_PRODUCT_MAX_PER_STORE = 2;

export type BlogProductsBlock = {
  kind: 'products';
  query: string;
  category: string;
  store: string;
  minPrice: number;
  maxPrice: number | null;
  exclude: string[];
  quantity: number;
  layout: 'cards' | 'lista';
  title: string;
};
export type BlogProductBlock = { kind: 'product'; id: string };
export type BlogProductDirective = BlogProductsBlock | BlogProductBlock;
export type BlogContentSegment =
  | { type: 'html'; html: string }
  | { type: 'block'; block: BlogProductDirective; key: string };

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const decode = (value: string) => value.replace(/&quot;|&#34;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
const text = (value: string | undefined, max: number) => (value ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
const money = (value: string | undefined, fallback: number | null) => {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 10_000_000 ? parsed : fallback;
};

export function parseBlogProductDirective(kind: string, source: string): BlogProductDirective | null {
  const attributes: Record<string, string> = {};
  const pattern = /([a-z_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+))/gi;
  for (const match of decode(source).matchAll(pattern)) attributes[match[1]?.toLowerCase() ?? ''] = decode(match[2] ?? match[3] ?? match[4] ?? '');
  if (kind.toLowerCase() === 'produto') {
    const id = text(attributes['id'], 160);
    return /^[a-zA-Z0-9_:.-]+$/.test(id) ? { kind: 'product', id } : null;
  }
  if (kind.toLowerCase() !== 'produtos') return null;
  const quantity = Number(attributes['qtd'] ?? 3);
  const minPrice = money(attributes['preco_min'], BLOG_PRODUCT_DEFAULT_MIN_PRICE) ?? BLOG_PRODUCT_DEFAULT_MIN_PRICE;
  const maxPrice = money(attributes['preco_max'], null);
  if (maxPrice !== null && maxPrice < minPrice) return null;
  return {
    kind: 'products', query: text(attributes['busca'], 120), category: text(attributes['categoria'], 100), store: text(attributes['loja'], 100),
    minPrice, maxPrice, exclude: (attributes['excluir'] ?? '').split(',').map(value => text(value, 60)).filter(Boolean).slice(0, 12),
    quantity: Number.isFinite(quantity) ? Math.min(BLOG_PRODUCT_MAX_QUANTITY, Math.max(1, Math.trunc(quantity))) : 3,
    layout: attributes['layout'] === 'lista' ? 'lista' : 'cards', title: text(attributes['titulo'], 160),
  };
}

/** Directives are paragraphs of their own; inline look-alikes remain ordinary article text. */
export function splitBlogProductBlocks(html: string): BlogContentSegment[] {
  const segments: BlogContentSegment[] = [];
  const pattern = /<p>\s*\{\{(produtos|produto)\b([\s\S]*?)\}\}\s*<\/p>/gi;
  let cursor = 0, index = 0;
  for (const match of html.matchAll(pattern)) {
    const start = match.index;
    const block = parseBlogProductDirective(match[1] ?? '', match[2] ?? '');
    if (!block) continue;
    if (start > cursor) segments.push({ type: 'html', html: html.slice(cursor, start) });
    segments.push({ type: 'block', block, key: `blog-products-${index++}` });
    cursor = start + match[0].length;
  }
  if (cursor < html.length) segments.push({ type: 'html', html: html.slice(cursor) });
  return segments;
}

function visible(hit: RelatedHit, minPrice: number, maxPrice: number | null) {
  return Number.isFinite(hit.price) && hit.price >= minPrice && (maxPrice === null || hit.price <= maxPrice)
    && validProductImage(hit.imageUrl) && hit.status !== 'unavailable' && hit.quality_status !== 'rejected'
    && !hit.site_hidden && hit.price_review_status !== 'pending' && Boolean(relatedOffer(hit).affiliateUrl);
}

/** Public Algolia filters are repeated here as a defense against stale or malformed hits. */
export function selectBlogOffers(hits: RelatedHit[], directive: BlogProductDirective): Offer[] {
  const isSingle = directive.kind === 'product';
  const minPrice = isSingle ? BLOG_PRODUCT_DEFAULT_MIN_PRICE : directive.minPrice;
  const maxPrice = isSingle ? null : directive.maxPrice;
  const excluded = isSingle ? [] : directive.exclude.map(normalize).filter(Boolean);
  const limit = isSingle ? 1 : directive.quantity;
  const selected: Offer[] = [], hitsByStore = new Map<string, number>();
  const ordered = isSingle ? hits : [...hits].sort((a, b) => (b.popularity_score ?? 0) - (a.popularity_score ?? 0));
  for (const hit of ordered) {
    if (isSingle && hit.objectID !== directive.id) continue;
    if (!visible(hit, minPrice, maxPrice)) continue;
    if (excluded.some(term => normalize(hit.title).includes(term))) continue;
    const offer = relatedOffer(hit);
    if (selected.some(item => item.id === offer.id || sameRailProduct(item, offer))) continue;
    if (!isSingle && (hitsByStore.get(offer.store) ?? 0) >= BLOG_PRODUCT_MAX_PER_STORE) continue;
    selected.push(offer);
    hitsByStore.set(offer.store, (hitsByStore.get(offer.store) ?? 0) + 1);
    if (selected.length >= limit) break;
  }
  return selected;
}

export function blogProductBlockVisible(directive: BlogProductDirective, count: number) {
  return directive.kind === 'product' ? count === 1 : count >= 2;
}
