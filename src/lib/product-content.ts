import { decodeHTML } from 'entities';

/** Plain partner text only; decode entities before stripping even encoded tags. */
export function partnerDescription(value: unknown): string {
  if (typeof value !== 'string') return '';
  return decodeHTML(value).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>|<\/p>|<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, ' ').replace(/\u00a0/g, ' ').trim();
}

export function partnerAttributes(record: Record<string, unknown>, source: string) {
  const attributes: Array<{ name: string; value: string; source: string }> = [];
  const add = (name: unknown, value: unknown) => {
    const label = partnerDescription(name), text = partnerDescription(value);
    if (!label || !text || attributes.some(attr => attr.name.toLowerCase() === label.toLowerCase())) return;
    attributes.push({ name: label, value: text, source });
  };
  if (Array.isArray(record['attributes'])) for (const attr of record['attributes']) {
    if (attr && typeof attr === 'object') add(attr.name, attr.value ?? attr.value_name);
  }
  for (const [label, keys] of [
    ['Marca', ['brand', 'brand_name']], ['Modelo', ['model', 'product_model', 'model_number']],
    ['Cor', ['colour', 'color']], ['Dimensões', ['dimensions']], ['Garantia', ['warranty', 'guarantee']],
    ['EAN', ['ean', 'gtin', 'product_GTIN']], ['Especificações', ['specifications']],
  ] as const) for (const key of keys) add(label, record[key]);
  return attributes;
}