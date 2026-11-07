import { describe, expect, it } from "vitest";
import {
  classifyMeliItem,
  classifyMeliItemsList,
  classifyMeliProduct,
  itemIdFromErrorBody,
  shouldAbortRevalidation,
} from "./ml-revalidate";

describe("classifyMeliItem", () => {
  it("marca indisponível quando o item não existe mais (404/410)", () => {
    expect(classifyMeliItem(404, { message: "Item with id MLB123 not found" })).toBe("unavailable");
    expect(classifyMeliItem(410, null)).toBe("unavailable");
  });

  it("marca indisponível quando o status não é active", () => {
    expect(classifyMeliItem(200, { status: "paused", available_quantity: 5 })).toBe("unavailable");
    expect(classifyMeliItem(200, { status: "closed", available_quantity: 3 })).toBe("unavailable");
  });

  it("marca indisponível quando não há estoque", () => {
    expect(classifyMeliItem(200, { status: "active", available_quantity: 0 })).toBe("unavailable");
  });

  it("mantém ativo quando status é active e há estoque", () => {
    expect(classifyMeliItem(200, { status: "active", available_quantity: 7 })).toBe("active");
  });

  it("trata erro de API como desconhecido e não altera o registro", () => {
    expect(classifyMeliItem(429, null)).toBe("unknown");
    expect(classifyMeliItem(500, null)).toBe("unknown");
    expect(classifyMeliItem(200, null)).toBe("unknown");
  });
});

describe("classifyMeliProduct", () => {
  it("marca indisponível quando o produto não existe (404/410)", () => {
    expect(classifyMeliProduct(404, null)).toBe("unavailable");
    expect(classifyMeliProduct(410, null)).toBe("unavailable");
  });

  it("marca indisponível quando o status do produto não é active", () => {
    expect(classifyMeliProduct(200, { status: "inactive" })).toBe("unavailable");
  });

  it("mantém ativo quando o produto está active", () => {
    expect(classifyMeliProduct(200, { status: "active" })).toBe("active");
  });

  it("trata erro de API como desconhecido", () => {
    expect(classifyMeliProduct(429, null)).toBe("unknown");
    expect(classifyMeliProduct(500, null)).toBe("unknown");
  });
});

describe("classifyMeliItemsList", () => {
  it("marca indisponível quando a lista de ofertas veio vazia ou 404", () => {
    expect(classifyMeliItemsList(200, [])).toBe("unavailable");
    expect(classifyMeliItemsList(404, null)).toBe("unavailable");
  });

  it("mantém ativo quando há ofertas na lista", () => {
    expect(classifyMeliItemsList(200, [{ item_id: "MLB1" }])).toBe("active");
  });

  it("aceita 206 (conteúdo parcial) como resposta válida da API", () => {
    expect(classifyMeliItemsList(206, [{ item_id: "MLB1" }])).toBe("active");
    expect(classifyMeliProduct(206, { status: "active" })).toBe("active");
    expect(classifyMeliItem(206, { status: "active", available_quantity: 2 })).toBe("active");
  });

  it("trata erro de API como desconhecido", () => {
    expect(classifyMeliItemsList(429, null)).toBe("unknown");
    expect(classifyMeliItemsList(200, null)).toBe("unknown");
  });
});

describe("shouldAbortRevalidation", () => {
  it("aborta quando mais de 30% dos verificados ficaram indisponíveis", () => {
    expect(shouldAbortRevalidation(100, 31)).toBe(true);
  });

  it("segue gravando quando 30% ou menos ficaram indisponíveis", () => {
    expect(shouldAbortRevalidation(100, 30)).toBe(false);
  });

  it("não aborta sem itens verificados", () => {
    expect(shouldAbortRevalidation(0, 0)).toBe(false);
  });
});

describe("itemIdFromErrorBody", () => {
  it("extrai o id do item da mensagem de erro do multiget", () => {
    expect(itemIdFromErrorBody({ message: "Item with id MLB2345678901 not found" })).toBe("MLB2345678901");
  });

  it("devolve null quando a mensagem não traz id", () => {
    expect(itemIdFromErrorBody({ message: "unexpected error" })).toBeNull();
    expect(itemIdFromErrorBody(null)).toBeNull();
  });
});
