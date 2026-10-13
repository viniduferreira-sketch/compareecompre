import { fetchQA_MercadoLivre, type PartnerQA } from '@/lib/partner-qa.server';
import { getAlgoliaConfig } from '@/lib/algolia.server';
import { fetchMeliWithRetry, removalIds, validMeliItem } from '@/lib/offer-freshness';

const AFFILIATE_PARAMS = 'matt_tool=15523479&matt_word=compareecompre';
export const MENU_CATEGORIES = [
  { name: 'Eletrônicos', queries: ['smart tv', 'fone bluetooth', 'caixa de som', 'tablet', 'câmera digital', 'smartwatch', 'monitor'] },
  { name: 'Moda', queries: ['tênis', 'camiseta', 'vestido', 'calça jeans', 'bolsa', 'relógio', 'jaqueta'] },
  { name: 'Casa', queries: ['air fryer', 'liquidificador', 'cafeteira', 'aspirador', 'ventilador', 'microondas', 'panela elétrica'] },
  { name: 'Celulares', queries: ['iphone', 'samsung galaxy', 'motorola celular', 'xiaomi celular', 'realme celular', 'smartphone'] },
  { name: 'Games', queries: ['playstation', 'xbox', 'nintendo switch', 'controle gamer', 'headset gamer', 'cadeira gamer', 'jogo videogame'] },
  { name: 'Beleza', queries: ['perfume', 'maquiagem', 'secador de cabelo', 'chapinha', 'barbeador', 'hidratante', 'protetor solar'] },
  { name: 'Esportes', queries: ['bicicleta', 'tênis corrida', 'halter', 'bola futebol', 'camisa de time', 'suplemento', 'mochila esportiva'] },
] as const;
type CatalogProduct = { id: string; name: string; domain_id?: string; pictures?: Array<{ url?: string }>; short_description?: { content?: string }; attributes?: Array<{ id?: string; name?: string; value_name?: string }> };
type CatalogItem = { id?: string; item_id?: string; status?: string; available_quantity?: number; title?: string; thumbnail?: string; price?: number; original_price?: number | null; category_id?: string; shipping?: { free_shipping?: boolean }; permalink?: string };
type IndexedOffer = { objectID: string; source?: string; categoryName?: string; store?: string; qa?: PartnerQA[]; [key: string]: unknown };
export type SyncOffersResult = { success: boolean; executionId: string; category: string; fetched: number; updated: number; removed: number; errors: number; durationMs: number; error?: string };
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getMeliToken(fetcher: typeof fetch): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30000) return cachedToken.value;
  const clientId = process.env['ML_CLIENT_ID']; const secret = process.env['ML_CLIENT_SECRET'];
  if (!clientId || !secret) throw new Error('Credenciais do Mercado Livre ausentes.');
  const response = await fetcher('https://api.mercadolibre.com/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: secret }) });
  if (!response.ok) throw new Error(`Mercado Livre autenticação HTTP ${response.status}`);
  const data = await response.json() as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

// Every category stages its complete snapshot before any Algolia write or removal.
export async function syncOffersToAlgolia(options: { category: string; targetPerCategory?: number }): Promise<SyncOffersResult> {
  const started = Date.now(); const executionId = crypto.randomUUID();
  const result: SyncOffersResult = { success: false, executionId, category: options.category, fetched: 0, updated: 0, removed: 0, errors: 0, durationMs: 0 };
  const category = MENU_CATEGORIES.find(item => item.name === options.category);
  if (!category) throw new Error('Categoria inválida.');
  const target = Math.min(options.targetPerCategory ?? 100, 150);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180000);
  let apiFailed = false;
  const request: typeof fetch = async (input, init) => {
    const response = await fetch(input, { ...init, signal: controller.signal });
    if (response.status === 403 || response.status === 429 || response.status >= 500) {
      apiFailed = true;
      result.errors += 1;
      console.error('Mercado Livre sync retry/error', { executionId, category: category.name, status: response.status });
    }
    return response;
  };
  const fetcher = (input: string, init?: RequestInit) => fetchMeliWithRetry(input, init, request);
  let locked = false;
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  try {
    const lease = await supabaseAdmin.rpc('claim_offer_sync_category', { _category: category.name, _execution_id: executionId });
    if (lease.error) throw lease.error;
    if (!lease.data) throw new Error('Categoria já está sendo sincronizada.');
    locked = true;
    const { client, indexName } = getAlgoliaConfig();
    const previous: IndexedOffer[] = []; let cursor: string | undefined;
    do {
      const page = await client.browse<IndexedOffer>({ indexName, browseParams: { hitsPerPage: 1000, cursor } });
      previous.push(...page.hits); cursor = page.cursor;
    } while (cursor);
    const previousById = new Map(previous.map(item => [item.objectID, item]));
    const headers = { Authorization: `Bearer ${await getMeliToken(request)}`, Accept: 'application/json' };
    const records: IndexedOffer[] = []; const seen = new Set<string>();
    const read = async <T>(url: string): Promise<T> => {
      const response = await fetcher(url, { headers });
      if (!response.ok) {
        const body = await response.text();
        console.error('Mercado Livre sync API error', { executionId, category: category.name, status: response.status, body });
        throw new Error(`Mercado Livre HTTP ${response.status}`);
      }
      return await response.json() as T;
    };
    const mapProduct = async (product: CatalogProduct): Promise<IndexedOffer | null> => {
      const old = previousById.get(product.id);
      // Never overwrite another partner's record or a record from another category.
      if (old && ((old.source && old.source !== 'mercadolivre') || old.categoryName !== category.name)) return null;
      const json = await read<{ results?: CatalogItem[] }>(`https://api.mercadolibre.com/products/${encodeURIComponent(product.id)}/items?limit=20`);
      if (!Array.isArray(json.results) || json.results.length === 0) throw new Error('Lista de ofertas vazia inesperada.');
      const items: CatalogItem[] = [];
      for (const candidate of json.results) {
        let item = candidate;
        if (item.status === undefined || item.available_quantity === undefined || !item.permalink) {
          const id = item.item_id ?? item.id;
          if (!id || !/^MLB\d+$/.test(id)) throw new Error('Oferta sem ID verificável.');
          item = await read<CatalogItem>(`https://api.mercadolibre.com/items/${encodeURIComponent(id)}`);
        }
        if (validMeliItem(item)) items.push(item);
      }
      if (!items.length) return null;
      const cheapest = items.reduce((best, item) => Number(item.price) < Number(best.price) ? item : best);
      if (!validMeliItem(cheapest) || !cheapest.permalink || typeof cheapest.price !== 'number') return null;
      const stamp = new Date().toISOString(); const price = cheapest.price;
      const originalPrice = cheapest.original_price && cheapest.original_price > price ? cheapest.original_price : null;
      const itemId = cheapest.id ?? cheapest.item_id ?? '';
      const qa = itemId ? await fetchQA_MercadoLivre(itemId, headers, fetcher) : [];
      const url = new URL(cheapest.permalink); new URLSearchParams(AFFILIATE_PARAMS).forEach((value, key) => url.searchParams.set(key, value));
      return {
        objectID: product.id, itemId, title: product.name, imageUrl: product.pictures?.[0]?.url ?? cheapest.thumbnail ?? null,
        images: product.pictures?.map(picture => picture.url).filter(Boolean) ?? [],
        store: 'Mercado Livre', source: 'mercadolivre', status: 'active', available_quantity: cheapest.available_quantity,
        permalink: cheapest.permalink, last_synced_at: stamp, last_synced_at_timestamp: Date.parse(stamp),
        price, originalPrice, discountPercent: originalPrice ? Math.round((originalPrice - price) / originalPrice * 100) : null,
        freeShipping: Boolean(cheapest.shipping?.free_shipping), affiliateUrl: url.toString(),
        category: cheapest.category_id ?? product.domain_id ?? null, categoryName: category.name,
        brand: product.attributes?.find(attribute => attribute.id === 'BRAND')?.value_name ?? null,
        attributes: product.attributes?.filter(attribute => attribute.name && attribute.value_name).map(attribute => ({ name: attribute.name, value: attribute.value_name })) ?? [],
        description: product.short_description?.content?.trim() ?? '', sellerCount: items.length,
        qa: qa.length ? qa : old?.qa ?? [],
      };
    };
    for (const query of category.queries) {
      if (records.length >= target) break;
      for (let page = 0; page < 10 && records.length < target; page++) {
        const params = new URLSearchParams({ status: 'active', site_id: 'MLB', q: query, limit: '20', offset: String(page * 20) });
        const json = await read<{ results?: CatalogProduct[] }>(`https://api.mercadolibre.com/products/search?${params}`);
        if (!Array.isArray(json.results) || json.results.length === 0) throw new Error('Busca de categoria vazia inesperada.');
        result.fetched += json.results.length;
        const products = json.results.filter(product => { if (!product.id || !product.name || seen.has(product.id)) return false; seen.add(product.id); return true; });
        for (let position = 0; position < products.length && records.length < target; position += 3) {
          const batch = await Promise.allSettled(products.slice(position, position + 3).map(mapProduct));
          const failures = batch.filter(item => item.status === 'rejected');
          result.errors += failures.length;
          if (failures.length) throw new Error('Falha na validação de ofertas; categoria preservada.');
          for (const item of batch) if (item.status === 'fulfilled' && item.value && records.length < target) records.push(item.value);
        }
        if (json.results.length < 20) break;
      }
    }
    if (records.length < target) throw new Error(`Categoria incompleta: ${records.length}/${target} ofertas válidas.`);
    if (apiFailed) throw new Error('A API retornou erro nesta execução; categoria preservada.');
    if (controller.signal.aborted) throw new Error('Tempo de consulta excedido; categoria preservada.');
    const removed = removalIds(previous, new Set(records.map(item => item.objectID)), category.name, true);
    await client.saveObjects({ indexName, objects: records, batchSize: 100, waitForTasks: true });
    result.updated = records.length;
    if (removed.length) {
      const tasks = await client.deleteObjects({ indexName, objectIDs: removed });
      for (const task of tasks) await client.waitForTask({ indexName, taskID: task.taskID });
    }
    result.removed = removed.length; result.success = true;
  } catch (error) {
    result.errors = Math.max(1, result.errors);
    result.error = error instanceof Error ? error.message : 'Falha de sincronização.';
  } finally {
    clearTimeout(timer);
    if (locked) {
      const release = await supabaseAdmin.rpc('release_offer_sync_category', { _category: category.name, _execution_id: executionId });
      if (release.error) console.error('Algolia sync lease release failed', release.error.message);
    }
    result.durationMs = Date.now() - started;
    console.info('Algolia category sync summary', result);
  }
  return result;
}
