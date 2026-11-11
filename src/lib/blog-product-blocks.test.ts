import { describe, expect, it } from 'vitest';
import { blogProductBlockVisible, parseBlogProductDirective, selectBlogOffers, splitBlogProductBlocks } from './blog-product-blocks';
import type { RelatedHit } from './related-products';
import { parseArticle } from './blog';

const hit = (id: string, store: string, price = 100, popularity = 50, title = `Produto ${id}`): RelatedHit => ({ objectID: id, title, price, imageUrl: `https://img.example/${id}.webp`, store, affiliateUrl: `https://shop.example/${id}`, popularity_score: popularity, source: 'awin' });

describe('blog product directives', () => {
  it('uses three cards and R$30 by default and caps quantity at six', () => {
    expect(parseBlogProductDirective('produtos', 'busca="protetor solar"')).toMatchObject({ query: 'protetor solar', quantity: 3, minPrice: 30, layout: 'cards' });
    expect(parseBlogProductDirective('produtos', 'qtd=20')?.kind === 'products' && (parseBlogProductDirective('produtos', 'qtd=20') as { quantity: number }).quantity).toBe(6);
  });
  it('parses all search options, comma-separated exclusions and a specific product', () => {
    expect(parseBlogProductDirective('produtos', 'busca="ssd" categoria="Eletrônicos" loja="KaBuM" preco_min=50 preco_max=900 excluir="capa, cabo" layout="lista" titulo="SSDs"')).toMatchObject({ category: 'Eletrônicos', store: 'KaBuM', minPrice: 50, maxPrice: 900, exclude: ['capa', 'cabo'], layout: 'lista', title: 'SSDs' });
    expect(parseBlogProductDirective('produto', 'id="awin:123.abc"')).toEqual({ kind: 'product', id: 'awin:123.abc' });
  });
  it('recognizes both directives after the real Markdown conversion', () => {
    const article = parseArticle('{{produtos busca="protetor solar fps 50" qtd=3 titulo="Protetores com FPS 50"}}\n\n{{produto id="awin:123"}}');
    const parts = splitBlogProductBlocks(article.corpo);
    const blocks = parts.filter(part => part.type === 'block');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ block: { query: 'protetor solar fps 50', title: 'Protetores com FPS 50' } });
    expect(blocks[1]).toMatchObject({ block: { kind: 'product', id: 'awin:123' } });
  });
  it('decodes quotes escaped by the Markdown renderer', () => {
    const parts = splitBlogProductBlocks('<p>{{produtos busca=&quot;protetor solar fps 50&quot; qtd=3 titulo=&quot;Protetores com FPS 50 para comparar&quot;}}</p><p>{{produto id=&quot;awin:123&quot;}}</p>');
    expect(parts[0]).toMatchObject({ block: { query: 'protetor solar fps 50', title: 'Protetores com FPS 50 para comparar' } });
    expect(parts[1]).toMatchObject({ block: { kind: 'product', id: 'awin:123' } });
  });
  it('splits standalone Markdown-generated paragraphs and preserves the surrounding HTML', () => {
    const parts = splitBlogProductBlocks('<h2>Guia</h2><p>{{produtos busca="ssd" qtd=3}}</p><p>Texto</p><p>{{produto id="awin:1"}}</p>');
    expect(parts.map(part => part.type)).toEqual(['html', 'block', 'html', 'block']);
    expect(parts[0]).toMatchObject({ html: '<h2>Guia</h2>' });
    expect(parts[2]).toMatchObject({ html: '<p>Texto</p>' });
  });
  it('does not execute an inline code sample', () => {
    expect(splitBlogProductBlocks('<p>Use {{produtos busca="ssd"}} no texto.</p>')).toHaveLength(1);
    expect(splitBlogProductBlocks('<p>Use {{produtos busca="ssd"}} no texto.</p>')[0]?.type).toBe('html');
  });
});

describe('blog offer selection', () => {
  it('sorts by popularity, excludes terms and enforces the default minimum price', () => {
    const directive = parseBlogProductDirective('produtos', 'excluir="capa" qtd=3');
    if (!directive || directive.kind !== 'products') throw new Error('directive');
    const offers = selectBlogOffers([hit('cheap', 'A', 29, 100), hit('cover', 'B', 100, 99, 'Capa para tablet'), hit('low', 'C', 100, 20), hit('top', 'D', 100, 90)], directive);
    expect(offers.map(offer => offer.id)).toEqual(['top', 'low']);
  });
  it('never selects more than two products from one store and avoids near-identical titles', () => {
    const directive = parseBlogProductDirective('produtos', 'qtd=6');
    if (!directive || directive.kind !== 'products') throw new Error('directive');
    const offers = selectBlogOffers([hit('1', 'A', 100, 100, 'SSD 1TB NVMe'), hit('2', 'A', 100, 99, 'SSD 1TB NVMe'), hit('3', 'A', 100, 98, 'SSD 2TB'), hit('4', 'A', 100, 97, 'SSD 4TB'), hit('5', 'B', 100, 96, 'Monitor gamer')], directive);
    expect(offers.filter(offer => offer.store === 'A')).toHaveLength(2);
    expect(offers.filter(offer => offer.title === 'SSD 1TB NVMe')).toHaveLength(1);
  });
  it('honors explicit category/store-matched candidate lists and maximum price', () => {
    const directive = parseBlogProductDirective('produtos', 'preco_max=150 qtd=3');
    if (!directive || directive.kind !== 'products') throw new Error('directive');
    expect(selectBlogOffers([hit('ok', 'A', 150), hit('expensive', 'B', 151)], directive).map(offer => offer.id)).toEqual(['ok']);
  });
  it('hides a multi-product block below two results but allows one explicit product', () => {
    const products = parseBlogProductDirective('produtos', 'qtd=3');
    const product = parseBlogProductDirective('produto', 'id="awin:1"');
    expect(products && blogProductBlockVisible(products, 1)).toBe(false);
    expect(products && blogProductBlockVisible(products, 2)).toBe(true);
    expect(product && blogProductBlockVisible(product, 1)).toBe(true);
  });
  it('rejects unavailable, hidden, suspicious, imageless and linkless products', () => {
    const directive = parseBlogProductDirective('produto', 'id="awin:1"');
    if (!directive) throw new Error('directive');
    const invalid = [{ ...hit('awin:1', 'A'), status: 'unavailable' }, { ...hit('awin:1', 'A'), site_hidden: true }, { ...hit('awin:1', 'A'), price_review_status: 'pending' }, { ...hit('awin:1', 'A'), imageUrl: null }, { ...hit('awin:1', 'A'), affiliateUrl: '' }];
    for (const candidate of invalid) expect(selectBlogOffers([candidate], directive)).toHaveLength(0);
  });
});
