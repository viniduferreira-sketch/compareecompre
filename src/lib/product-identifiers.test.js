import { describe, expect, it } from "vitest";
import { normalizeGtin, mercadoLivreIdentifiers, countIdentifiers } from "./product-identifiers";
import { normalizeAwinProduct } from "./awin-catalog";
import { normalizeLomadeeProduct } from "./lomadee-catalog";

describe("identificadores reais dos parceiros", () => {
  it("aceita 8 a 14 dígitos e preenche até 14", () => {
    expect(normalizeGtin("1234-5678")).toBe("00000012345678");
    expect(normalizeGtin("7891234567890")).toBe("07891234567890");
    expect(normalizeGtin("12345678901234")).toBe("12345678901234");
  });
  it("deixa valores inválidos ou ausentes vazios", () => {
    for (const value of [null, undefined, "", "1234567", "123456789012345", "sem ean"]) expect(normalizeGtin(value)).toBeNull();
  });
  it("extrai GTIN e MODEL apenas dos atributos ML", () => {
    expect(mercadoLivreIdentifiers([{ id: "GTIN", value_name: "7891234567890" }, { id: "MODEL", value_name: "A23" }])).toEqual({ gtin: "07891234567890", model: "A23" });
    expect(mercadoLivreIdentifiers()).toEqual({ gtin: null, model: null });
  });
  const awin = { aw_product_id: "1", merchant_id: "2", product_name: "Telefone", merchant_name: "Loja", search_price: "100", aw_deep_link: "https://www.awin1.com/p" };
  it("preserva ean e product_model da Awin", () => {
    const p = normalizeAwinProduct({ ...awin, ean: "7891234567890", product_model: "A23" }, "2026-11-07T00:00:00Z");
    expect(p.gtin).toBe("07891234567890"); expect(p.model).toBe("A23");
  });
  it("usa product_GTIN e model_number quando os primeiros faltam ou são inválidos", () => {
    const p = normalizeAwinProduct({ ...awin, ean: "inválido", product_GTIN: "12345678", model_number: "X100" }, "2026-11-07T00:00:00Z");
    expect(p.gtin).toBe("00000012345678"); expect(p.model).toBe("X100");
  });
  it("preserva metadata ean da Lomadee sem inventar modelo", () => {
    const p = normalizeLomadeeProduct({ id: "1", organizationId: "2", name: "Telefone", url: "https://loja.com/p", metadata: [{ key: "ean", value: "7891234567890" }], options: [{ pricing: [{ price: 100 }] }] }, { name: "Loja" }, "https://lmdee.link/p", "2026-11-07T00:00:00Z");
    expect(p.gtin).toBe("07891234567890"); expect(p.model).toBeNull();
  });
  it("conta por source sem atribuir registros legados a outro parceiro", () => {
    expect(countIdentifiers([{ source: "awin", gtin: "12345678", brand: "Marca", model: "X" }, { source: "lomadee", gtin: null }, { store: "Mercado Livre" }])).toEqual({ awin: { total: 1, gtin: 1, brand: 1, model: 1 }, lomadee: { total: 1, gtin: 0, brand: 0, model: 0 }, unknown: { total: 1, gtin: 0, brand: 0, model: 0 } });
  });
});