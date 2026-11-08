import { getAlgoliaIndexingConfig } from "./algolia-indexing.server";
import { lomadeeRequests } from "./lomadee-client.server";
import type { LomadeeBrand } from "./lomadee-catalog";
import { countIdentifiers, type IdentifierCounts } from "./product-identifiers";
import {
  countSharedGtins,
  evaluatePartnerQualityRecords,
  type PartnerQualityRecord,
  type PartnerQualityResult,
} from "./partner-quality";

export type PartnerQualitySimulation = PartnerQualityResult & {
  identifierCounts: IdentifierCounts;
  allSourcesSharedGtins: number;
  allSourcesRecordsWithSharedGtin: number;
};

type BrandPage = {
  data?: Array<LomadeeBrand & { id: string }>;
  pagination?: { totalPages?: number };
  meta?: { totalPages?: number };
};

/** Somente GETs das lojas do canal; não usa o encurtador nem a sincronização. */
async function listAuthorizedLomadeeStores(): Promise<string[]> {
  const requests = lomadeeRequests(20);
  const authorized = new Set<string>();
  for (let page = 1; requests.remaining > 0; page += 1) {
    const json = await requests.call<BrandPage>(`/affiliate/brands?limit=20&page=${page}`);
    for (const brand of json.data ?? []) {
      if (brand.network?.active !== false && brand.channels?.some((channel) => channel.shortUrls?.length)) authorized.add(brand.name);
    }
    if (page >= (json.meta?.totalPages ?? json.pagination?.totalPages ?? 1)) break;
  }
  return [...authorized];
}

/** Lê o índice e as autorizações; não grava records, settings, jobs, cursores ou histórico. */
export async function evaluatePartnerQuality(awinAllowedMerchants: readonly string[]): Promise<PartnerQualitySimulation> {
  const lomadeeAuthorizedStores = await listAuthorizedLomadeeStores();
  const { client, indexName } = getAlgoliaIndexingConfig();
  const all: PartnerQualityRecord[] = [];
  await client.browseObjects<PartnerQualityRecord>({
    indexName,
    browseParams: {
      hitsPerPage: 1000,
      attributesToRetrieve: [
        "objectID", "source", "title", "price", "affiliateUrl", "imageUrl", "store",
        "status", "inStock", "gtin", "brand", "model", "categoryName",
      ],
    },
    aggregator: (batch) => { all.push(...batch.hits); },
  });
  const partnerRecords = all.filter((record) => record.source === "awin" || record.source === "lomadee");
  const result = evaluatePartnerQualityRecords(partnerRecords, { awinAllowedMerchants, lomadeeAuthorizedStores });
  const shared = countSharedGtins(all);
  return {
    ...result,
    identifierCounts: countIdentifiers(all),
    allSourcesSharedGtins: shared.gtins,
    allSourcesRecordsWithSharedGtin: shared.records,
  };
}
