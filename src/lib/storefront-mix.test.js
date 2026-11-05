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
