import { describe, it, expect } from "vitest";
import { calculatePopularity, productGroupId } from "./popularity";

const product = { objectID: "one", store: "Nike", source: "awin", title: "Tênis Nike Azul tamanho 42", gtin: "7891234567890", status: "active", inStock: true, imageUrl: "https://example.com/shoe.jpg", price: 70, originalPrice: 100 };
describe("popularity and variants", () => {
  it("uses all signals and stays between zero and 100", () => {
    expect(calculatePopularity(product)).toBe(100);
    expect(calculatePopularity({ objectID: "empty" })).toBe(0);
    expect(calculatePopularity(product, 100000, 100000)).toBeLessThanOrEqual(100);
  });
  it("ignores false discounts", () => {
    expect(calculatePopularity({ ...product, originalPrice: 50 })).toBe(80);
  });
  it("real clicks increase rank and their weight grows with data", () => {
    const p = { objectID: "click-only" };
    expect(calculatePopularity(p, 10, 100)).toBe(15);
    expect(calculatePopularity(p, 10, 1000)).toBe(27);
    expect(calculatePopularity(p, 0, 1000)).toBe(0);
  });
  it("never groups different stores even with same parent", () => {
    expect(productGroupId({ ...product, parent_product_id: "parent" })).not.toBe(productGroupId({ ...product, store: "Outra", parent_product_id: "parent" }));
  });
  it("groups size and color variants inside one store", () => {
    expect(productGroupId({ ...product, colour: "Azul", size: "42" })).toBe(productGroupId({ ...product, title: "Tênis Nike Vermelho tamanho 40", colour: "Vermelho", size: "40" }));
  });
  it("does not merge capacities or ML catalog products", () => {
    expect(productGroupId({ ...product, title: "SSD 1TB" })).not.toBe(productGroupId({ ...product, title: "SSD 2TB" }));
    expect(productGroupId({ ...product, source: "mercadolivre" })).not.toBe(productGroupId({ ...product, source: "mercadolivre", objectID: "two" }));
  });
  it("keeps KaBuM duplicate titles separate without parent evidence", () => {
    expect(productGroupId({ ...product, store: "Kabum BR" })).not.toBe(productGroupId({ ...product, store: "Kabum BR", objectID: "two" }));
  });
});