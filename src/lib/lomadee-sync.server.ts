import { getAlgoliaIndexingConfig, ensureIdentifierFacets } from "./algolia-indexing.server";
import { lomadeeObjectId, normalizeLomadeeProduct, lomadeeDiscardReason, type LomadeeBrand, type LomadeeProduct, type NormalizedLomadeeProduct } from "./lomadee-catalog";
import { addDiscard, type DiscardReasons } from "./import-discards";
import { lomadeeRequests } from "./lomadee-client.server";
import { prioritizedMerchants, readLomadeeCursor } from "./lomadee-cursor";
import { normalizeLomadeeCoupon, type LomadeeCampaign } from "./coupons";
import { enrichPopularity } from "./popularity.server";
import { applyStoreDisplay } from "./partner-stores";

type Page<T> = { data?: T[]; pagination?: { totalPages?: number }; meta?: { totalPages?: number } };

export async function runLomadeeSync(options: { couponsOnly?: boolean } = {}): Promise<{ id: string; indexed: number; coupons: number; skipped: number; nextPage: number; emptyStores: string[] }> {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  await db.from("catalog_imports").update({ status: "failed", error: "Execução interrompida; solicite novamente." })
    .eq("source", "lomadee").in("status", ["queued", "running"]).lt("updated_at", new Date(Date.now() - 5 * 60_000).toISOString());
  const last = await db.from("catalog_imports").select("sync_cursor").eq("source", "lomadee").not("sync_cursor", "is", null)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (last.error) throw new Error("Não foi possível ler a continuação da Lomadee.");
  const cursor = readLomadeeCursor(last.data?.sync_cursor);
  const { data: job, error } = await db.from("catalog_imports").insert({ source: "lomadee", status: "running" }).select("id").single();
  if (error || !job) throw new Error("Já existe uma sincronização da Lomadee em andamento.");
  let indexed = 0, skipped = 0, coupons = 0;
  const reasons: DiscardReasons = {};
  const emptyStores: string[] = [];
  try {
    const requests = lomadeeRequests(40);
    const brands = new Map<string, LomadeeBrand>();
    for (let page = 1; requests.remaining > 0; page += 1) {
      const json = await requests.call<Page<LomadeeBrand & { id: string }>>(`/affiliate/brands?limit=20&page=${page}`);
      for (const brand of json.data ?? []) brands.set(brand.id, brand);
      if (page >= (json.meta?.totalPages ?? json.pagination?.totalPages ?? 1)) break;
    }
    const now = new Date().toISOString();
    const couponPages = options.couponsOnly ? requests.remaining : Math.min(4, requests.remaining);
    for (let n = 0; n < couponPages; n += 1) {
      const json = await requests.call<Page<LomadeeCampaign>>(`/affiliate/campaigns?limit=20&page=${cursor.couponPage}&types=GenericCoupon,PersonalCoupon&status=onTime`);
      const campaigns = json.data ?? [];
      const ready = campaigns.flatMap((c) => { const r = normalizeLomadeeCoupon(c, brands.get(c.organizationId ?? ""), now); return r ? [r] : []; });
      if (ready.length) {
        const saved = await db.from("partner_coupons").upsert(ready, { onConflict: "id" });
        if (saved.error) throw new Error("Não foi possível salvar os cupons da Lomadee.");
        coupons += ready.length;
      }
      const rejected = campaigns.filter((c) => !ready.some((r) => r.id === `lomadee-${c.organizationId}-${c.id}`)).map((c) => `lomadee-${c.organizationId}-${c.id}`);
      if (rejected.length) {
        const update = await db.from("partner_coupons").update({ status: "unavailable" }).in("id", rejected).eq("source", "lomadee");
        if (update.error) throw new Error("Não foi possível atualizar a validade dos cupons.");
      }
      const pages = json.meta?.totalPages ?? json.pagination?.totalPages;
      cursor.couponPage = (pages ? cursor.couponPage >= pages : campaigns.length < 20) ? 1 : cursor.couponPage + 1;
      if (cursor.couponPage === 1) break;
    }
    if (!options.couponsOnly) {
      await ensureIdentifierFacets();
      const controls = await db.from("partner_stores").select("network,external_id,merchant_name,import_enabled,display_enabled").eq("network", "lomadee");
      if (controls.error) throw new Error("Não foi possível conferir os controles das lojas Lomadee.");
      const merchants = prioritizedMerchants([...brands].filter(([id, b]) => b.network?.active !== false && b.channels?.some((c) => c.shortUrls?.length) && !(controls.data ?? []).some((store) => store.external_id === id && !store.import_enabled)).map(([id, brand]) => ({ id, ...brand })));
      let start = Math.max(0, merchants.findIndex((m) => m.id === cursor.merchantId));
      const { client, indexName } = getAlgoliaIndexingConfig();
      for (let visited = 0; visited < merchants.length && requests.remaining > 0; visited += 1) {
        const merchant = merchants[(start + visited) % merchants.length];
        if (!merchant) break;
        const position = cursor.products[merchant.id] ?? { page: 1, offset: 0 };
        const json = await requests.call<Page<LomadeeProduct>>(`/affiliate/products?limit=100&page=${position.page}&isAvailable=true&organizationIds=${encodeURIComponent(merchant.id)}`);
        const products = json.data ?? [];
        if (!products.length) emptyStores.push(merchant.name);
        const ids = products.map(lomadeeObjectId).filter((id): id is string => Boolean(id));
        const existing = new Map<string, { productUrl?: string; affiliateUrl?: string }>();
        if (ids.length) {
          const rows = await db.from("partner_catalog").select("object_id,record").in("object_id", ids);
          if (rows.error) throw new Error("Não foi possível ler os links de afiliado existentes.");
          for (const row of rows.data ?? []) existing.set(row.object_id, row.record as { productUrl?: string; affiliateUrl?: string });
        }
        const ready: NormalizedLomadeeProduct[] = [];
        let offset = Math.min(position.offset, products.length), linkCalls = 0;
        for (; offset < products.length; offset += 1) {
          const product = products[offset];
          if (!product || product.organizationId !== merchant.id) { skipped += 1; addDiscard(reasons, "merchant_mismatch"); continue; }
          const id = lomadeeObjectId(product);
          const reason = lomadeeDiscardReason(product, merchant, "https://lmdee.link/check");
          if (!id || reason) { skipped += 1; addDiscard(reasons, reason ?? "invalid_id"); continue; }
          const previous = existing.get(id);
          let link = previous && previous.productUrl === product.url ? previous.affiliateUrl ?? null : null;
          if (!link) {
            if (requests.remaining <= 0 || linkCalls >= 4) break;
            linkCalls += 1;
            const channels = await requests.call<Array<{ shortUrls?: string[] | null }>>("/affiliate/shortener/url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId: merchant.id, type: "Custom", url: product.url }) });
            link = channels.flatMap((c) => c.shortUrls ?? [])[0] ?? null;
          }
          const record = normalizeLomadeeProduct(product, merchant, link, now);
          if (record) ready.push(record); else { skipped += 1; addDiscard(reasons, lomadeeDiscardReason(product, merchant, link) ?? "invalid_affiliate_url"); }
        }
        if (ready.length) {
          const enriched = applyStoreDisplay(await enrichPopularity(ready), controls.data ?? []);
          const saved = await db.from("partner_catalog").upsert(enriched.map((record) => ({ object_id: record.objectID, source: "lomadee", record, last_synced_at: now })), { onConflict: "object_id" });
          if (saved.error) throw new Error("Falha ao salvar produtos da Lomadee.");
          await client.saveObjects({ indexName, objects: enriched, waitForTasks: true, batchSize: 100 });
          indexed += ready.length;
        }
        const pages = json.meta?.totalPages ?? json.pagination?.totalPages;
        cursor.products[merchant.id] = offset < products.length ? { page: position.page, offset } : { page: (pages ? position.page >= pages : products.length < 100) ? 1 : position.page + 1, offset: 0 };
        cursor.merchantId = merchants[(start + visited + 1) % merchants.length]?.id;
        const checkpoint = await db.from("catalog_imports").update({ sync_cursor: JSON.parse(JSON.stringify(cursor)), updated_at: new Date().toISOString() }).eq("id", job.id);
        if (checkpoint.error) throw new Error("Falha ao salvar continuação da importação.");
      }
    }
    const batch = await db.from("catalog_import_batches").upsert({ import_id: job.id, batch: 0, indexed, skipped, discard_reasons: reasons });
    if (batch.error) throw new Error("Falha ao registrar resultado da importação.");
    const result = await db.from("catalog_imports").update({ status: "completed", sync_cursor: JSON.parse(JSON.stringify(cursor)), next_page: cursor.couponPage, finished_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", job.id);
    if (result.error) throw new Error("Falha ao concluir importação.");
    console.info("Lomadee sync completed", { indexed, coupons, skipped, emptyStores });
    return { id: job.id, indexed, coupons, skipped, nextPage: cursor.couponPage, emptyStores };
  } catch (e) {
    await db.from("catalog_import_batches").upsert({ import_id: job.id, batch: 0, indexed, skipped, discard_reasons: reasons });
    await db.from("catalog_imports").update({ status: "failed", sync_cursor: JSON.parse(JSON.stringify(cursor)), error: e instanceof Error ? e.message.slice(0, 300) : "Falha na sincronização.", finished_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", job.id);
    throw e;
  }
}
