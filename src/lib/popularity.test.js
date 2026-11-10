import { describe, it, expect } from "vitest";
import { calculatePopularity, productGroupId, defaultVariantGrouping } from "./popularity";

const product = { objectID: "one", store: "Nike", source: "awin", title: "Tênis Nike Azul tamanho 42", gtin: "7891234567890", status: "active", inStock: true, imageUrl: "https://example.com/shoe.jpg", price: 70, originalPrice: 100 };
describe("popularity and variants", () => {
  it("defaults Nike and Adidas on and all other stores off", () => {
    for (const name of ["Nike", "Nike BR", "adidas BR", "Adidas"]) expect(defaultVariantGrouping(name)).toBe(true);
    for (const name of ["KaBuM", "Mercado Livre", "Lauri Esporte", "Monsterpub"]) expect(defaultVariantGrouping(name)).toBe(false);
  });
  it("groups Adidas sizes when enabled and restores singleton keys when disabled", () => {
    const a = { ...product, store: "79926", colour: "Azul", size: "42", parent_product_id: "shoe" };
    const b = { ...a, objectID: "two", size: "40" };
    expect(productGroupId(a, true)).toBe(productGroupId(b, true));
    expect(productGroupId(a, false)).toBe("single:one");
    expect(productGroupId(b, false)).toBe("single:two");
  });
  it("never merges enabled stores or networks even with identical products and colours", () => {
    const a = { ...product, store: "17652", colour: "Azul", parent_product_id: "shoe" };
    expect(productGroupId(a, true)).not.toBe(productGroupId({ ...a, store: "79926" }, true));
    expect(productGroupId(a, true)).not.toBe(productGroupId({ ...a, source: "lomadee" }, true));
  });
  it("uses all signals and stays between zero and 100", () => {
    expect(calculatePopularity(product)).toBe(100);
    expect(calculatePopularity({ objectID: "empty" })).toBe(0);
    expect(calculatePopularity(product, 100000, 100000)).toBeLessThanOrEqual(100);
  });
  it("ignores false discounts", () => {
    expect(calculatePopularity({ ...product, originalPrice: 50 })).toBe(80);
  });
  it("gives no discount bonus above 70%, but keeps the 70% bonus", () => {
    expect(calculatePopularity({ ...product, price: 20, originalPrice: 100 })).toBe(80);
    expect(calculatePopularity({ ...product, price: 30, originalPrice: 100 })).toBe(100);
  });
  it("real clicks increase rank and their weight grows with data", () => {
    const p = { objectID: "click-only" };
    expect(calculatePopularity(p, 10, 100)).toBe(15);
    expect(calculatePopularity(p, 10, 1000)).toBe(27);
    expect(calculatePopularity(p, 0, 1000)).toBe(0);
  });
  it("never groups different stores even with same parent", () => {
    expect(productGroupId({ ...product, parent_product_id: "parent" })).not.toBe(productGroupId({ ...product, objectID: "two", store: "Outra", parent_product_id: "parent" }));
  });
  it("groups Nike sizes of the same product and colour, but never different colours", () => {
    expect(productGroupId({ ...product, colour: "Azul", size: "42" })).toBe(productGroupId({ ...product, objectID: "two", title: "Tênis Nike Azul tamanho 40", colour: "Azul", size: "40" }));
    expect(productGroupId({ ...product, colour: "Azul", size: "42" })).not.toBe(productGroupId({ ...product, title: "Tênis Nike Vermelho tamanho 40", colour: "Vermelho", size: "40" }));
  });
  it("never groups non-Nike parents, other sources or different stores", () => {
    expect(productGroupId({ ...product, store: "Kabum BR", parent_product_id: "same" })).not.toBe(productGroupId({ ...product, objectID: "two", store: "Kabum BR", parent_product_id: "same" }));
    expect(productGroupId({ ...product, source: "lomadee", colour: "Azul" })).not.toBe(productGroupId({ ...product, objectID: "two", source: "lomadee", colour: "Azul" }));
    expect(productGroupId({ ...product, colour: "Azul" })).not.toBe(productGroupId({ ...product, store: "Outra", colour: "Azul" }));
  });
  it("keeps Nike records without a reliable product or colour singleton", () => {
    expect(productGroupId({ ...product, colour: null })).toBe("single:one");
    expect(productGroupId({ ...product, title: "", colour: "Azul" })).toBe("single:one");
  });
  it("does not merge capacities or ML catalog products", () => {
    expect(productGroupId({ ...product, title: "SSD 1TB" })).not.toBe(productGroupId({ ...product, objectID: "two", title: "SSD 2TB" }));
    expect(productGroupId({ ...product, source: "mercadolivre" })).not.toBe(productGroupId({ ...product, source: "mercadolivre", objectID: "two" }));
  });
  it("keeps KaBuM duplicate titles separate without parent evidence", () => {
    expect(productGroupId({ ...product, store: "Kabum BR" })).not.toBe(productGroupId({ ...product, store: "Kabum BR", objectID: "two" }));
  });
});