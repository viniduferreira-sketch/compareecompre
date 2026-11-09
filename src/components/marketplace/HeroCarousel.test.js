import { describe, expect, it } from "vitest";
import { HOME_BANNERS } from "./HeroCarousel";

describe("banners da página inicial", () => {
  it("mantém só os três banners novos ativos, nesta ordem", () => {
    expect(HOME_BANNERS.map((b) => [b.id, b.active])).toEqual([["kabum", true], ["nike", true], ["como-funciona", true]]);
  });

  it("direciona os banners de parceiros para os filtros das lojas corretas", () => {
    expect(HOME_BANNERS[0].action).toEqual({ type: "store", value: "Kabum BR" });
    expect(HOME_BANNERS[1].action).toEqual({ type: "store", value: "Nike BR" });
  });
});
