/** Public feed aliases are normalized at the storefront boundary, not per component. */
export type StorefrontRecord = {
  store?: string;
  merchant_name?: string;
  loja?: string;
  storeLogoUrl?: string | null;
  merchant_logo?: string | null;
  store_logo?: string | null;
  affiliateUrl?: string;
  aw_deep_link?: string;
  source?: string;
};

export function storefrontIdentity(record: StorefrontRecord) {
  const store = [record.store, record.merchant_name, record.loja].find((value) => value?.trim())?.trim() ?? "Loja parceira";
  const storeLogoUrl = [record.storeLogoUrl, record.merchant_logo, record.store_logo].find((value) => value?.startsWith("https://")) ?? null;
  const affiliateUrl = record.source === "awin"
    ? record.aw_deep_link || record.affiliateUrl || ""
    : record.affiliateUrl || record.aw_deep_link || "";
  return { store, storeLogoUrl, affiliateUrl };
}