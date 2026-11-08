import { describe, expect, it } from "vitest";
import { ADULT_CONTENT_REASON, MERCHANT_NOT_ALLOWED_REASON, hasAdultContent } from "./content-policy";
import { isAwinMerchantAllowed } from "./awin-allowlist";
import { awinDiscardReason } from "./awin-catalog";
import { lomadeeDiscardReason } from "./lomadee-catalog";

const awinRow = {
  aw_product_id: "123", merchant_id: "456", product_name: "Notebook", merchant_name: "Kabum BR",
  search_price: "1999", currency: "BRL", aw_deep_link: "https://www.awin1.com/cread.php?awinmid=456",
};

describe("proteção da importação", () => {
  it("KaBuM permite o nome real Kabum BR do feed", () => {
    expect(isAwinMerchantAllowed("Kabum BR", ["KaBuM"])).toBe(true);
    expect(awinDiscardReason(awinRow, ["KaBuM"])).toBeNull();
  });

  it("descarta outro anunciante antes da validação de moeda", () => {
    const row = { ...awinRow, merchant_name: "Monsterpub Sex Toy", currency: "USD" };
    expect(awinDiscardReason(row, ["KaBuM"])).toBe(MERCHANT_NOT_ALLOWED_REASON);
  });

  it("mantém a rejeição de moeda diferente de BRL para anunciante permitido", () => {
    expect(awinDiscardReason({ ...awinRow, currency: "USD" }, ["KaBuM"])).toBe("unsupported_currency");
  });

  it.each(["sex shop", "sex toy", "erótico", "adulto", "vibrador", "consolador", "fetiche"])
    ("bloqueia o termo %s sem depender de acentos ou caixa", (term) => {
      expect(hasAdultContent(`Produto ${term.toUpperCase()} edição`)).toBe(true);
    });

  it("não bloqueia produto comum", () => {
    expect(hasAdultContent("Notebook Gamer", { category: "Eletrônicos" })).toBe(false);
  });

  it("aplica conteúdo adulto à Awin mesmo com anunciante permitido e BRL", () => {
    const row = { ...awinRow, product_name: "Vibrador recarregável" };
    expect(awinDiscardReason(row, ["KaBuM"])).toBe(ADULT_CONTENT_REASON);
  });

  it("aplica conteúdo adulto à Lomadee antes do link de afiliado", () => {
    const product = { id: "1", organizationId: "org", name: "Produto", url: "https://loja.com/p", categories: [{ name: "Sex Shop" }], options: [{ pricing: [{ price: 10 }] }] };
    expect(lomadeeDiscardReason(product, { name: "Loja" }, null)).toBe(ADULT_CONTENT_REASON);
  });

  it("não amplia o bloqueio para descrições fora dos campos solicitados", () => {
    expect(awinDiscardReason({ ...awinRow, description: "atendimento adulto" }, ["KaBuM"])).toBeNull();
    const product = { id: "1", organizationId: "org", name: "Jogo", description: "brincadeira de criança e adulto", url: "https://loja.com/p", categories: [{ name: "Games" }], options: [{ pricing: [{ price: 10 }] }] };
    expect(lomadeeDiscardReason(product, { name: "Loja" }, "https://lmdee.link/x")).toBeNull();
  });

  it("allowlist vazia falha fechada", () => {
    expect(awinDiscardReason(awinRow, [])).toBe(MERCHANT_NOT_ALLOWED_REASON);
  });
});
