import { z } from "zod";
import { normalizeAwinMerchantName } from "./awin-allowlist";

export const logoUrlSchema = z.string().trim().max(2000).refine((value) => {
  if (!value) return true;
  if (/^\/logos\/[a-z0-9_-]+\.(png|webp|jpg|jpeg)$/.test(value)) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}, "Use uma URL HTTPS de imagem ou um caminho /logos/ válido.");
export const storeEditSchema = z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(200), logo_url: logoUrlSchema, description: z.string().trim().max(2000), notes: z.string().trim().max(2000) });
export type StoreControl = { network: string; external_id: string; merchant_name: string; import_enabled: boolean; display_enabled: boolean };
export function storeMatches(store: StoreControl, record: { source?: string | undefined; store?: string | undefined; merchant_id?: string | undefined; organizationId?: string | undefined }) {
  return record.source === store.network && (record.store === store.merchant_name || store.network === "awin" && normalizeAwinMerchantName(record.store ?? "") === normalizeAwinMerchantName(store.merchant_name) || record.merchant_id === store.external_id || record.organizationId === store.external_id);
}
export function applyStoreDisplay<T extends { source?: string; store?: string; merchant_id?: string; organizationId?: string }>(records: T[], stores: StoreControl[]) {
  return records.map((record) => ({ ...record, site_hidden: stores.some((store) => storeMatches(store, record) && !store.display_enabled) }));
}