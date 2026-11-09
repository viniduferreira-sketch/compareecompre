import { describe, it, expect } from "vitest";
import { applyStoreDisplay, storeMatches, logoUrlSchema } from "./partner-stores";
const hidden = { network: "awin", external_id: "17729", merchant_name: "Kabum BR", import_enabled: false, display_enabled: false };
describe("partner controls", () => {
  it("hides only the matching source and store without overwriting quality or availability", () => {
    const rows = [{ source: "awin", store: "Kabum BR", quality_status: "approved", status: "active" }, { source: "lomadee", store: "Kabum BR", status: "active" }];
    const result = applyStoreDisplay(rows, [hidden]);
    expect(result[0]).toEqual({ ...rows[0], site_hidden: true });
    expect(result[1]).toEqual({ ...rows[1], site_hidden: false });
    expect(rows[0]).not.toHaveProperty("site_hidden");
  });
  it("restores display independently of import and quality", () => {
    expect(applyStoreDisplay([{ source: "awin", merchant_id: "17729", quality_status: "rejected" }], [{ ...hidden, display_enabled: true }])[0]).toEqual({ source: "awin", merchant_id: "17729", quality_status: "rejected", site_hidden: false });
  });
  it("preserves an exact-duplicate manual hide during later imports", () => {
    expect(applyStoreDisplay([{ source: "awin", merchant_id: "17729", site_hidden: true }], [{ ...hidden, display_enabled: true }])[0].site_hidden).toBe(true);
  });
  it("matches Awin country aliases but never another network", () => {
    expect(storeMatches(hidden, { source: "awin", store: "KaBuM" })).toBe(true);
    expect(storeMatches(hidden, { source: "mercadolivre", merchant_id: "17729" })).toBe(false);
  });
  it("accepts external HTTPS and static chat logo paths", () => {
    expect(logoUrlSchema.safeParse("https://example.com/logo.png").success).toBe(true);
    expect(logoUrlSchema.safeParse("/logos/kabum.png").success).toBe(true);
  });
  it("rejects unsafe protocols, credentials and traversal", () => {
    for (const value of ["javascript:alert(1)", "https://user:password@example.com/logo.png", "/logos/../secret.png", "http://example.com/logo.png"]) expect(logoUrlSchema.safeParse(value).success).toBe(false);
  });
});