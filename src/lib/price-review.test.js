import { describe, expect, it } from "vitest";
import { detectSuspiciousPrices, median, pricePeerKey } from "./price-review";

const record = (objectID, price, title = "SSD exemplo 1TB", categoryName = "Eletrônicos") => ({ objectID, price, title, categoryName });

describe("price review", () => {
  it("hides anything below R$ 5 even without peers", () => {
    const result = detectSuspiciousPrices([record("cheap", 4.99), record("five", 5)]);
    expect(result.get("cheap")).toMatchObject({ reason: "below_minimum" });
    expect(result.has("five")).toBe(false);
  });
  it("flags strictly below 20% of the similar category median", () => {
    const result = detectSuspiciousPrices([record("low", 39), record("a", 100), record("b", 200), record("c", 300), record("d", 400)]);
    expect(result.get("low")).toMatchObject({ reason: "below_median", median: 200, peerCount: 5 });
    expect(result.has("a")).toBe(false);
  });
  it("does not mix categories or product families", () => {
    expect(pricePeerKey(record("a", 10))).not.toBe(pricePeerKey(record("b", 10, "Tênis exemplo")));
    expect(pricePeerKey(record("a", 10))).not.toBe(pricePeerKey(record("b", 10, "SSD exemplo 1TB", "Casa")));
    const result = detectSuspiciousPrices([record("ssd", 10), record("shoe", 1000, "Tênis exemplo")]);
    expect(result.has("ssd")).toBe(false);
  });
  it("calculates even and odd medians", () => {
    expect(median([1, 3, 2])).toBe(2);
    expect(median([1, 4, 2, 3])).toBe(2.5);
    expect(median([])).toBeNull();
  });
  it("finds the R$ 1 SSD against its SSD peers", () => {
    const result = detectSuspiciousPrices([record("one-real", 1, "SSD PCYES 1TB", null), record("a", 422.9, "SSD PCYES 256GB", null), record("b", 809.9, "SSD PCYES 512GB", null), record("c", 881.9, "SSD PCYES 512GB", null)]);
    expect(result.get("one-real")).toMatchObject({ reason: "below_minimum", median: 616.4, peerCount: 4 });
  });
});
