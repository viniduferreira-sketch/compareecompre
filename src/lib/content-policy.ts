/** Listas editáveis do bloqueio de conteúdo adulto. Use somente sinais inequívocos. */
export const ADULT_CONTENT_TERMS = [
  "sex shop",
  "sexshop",
  "sex toy",
  "sextoy",
  "erótico",
  "erótica",
  "eróticos",
  "eróticas",
  "masturbador",
  "masturbadores",
  "estimulador sexual",
  "estimuladores sexuais",
  "lubrificante íntimo",
  "lubrificantes íntimos",
  "plug anal",
  "plugs anais",
  "fetiche",
  "fetiches",
  "bondage",
  "pornô",
  "pornografia",
] as const;

export const BLOCKED_ADULT_STORES = ["Monsterpub"] as const;

export const ADULT_CONTENT_REASON = "conteúdo adulto";
export const MERCHANT_NOT_ALLOWED_REASON = "anunciante não permitido";

export type AdultContentMatch = {
  matchedBy: "store" | "category" | "title";
  term: string;
};

export function normalizePolicyText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function flattenedStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(flattenedStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(flattenedStrings);
  return [];
}

/** Compara palavras ou expressões inteiras após normalizar caixa, acentos e pontuação. */
function findWholeTerm(value: unknown, terms: readonly string[]): string | null {
  for (const text of flattenedStrings(value)) {
    const normalizedText = ` ${normalizePolicyText(text)} `;
    for (const term of terms) {
      if (normalizedText.includes(` ${normalizePolicyText(term)} `)) return term;
    }
  }
  return null;
}

/** Prioridade: loja/anunciante bloqueado, categoria adulta e, por último, título. */
export function getAdultContentMatch(signals: {
  store?: unknown;
  category?: unknown;
  title?: unknown;
}): AdultContentMatch | null {
  const store = findWholeTerm(signals.store, BLOCKED_ADULT_STORES);
  if (store) return { matchedBy: "store", term: store };
  const category = findWholeTerm(signals.category, ADULT_CONTENT_TERMS);
  if (category) return { matchedBy: "category", term: category };
  const title = findWholeTerm(signals.title, ADULT_CONTENT_TERMS);
  if (title) return { matchedBy: "title", term: title };
  return null;
}

export function describeAdultContentMatch(match: AdultContentMatch): string {
  if (match.matchedBy === "store") return `Loja/anunciante bloqueado: ${match.term}`;
  if (match.matchedBy === "category") return `Categoria adulta: ${match.term}`;
  return `Termo adulto no título: ${match.term}`;
}
