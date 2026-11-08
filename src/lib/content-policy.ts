/** Única lista de termos do bloqueio permanente de conteúdo adulto. */
export const ADULT_CONTENT_TERMS = [
  "sex shop",
  "sex toy",
  "erótico",
  "adulto",
  "vibrador",
  "consolador",
  "fetiche",
] as const;

export const ADULT_CONTENT_REASON = "conteúdo adulto";
export const MERCHANT_NOT_ALLOWED_REASON = "anunciante não permitido";

export function normalizePolicyText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const NORMALIZED_ADULT_TERMS = ADULT_CONTENT_TERMS.map(normalizePolicyText);

function stringHasAdultTerm(value: string): boolean {
  const normalized = normalizePolicyText(value);
  return NORMALIZED_ADULT_TERMS.some((term) => normalized.includes(term));
}

/** Examina textos, listas e objetos de parceiros sem exigir um formato comum. */
export function hasAdultContent(...values: unknown[]): boolean {
  const visit = (value: unknown): boolean => {
    if (typeof value === "string") return stringHasAdultTerm(value);
    if (Array.isArray(value)) return value.some(visit);
    if (value && typeof value === "object") return Object.values(value).some(visit);
    return false;
  };
  return values.some(visit);
}
