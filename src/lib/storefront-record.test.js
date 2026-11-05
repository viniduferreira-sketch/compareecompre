import { test } from "node:test";
import assert from "node:assert/strict";
import { storefrontIdentity } from "./storefront-record.ts";

test("merchant_name identifies Promo Farma without a fixed Mercado Livre label", () => {
  assert.equal(storefrontIdentity({ merchant_name: "Promo Farma" }).store, "Promo Farma");
});
test("loja identifies Reserva when the normalized store field is absent", () => {
  assert.equal(storefrontIdentity({ loja: "Reserva" }).store, "Reserva");
});
test("Awin uses its own tracked deep link", () => {
  assert.equal(storefrontIdentity({ source: "awin", aw_deep_link: "https://www.awin1.com/cread.php?id=1", affiliateUrl: "https://example.com" }).affiliateUrl, "https://www.awin1.com/cread.php?id=1");
});
test("Lomadee preserves its tracked affiliate link", () => {
  assert.equal(storefrontIdentity({ source: "lomadee", affiliateUrl: "https://lmd.to/promofarma" }).affiliateUrl, "https://lmd.to/promofarma");
});
test("official feed logo is preserved", () => {
  assert.equal(storefrontIdentity({ merchant_logo: "https://example.com/logo.png" }).storeLogoUrl, "https://example.com/logo.png");
});