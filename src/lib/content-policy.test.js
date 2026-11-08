import { describe, expect, it } from "vitest";
import {
  ADULT_CONTENT_REASON,
  ADULT_CONTENT_TERMS,
  MERCHANT_NOT_ALLOWED_REASON,
  describeAdultContentMatch,
  getAdultContentMatch,
} from "./content-policy";
import { isAwinMerchantAllowed } from "./awin-allowlist";
import { awinDiscardReason } from "./awin-catalog";
import { lomadeeDiscardReason } from "./lomadee-catalog";

const awinRow = {
  aw_product_id: "123", merchant_id: "456", product_name: "Notebook", merchant_name: "Kabum BR",
  search_price: "1999", currency: "BRL", aw_deep_link: "https://www.awin1.com/cread.php?awinmid=456",
};

const titleMatch = (title) => getAdultContentMatch({ title });

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

  it.each(ADULT_CONTENT_TERMS)("bloqueia o termo inequívoco %s no título", (term) => {
    expect(titleMatch(`Produto ${term.toUpperCase()} edição`)).toEqual({ matchedBy: "title", term });
  });

  it.each([
    "Poltrona Duck Adulto - Verde",
    "Óculos Natação Adulto Vollo Essential",
    "Chaveiro Camiseta Adulto",
    "Vibrador para concreto",
    "O Consolador",
    "Notebook Gamer",
  ])("não bloqueia o produto comum ou ambíguo: %s", (title) => {
    expect(titleMatch(title)).toBeNull();
  });

  it("não bloqueia palavras que apenas contenham um termo", () => {
    expect(titleMatch("Produto eroticosse")).toBeNull();
    expect(titleMatch("Produto pornografado")).toBeNull();
    expect(titleMatch("Produto ERÓTICO")).toEqual({ matchedBy: "title", term: "erótico" });
  });

  it("prioriza loja bloqueada sobre categoria e título", () => {
    const match = getAdultContentMatch({ store: "Monsterpub Sex Toy", category: "Sex Shop", title: "Masturbador" });
    expect(match).toEqual({ matchedBy: "store", term: "Monsterpub" });
    expect(describeAdultContentMatch(match)).toBe("Loja/anunciante bloqueado: Monsterpub");
  });

  it("prioriza categoria adulta sobre o título", () => {
    const match = getAdultContentMatch({ store: "Loja comum", category: [{ name: "Produtos Eróticos" }], title: "Masturbador" });
    expect(match).toEqual({ matchedBy: "category", term: "eróticos" });
    expect(describeAdultContentMatch(match)).toBe("Categoria adulta: eróticos");
  });

  it("aplica conteúdo adulto à Awin mesmo com anunciante permitido e BRL", () => {
    const row = { ...awinRow, product_name: "Masturbador recarregável" };
    expect(awinDiscardReason(row, ["KaBuM"])).toBe(ADULT_CONTENT_REASON);
    expect(awinDiscardReason({ ...awinRow, product_name: "Poltrona Adulto" }, ["KaBuM"])).toBeNull();
  });

  it("aplica conteúdo adulto à Lomadee antes do link de afiliado", () => {
    const product = { id: "1", organizationId: "org", name: "Produto", url: "https://loja.com/p", categories: [{ name: "Sex Shop" }], options: [{ pricing: [{ price: 10 }] }] };
    expect(lomadeeDiscardReason(product, { name: "Loja" }, null)).toBe(ADULT_CONTENT_REASON);
  });

  it("não amplia o bloqueio para descrições ou palavras-chave", () => {
    expect(awinDiscardReason({ ...awinRow, description: "masturbador", keywords: "sex shop" }, ["KaBuM"])).toBeNull();
    const product = { id: "1", organizationId: "org", name: "Jogo Adulto", description: "pornografia", keywords: "sex shop", url: "https://loja.com/p", categories: [{ name: "Games" }], options: [{ pricing: [{ price: 10 }] }] };
    expect(lomadeeDiscardReason(product, { name: "Loja" }, "https://lmdee.link/x")).toBeNull();
  });

  it("allowlist vazia falha fechada", () => {
    expect(awinDiscardReason(awinRow, [])).toBe(MERCHANT_NOT_ALLOWED_REASON);
  });
});
