import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeAwinProduct, authorizedAwinWorkflow } from "./awin-catalog.ts";
const row = { aw_product_id: "123", merchant_id: "456", product_name: "Tênis branco", search_price: "199,90", merchant_name: "Reserva", aw_deep_link: "https://www.awin1.com/cread.php?awinmid=456", merchant_image_url: "https://example.com/tenis.jpg", in_stock: "1", currency: "BRL" };
const date = "2026-11-05T19:00:00.000Z";
test("Awin preserves merchant, tracked link, decimal price and source", () => {
  const p = normalizeAwinProduct(row, date);
  assert.equal(p?.price, 199.9); assert.equal(p?.store, "Reserva");
  assert.equal(p?.affiliateUrl, row.aw_deep_link); assert.equal(p?.source, "awin"); assert.equal(p?.last_synced_at, date);
});
test("source-qualified IDs prevent merchant and partner collisions", () => {
  assert.equal(normalizeAwinProduct(row, date)?.objectID, "awin-456-123");
  assert.equal(normalizeAwinProduct({ ...row, merchant_id: "789" }, date)?.objectID, "awin-789-123");
});
test("out of stock is marked unavailable without deletion", () => {
  assert.equal(normalizeAwinProduct({ ...row, in_stock: "0" }, date)?.status, "unavailable");
});
test("invalid prices and untracked unsafe URLs are rejected", () => {
  assert.equal(normalizeAwinProduct({ ...row, search_price: "0" }, date), null);
  assert.equal(normalizeAwinProduct({ ...row, aw_deep_link: "javascript:alert(1)" }, date), null);
});
test("absent partner data is never invented", () => {
  const p = normalizeAwinProduct(row, date);
  assert.equal(p?.description, ""); assert.deepEqual(p?.qa, []); assert.deepEqual(p?.attributes, []);
});
test("only the configured main workflow may ingest", () => {
  const repo = "viniduferreira-sketch/compareecompre";
  const c = { repository: repo, ref: "refs/heads/main", workflow_ref: `${repo}/.github/workflows/awin-import.yml@refs/heads/main`, event_name: "schedule" };
  assert.equal(authorizedAwinWorkflow(c, repo), true);
  assert.equal(authorizedAwinWorkflow({ ...c, ref: "refs/heads/other" }, repo), false);
  assert.equal(authorizedAwinWorkflow({ ...c, repository: "other/repo" }, repo), false);
  assert.equal(authorizedAwinWorkflow({ ...c, event_name: "pull_request" }, repo), false);
});