import { describe, expect, it } from "vitest";
import { isSameProduct } from "./search-offers";
import { descriptionParagraphs } from "@/components/marketplace/ProductDetailSections";
describe("comparador", () => {
  it("casa pelo EAN", () => expect(isSameProduct({ title: "x y", ean: "7891234567890" }, { title: "z w", ean: "7891234567890" })).toBe(true));
  it("rejeita modelo diferente", () => expect(isSameProduct({ title: "Smartphone Galaxy A15 128GB" }, { title: "Smartphone Galaxy A25 128GB" })).toBe(false));
  it("aceita mesmo título", () => expect(isSameProduct({ title: "Smartphone Galaxy A15 128GB Preto" }, { title: "Galaxy A15 128GB Smartphone Preto Samsung" })).toBe(true));
  it("quebra descrição em <br>", () => expect(descriptionParagraphs("Um.<br>Dois.")).toEqual(["Um.", "Dois."]));
});
