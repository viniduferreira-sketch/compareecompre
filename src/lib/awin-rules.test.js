import { describe, expect, it } from "vitest";
import { awinRowPriority, awinRuleDiscard, findAwinRule, matchCategoryTerm } from "./awin-rules.ts";

const rules = [
  { merchant: "KaBuM", category_terms: ["tv", "placa de vídeo", "celular", "monitor"], max_products: 2000 },
  { merchant: "Nike", category_terms: ["tênis"], max_products: 500 },
];

describe("awin merchant rules", () => {
  const exclusions = ["suporte", "base", "mesa", "cabo", "adaptador", "capa", "película", "carregador"];
  for (const term of exclusions) {
    it(`excludes KaBuM ${term} before the notebook inclusion`, () => {
      const configured = [{ merchant: "KaBuM", category_terms: ["notebook", "tv"], excluded_category_terms: exclusions, max_products: 2000 }];
      expect(awinRuleDiscard({ merchant_name: "Kabum BR", merchant_category: `Periféricos > ${term} > Notebook` }, configured)).toBe("categoria não permitida");
    });
  }
  it("rejects notebook/TV supports but does not inherit another store's exclusions", () => {
    const configured = [
      { merchant: "KaBuM", category_terms: ["notebook", "tv"], excluded_category_terms: exclusions, max_products: 2000 },
      { merchant: "Nike", category_terms: ["tênis"], excluded_category_terms: [], max_products: 500 },
    ];
    expect(awinRuleDiscard({ merchant_name: "Kabum BR", merchant_category: "Periféricos > Suportes > Suporte para Notebook" }, configured)).toBe("categoria não permitida");
    expect(awinRuleDiscard({ merchant_name: "Kabum BR", merchant_category: "Suportes > Suporte para TV" }, configured)).toBe("categoria não permitida");
    expect(awinRuleDiscard({ merchant_name: "Nike BR", merchant_category: "Tênis > Base" }, configured)).toBeNull();
    expect(awinRuleDiscard({ merchant_name: "Kabum BR", merchant_category: "Computadores > Notebooks" }, configured)).toBeNull();
    expect(awinRuleDiscard({ merchant_name: "Kabum BR", merchant_category: "Notebooks", product_name: "Suporte" }, configured)).toBeNull();
  });
  it("matches the rule by merchant name variant or merchant_id", () => {
    expect(findAwinRule({ merchant_name: "Kabum BR" }, rules)?.merchant).toBe("KaBuM");
    expect(findAwinRule({ merchant_name: "Outra", merchant_id: "Nike" }, rules)?.merchant).toBe("Nike");
    expect(findAwinRule({ merchant_name: "Lauri Esporte", merchant_id: "118977" }, rules)).toBeNull();
  });
  it("matches whole words, ignoring case and accents, plus simple plurals", () => {
    expect(matchCategoryTerm("TV e Vídeo > Smart TVs", rules[0].category_terms)).toBe("tv");
    expect(matchCategoryTerm("Hardware > Placas de Video", rules[0].category_terms)).toBe("placa de vídeo");
    expect(matchCategoryTerm("Calçados > Tenis", rules[1].category_terms)).toBe("tênis");
    expect(matchCategoryTerm("Áudio > TVBox antena", ["tv"])).toBeNull();
    expect(matchCategoryTerm("Monitoramento", ["monitor"])).toBeNull();
  });
  it("only looks at merchant_category, never the title", () => {
    expect(awinRuleDiscard({ merchant_name: "Kabum BR", merchant_category: "Acessórios > Suportes", product_name: "Suporte para TV" }, rules)).toBe("categoria não permitida");
    expect(awinRuleDiscard({ merchant_name: "Kabum BR", merchant_category: "Celular & Smartphone > Celulares" }, rules)).toBeNull();
    expect(awinRuleDiscard({ merchant_name: "Kabum BR", merchant_category: "Hardware > Placa de vídeo (VGA) > Acessórios > Acessórios" }, rules)).toBe("categoria não permitida");
    expect(awinRuleDiscard({ merchant_name: "Lauri Esporte", merchant_category: "Tênis" }, rules)).toBe("loja sem regra de categoria");
  });
  it("opens every category with * except only that store's exclusions", () => {
    const open = [
      { merchant: "KaBuM", category_terms: ["*"], excluded_category_terms: ["gift card", "cartão presente"], max_products: 20000 },
      { merchant: "Nike", category_terms: ["*"], excluded_category_terms: ["gift card", "cartão presente"], max_products: 20000 },
    ];
    expect(awinRuleDiscard({ merchant_name: "Kabum BR", merchant_category: "Hardware > Acessórios > Cabos" }, open)).toBeNull();
    expect(awinRuleDiscard({ merchant_name: "Nike BR", merchant_category: "Infantil > Roupas" }, open)).toBeNull();
    expect(awinRuleDiscard({ merchant_name: "Kabum BR", merchant_category: "Gift Cards" }, open)).toBe("categoria não permitida");
    expect(awinRuleDiscard({ merchant_name: "Nike BR", merchant_category: "Cartão-Presente" }, open)).toBe("categoria não permitida");
    expect(awinRuleDiscard({ merchant_name: "Kabum BR", merchant_category: "Games", product_name: "Gift Card" }, open)).toBeNull();
  });
  it("prioritizes GTIN, then stock, then image", () => {
    const full = awinRowPriority({ ean: "7891234567895", in_stock: "1", merchant_image_url: "https://x/y.jpg" });
    const noGtin = awinRowPriority({ in_stock: "1", merchant_image_url: "https://x/y.jpg" });
    const outOfStock = awinRowPriority({ ean: "7891234567895", in_stock: "0" });
    expect(full).toBe(7);
    expect(full).toBeGreaterThan(outOfStock);
    expect(outOfStock).toBeGreaterThan(noGtin);
  });
});
