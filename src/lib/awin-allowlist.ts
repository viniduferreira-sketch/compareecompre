import { normalizePolicyText } from "./content-policy";

/** O sufixo de país não diferencia o mesmo anunciante (KaBuM = Kabum BR). */
export function normalizeAwinMerchantName(value: string): string {
  return normalizePolicyText(value).replace(/\s+br$/, "");
}

export function isAwinMerchantAllowed(merchantName: string, allowedMerchants: readonly string[]): boolean {
  const merchant = normalizeAwinMerchantName(merchantName);
  return Boolean(merchant) && allowedMerchants.some((allowed) => normalizeAwinMerchantName(allowed) === merchant);
}
