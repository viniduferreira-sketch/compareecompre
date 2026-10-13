import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { isFreshPrice } from "@/lib/offer-freshness";
import type { PartnerQA } from "@/lib/partner-qa.server";

export type ProductAttribute = { name: string; value: string };

export type ProductDetail = {
  id: string;
  last_synced_at: string | null;
  source: string;
  store: string;
  title: string;
  images: string[];
  price: number | null;
  originalPrice: number | null;
  discountPercent: number | null;
  freeShipping: boolean;
  affiliateUrl: string;
  sellerCount: number;
  category: string | null;
  description: string;
  attributes: ProductAttribute[];
  pros: string[];
  cons: string[];
  qa: PartnerQA[];
};

function isPartnerQA(value: unknown): value is PartnerQA {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item["pergunta"] === "string"
    && typeof item["data"] === "string"
    && typeof item["source"] === "string"
    && (item["resposta"] === undefined || typeof item["resposta"] === "string");
}

export const getProductDetail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().min(3).max(40) }).parse(data))
  .handler(async ({ data }): Promise<ProductDetail | null> => {
    const { getAlgoliaConfig } = await import("@/lib/algolia.server");
    const { client, indexName } = getAlgoliaConfig();
    let record: {
      objectID: string; title: string; imageUrl?: string; images?: string[];
      price?: number; originalPrice?: number; freeShipping?: boolean; sellerCount?: number;
      affiliateUrl: string; category?: string; description?: string; attributes?: ProductAttribute[];
      qa?: unknown; source?: string; status?: string; store?: string; last_synced_at?: string;
    };
    try { record = await client.getObject({ indexName, objectID: data.id }); }
    catch (error) { console.error("Indexed product unavailable", data.id, error); return null; }
    const fresh = isFreshPrice(record.last_synced_at) && (!record.status || record.status === "active");
    const price = fresh && typeof record.price === "number" && record.price > 0 ? record.price : null;
    const originalPrice = price && record.originalPrice && record.originalPrice > price ? record.originalPrice : null;
    const freeShipping = fresh && Boolean(record.freeShipping);
    const sellerCount = record.sellerCount ?? 0;
    const attributes = record.attributes ?? [];
    const images = record.images?.length ? record.images : record.imageUrl ? [record.imageUrl] : [];
    const qa = Array.isArray(record.qa) ? record.qa.filter(isPartnerQA).sort((left, right) => Date.parse(right.data) - Date.parse(left.data)) : [];
    const attributeValue = (needle: string) =>
      attributes.find((attribute) => attribute.name.toLowerCase().includes(needle))?.value ?? null;

    const brand = attributeValue("marca");
    const pros = [
      brand ? `Produto da marca ${brand}, com boa reputação no Mercado Livre.` : "Produto com boa reputação entre os compradores.",
      sellerCount > 1
        ? `${sellerCount} vendedores anunciam este produto, o que ajuda a manter o preço competitivo.`
        : "Preço acompanhado diariamente pelo Compare e Compre.",
      freeShipping ? "Frete grátis disponível na oferta atual." : "Envio rápido pelo Mercado Envios.",
      "Compra protegida e garantia oferecida pela loja parceira.",
    ];
    const cons = [
      "O preço pode mudar sem aviso na loja parceira.",
      "Disponibilidade limitada ao estoque do vendedor.",
      sellerCount <= 1 ? "Poucas ofertas concorrentes para comparar no momento." : "Condições de parcelamento variam conforme o vendedor.",
    ];

    return {
      id: record.objectID,
      title: record.title,
      last_synced_at: record.last_synced_at ?? null,
      source: record.source ?? "",
      store: record.store ?? "Mercado Livre",
      images,
      price,
      originalPrice,
      discountPercent:
        originalPrice && price ? Math.round(((originalPrice - price) / originalPrice) * 100) : null,
      freeShipping,
      affiliateUrl: record.affiliateUrl,
      sellerCount,
      category: record.category ?? null,
      description:
        record.description?.trim() ||
        `Confira as informações e o melhor preço encontrado para ${record.title} entre as lojas parceiras do Compare e Compre.`,
      attributes,
      pros,
      cons,
       qa,
    };
  });
