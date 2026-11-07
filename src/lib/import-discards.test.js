import { describe, expect, it } from "vitest";
import { awinDiscardReason, normalizeAwinProduct } from "./awin-catalog";
import { lomadeeDiscardReason, normalizeLomadeeProduct } from "./lomadee-catalog";
import { mergeDiscardReasons } from "./import-discards";
const awin = { aw_product_id: "1", merchant_id: "2", product_name: "Produto", merchant_name: "Loja", search_price: "100", aw_deep_link: "https://awin1.com/p", currency: "BRL" };
const lomadee = { id: "1", organizationId: "2", name: "Produto", url: "https://loja.com/p", options: [{ pricing: [{ price: 100 }] }] };
describe("motivos de descarte sem mudar aceitação", () => {
  it.each([
    [{ aw_product_id: "" }, "missing_product_id"], [{ merchant_id: "" }, "missing_merchant_id"],
    [{ product_name: "<b></b>" }, "missing_title"], [{ merchant_name: "" }, "missing_store"],
    [{ aw_deep_link: "javascript:alert(1)" }, "invalid_affiliate_url"], [{ search_price: "0" }, "invalid_price"],
    [{ currency: "USD" }, "unsupported_currency"], [{ aw_product_id: "invalid id" }, "invalid_id"],
  ])("Awin: %j gera %s e continua descartado", (change, reason) => {
    expect(awinDiscardReason({ ...awin, ...change })).toBe(reason);
    expect(normalizeAwinProduct({ ...awin, ...change }, "2026-11-07T00:00:00Z")).toBeNull();
  });
  it("Awin não passa a rejeitar sem categoria ou sem estoque", () => {
    expect(awinDiscardReason({ ...awin, in_stock: "0" })).toBeNull();
    expect(normalizeAwinProduct({ ...awin, in_stock: "0" }, "2026-11-07T00:00:00Z").status).toBe("unavailable");
  });
  it.each([
    [{ id: "invalid id" }, "invalid_id"], [{ name: "" }, "missing_title"],
    [{ url: "invalid" }, "invalid_product_url"], [{ options: [{ pricing: [{ price: 0 }] }] }, "invalid_price"],
  ])("Lomadee: %j gera %s", (change, reason) => {
    expect(lomadeeDiscardReason({ ...lomadee, ...change }, { name: "Loja" }, "https://lmdee.link/p")).toBe(reason);
    expect(normalizeLomadeeProduct({ ...lomadee, ...change }, { name: "Loja" }, "https://lmdee.link/p", "2026-11-07T00:00:00Z")).toBeNull();
  });
  it("Lomadee separa loja ausente e link inválido", () => {
    expect(lomadeeDiscardReason(lomadee, undefined, "https://lmdee.link/p")).toBe("missing_store");
    expect(lomadeeDiscardReason(lomadee, { name: "Loja" }, null)).toBe("invalid_affiliate_url");
  });
  it("soma motivos por lote sem inventar motivos históricos", () => {
    expect(mergeDiscardReasons([null, { unsupported_currency: 5 }, { unsupported_currency: 7, invalid_price: 2 }, { bad: -1 }])).toEqual({ unsupported_currency: 12, invalid_price: 2 });
  });
});