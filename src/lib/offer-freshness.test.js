import { test } from "node:test";
import assert from "node:assert/strict";
import { isOfferExpired, selectVisibleOffers } from "./offer-freshness.ts";

const now = Date.parse("2026-10-15T16:25:00Z");
const dated = (hours, status = "active") => ({ price: 100, status, last_synced_at: new Date(now - hours * 3600000).toISOString() });
test("legacy offers without last_synced_at remain valid", () => assert.equal(isOfferExpired({ price: 100 }, now), false));
test("the 48-hour boundary is inclusive", () => assert.equal(isOfferExpired(dated(48), now), false));
test("a present timestamp older than 48 hours expires", () => assert.equal(isOfferExpired(dated(49), now), true));
test("a list emptied by freshness falls back to its available products", () => assert.deepEqual(selectVisibleOffers([dated(49)], now), [dated(49)]));
test("unavailable products never appear even in freshness fallback", () => assert.deepEqual(selectVisibleOffers([dated(49, "unavailable")], now), []));
test("fresh lists omit expired offers", () => assert.deepEqual(selectVisibleOffers([dated(47), dated(49)], now), [dated(47)]));