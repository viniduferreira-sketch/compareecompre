import { describe, expect, it } from "vitest";
import { prioritizedMerchants, readLomadeeCursor } from "./lomadee-cursor";
describe("continuação multiloja Lomadee", () => {
  it("inclui Shopee e outras lojas sem lista fixa de varejistas", () => {
    const stores = prioritizedMerchants([{ id: "a", name: "PromoFarma" }, { id: "z", name: "Shopee" }, { id: "b", name: "Nova loja" }]);
    expect(stores.map((s) => s.name)).toEqual(["Shopee", "PromoFarma", "Nova loja"]);
  });
  it("retoma a posição exata na página para não repetir apenas os primeiros produtos", () => {
    expect(readLomadeeCursor({ merchantId: "shopee", products: { shopee: { page: 3, offset: 27 } }, couponPage: 4 })).toEqual({ merchantId: "shopee", products: { shopee: { page: 3, offset: 27 } }, couponPage: 4 });
  });
});