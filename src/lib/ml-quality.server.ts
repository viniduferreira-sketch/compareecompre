import { getAlgoliaIndexingConfig } from "./algolia-indexing.server";
import {
  ML_QUALITY_CONFIG,
  groupKeyOf,
  demandSignal,
  isSensitiveCategory,
  sellerTrust,
  pickGroupWinner,
  priceVerdict,
  type QualityVerdict,
  type SellerInfo,
} from "./ml-quality";

const MELI_API = "https://api.mercadolibre.com";
const MAX_RETRIES = 4;

type MlRecord = {
  objectID: string;
  title?: string;
  price?: number;
  brand?: string | null;
  categoryName?: string | null;
  imageUrl?: string | null;
  affiliateUrl?: string;
  source?: string;
  status?: string;
};

export type QualitySample = { id: string; title: string; price: number; seller: string; reason: string };

export type MlQualityResult = {
  message: string;
  evaluated: number;
  approved: number;
  rejected: number;
  unknown: number;
  skipped: number;
  byReason: Record<string, number>;
  rejectedSample: QualitySample[];
  approvedSample: QualitySample[];
};

async function fetchWithBackoff(url: string, headers: Record<string, string>): Promise<Response> {
  let wait = 400;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, { headers }).catch(() => null);
    if (res && res.status !== 429 && res.status < 500) return res;
    if (res && res.status >= 400 && res.status < 500 && res.status !== 429) return res;
    await new Promise((r) => setTimeout(r, wait));
    wait *= 2;
  }
  return fetch(url, { headers });
}

async function getToken(): Promise<string> {
  const { getMeliToken } = await import("./search-offers.functions");
  const token = await getMeliToken();
  if (!token) throw new Error("Token do Mercado Livre indisponível");
  return token;
}

async function ensureQualityFilterable(client: ReturnType<typeof getAlgoliaIndexingConfig>["client"], indexName: string) {
  const settings = await client.getSettings({ indexName });
  const current = settings.attributesForFaceting ?? [];
  if (!current.some((a) => a === "quality_status" || a === "filterOnly(quality_status)")) {
    await client.setSettings({ indexName, indexSettings: { attributesForFaceting: [...current, "filterOnly(quality_status)"] } });
  }
}

type Evaluated = {
  record: MlRecord;
  seller: SellerInfo & { nickname: string };
  trusted: boolean;
  hasDemand: boolean;
  isBuyBoxWinner: boolean;
  price: number;
  verdict: QualityVerdict;
};

/**
 * Evaluates quality rules for Mercado Livre records. Dry-run only for now:
 * writes nothing to records; only ensures quality_status is filterable.
 * Only touches source === "mercadolivre"; never deletes anything.
 */
