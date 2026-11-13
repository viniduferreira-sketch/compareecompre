import { comparisonKey } from './product-comparison';
import { normalizeGtin } from './product-identifiers';
import type { RelatedHit } from './related-products';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const topics = [
  ['roteador-wifi', 'roteador'], ['ssd', 'ssd'], ['tablet', 'tablet'], ['ventilador', 'ventilador'],
  ['batedeira', 'batedeira'], ['microfone-usb', 'microfone usb'], ['soundbar', 'soundbar'],
  ['caixa-de-som-bluetooth', 'caixa de som bluetooth'], ['mouse-gamer', 'mouse gamer'],
  ['headset-gamer', 'headset gamer'], ['cadeira-gamer', 'cadeira gamer'], ['liquidificador', 'liquidificador'],
  ['aspirador-robo', 'aspirador robo'], ['smartwatch', 'smartwatch'], ['maquina-de-lavar', 'maquina de lavar'],
  ['geladeira', 'geladeira'], ['monitor', 'monitor'], ['smart-tv', 'smart tv'], ['fone-de-ouvido', 'fone de ouvido'],
  ['protetor-solar', 'protetor solar'], ['air-fryer', 'air fryer'], ['tenis-de-corrida', 'tenis de corrida'],
  ['notebook-custo-beneficio', 'notebook'], ['celular-custo-beneficio', 'celular'],
] as const;

export function buyingTopic(title: string) {
  const text = ` ${normalize(title)} `;
  if (/\b(capa|suporte|cabo|adaptador|pelicula|peca|refil)\b/.test(text)) return null;
  if (/\b(pc gamer|computador|desktop)\b/.test(text)) return null;
  return topics.find(([, term]) => text.includes(` ${term} `)) ?? null;
}
export type TechnicalHit = RelatedHit & {
  gtin?: string | null; ean?: string | null; model?: string | null; comparison_variant?: unknown;
  attributes?: Array<{ name?: string; value?: string; value_name?: string; source?: string }>;
};
export function technicalAttributes(hit: TechnicalHit) {
  return (hit.attributes ?? []).flatMap(attr => {
    const name = attr.name?.trim(), value = (attr.value ?? attr.value_name)?.trim();
    if (!name || !value || /^(marca|brand|modelo|model|cor|color|ean|gtin|sku)$/i.test(name) || /^(n\/a|nao informado|—|-)$/i.test(value)) return [];
    return [{ name, value, source: attr.source ?? hit.source }];
  });
}
export function selectTechnicalSimilars(current: TechnicalHit, hits: TechnicalHit[]) {
  const topic = buyingTopic(current.title);
  if (!topic || !technicalAttributes(current).length || !(current.price > 0)) return [];
  const seen = new Set<string>();
  const key = comparisonKey(current);
  const selected = hits.filter(hit => {
    if (hit.objectID === current.objectID || buyingTopic(hit.title)?.[0] !== topic[0]
      || (hit.categoryName ?? hit.category) !== (current.categoryName ?? current.category)
      || hit.price < current.price * 0.7 || hit.price > current.price * 1.3
      || hit.status === 'unavailable' || hit.quality_status === 'rejected' || hit.site_hidden || hit.price_review_status === 'pending'
      || !technicalAttributes(hit).length || (key && comparisonKey(hit) === key)) return false;
    const model = normalize(hit.model ?? ''), baseModel = normalize(current.model ?? '');
    const brand = normalize(hit.brand ?? ''), baseBrand = normalize(current.brand ?? '');
    // Require explicit different model evidence; a different GTIN alone may be a size/colour variant.
    if (!model || !baseModel || !brand || !baseBrand || (model === baseModel && brand === baseBrand)) return false;
    const gtin = normalizeGtin(hit.gtin ?? hit.ean);
    if (gtin && gtin === normalizeGtin(current.gtin ?? current.ean)) return false;
    const identity = `${brand}:${model}`;
    if (seen.has(identity)) return false;
    seen.add(identity); return true;
  }).sort((a, b) => Math.abs(a.price - current.price) - Math.abs(b.price - current.price)).slice(0, 3);
  return selected.length >= 2 ? selected : [];
}