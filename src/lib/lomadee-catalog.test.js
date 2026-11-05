import { describe, expect, it } from "vitest";
import { normalizeLomadeeProduct } from "./lomadee-catalog";

const base = {
  id: "2691", organizationId: "de93faa0-5a21", available: true, name: "Fidget Spinner",
  url: "https://www.candide.com.br/p", images: [{ url: "https://img.example/a.jpg" }],
  categories: [{ name: "games_hobby" }],
  options: [{ available: true, seller: "Candide", pricing: [{ listPrice: 29.99, price: 24.99 }] }],
};

describe("normalizeLomadeeProduct", () => {
  it("normaliza Shopee com logotipo oficial e link próprio", () => {
    const p = normalizeLomadeeProduct({ ...base, organizationId: "shopee-org" }, { name: "Shopee", logo: "https://cdn.lomadee.com.br/shopee.png" }, "https://lmdee.link/shopee", "2026-11-05T00:00:00Z");
    expect(p.objectID).toBe("lomadee-shopee-org-2691");
    expect(p.store).toBe("Shopee"); expect(p.storeLogoUrl).toBe("https://cdn.lomadee.com.br/shopee.png");
    expect(p.affiliateUrl).toBe("https://lmdee.link/shopee"); expect(p.source).toBe("lomadee");
  });
  it("maps price, store, affiliate link, source and category", () => {
    const p = normalizeLomadeeProduct(base, { name: "Candide" }, "https://lmdee.link/x", "2026-11-05T00:00:00Z");
    expect(p.objectID).toBe("lomadee-de93faa0-5a21-2691");
    expect(p.price).toBe(24.99);
    expect(p.originalPrice).toBe(29.99);
    expect(p.discountPercent).toBe(17);
    expect(p.store).toBe("Candide");
    expect(p.affiliateUrl).toBe("https://lmdee.link/x");
    expect(p.source).toBe("lomadee");
    expect(p.categoryName).toBe("Games");
  });
  it("rejects products without an affiliate link", () => {
    expect(normalizeLomadeeProduct(base, { name: "Candide" }, null, "2026-11-05T00:00:00Z")).toBeNull();
  });
  it("rejects products without a valid price", () => {
    expect(normalizeLomadeeProduct({ ...base, options: [{ pricing: [{ price: 0 }] }] }, { name: "C" }, "https://lmdee.link/x", "t")).toBeNull();
  });
});
