import { describe, expect, it } from "vitest";
import { isSameProduct } from "./search-offers";
import { descriptionParagraphs } from "@/components/marketplace/ProductDetailSections";
describe("comparador", () => {
  it("casa pelo EAN", () => expect(isSameProduct({ title: "x y", ean: "7891234567890" }, { title: "z w", ean: "7891234567890" })).toBe(true));
  it("rejeita modelo diferente", () => expect(isSameProduct({ title: "Smartphone Galaxy A15 128GB" }, { title: "Smartphone Galaxy A25 128GB" })).toBe(false));
  it("não aceita títulos parecidos sem identificadores", () => expect(isSameProduct({ title: "Smartphone Galaxy A15 128GB Preto" }, { title: "Galaxy A15 128GB Smartphone Preto Samsung" })).toBe(false));
  it("quebra descrição em <br>", () => expect(descriptionParagraphs("Um.<br>Dois.")).toEqual(["Um.", "Dois."]));
});
import { groupComparedOffers } from "./search-offers";
const hit = (objectID, store, price, title = "SSD Kingston A400 480GB SATA") => ({ objectID, store, price, title, gtin: title.includes("240GB") ? "12345679" : "12345678", affiliateUrl: "https://x/" + objectID, source: "awin" });
describe("agrupamento do comparador", () => {
  it("junta lojas diferentes, uma oferta (a mais barata) por loja, menor preço primeiro", () => {
    const out = groupComparedOffers({ gtin: "12345678" }, [
      hit("a", "Kabum BR", 299), hit("b", "Mercado Livre", 279), hit("c", "Mercado Livre", 289), hit("d", "Shopee", 310), hit("e", "Shopee", 150, "SSD Kingston A400 240GB SATA"),
    ]);
    expect(out.map((o) => [o.store, o.price])).toEqual([["Mercado Livre", 279], ["Kabum BR", 299], ["Shopee", 310]]);
  });
});
