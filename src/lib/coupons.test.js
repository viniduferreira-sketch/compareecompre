import { describe, expect, it } from "vitest";
import { activeCouponDates, normalizeLomadeeCoupon } from "./coupons";

const now = "2026-11-05T21:25:00Z";
const campaign = { id: "coupon1", organizationId: "shopee1", name: "10% OFF em eletrônicos", code: "ELETRONICOS10", type: "GenericCoupon", status: "onTime", period: { startAt: "2026-11-05T20:00:00Z", endAt: "2026-11-06T20:00:00Z" }, channels: [{ shortUrls: ["https://lmdee.link/tracked"] }] };
describe("cupons reais", () => {
  it("preserva código, loja, origem e link rastreado", () => {
    const coupon = normalizeLomadeeCoupon(campaign, { name: "Shopee", logo: "https://cdn.example/logo.png" }, now);
    expect(coupon.code).toBe("ELETRONICOS10"); expect(coupon.store).toBe("Shopee");
    expect(coupon.source).toBe("lomadee"); expect(coupon.affiliate_url).toBe("https://lmdee.link/tracked");
    expect(coupon.logo_url).toBe("https://cdn.example/logo.png");
  });
  it("não publica cupom expirado", () => { expect(activeCouponDates(null, now, Date.parse(now))).toBe(false); });
  it("não publica cupom futuro", () => { expect(activeCouponDates("2026-11-06T20:00:00Z", null, Date.parse(now))).toBe(false); });
  it("não publica cupom sem link autorizado", () => { expect(normalizeLomadeeCoupon({ ...campaign, channels: [] }, { name: "Shopee" }, now)).toBeNull(); });
  it("não inventa código para ofertas sem cupom", () => { expect(normalizeLomadeeCoupon({ ...campaign, type: "Offer", code: "" }, { name: "Shopee" }, now)).toBeNull(); });
});