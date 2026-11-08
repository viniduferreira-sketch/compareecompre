import { describe, expect, it } from "vitest";
import { awinRowPriority, awinRuleDiscard, findAwinRule, matchCategoryTerm } from "./awin-rules.ts";

const rules = [
  { merchant: "KaBuM", category_terms: ["tv", "placa de vídeo", "celular", "monitor"], max_products: 2000 },
  { merchant: "Nike", category_terms: ["tênis"], max_products: 500 },
];

describe("awin merchant rules", () => {
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
  it("prioritizes GTIN, then stock, then image", () => {
    const full = awinRowPriority({ ean: "7891234567895", in_stock: "1", merchant_image_url: "https://x/y.jpg" });
    const noGtin = awinRowPriority({ in_stock: "1", merchant_image_url: "https://x/y.jpg" });
    const outOfStock = awinRowPriority({ ean: "7891234567895", in_stock: "0" });
    expect(full).toBe(7);
    expect(full).toBeGreaterThan(outOfStock);
    expect(outOfStock).toBeGreaterThan(noGtin);
  });
});
