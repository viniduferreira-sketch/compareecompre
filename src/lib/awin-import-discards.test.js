import { describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ batch: null, writes: [] }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: (table) => {
  const chain = { select: () => chain, eq: () => chain,
    single: async () => ({ data: { id: "job", status: "running" }, error: null }),
    maybeSingle: async () => ({ data: state.batch, error: null }),
    upsert: async (value) => { state.writes.push({ table, value }); state.batch = value; return { error: null }; },
    update: () => chain, then: (resolve) => resolve({ error: null }),
  }; return chain;
} } }));
vi.mock("./algolia-indexing.server", () => ({ getAlgoliaIndexingConfig: () => { throw new Error("Discarded rows must not touch Algolia"); }, ensureIdentifierFacets: vi.fn() }));
import { handleAwinImport } from "./awin-import.server";
describe("persistência idempotente dos descartes Awin", () => {
  it("grava 12 moedas USD rejeitadas e replay não soma novamente", async () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({ aw_product_id: String(i), merchant_id: "2", product_name: "Produto", merchant_name: "Loja", search_price: "109", aw_deep_link: "https://awin1.com/p", currency: "USD" }));
    const input = { action: "batch", importId: "job", batch: 0, rows };
    const first = await handleAwinImport("run", input);
    expect(first).toEqual({ indexed: 0, skipped: 12 });
    expect(state.writes).toHaveLength(1);
    expect(state.writes[0].value.discard_reasons).toEqual({ unsupported_currency: 12 });
    await handleAwinImport("run", input);
    expect(state.writes).toHaveLength(1);
  });
});