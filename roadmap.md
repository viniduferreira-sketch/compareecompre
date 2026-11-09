# Roadmap — Filtro de qualidade Mercado Livre

## Redesenho administrativo (pedido atual; sem importar/sincronizar/apagar)
- [x] Correções atuais: popularidade visível sem aguardar varredura; cupons sem ações duplicadas. Valores Awin eram kabum/Nike (criados 03:55:49/03:56:00 UTC), restaurados Kabum BR/Nike BR. Simulação autenticada atual: KaBuM 791/Nike 500 (não 789; feed atual). Lomadee 01:16:12 sem ator/origem persistidos, autoria não comprovável.
- [x] Etapa 2 A: partner_stores e RLS EXISTS user_roles aplicadas isoladamente, existência confirmada. B: SELECT CTE agregado validado e informado antes da inserção; 31 Lomadee habilitadas e 3 Awin (KaBuM/Nike habilitadas, Lauri não). Cadastro preenchido separado, produtos intactos.
- [x] Etapa 2: controles Importar/Exibir/Regras, URL da logo sem buckets/upload, iniciais, identidade pública segura e filtros. Lomadee: 132 lojas (119 autorizadas), 101 sem produtos; 101 cadastros adicionados apenas lendo a rede, 131 logos de origem e nenhuma descrição fornecida. Awin: KaBuM/Nike/Lauri existentes; Monsterpub bloqueada, Reserva sem ID/inscrição confirmados adicionados. Mercado Livre cadastrado. Visibilidade em lotes de 500 com prévia e retomada na sessão; preserva qualidade/status. Edição real salva e relida; nenhum produto ocultado/importado por esta tarefa.
- [x] Etapa 1: sete páginas, menu fixo/gaveta, mesmas ações e confirmações, histórico dez por fonte; navegador autenticado sem erros e 33 testes passaram. Nenhuma importação acionada.
- [x] Erro 42803 resolvido: criação isolada e preenchimento separado com CTE agregado e verificação da allowlist por campo escalar.
- [x] Etapa 3: indicadores e gráficos reais, cache de 5 minutos e Atualizar; cliques por dia/loja/produto; 87 cupons com busca/validade/contagens. Navegador autenticado validou parceiros, filtros, edição, visão geral, cliques, cupons e carrossel público; mobile sem overflow. 28 testes passaram. Sem importação/sincronização/exclusão acionada; rotinas agendadas existentes continuaram normalmente. Logos Awin/ML e descrições permanecem manuais; nenhuma logo nova anexada neste pedido. Ocultar/exibir implementado e testado em lógica, não executado contra produtos reais para preservar visibilidade atual.

## Popularidade e catálogo amplo (sem importação)
- [x] Etapa 1 parcial: pontuação centralizada e integrada nos três syncs/revalidação, botão autenticado de recálculo somente de score; 7454 registros recalculados e distribuição conferida; 15 testes passaram.
- [x] Retomada: erro original reproduzido na leitura GET /rest/v1/partner_catalog com query de 28705 caracteres: HTTP 400, corpo de resposta literal Bad Request, corpo enviado vazio. Algolia browse funciona. customRanking isolado aplicado; réplicas de preço intactas.
- [ ] Agrupamento interrompido: gravação em lotes de 100 excedeu timeout de 309s; 4900 group_key gravadas, sem mudar visibilidade. attributeForDistinct continua null; distinct não ativado. Nike feed 6115 linhas/2887 grupos por título, KaBuM 4812/4810 títulos (apenas 2 duplicações; singleton por segurança).
- [ ] Etapa 2 não iniciada: depende da conclusão da etapa 1; regras Awin e filtros de qualidade permanecem inalterados.
- [ ] Buscas iphone/tênis/ssd e simulação das novas regras não executadas: interrompidas conforme pedido após timeout do agrupamento.

## Ajuste Awin e diagnóstico Lomadee
- [x] Exclusões de categoria por loja, editáveis no admin; KaBuM preenchida com os oito termos. Nove regressões reproduzidas e corrigidas; 22 testes Awin passaram.
- [x] Diagnóstico somente leitura: execução Lomadee 20:20 UTC teve 100 invalid_price; nova leitura da mesma página 6 da ECO FLAME GARDEN retornou 100 com price=0 e listPrice positivo. Não há snapshot histórico para provar igualdade linha a linha.
- [x] Simulação Awin autenticada sem importação: 10.944 linhas; KaBuM 812 aceitos/4.017 categoria; Nike 500 aceitos/1.808 categoria/3.807 limite.

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
- [x] Etapa 3: botão admin e simulação real sem gravações (19:39 UTC): 5.713 avaliados, 2.960 aprovados, 2.753 rejeitados (2.656 anunciante não aprovado, 31 indisponíveis, 66 imagem), 1.631 sem categoria; 0 GTINs em 2+ lojas. Relatório Awin/Lomadee/identificadores conferido; 67 testes e UI validados. Aguardar OK separado para qualquer botão Aplicar

## Proteção da importação (antes da etapa 3)
- [x] Allowlist Awin editável no /admin, inicialmente somente KaBuM (reconhece Kabum BR); demais anunciantes descartados como "anunciante não permitido"
- [x] Bloqueio permanente de conteúdo adulto nas três fontes, com termos centralizados e motivo "conteúdo adulto"; moeda BRL preservada
- [x] Auditoria somente leitura: 18 registros pela regra literal (6 ML, 0 Awin, 12 Lomadee), 15 exemplos apresentados; nenhum registro escondido, apagado ou reindexado
- [x] 28 testes aprovados, typecheck/build limpos e edição administrativa validada no navegador; etapa 3 não iniciada

## Correção dos falsos positivos de conteúdo adulto
- [x] Removidos adulto, vibrador e consolador; comparação por palavras/expressões inteiras e prioridade loja bloqueada (Monsterpub), categoria e título
- [x] 50 testes aprovados; auditoria somente leitura de 7.191 registros: 0 bloqueados em todas as fontes, sem exemplos; nada apagado, escondido, reindexado ou publicado
