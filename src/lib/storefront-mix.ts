// Partner-agnostic helpers: map partner category labels onto the site's seven
// categories and interleave offers so home rails show every active store.

export const SITE_CATEGORIES = ["Eletrônicos", "Moda", "Casa", "Celulares", "Games", "Beleza", "Esportes"] as const;
export type SiteCategory = (typeof SITE_CATEGORIES)[number];

// Order matters: more specific niches are checked first.
const RULES: Array<[SiteCategory, RegExp]> = [
  ["Celulares", /\b(celular(es)?|smartphones?|mobile phones?|telefon(e|ia) m[oó]vel|iphone)\b/i],
  ["Games", /\b(games?|video ?games?|consoles?|gaming|playstation|xbox|nintendo|jogos?)\b/i],
  ["Beleza", /\b(beleza|beauty|perfum(e|aria|es)?|fragrances?|cosm[eé]tic|makeup|maquiagem|skin ?care|cabelo|hair care)\b/i],
  ["Esportes", /\b(esportes?|sports?|fitness|ciclismo|cycling|bicicletas?|academia|camping|outdoor)\b/i],
  ["Moda", /\b(moda|fashion|vestu[aá]rio|clothing|apparel|roupas?|cal[cç]ados?|shoes|footwear|camisas?|camisetas?|t-shirts?|shirts?|vestidos?|dresses|cal[cç]as|trousers|jeans|jaquetas?|jackets?|bermudas?|shorts|polos?|blusas?|tops|underwear|lingerie|swimwear|moda praia|bolsas?|handbags|acess[oó]rios de moda)\b/i],
  ["Casa", /\b(casa|home|kitchen|cozinha|m[oó]veis|furniture|decor(a[cç][aã]o)?|eletrodom[eé]sticos?|appliances?|bedding|cama|banho|jardim|garden|lighting|ilumina[cç][aã]o)\b/i],
  ["Eletrônicos", /\b(eletr[oô]nicos?|electronics?|hardware|computers?|computador(es)?|inform[aá]tica|notebooks?|laptops?|memory|mem[oó]ria|software|headphones?|fones?|audio|[aá]udio|stereos?|amplifiers?|receivers?|dj equipment|input devices|keyboards?|teclados?|mouses?|cables?|power supplies|computer components|streaming media|tvs?|televis|monitores?|monitors?|c[aâ]meras?|cameras?|tablets?)\b/i],
];

/** Maps a partner category label onto one site category, or null when it fits none. */
export function toSiteCategory(rawCategory: string | null | undefined): SiteCategory | null {
  const value = (rawCategory ?? "").trim();
  if (!value) return null;
  const exact = SITE_CATEGORIES.find((name) => name.localeCompare(value, "pt-BR", { sensitivity: "base" }) === 0);
  if (exact) return exact;
  return RULES.find(([, pattern]) => pattern.test(value))?.[0] ?? null;
}

/** Deterministic shuffle so rotation changes per seed (e.g. per hour) without flicker inside one. */
function seededShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  let state = seed >>> 0 || 1;
  for (let i = copy.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

/** Round-robin across stores (store order rotates with the seed), capped at `limit`. */
export function interleaveByStore<T extends { store: string; id: string }>(groups: T[][], limit: number, seed: number): T[] {
  const lists = seededShuffle(groups.filter((group) => group.length > 0).map((group) => seededShuffle(group, seed)), seed);
  const result: T[] = [];
  const seen = new Set<string>();
  for (let index = 0; result.length < limit && lists.some((list) => index < list.length); index++) {
    for (const list of lists) {
      const offer = list[index];
      if (!offer || seen.has(`${offer.store}-${offer.id}`)) continue;
      seen.add(`${offer.store}-${offer.id}`);
      result.push(offer);
      if (result.length >= limit) break;
    }
  }
  return result;
}