export async function evaluateMercadoLivreQuality(options: { limit?: number } = {}): Promise<MlQualityResult> {
  const limit = Math.min(options.limit ?? ML_QUALITY_CONFIG.sampleLimit, 1000);
  const { client, indexName } = getAlgoliaIndexingConfig();
  const headers = { Authorization: `Bearer ${await getToken()}`, Accept: "application/json" };

  // 1. Collect ML records (stratified sample across the whole browse order).
  const all: MlRecord[] = [];
  await client.browseObjects<MlRecord>({
    indexName,
    browseParams: {
      attributesToRetrieve: ["objectID", "title", "price", "brand", "categoryName", "imageUrl", "affiliateUrl", "source", "status"],
      hitsPerPage: 1000,
    },
    aggregator: (batch) => {
      for (const hit of batch.hits) {
        if (hit.source === "mercadolivre" && hit.status !== "unavailable") all.push(hit);
      }
    },
  });
  const step = Math.max(1, Math.floor(all.length / limit));
  const sample = all.filter((_, i) => i % step === 0).slice(0, limit);
  if (!sample.some((r) => r.objectID === "MLB19602360")) {
    const a23 = all.find((r) => r.objectID === "MLB19602360");
    if (a23) sample.push(a23);
  }

  const sellerCache = new Map<number, (SellerInfo & { nickname: string }) | null>();
  const highlightsCache = new Map<string, Set<string> | null>();
  const evaluated: Evaluated[] = [];
  let unknown = 0;
  let skipped = 0;

  async function getSeller(sellerId: number) {
    if (!sellerCache.has(sellerId)) {
      const res = await fetchWithBackoff(`${MELI_API}/users/${sellerId}`, headers);
      if (res.status !== 200) {
        sellerCache.set(sellerId, null);
      } else {
        const body = await res.json();
        const rep = body?.seller_reputation ?? {};
        sellerCache.set(sellerId, {
          officialStoreId: null,
          powerSellerStatus: rep.power_seller_status ?? null,
          levelId: rep.level_id ?? null,
          completedSales: rep.transactions?.total ?? null,
          positiveRatio: typeof rep.ratings?.positive === "number" ? rep.ratings.positive : null,
          nickname: body?.nickname ?? String(sellerId),
        });
      }
    }
    return sellerCache.get(sellerId) ?? null;
  }

  async function getHighlights(categoryId: string) {
    if (!highlightsCache.has(categoryId)) {
      const res = await fetchWithBackoff(`${MELI_API}/highlights/MLB/category/${categoryId}`, headers);
      if (res.status !== 200) {
        highlightsCache.set(categoryId, null);
      } else {
        const body = await res.json();
        const ids = new Set<string>(
          (Array.isArray(body?.content) ? body.content : [])
            .filter((e: { type?: string }) => e?.type === "PRODUCT")
            .map((e: { id?: string }) => String(e?.id ?? "")),
        );
        highlightsCache.set(categoryId, ids);
      }
    }
    return highlightsCache.get(categoryId) ?? null;
  }

  async function evaluateOne(record: MlRecord): Promise<void> {
    const productRes = await fetchWithBackoff(`${MELI_API}/products/${record.objectID}`, headers);
    if (productRes.status !== 200) {
      if (productRes.status === 404 || productRes.status === 410) {
        skipped++; // revalidation owns inactive/missing products
      } else {
        unknown++;
      }
      return;
    }
    const product = await productRes.json();
    if (product?.status !== "active") {
      skipped++;
      return;
    }
    const itemsRes = await fetchWithBackoff(`${MELI_API}/products/${record.objectID}/items?limit=20`, headers);
    if (itemsRes.status !== 200) {
      if (itemsRes.status === 404 || itemsRes.status === 410) skipped++;
      else unknown++;
      return;
    }
    const itemsBody = await itemsRes.json();
    const items = (Array.isArray(itemsBody?.results) ? itemsBody.results : []).filter(
      (i: { price?: number }) => typeof i?.price === "number" && i.price > 0,
    );
    if (items.length === 0) {
      skipped++;
      return;
    }
    const cheapest = items.sort((a: { price: number }, b: { price: number }) => a.price - b.price)[0];

    if (!record.imageUrl || !record.title || !record.affiliateUrl) {
      evaluated.push({
        record, seller: { nickname: "" }, trusted: false, hasDemand: false,
        isBuyBoxWinner: false, price: record.price ?? cheapest.price,
        verdict: { status: "rejected", reason: "dados incompletos" },
      });
      return;
    }
    if (cheapest.condition && cheapest.condition !== "new") {
      evaluated.push({
        record, seller: { nickname: "" }, trusted: false, hasDemand: false,
        isBuyBoxWinner: false, price: cheapest.price,
        verdict: { status: "rejected", reason: "anúncio usado" },
      });
      return;
    }

    const seller = await getSeller(cheapest.seller_id);
    if (!seller) {
      unknown++;
      return;
    }
    seller.officialStoreId = cheapest.official_store_id ?? null;
    const trust = sellerTrust(seller);
    const trusted = trust.tier !== null;

    const highlights = cheapest.category_id ? await getHighlights(String(cheapest.category_id)) : null;
    const isBuyBoxWinner = !!product.buy_box_winner;
    // sold_quantity does not exist in the ML payload; competition between sellers
    // on the same catalog product is the available proxy for real demand.
    const demand = demandSignal({
      isBestSeller: highlights?.has(record.objectID) ?? false,
      sellerCount: items.length,
      isBuyBoxWinner,
    });
    const hasDemand = demand !== null;
    const sensitive = isSensitiveCategory({ siteCategory: record.categoryName, domainId: product.domain_id, title: record.title });

    let verdict: QualityVerdict;
    if (!trusted) verdict = { status: "rejected", reason: "vendedor sem reputação" };
    else if (sensitive && trust.tier === "green") verdict = { status: "rejected", reason: "categoria sensível exige loja oficial ou Mercado Líder" };
    else if (!hasDemand) verdict = { status: "rejected", reason: "sem sinal de procura" };
    else verdict = { status: "approved", reason: `${trust.label} · procura: ${demand}${sensitive ? " · categoria sensível" : ""}` };

    evaluated.push({ record, seller, trusted, hasDemand, isBuyBoxWinner, price: cheapest.price, verdict });
  }

  // 2. Per-record evaluation with bounded concurrency.
  let cursor = 0;
  await Promise.all(
    Array.from({ length: ML_QUALITY_CONFIG.concurrency }, async () => {
      while (cursor < sample.length) {
        const record = sample[cursor++];
        if (record) await evaluateOne(record);
      }
    }),
  );

  // 3. Group-level rules: price coherence and duplicity.
  const groups = new Map<string, Evaluated[]>();
  for (const e of evaluated) {
    const key = groupKeyOf({ categoryName: e.record.categoryName, brand: e.record.brand, title: e.record.title ?? "" });
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(e);
    groups.set(key, list);
  }
  for (const list of groups.values()) {
    const prices = list.map((e) => e.price);
    for (const e of list) {
      if (e.verdict.status !== "approved") continue;
      const pv = priceVerdict(e.price, prices, e.trusted);
      if (pv !== "ok") e.verdict = { status: "rejected", reason: pv };
    }
    const approved = list.filter((e) => e.verdict.status === "approved");
    if (approved.length > 1) {
      const winnerId = pickGroupWinner(approved.map((e) => ({ id: e.record.objectID, price: e.price, isBuyBoxWinner: e.isBuyBoxWinner })));
      for (const e of approved) {
        if (e.record.objectID !== winnerId) e.verdict = { status: "rejected", reason: "duplicado" };
      }
    }
  }

  // 4. Aggregate. Settings only (no record writes) so the frontend filter works.
  // The price replicas are configured explicitly, like the revalidation does.
  for (const name of [indexName, `${indexName}_price_asc`, `${indexName}_price_desc`]) {
    await ensureQualityFilterable(client, name).catch(() => undefined);
  }

  const byReason: Record<string, number> = {};
  const rejectedAll: QualitySample[] = [];
  const approvedAll: QualitySample[] = [];
  let approved = 0;
  let rejected = 0;
  for (const e of evaluated) {
    const entry: QualitySample = { id: e.record.objectID, title: e.record.title ?? "", price: e.price, seller: e.seller.nickname, reason: e.verdict.reason };
    if (e.verdict.status === "approved") {
      approved++;
      approvedAll.push(entry);
    } else if (e.verdict.status === "rejected") {
      rejected++;
      byReason[e.verdict.reason] = (byReason[e.verdict.reason] ?? 0) + 1;
      rejectedAll.push(entry);
    }
  }

  // Surface the Galaxy A23 case first when it was evaluated, so the admin can confirm it.
  for (const list of [rejectedAll, approvedAll]) {
    const idx = list.findIndex((s) => s.id === "MLB19602360");
    if (idx > 0) list.unshift(...list.splice(idx, 1));
  }
  const rejectedSample = rejectedAll.slice(0, 30);
  const approvedSample = approvedAll.slice(0, 15);

  return {
    message: `Simulação de qualidade: ${evaluated.length} avaliados de ${all.length} registros ML (amostra), ${approved} aprovados, ${rejected} rejeitados, ${unknown} desconhecidos, ${skipped} ignorados (tratados pela revalidação).`,
    evaluated: evaluated.length,
    approved,
    rejected,
    unknown,
    skipped,
    byReason,
    rejectedSample,
    approvedSample,
  };
}
