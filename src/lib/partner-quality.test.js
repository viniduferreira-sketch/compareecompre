import { describe, expect, it } from "vitest";
import { countSharedGtins, evaluatePartnerQualityRecords } from "./partner-quality";

const validAwin = {
  objectID: "awin-1-1", source: "awin", title: "Notebook", price: 100,
  affiliateUrl: "https://awin1.com/oferta", imageUrl: "https://loja.com/imagem.jpg",
  store: "Kabum BR", status: "active", inStock: true, categoryName: "Eletrônicos",
};
const options = { awinAllowedMerchants: ["KaBuM"], lomadeeAuthorizedStores: ["Loja Autorizada"] };
const evaluate = (records, overrides = {}) => evaluatePartnerQualityRecords(records, { ...options, ...overrides });

describe("qualidade Awin e Lomadee — somente regras em memória", () => {
  it("aprova oferta completa de anunciante permitido", () => {
    const result = evaluate([validAwin]);
    expect(result.approved).toBe(1);
    expect(result.rejected).toBe(0);
  });

  it.each([
    [{ price: 0 }, "preço inválido"],
    [{ affiliateUrl: "javascript:alert(1)" }, "link de afiliado inválido"],
    [{ imageUrl: null }, "imagem ausente ou inválida"],
    [{ title: " " }, "título ausente"],
    [{ status: "unavailable" }, "indisponível"],
    [{ inStock: false }, "indisponível"],
    [{ status: null, inStock: null }, "indisponível"],
  ])("rejeita dado obrigatório ausente ou inválido", (change, reason) => {
    const result = evaluate([{ ...validAwin, ...change }]);
    expect(result.byReason[reason]).toBe(1);
  });

  it("rejeita anunciante Awin fora da allowlist", () => {
    const result = evaluate([{ ...validAwin, store: "Lauri Esporte" }]);
    expect(result.byReason["anunciante não aprovado"]).toBe(1);
  });

  it("confirma a loja Lomadee autorizada no canal sem diferenciar caixa e acentos", () => {
    const product = { ...validAwin, objectID: "lomadee-1-1", source: "lomadee", store: "Loja autorizada" };
    expect(evaluate([product]).approved).toBe(1);
    expect(evaluate([{ ...product, store: "Loja não liberada" }]).byReason["loja não autorizada no canal"]).toBe(1);
  });

  it("não julga preço sem GTIN ou sem segunda loja", () => {
    const result = evaluate([
      { ...validAwin, price: 10000, gtin: null },
      { ...validAwin, objectID: "awin-1-2", price: 20000, gtin: "7891234567890" },
    ]);
    expect(result.approved).toBe(2);
    expect(result.sharedGtins).toBe(0);
  });

  it("usa a mediana somente quando o GTIN aparece em duas ou mais lojas", () => {
    const stores = ["KaBuM", "Loja Autorizada", "Terceira Loja", "Quarta Loja", "Quinta Loja"];
    const prices = [100, 100, 100, 40, 200];
    const records = stores.map((store, index) => ({
      ...validAwin,
      objectID: `offer-${index}`,
      source: index === 0 ? "awin" : "lomadee",
      store,
      price: prices[index],
      gtin: "7891234567890",
    }));
    const result = evaluate(records, { lomadeeAuthorizedStores: stores.slice(1) });
    expect(result.sharedGtins).toBe(1);
    expect(result.recordsWithSharedGtin).toBe(5);
    expect(result.approved).toBe(3);
    expect(result.byReason["preço fora da faixa"]).toBe(2);
  });

  it.each([null, "Headphones"])("conta categoria ausente ou fora do site sem rejeitar: %s", (categoryName) => {
    const result = evaluate([{ ...validAwin, categoryName }]);
    expect(result.approved).toBe(1);
    expect(result.withoutCategory).toBe(1);
    expect(result.bySource.awin.withoutCategory).toBe(1);
  });

  it("limita as listas a 30 rejeitados e 15 aprovados sem alterar as entradas", () => {
    const records = [
      ...Array.from({ length: 40 }, (_, index) => ({ ...validAwin, objectID: `bad-${index}`, price: 0 })),
      ...Array.from({ length: 20 }, (_, index) => ({ ...validAwin, objectID: `good-${index}` })),
    ];
    const before = JSON.stringify(records);
    const result = evaluate(records);
    expect(result.rejectedSample).toHaveLength(30);
    expect(result.approvedSample).toHaveLength(15);
    expect(result.evaluated).toBe(60);
    expect(JSON.stringify(records)).toBe(before);
  });

  it("não conta aliases da mesma loja Awin como lojas distintas", () => {
    expect(countSharedGtins([
      { gtin: "7891234567890", store: "KaBuM", source: "awin" },
      { gtin: "7891234567890", store: "Kabum BR", source: "awin" },
    ])).toEqual({ gtins: 0, records: 0 });
  });

  it("conta GTIN compartilhado entre fontes somente em lojas distintas", () => {
    const records = [
      { gtin: "7891234567890", store: "KaBuM" },
      { gtin: "7891234567890", store: "Loja Autorizada" },
      { gtin: "7891234567890", store: "kabum br" },
      { gtin: "7890000000000", store: "KaBuM" },
      { gtin: "7890000000000", store: "KaBuM" },
    ];
    expect(countSharedGtins(records)).toEqual({ gtins: 1, records: 3 });
  });
});
