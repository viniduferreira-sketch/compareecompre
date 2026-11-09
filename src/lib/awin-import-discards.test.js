import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ batch: null, writes: [], rules: [] }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: (table) => {
  const chain = { select: () => chain, eq: () => chain,
    single: async () => ({ data: { id: "job", status: "running" }, error: null }),
    maybeSingle: async () => ({ data: state.batch, error: null }),
    upsert: async (value) => { state.writes.push({ table, value }); state.batch = value; return { error: null }; },
    update: () => chain, then: (resolve) => resolve(table === "awin_allowed_merchants" ? { data: [{ merchant_name: "KaBuM" }, { merchant_name: "Nike BR" }], error: null } : table === "awin_merchant_rules" ? { data: state.rules, error: null } : { error: null }),
  }; return chain;
} } }));
vi.mock("./algolia-indexing.server", () => ({ getAlgoliaIndexingConfig: () => { throw new Error("Discarded rows must not touch Algolia"); }, ensureIdentifierFacets: vi.fn() }));
import { handleAwinImport } from "./awin-import.server";

beforeEach(() => { state.batch = null; state.writes = []; state.rules = []; });

describe("persistência idempotente dos descartes Awin", () => {
  it("grava 12 moedas USD rejeitadas e replay não soma novamente", async () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({ aw_product_id: String(i), merchant_id: "2", product_name: "Produto", merchant_name: "KaBuM", search_price: "109", aw_deep_link: "https://awin1.com/p", currency: "USD" }));
    const input = { action: "batch", importId: "job", batch: 0, rows };
    const first = await handleAwinImport("run", input);
    expect(first).toEqual({ indexed: 0, skipped: 12 });
    expect(state.writes).toHaveLength(1);
    expect(state.writes[0].value.discard_reasons).toEqual({ unsupported_currency: 12 });
    await handleAwinImport("run", input);
    expect(state.writes).toHaveLength(1);
  });

  it("descarta Monsterpub mesmo em BRL por não estar na allowlist", async () => {
    const rows = [{ aw_product_id: "adult-1", merchant_id: "2", product_name: "Produto", merchant_name: "Monsterpub Sex Toy", search_price: "109", aw_deep_link: "https://awin1.com/p", currency: "BRL" }];
    const result = await handleAwinImport("run", { action: "batch", importId: "job", batch: 0, rows });
    expect(result).toEqual({ indexed: 0, skipped: 1 });
    expect(state.writes[0].value.discard_reasons).toEqual({ "anunciante não permitido": 1 });
  });

  it("descarta conteúdo adulto de anunciante permitido", async () => {
    const rows = [{ aw_product_id: "adult-2", merchant_id: "2", product_name: "Masturbador", merchant_name: "KaBuM", search_price: "109", aw_deep_link: "https://awin1.com/p", currency: "BRL" }];
    const result = await handleAwinImport("run", { action: "batch", importId: "job", batch: 0, rows });
    expect(result).toEqual({ indexed: 0, skipped: 1 });
    expect(state.writes[0].value.discard_reasons).toEqual({ "conteúdo adulto": 1 });
  });

  it("testa o lote real com categorias vazias sem gravar produtos, histórico ou índice", async () => {
    state.rules = [
      { merchant: "KaBuM", category_terms: [], excluded_category_terms: ["gift card", "cartão presente"], max_products: 20000 },
      { merchant: "Nike", category_terms: [], excluded_category_terms: ["gift card", "cartão presente"], max_products: 20000 },
    ];
    const rows = [
      { aw_product_id: "kabum-1", merchant_id: "17729", product_name: "Notebook", merchant_name: "Kabum BR", merchant_category: "Computadores", search_price: "109", aw_deep_link: "https://awin1.com/p", currency: "BRL" },
      { aw_product_id: "nike-1", merchant_id: "17652", product_name: "Tênis", merchant_name: "Nike BR", merchant_category: "Calçados", search_price: "299", aw_deep_link: "https://awin1.com/p", currency: "BRL" },
      { aw_product_id: "gift-1", merchant_id: "17729", product_name: "Vale", merchant_name: "Kabum BR", merchant_category: "Gift Cards", search_price: "100", aw_deep_link: "https://awin1.com/p", currency: "BRL" },
    ];
    const result = await handleAwinImport("dry-run", { action: "testBatch", batch: 0, rows });
    expect(result).toMatchObject({ dryRun: true, indexed: 2, skipped: 1, acceptedByMerchant: { KaBuM: 1, Nike: 1 }, discardReasons: { "categoria não permitida": 1 } });
    expect(state.writes).toHaveLength(0);
  });
});
