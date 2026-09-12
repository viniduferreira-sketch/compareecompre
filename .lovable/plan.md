# Corrigir lógica da busca do Mercado Livre

## Objetivo
Fazer paginação, ordenação e filtros refletirem diretamente cada resposta da API, sem alterar o visual geral da página.

## Implementação
- Centralizar a montagem dos parâmetros da busca com `limit=40` e `offset=(página-1)*40`.
- Enviar `sort=price_asc` ou `sort=price_desc` somente nas opções correspondentes; omitir `sort` para relevância.
- Garantir que página e ordenação façam parte da chave da consulta e provoquem uma nova chamada, sem recorte local dos resultados.
- Renderizar exatamente os itens devolvidos pela resposta atual e usar `paging.total`, `paging.offset` e `paging.limit` na paginação.
- Mapear `available_filters` em grupos com `name` e listas de valores no formato `Nome (Resultados)`.
- Manter os filtros apenas informativos nesta etapa, removendo ações que alterem a consulta.
- Evitar manter dados da consulta anterior enquanto uma nova página ou ordenação estiver carregando.

## Validação
- Confirmar que a primeira requisição envia `limit=40&offset=0`.
- Confirmar que a página 2 envia `offset=40` e troca o conjunto exibido.
- Confirmar as três URLs de ordenação e a atualização dos produtos.
- Confirmar que a lateral usa os filtros retornados pela resposta atual.
