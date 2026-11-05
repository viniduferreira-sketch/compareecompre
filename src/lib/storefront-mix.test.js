import { test } from "node:test";
import assert from "node:assert/strict";
import { interleaveByStore, toSiteCategory } from "./storefront-mix.ts";

test("Kabum hardware never maps to Moda", () => assert.equal(toSiteCategory("Hardware"), "Eletrônicos"));
test("headphones map to Eletrônicos", () => assert.equal(toSiteCategory("Headphones"), "Eletrônicos"));
test("clothing maps to Moda", () => assert.equal(toSiteCategory("Camisetas Masculinas"), "Moda"));
test("unknown labels stay uncategorized", () => assert.equal(toSiteCategory("Diversos"), null));
test("existing site names are kept", () => assert.equal(toSiteCategory("Moda"), "Moda"));

const offers = (store, n) => Array.from({ length: n }, (_, i) => ({ store, id: `${store}${i}` }));
test("rail alternates stores instead of filling with one", () => {
  const mixed = interleaveByStore([offers("ML", 10), offers("Kabum", 10)], 4, 7);
  assert.equal(mixed.filter((o) => o.store === "ML").length, 2);
  assert.equal(mixed.filter((o) => o.store === "Kabum").length, 2);
});
test("a small store does not shrink the rail", () => assert.equal(interleaveByStore([offers("ML", 10), offers("Kabum", 1)], 6, 3).length, 6));

test("Mercado Livre, Kabum and Promo Farma share a rail equally", () => {
  const mixed = interleaveByStore([offers("Mercado Livre", 100), offers("Kabum", 40), offers("Promo Farma", 20)], 12, 7);
  for (const store of ["Mercado Livre", "Kabum", "Promo Farma"]) assert.equal(mixed.filter((offer) => offer.store === store).length, 4);
});
test("rotation changes hourly while remaining stable within a seed", () => {
  const groups = [offers("Mercado Livre", 42), offers("Kabum", 42), offers("Promo Farma", 42)];
  assert.deepEqual(interleaveByStore(groups, 14, 10), interleaveByStore(groups, 14, 10));
  assert.notDeepEqual(interleaveByStore(groups, 14, 10), interleaveByStore(groups, 14, 11));
});
