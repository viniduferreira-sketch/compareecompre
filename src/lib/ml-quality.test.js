import { describe, expect, it } from "vitest";
import {
  groupKeyOf,
  isTrustedSeller,
  median,
  normalizeModelTokens,
  pickGroupWinner,
  priceVerdict,
} from "./ml-quality.ts";

describe("isTrustedSeller", () => {
  it("approves an official store", () => {
    expect(isTrustedSeller({ officialStoreId: 123 })).toBe(true);
  });
  it("approves gold and platinum power sellers", () => {
    expect(isTrustedSeller({ powerSellerStatus: "gold" })).toBe(true);
    expect(isTrustedSeller({ powerSellerStatus: "platinum" })).toBe(true);
    expect(isTrustedSeller({ powerSellerStatus: "silver" })).toBe(false);
  });
  it("approves green reputation with enough sales and positive ratio", () => {
    expect(isTrustedSeller({ levelId: "5_green", completedSales: 500, positiveRatio: 0.95 })).toBe(true);
    expect(isTrustedSeller({ levelId: "4_light_green", completedSales: 200, positiveRatio: 0.9 })).toBe(true);
  });
  it("rejects green reputation with too few sales or low ratio", () => {
    expect(isTrustedSeller({ levelId: "5_green", completedSales: 199, positiveRatio: 0.99 })).toBe(false);
    expect(isTrustedSeller({ levelId: "5_green", completedSales: 500, positiveRatio: 0.89 })).toBe(false);
  });
  it("accepts green level with sales when the API omits ratings", () => {
    expect(isTrustedSeller({ levelId: "5_green", completedSales: 300, positiveRatio: null })).toBe(true);
  });
  it("rejects a seller with no reputation data (Galaxy A23 case)", () => {
    expect(isTrustedSeller({ officialStoreId: null, powerSellerStatus: null, levelId: null, completedSales: 0, positiveRatio: null })).toBe(false);
  });
});

describe("median", () => {
  it("computes odd and even medians", () => {
    expect(median([1, 2, 3])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBe(0);
  });
});

describe("normalizeModelTokens", () => {
  it("extracts digit-bearing tokens, normalized and sorted", () => {
    expect(normalizeModelTokens("Celular Samsung Galaxy A23 5G 128GB")).toEqual(["128gb", "5g", "a23"]);
  });
  it("ignores pure words", () => {
    expect(normalizeModelTokens("Fone de ouvido bluetooth")).toEqual([]);
  });
});

describe("groupKeyOf", () => {
  it("groups same category, brand and model", () => {
    const a = groupKeyOf({ categoryName: "Celulares", brand: "Samsung", title: "Celular Samsung Galaxy A23 128GB" });
    const b = groupKeyOf({ categoryName: "Celulares", brand: "samsung", title: "Smartphone Galaxy A23 5G 128GB Preto" });
    expect(a).toBe("celulares|samsung|128gb-a23");
    expect(b).toBe("celulares|samsung|128gb-5g-a23");
    expect(a).not.toBe(b);
  });
  it("returns empty key without brand or model", () => {
    expect(groupKeyOf({ categoryName: "Casa", brand: null, title: "Jogo de panelas" })).toBe("");
  });
});

describe("priceVerdict", () => {
  it("rejects prices outside 0.5x–1.6x of the median in groups of 3+", () => {
    const group = [1200, 1300, 1400];
    expect(priceVerdict(10000, group, false)).toBe("preço fora da faixa");
    expect(priceVerdict(400, group, false)).toBe("preço fora da faixa");
    expect(priceVerdict(1300, group, false)).toBe("ok");
    expect(priceVerdict(2080, group, false)).toBe("ok"); // exactly 1.6x
  });
  it("requires a trusted seller in groups smaller than 3", () => {
    expect(priceVerdict(999, [999], false)).toBe("grupo pequeno exige vendedor confiável");
    expect(priceVerdict(999, [999], true)).toBe("ok");
  });
});

describe("pickGroupWinner", () => {
  it("prefers the buy box winner", () => {
    expect(pickGroupWinner([
      { id: "a", price: 100, isBuyBoxWinner: false },
      { id: "b", price: 150, isBuyBoxWinner: true },
    ])).toBe("b");
  });
  it("falls back to the cheapest approved", () => {
    expect(pickGroupWinner([
      { id: "a", price: 150, isBuyBoxWinner: false },
      { id: "b", price: 100, isBuyBoxWinner: false },
    ])).toBe("b");
  });
  it("returns null for an empty group", () => {
    expect(pickGroupWinner([])).toBeNull();
  });
});
