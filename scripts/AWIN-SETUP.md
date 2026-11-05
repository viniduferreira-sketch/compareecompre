# Awin ingestion

The workflow `.github/workflows/awin-import.yml` runs every six hours and can be dispatched from `/admin`. GitHub scheduled runs may be delayed. Mercado Livre's existing schedule is unchanged.

## Activation

1. Publish the app so `https://compareecompre.com/api/public/awin/import` runs the new handler.
2. Confirm this source and workflow are synchronized to the `main` branch of `viniduferreira-sketch/compareecompre`. GitHub requires permission to write workflow files; if repository sync refuses that permission, authorize workflow access in the GitHub connection.
3. Sign in at `/auth` using the authorized administrator account, then open `/admin` and click **Sincronizar catálogo**.
4. Verify the run in GitHub Actions and the completed import in `/admin`.

The feed URL is held only in the Lovable Cloud secret `AWIN_FEED_URL`. No provider secret or database service key is copied into GitHub. Each request obtains a short-lived GitHub OIDC identity, verified for issuer, audience, repository, workflow and main branch before writes or feed configuration access.

The processor streams gzip/CSV and submits batches of 100. The database stores normalized records in `partner_catalog` before Algolia upserts into `produtos_mercado_livre`; its existing price replicas receive those offers automatically. A failed batch can retry with the same identifiers. Import batch totals count processed unique IDs per batch, not necessarily the final number of distinct products across a feed.

Only confirmed out-of-stock rows become unavailable. Missing rows, failed downloads and partial runs never delete products. Awin has a separate adapter and qualified IDs; no Awin records are sent to Mercado Livre APIs. Missing Q&A and price history remain absent.

## Verification completed during implementation

- Feed download returned HTTP 200; 100 real CSV rows were parsed, 98 normalized successfully.
- Unit tests cover numeric mapping, stock, IDs, affiliate links, absent data and workflow restrictions.
- Signed-out `/admin` redirects to `/auth`; unauthenticated import calls return 401.
- Home still displays products with the existing design.

A complete authenticated GitHub-to-app ingestion has not run before publication. The authorized account does not yet exist in the app: its first confirmed sign-in creates the administrative role through the protected email allowlist.