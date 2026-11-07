# Roadmap — Revalidação Mercado Livre

- [x] Confirmar endpoint/limite do multiget ML (20 IDs; bloqueado 403 p/ nosso token — uso de /products + /items do produto)
- [x] src/lib/ml-revalidate.ts (classificação pura + disjuntor) + testes
- [x] src/lib/ml-revalidate.server.ts (browse Algolia, verificação direta, gravação, catalog_imports)
- [x] sync-offers.server.ts: revalidação após sync; item_id corrigido; status filtrável nas réplicas
- [x] offer-freshness.ts: ML_STRICT_FRESHNESS (false)
- [x] search-offers.ts: NOT status:unavailable nas capas de categoria
- [x] product-detail + produto.$id.tsx: aviso de indisponível com link da categoria
- [x] admin: botões "Revalidar ML (simulação)" e "Revalidar ML"
- [x] Testes + validação Playwright + commit
