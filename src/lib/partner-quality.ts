import { isAwinMerchantAllowed, normalizeAwinMerchantName } from "./awin-allowlist";
import { normalizePolicyText } from "./content-policy";
import { normalizeGtin } from "./product-identifiers";
import { SITE_CATEGORIES } from "./storefront-mix";

export const PARTNER_QUALITY_CONFIG = {
  minPriceToMedian: 0.5,
  maxPriceToMedian: 1.6,
  rejectedSampleLimit: 30,
  approvedSampleLimit: 15,
} as const;

export type PartnerQualityRecord = {
  objectID?: string;
  source?: string;
  title?: string | null;
  price?: number | null;
  affiliateUrl?: string | null;
  imageUrl?: string | null;
  store?: string | null;
  status?: string | null;
  inStock?: boolean | null;
  gtin?: string | null;
  brand?: string | null;
  model?: string | null;
  categoryName?: string | null;
};

export type PartnerQualitySample = {
  id: string;
  title: string;
  price: number;
  store: string;
  source: string;
  reason: string;
};

export type PartnerQualitySourceSummary = {
  evaluated: number;
  approved: number;
  rejected: number;
  withoutCategory: number;
};

export type PartnerQualityResult = {
  message: string;
  evaluated: number;
  approved: number;
  rejected: number;
  withoutCategory: number;
  sharedGtins: number;
  recordsWithSharedGtin: number;
  byReason: Record<string, number>;
  bySource: Record<string, PartnerQualitySourceSummary>;
  rejectedSample: PartnerQualitySample[];
  approvedSample: PartnerQualitySample[];
};

function validHttpUrl(value: unknown): boolean {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function normalizedStore(value: unknown, source?: string): string {
  if (typeof value !== "string") return "";
  return source === "awin" ? normalizeAwinMerchantName(value) : normalizePolicyText(value);
}

/** Conta GTINs realmente compartilhados por lojas distintas, sem inferir identificadores. */
export function countSharedGtins(records: Array<Pick<PartnerQualityRecord, "gtin" | "store" | "source">>) {
  const groups = new Map<string, Array<{ store: string }>>();
  for (const record of records) {
    const gtin = normalizeGtin(record.gtin);
    const store = normalizedStore(record.store, record.source);
    if (!gtin || !store) continue;
    const group = groups.get(gtin) ?? [];
    group.push({ store });
    groups.set(gtin, group);
  }
  let gtins = 0;
  let recordsWithShared = 0;
  for (const group of groups.values()) {
    if (new Set(group.map((entry) => entry.store)).size < 2) continue;
    gtins += 1;
    recordsWithShared += group.length;
  }
  return { gtins, records: recordsWithShared };
}

function baseRejection(
  record: PartnerQualityRecord,
  options: { awinAllowedMerchants: readonly string[]; lomadeeAuthorizedStores: readonly string[] },
): string | null {
  if (typeof record.price !== "number" || !Number.isFinite(record.price) || record.price <= 0) return "preço inválido";
  if (!validHttpUrl(record.affiliateUrl)) return "link de afiliado inválido";
  if (!validHttpUrl(record.imageUrl)) return "imagem ausente ou inválida";
  if (!record.title?.trim()) return "título ausente";
  const available = record.inStock !== false && (record.status === "active" || (record.status !== "unavailable" && record.inStock === true));
  if (!available) return "indisponível";
  if (record.source === "awin" && !isAwinMerchantAllowed(record.store ?? "", options.awinAllowedMerchants)) return "anunciante não aprovado";
  if (record.source === "lomadee") {
    const store = normalizedStore(record.store);
    const authorized = options.lomadeeAuthorizedStores.some((name) => normalizedStore(name) === store);
    if (!store || !authorized) return "loja não autorizada no canal";
  }
  return null;
}

/** Regras puras da etapa 3: avalia em memória e nunca altera os objetos recebidos. */
export function evaluatePartnerQualityRecords(
  records: PartnerQualityRecord[],
  options: { awinAllowedMerchants: readonly string[]; lomadeeAuthorizedStores: readonly string[] },
): PartnerQualityResult {
  const evaluated = records.flatMap((record) => {
    if (record.source !== "awin" && record.source !== "lomadee") return [];
    return [{ record, reason: baseRejection(record, options) }];
  });

  // Somente ofertas íntegras e autorizadas formam o grupo de comparação de preço.
  const priceGroups = new Map<string, typeof evaluated>();
  for (const entry of evaluated) {
    if (entry.reason) continue;
    const gtin = normalizeGtin(entry.record.gtin);
    if (!gtin) continue;
    const group = priceGroups.get(gtin) ?? [];
    group.push(entry);
    priceGroups.set(gtin, group);
  }

  let sharedGtins = 0;
  let recordsWithSharedGtin = 0;
  for (const group of priceGroups.values()) {
    if (new Set(group.map((entry) => normalizedStore(entry.record.store, entry.record.source))).size < 2) continue;
    sharedGtins += 1;
    recordsWithSharedGtin += group.length;
    const groupMedian = median(group.map((entry) => entry.record.price!));
    for (const entry of group) {
      const price = entry.record.price!;
      if (price < groupMedian * PARTNER_QUALITY_CONFIG.minPriceToMedian || price > groupMedian * PARTNER_QUALITY_CONFIG.maxPriceToMedian) {
        entry.reason = "preço fora da faixa";
      }
    }
  }

  const byReason: Record<string, number> = {};
  const bySource: Record<string, PartnerQualitySourceSummary> = {};
  const rejectedAll: PartnerQualitySample[] = [];
  const approvedAll: PartnerQualitySample[] = [];
  let approved = 0;
  let rejected = 0;
  let withoutCategory = 0;

  for (const { record, reason } of evaluated) {
    const source = record.source!;
    const summary = bySource[source] ?? (bySource[source] = { evaluated: 0, approved: 0, rejected: 0, withoutCategory: 0 });
    summary.evaluated += 1;
    const missingCategory = !record.categoryName || !SITE_CATEGORIES.some((name) => name === record.categoryName);
    if (missingCategory) {
      withoutCategory += 1;
      summary.withoutCategory += 1;
    }
    const sample: PartnerQualitySample = {
      id: record.objectID || "Sem ID",
      title: record.title?.trim() || "Sem título",
      price: typeof record.price === "number" && Number.isFinite(record.price) ? record.price : 0,
      store: record.store?.trim() || "Loja não informada",
      source,
      reason: reason ?? "",
    };
    if (reason) {
      rejected += 1;
      summary.rejected += 1;
      byReason[reason] = (byReason[reason] ?? 0) + 1;
      rejectedAll.push(sample);
    } else {
      approved += 1;
      summary.approved += 1;
      approvedAll.push(sample);
    }
  }

  return {
    message: `Simulação concluída sem gravações: ${evaluated.length} avaliados, ${approved} aprovados e ${rejected} rejeitados.`,
    evaluated: evaluated.length,
    approved,
    rejected,
    withoutCategory,
    sharedGtins,
    recordsWithSharedGtin,
    byReason,
    bySource,
    rejectedSample: rejectedAll.slice(0, PARTNER_QUALITY_CONFIG.rejectedSampleLimit),
    approvedSample: approvedAll.slice(0, PARTNER_QUALITY_CONFIG.approvedSampleLimit),
  };
}
