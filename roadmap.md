# Roadmap — Filtro de qualidade Mercado Livre

- [x] Sondar API: /users/{id} e /highlights/MLB/category/{id} funcionam; sold_quantity NÃO existe em nenhum payload
- [x] src/lib/ml-quality.ts (ML_QUALITY_CONFIG + regras puras) + 16 testes
- [x] src/lib/ml-quality.server.ts (avaliação: vendedor, procura, preço vs mediana, duplicidade; dry-run)
- [x] admin: botão "Qualidade ML (simulação)" com contagens, motivos e listas
- [x] Simulação real: 396 avaliados, 49 aprovados, 347 rejeitados; Galaxy A23 (MLB19602360) rejeitado por "vendedor sem reputação"
- [x] Front-end: filtro NOT quality_status:"rejected" nas buscas; selo fixo removido (Loja oficial / vendedor condicionais)
- [ ] Aguardar confirmação do usuário → botão "Aplicar qualidade ML" (grava quality_status/reason/checked_at) + integração no sync e na revalidação

## Preparação para comparar preços entre lojas
- [x] Etapa 1: preservar GTIN/modelo nos três parceiros, filtros aditivos no Algolia e contagens por parceiro no /admin (35 testes; contagens autenticadas conferidas; campos serão preenchidos nas próximas importações/revalidações, sem executar alterações de disponibilidade)
- [x] Etapa 2: feed atual lido (279 linhas: 267 KaBuM + 12 Monsterpub/USD; zero celulares), seleção integral confirmada; motivos por lote e /admin implementados e testados sem importar produtos. Histórico não guarda motivos individuais nem snapshot do feed; não é possível provar os 12 históricos linha a linha.
- [ ] Etapa 3: simulação de qualidade Awin/Lomadee — aguarda etapa 2 e OK do usuário
