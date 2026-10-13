import { test } from "node:test";
import assert from "node:assert/strict";

import { formatSyncedAt, freshnessThresholdSeconds, isPriceFresh } from "./price-freshness.ts";

const now = Date.parse("2026-10-13T12:00:00Z");

test("price synced 23h ago is shown", () => {
  assert.equal(isPriceFresh("2026-10-12T13:00:00Z", now), true);
});

test("price synced 25h ago is hidden", () => {
  assert.equal(isPriceFresh("2026-10-12T11:00:00Z", now), false);
});

test("missing sync timestamp hides the price", () => {
  assert.equal(isPriceFresh(null, now), false);
});

test("listing filter threshold is exactly 24h before now in seconds", () => {
  assert.equal(freshnessThresholdSeconds(now), (now - 86_400_000) / 1000);
});

test("sync label uses Brasília time", () => {
  assert.equal(formatSyncedAt("2026-10-13T03:05:00Z"), "Preço atualizado em 13/10 às 00:05");
});
