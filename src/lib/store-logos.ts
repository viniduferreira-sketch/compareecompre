const assets = import.meta.glob<{ url: string }>("/src/assets/stores/*.asset.json", { eager: true, import: "default" });

const OFFICIAL_LOGOS: Array<{ names: string[]; file: string; inverse?: boolean }> = [
  { names: ["mercado livre"], file: "mercado-livre.png" },
  { names: ["kabum", "kabum!", "kabum br"], file: "kabum.svg" },
  { names: ["nike", "nike br"], file: "nike.svg" },
  { names: ["reserva"], file: "reserva.svg" },
  { names: ["shopee", "shopee brasil", "shopee br"], file: "shopee.png" },
  { names: ["promo farma", "promofarma"], file: "promo-farma.svg" },
  { names: ["anhanguera ferramentas"], file: "anhanguera.svg", inverse: true },
  { names: ["amakha paris"], file: "amakha-paris.png" },
  { names: ["noble nature"], file: "noble-nature.svg" },
  { names: ["candide"], file: "candide.png" },
  { names: ["livrarias curitiba"], file: "livrarias-curitiba.svg" },
  { names: ["lojao dos esportes"], file: "lojao-esportes.png" },
  { names: ["amoedo"], file: "amoedo.png" },
  { names: ["friopecas"], file: "friopecas.png" },
  { names: ["little duck"], file: "little-duck.png" },
  { names: ["vapza alimentos", "vapza"], file: "vapza.svg" },
];

const normalize = (name: string) => name.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function officialStoreLogo(store: string) {
  const name = normalize(store);
  const entry = OFFICIAL_LOGOS.find((item) => item.names.includes(name));
  const url = entry && assets[`/src/assets/stores/${entry.file}.asset.json`]?.url;
  return url ? { url, inverse: entry?.inverse ?? false } : null;
}