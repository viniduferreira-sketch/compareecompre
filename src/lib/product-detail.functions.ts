import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getMeliToken, withAffiliate } from "@/lib/search-offers.functions";
import type { PartnerQA } from "@/lib/partner-qa.server";

export type ProductAttribute = { name: string; value: string };

export type ProductDetail = {
  source: string;
  store: string;
  storeLogoUrl?: string | null;
  last_synced_at?: string;
  status?: string | undefined;
  categoryName?: string | null;
  id: string;
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
  attributes: Array<ProductAttribute & { source?: string }>;
  pros: string[];
  cons: string[];
  qa: PartnerQA[];
  /** Real partner rating only; null hides the stars (never mocked). */
  rating?: { value: number; count: number; source: string } | null;
  ean?: string | null;
};

function isPartnerQA(value: unknown): value is PartnerQA {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item["pergunta"] === "string"
    && typeof item["data"] === "string"
    && typeof item["source"] === "string"
    && (item["resposta"] === undefined || typeof item["resposta"] === "string");
}

type IndexedRecord = { qa: PartnerQA[]; status?: string | undefined; categoryName?: string | null };

async function getIndexedRecord(productId: string): Promise<IndexedRecord> {
  try {
    const { getAlgoliaIndexingConfig } = await import("@/lib/algolia-indexing.server");
    const { client, indexName } = getAlgoliaIndexingConfig();
    const record = await client.getObject<{ qa?: unknown; status?: string; categoryName?: string | null }>({
      indexName,
      objectID: productId,
      attributesToRetrieve: ["qa", "status", "categoryName"],
    });
    return {
      qa: Array.isArray(record.qa)
        ? record.qa.filter(isPartnerQA).sort((left, right) => Date.parse(right.data) - Date.parse(left.data))
        : [],
      status: record.status,
      categoryName: record.categoryName ?? null,
    };
  } catch (error) {
    console.warn("Indexed product record unavailable", productId, error);
    return { qa: [] };
  }
}

type MeliProduct = {
  id: string;
  name: string;
  domain_id?: string;
  pictures?: { url?: string; secure_url?: string }[];
  short_description?: { content?: string };
  attributes?: { name?: string; value_name?: string | null }[];
};

type MeliItem = {
  price: number;
  original_price: number | null;
  shipping?: { free_shipping?: boolean };
};

export const getProductDetail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().min(3).max(130).regex(/^[\w.-]+$/) }).parse(data))
  .handler(async ({ data }): Promise<ProductDetail | null> => {
    if (data.id.startsWith("awin-") || data.id.startsWith("lomadee-")) {
      const { getAwinProductDetail } = await import("@/lib/awin-product.server");
      return getAwinProductDetail(data.id);
    }
    const token = await getMeliToken();
    if (!token) return null;

    const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

    const productRes = await fetch(`https://api.mercadolibre.com/products/${data.id}`, { headers });
    if (!productRes.ok) {
      console.error("Mercado Livre product detail failed", productRes.status);
      return null;
    }
    const product = (await productRes.json()) as MeliProduct;

    let price: number | null = null;
    let originalPrice: number | null = null;
    let freeShipping = false;
    let sellerCount = 0;

    try {
      const itemsRes = await fetch(
        `https://api.mercadolibre.com/products/${data.id}/items?limit=20`,
        { headers },
      );
      if (itemsRes.ok) {
        const json = (await itemsRes.json()) as { results?: MeliItem[] };
        const items = (json.results ?? []).filter((item) => typeof item.price === "number");
        sellerCount = items.length;
        if (items.length > 0) {
          const cheapest = items.reduce((best, item) => (item.price < best.price ? item : best));
          price = cheapest.price;
          originalPrice =
            cheapest.original_price && cheapest.original_price > cheapest.price
              ? cheapest.original_price
              : null;
          freeShipping = Boolean(cheapest.shipping?.free_shipping);
        }
      }
    } catch (error) {
      console.error("Mercado Livre items error", error);
    }

    const attributes: ProductAttribute[] = (product.attributes ?? [])
      .filter((attribute) => attribute.name && attribute.value_name)
      .slice(0, 12)
      .map((attribute) => ({ name: attribute.name as string, value: attribute.value_name as string }));

    const images = (product.pictures ?? [])
      .map((picture) => picture.secure_url ?? picture.url)
      .filter((url): url is string => Boolean(url))
      .slice(0, 8);
    const indexed = await getIndexedRecord(product.id);
    const qa = indexed.qa;

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
      source: "mercadolivre",
      store: "Mercado Livre",
      status: indexed.status,
      categoryName: indexed.categoryName ?? null,
      id: product.id,
      title: product.name,
      images,
      price,
      originalPrice,
      discountPercent:
        originalPrice && price ? Math.round(((originalPrice - price) / originalPrice) * 100) : null,
      freeShipping,
      affiliateUrl: withAffiliate(`https://www.mercadolivre.com.br/p/${product.id}`),
      sellerCount,
      category: product.domain_id ?? null,
      description:
        product.short_description?.content?.trim() ||
        `Confira as informações e o melhor preço encontrado para ${product.name} entre as lojas parceiras do Compare e Compre.`,
      attributes,
      pros,
      cons,
       qa,
    };
  });
