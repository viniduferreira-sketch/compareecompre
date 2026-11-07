import { describe, it, expect, vi } from "vitest";
import { clickContext, outboundClickSchema, recordOutboundClick } from "./outbound-clicks";

const click = { offer_id: "awin:123", source: "awin", store_name: "Kabum", category: "Eletrônicos", page_type: "produto", placement: "best_offer", referrer_host: "example.com", utm_source: null, utm_medium: null, utm_campaign: null, device: "desktop" };
describe("anonymous outbound clicks", () => {
  it("accepts each partner source", () => { for (const source of ["mercadolivre", "lomadee", "awin"]) expect(outboundClickSchema.parse({ ...click, source }).source).toBe(source); });
  it("rejects personal data fields", () => { for (const field of ["ip", "email", "user_agent", "visitor_id"]) expect(outboundClickSchema.safeParse({ ...click, [field]: "private" }).success).toBe(false); });
  it("rejects unknown sources", () => { expect(outboundClickSchema.safeParse({ ...click, source: "other" }).success).toBe(false); });
  it("bounds identifiers and merchant names", () => { expect(outboundClickSchema.safeParse({ ...click, offer_id: "a".repeat(161) }).success).toBe(false); expect(outboundClickSchema.safeParse({ ...click, store_name: "a".repeat(101) }).success).toBe(false); });
  it("stores referrer hostname only", () => { expect(clickContext("https://compareecompre.com/?utm_source=telegram", "https://example.com/private?email=user", false).referrer_host).toBe("example.com"); expect(outboundClickSchema.safeParse({ ...click, referrer_host: "https://example.com/private" }).success).toBe(false); });
  it("drops personal-looking UTM values and keeps campaign tokens", () => { expect(clickContext("https://compareecompre.com/?utm_source=telegram&utm_medium=user@example.com&utm_campaign=black_friday", "", true)).toEqual({ referrer_host: null, utm_source: "telegram", utm_medium: null, utm_campaign: "black_friday", device: "mobile" }); });
  it("does not propagate beacon or network errors into navigation", () => {
    vi.stubGlobal("window", { location: { href: "https://compareecompre.com/produto/awin:123", pathname: "/produto/awin:123", search: "" }, matchMedia: () => ({ matches: false }) });
    vi.stubGlobal("document", { referrer: "" }); vi.stubGlobal("navigator", { sendBeacon: () => { throw new Error("offline"); } });
    expect(() => recordOutboundClick({ id: "awin:123", source: "awin", store: "Kabum" }, "best_offer")).not.toThrow(); vi.unstubAllGlobals();
  });
});