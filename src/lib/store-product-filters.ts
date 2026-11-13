import { decodeHTML } from 'entities';

export type ProductFilterInput = {
  title?: string | null; merchant_category?: string | null; category_name?: string | null;
  product_type?: string | null; category_path?: string | null; merchant_category_path?: string | null;
  category?: string | null; productType?: string | null; audience?: string[] | null;
};
const normalized = (value: string) => decodeHTML(value).replace(/<[^>]*>/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const TYPES: readonly [string, RegExp][] = [
  ['Tênis', /\b(tenis|sneakers?|running shoes|trainers)\b/],
  ['Camisetas', /\b(camisetas?|t-shirts?|tees?)\b/],
  ['Calças', /\b(calcas?|pants|trousers|leggings?|tights)\b/],
  ['Jaquetas', /\b(jaquetas?|jackets?|corta[ -]vento|windbreakers?)\b/],
  ['Shorts e bermudas', /\b(shorts?|bermudas?)\b/],
  ['Moletons', /\b(moletons?|moletom|hoodies?|sweatshirts?)\b/],
  ['Chinelos e sandálias', /\b(chinelos?|sandalias?|slides?|flip[ -]flops)\b/],
  ['Vestidos e saias', /\b(vestidos?|saias?|dresses|skirts?)\b/],
  ['Tops e sutiãs', /\b(tops?|sutias?|bras)\b/],
  ['Acessórios', /\b(acessorios?|accessories|bones?|caps|meias?|socks|mochilas?|backpacks|bolsas?|bags|luvas?|gloves|cintos?|belts|suportes?|cabos?|capas?|adaptadores?|carregadores?)\b/],
  ['Memórias RAM', /\b(memoria ram|memorias ram|ram memory)\b/],
  ['Computadores', /\b(computadores?|desktop|imac|pc gamer)\b/],
  ['Notebooks', /\b(notebooks?|laptops?)\b/], ['Monitores', /\b(monitores?|monitors)\b/],
  ['Placas de vídeo', /\b(placas? de video|graphics cards?|video cards?)\b/],
  ['SSDs', /\b(ssd)\b/], ['Tablets', /\b(tablets?)\b/],
  ['Celulares', /\b(celulares?|smartphones?)\b/], ['Roteadores', /\b(roteadores?|routers?)\b/],
  ['Televisores', /\b(televisores?|televisao|smart tv|tvs?)\b/],
  ['Fones de ouvido', /\b(fones? de ouvido|headsets?|headphones?|earbuds)\b/],
  ['Teclados', /\b(teclados?|keyboards?)\b/], ['Mouses', /\b(mouses?|mouse)\b/],
  ['Ventiladores', /\b(ventiladores?|fans)\b/], ['Air fryers', /\b(air fryers?|fritadeiras?)\b/],
  ['Liquidificadores', /\b(liquidificadores?|blenders?)\b/], ['Cafeteiras', /\b(cafeteiras?)\b/],
  ['Brinquedos', /\b(brinquedos?|toys|lego)\b/],
];
function typeFrom(value: string) {
  const n = normalized(value);
  // Explicit accessories/components are not the device they are compatible with.
  if (/^(?:suporte|cabo|capa|adaptador|carregador|pelicula|meias?|mochila|bolsa|bone)\b/.test(n.trim())) return 'Acessórios';
  if (/^memoria ram\b/.test(n.trim())) return 'Memórias RAM';
  if (/^(?:computador|desktop|imac|pc gamer)\b/.test(n.trim())) return 'Computadores';
  // A path's final segment is more specific than its parent category.
  const segments = n.split(/\s*[>|/]\s*/).reverse();
  for (const segment of segments) {
    const matches = TYPES.filter(([, pattern]) => pattern.test(segment));
    if (matches.length === 1) return matches[0]?.[0] ?? null;
    if (matches.length > 1) return null;
  }
  return null;
}
function audienceFrom(value: string): string[] {
  const n = normalized(value);
  if (/\b(unissex|unisex)\b/.test(n)) return ['Unissex'];
  const result: string[] = [];
  if (/\b(masculin[oa]s?|homens?|men|mens|male|boys|meninos?)\b/.test(n)) result.push('Masculino');
  if (/\b(feminin[oa]s?|mulheres?|women|womens|female|girls|meninas?)\b/.test(n)) result.push('Feminino');
  if (/\b(infantil|infantis|criancas?|kids|children|junior|bebes?|babies|boys|girls|meninos?|meninas?)\b/.test(n)) result.push('Infantil');
  return result;
}
export function classifyStoreProduct(input: ProductFilterInput) {
  const paths = [input.product_type, input.merchant_category_path, input.category_path, input.merchant_category, input.category_name, input.category].filter((v): v is string => Boolean(v?.trim()));
  const productType = input.productType || paths.map(typeFrom).find(Boolean) || typeFrom(input.title ?? '');
  const feedAudience = audienceFrom(paths.join(' '));
  const audience = input.audience?.length ? input.audience : feedAudience.length ? feedAudience : audienceFrom(input.title ?? '');
  return { productType: productType || null, audience };
}