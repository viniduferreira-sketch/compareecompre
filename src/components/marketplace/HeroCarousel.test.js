import { describe, expect, it } from "vitest";
import { HOME_BANNERS } from "./HeroCarousel";

describe("banners da página inicial", () => {
  it("mantém exatamente sete banners ativos sem apagar os quatro inativos", () => {
    expect(HOME_BANNERS.filter((banner) => banner.active)).toHaveLength(7);
    expect(HOME_BANNERS.filter((banner) => !banner.active).map((banner) => banner.id)).toEqual([
      "cozinha",
      "eletronicos",
      "esportes",
      "moda",
    ]);
  });

  it("direciona os banners de parceiros para os filtros das lojas corretas", () => {
    expect(HOME_BANNERS.find((banner) => banner.id === "kabum")?.action).toEqual({ type: "store", value: "Kabum BR" });
    expect(HOME_BANNERS.find((banner) => banner.id === "nike")?.action).toEqual({ type: "store", value: "Nike BR" });
  });
});
