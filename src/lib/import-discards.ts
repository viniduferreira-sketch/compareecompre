export type DiscardReasons = Record<string, number>;
export function addDiscard(counts: DiscardReasons, reason: string) {
  counts[reason] = (counts[reason] ?? 0) + 1;
}
export function mergeDiscardReasons(values: unknown[]): DiscardReasons {
  const result: DiscardReasons = {};
  for (const value of values) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    for (const [key, count] of Object.entries(value)) {
      if (typeof count === "number" && Number.isSafeInteger(count) && count >= 0) result[key] = (result[key] ?? 0) + count;
    }
  }
  return result;
}
export const discardLabels: Record<string, string> = {
  missing_product_id: "Sem ID do produto", missing_merchant_id: "Sem ID da loja",
  missing_title: "Sem título", missing_store: "Sem loja", invalid_affiliate_url: "Link de afiliado inválido",
  invalid_price: "Preço inválido", unsupported_currency: "Moeda diferente de BRL", invalid_id: "ID inválido",
  merchant_mismatch: "Loja divergente", invalid_product_url: "URL do produto inválida", duplicate_in_batch: "Duplicado no lote",
  "anunciante não permitido": "Anunciante não permitido", "conteúdo adulto": "Conteúdo adulto",
};