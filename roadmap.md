# Roadmap — Filtro de qualidade Mercado Livre

## Home com exatamente três vitrines (sem importações)
- [ ] Manter somente Mais buscados (mínimo R$ 50), Cozinha e Games, nesta ordem, com 12 cartões e seis por vez no desktop.
- [ ] Ocultar reversivelmente as demais vitrines e limitar a ativação administrativa a três no total, incluindo Mais buscados.
- [ ] Games em todas as categorias, termos OU, mínimo R$ 150, exclusões, quatro por loja e Ver todos em “gamer”; validar regras, navegador e build sem importações.

## Ajustes das vitrines temáticas (sem importações)
- [x] Reuso de ProductRail, setas e Ver todos no topo, loja abaixo do preço e remoção de cartões com foto ausente/quebrada também nas três vitrines existentes; mesma verificação antes/depois confirmou zero placeholders.
- [x] Definições Games, Casa, R$ 20–100 e Nike/Adidas; termos OU, deduplicação por imagem/título e quatro por loja esportiva intercalados. Games tem somente três candidatos (dois headsets e um suporte) e continua oculta; não há teclados/mouses visíveis classificados em Games.
- [x] Edição administrativa expandida; 16 testes, SSR, persistência/restauração e 390 px sem overflow. Casa 4, Achados 8, Nike/Adidas 8; sem importações. A busca não tem preço na URL: Ver todos de Achados abre busca geral por popularidade.

## Vitrines temáticas da home (sem importações)
- [x] Cadastro das quatro vitrines, leitura pública de ativas e edição administrativa confirmada em /admin/vitrines.
- [x] Uma multi-query com chave pública, seleção popular com até oito produtos e três por loja; primeiro carrossel SSR, demais montados por proximidade sem repetir consultas.
- [x] Doze testes passaram; HTML inicial HTTP 200, carrosséis, edição persistida/restaurada e celular de 390 px sem overflow verificados. Esportes (8) e Celulares (6) aparecem; Games e Casa ficam ocultas por não atingirem quatro produtos elegíveis. Sem importações.

## Produtos relacionados na página de produto
- [x] Alternativas: categoria, preço 70–130% com ampliação, exclusão de variantes, popularidade e duas ofertas por marca.
- [x] Mais na categoria: oito ofertas sem repetição de produto/grupo, carregamento por proximidade, cards existentes e carrossel no celular.
- [x] Sete testes; produto real exibiu 4 alternativas e 8 da categoria, sem repetição; clique interno validado. Cliques internos não entram no registro de saída para lojas.

## Páginas institucionais de lojas e comparação
- [x] Criar as duas páginas SSR com dados públicos, contagens em cache de cinco minutos, textos fiéis ao código e SEO. Avaliação extra ML descrita como simulação; comissão não entra no ranking.
- [x] Rodapé, catálogo filtrado por loja, voltar, HTML inicial, canonical, dados estruturados, sitemap e FAQ verificados no navegador; celular sem overflow. Sem importações ou alterações em busca, produto, blog e importadores.

## Páginas próprias de categoria
- [x] Criar sete URLs SSR com lista compartilhada, filtros e ordenação na URL, canonical e breadcrumbs.
- [x] Atualizar atalhos e filtros de categoria, redirecionar URLs antigas com 301 e incluir no sitemap.
- [x] Sete testes passaram; sete páginas HTTP 200 com produtos no HTML inicial, filtros reais de marca/loja, ordem, página 2, canonical, histórico, vazio, 404 e celular validados. Sitemap HTTP 200 inclui sete categorias; URLs antigas retornam 301. Não existem subcategorias cadastradas. Sem importações ou mudanças em produto/blog.

## Blog — visual de portal
- [x] Corrigir 500 em páginas além dos artigos existentes: PGRST103 vira resultado vazio com contagem real; páginas do blog/categoria retornam HTTP 200, 14 testes passaram e build OK.
- [x] Reorganizar listagem, busca de artigos, categorias e paginação de 12 itens.
- [x] Melhorar leitura com sumário, progresso, tabelas e três relacionados.
- [x] 14 testes passaram; navegador validou busca real, categoria, canonical da página 2, sumário ativo, três relacionados e celular sem overflow; build OK. Artigos, painel e importações preservados.

## Divulgação do blog na home e nos produtos (sem alterar busca/importações/páginas do blog)
- [x] Home: carregar no servidor os três artigos publicados mais recentes e exibir cards antes do rodapé.
- [x] Produto: carregar no servidor até três artigos, priorizando a categoria e completando com os dois guias gerais.
- [x] Adicionar Blog ao cabeçalho e rodapé; imagens lazy com alt e dimensões fixas; esconder blocos vazios.
- [x] 11 testes e typecheck passaram; HTML inicial da home/produto, ordem dos oito artigos reais, links, imagens 1600 px e mobile 390 px sem overflow validados no navegador. Nenhuma importação ou alteração na busca/páginas do blog.

## Blog — parte pública (sem importações e sem links no menu/rodapé)
- [x] Páginas públicas SSR: destaque, grade, categorias/tags e paginação; artigo, autor, compartilhamento e relacionados.
- [x] Prévia administrativa no mesmo visual, inclusive rascunhos, sempre noindex e privada.
- [x] SEO por página, dados estruturados, sitemap paginado e contagem atômica de visualizações sem alterar a data editorial.
- [x] 23 testes passaram; HTML inicial com corpo/tabela/SEO, rascunho negado a visitante, prévia administrativa salva/não salva, paginação de 10 artigos temporários, quatro relacionados, autor existente, envio WebP real e mobile sem overflow. Dez artigos temporários removidos; sem importações.

## Blog — parte 1 (sem catálogo, importações ou páginas públicas)
- [x] Criar posts, categorias, tags, relações e autores com RLS administrativa e leitura pública restrita; cadastrar oito categorias iniciais separadamente.
- [x] Implementar lista, editor rico, preenchimento Markdown, SEO, agendamento e prévia privada.
- [x] Gerenciar categorias, tags e autores reais; imagens WebP em bucket privado com entrega pública controlada.
- [x] 15 testes; navegador autenticado salvou, reabriu, publicou, editou, agendou e excluiu artigo temporário; celular sem rolagem lateral. Envio real de imagem não testado.

## Agrupamento configurável por loja (sem importações)
- [x] Opção persistente ligada para Nike/Adidas, desligada nas demais, com controle confirmado por loja em Parceiros.
- [x] Importadores consultam a opção; alterações atualizam somente group_key em lotes retomáveis. 6.166 chaves Nike atualizadas, zero colisões entre lojas; Adidas sem produtos atuais.
- [x] 19 testes passaram; navegador autenticado salvou/releu Adidas desligada e ligada (estado final ligado), confirmou Nike ligada e KaBuM desligada; mobile sem overflow, sem erros de execução. Nenhuma importação acionada.

## Posição da seção de feeds Awin (sem importações)
- [x] Feeds de dados movido para imediatamente abaixo das abas, antes dos filtros/lista de lojas. Navegador autenticado em 1250×735 confirmou botão na primeira tela, abertura/cancelamento do formulário e ausência na aba Lomadee; nenhuma gravação ou importação.

## Cadastro seguro de feeds Awin (sem importações)
- [x] Cadastro privado e funções administrativas com user_roles, URLs mascaradas, gravação atômica e migração do segredo de uso único persistente.
- [x] Seção Feeds de dados na aba Awin: adicionar/testar/salvar, pausar/ativar, substituir com campo vazio e remover com confirmação; regras existentes preservadas.
- [x] Workflow sequencial com falhas isoladas, lotes globais e IDs source-qualified; segredo somente quando tabela vazia, nenhum fallback quando todos pausados.
- [x] Testes de limites 300 KB/200 linhas/20s, gzip e erros seguros; navegador autenticado validou salvar/reler/pausar/substituir/remover cadastro temporário; mobile sem overflow. Teste real parcial: 181 linhas Nike, colunas completas, 3 exemplos. Nenhuma importação acionada; tabela vazia ao final e regras KaBuM/Nike intactas. Rotinas agendadas preexistentes atualizaram 8 registros durante a verificação, fora das ações desta tarefa.

## Google Search Console (pedido atual)
- [x] Vincular a conta Google Search Console ao projeto.
- [ ] Publicar a etiqueta META e o sitemap com URLs da origem solicitada.
- [ ] Verificar e adicionar https://compareecompre.lovable.app/ à propriedade exata retornada pelo Google.
- [ ] Enviar https://compareecompre.lovable.app/sitemap.xml e marcar a pendência SEO como corrigida.

## Banners da página inicial (pedido atual; sem importações)
- [x] Substituir promessas não garantidas e padronizar todos os botões em laranja.
- [x] Manter sete banners ativos; preservar Cozinha, Eletrônicos, Esportes e Moda como inativos (quatro retiradas necessárias após incluir os três novos).
- [x] Selecionar por leitura os produtos mais populares da KaBuM e Nike e criar três banners sem preços.
- [x] Gerar imagens WebP otimizadas para desktop/celular, com lazy loading exceto no primeiro; todas abaixo dos limites de 200/120 KB.
- [x] Validar buscas filtradas, conteúdo e legibilidade móvel no navegador; KaBuM 4.702 e Nike 4.917 resultados, sem overflow, build e testes OK; nenhuma importação.

## Falhas Awin e Lomadee de 09/11 (pedido atual; sem importações)
- [x] Diagnosticar: Awin 13:03 descartou 10.898 porque `awin_merchant_rules` estava vazia; Lomadee 13:00 falhou antes dos produtos na conexão com Algolia, após concluir cupons, sem registros gravados.
- [x] Restaurar KaBuM/Nike no cadastro existente com categorias vazias = todas, somente gift card/cartão presente excluídos e limite 20.000; releitura confirmada.
- [x] Alinhar importador/simulação ao formato vazio somente para KaBuM/Nike e testar regras; 29 testes Vitest + 6 Bun passaram.
- [x] Aumentar timeouts (10s conexão/30s leitura/60s escrita) e repetir somente RetryError com cliente novo; verificação inicial e gravações idempotentes protegidas.
- [x] Prévia autenticada: simulação 10.898 linhas/10.851 aceitas (KaBuM 4.782, Nike 6.069, 47 categoria, zero sem regra); lote real teste 100/100 (50 cada), sem gravações/histórico e sem erros de console.
- [x] Publicado: mesma simulação 10.851 aceitos e teste 100/100; indicadores releram 9.540 registros via Algolia às 13:16:32. Nenhuma execução Awin/Lomadee nova, nenhum produto importado; sincronização Lomadee não foi rodada.

## Redesenho administrativo (pedido atual; sem importar/sincronizar/apagar)
- [x] Correções atuais: popularidade visível sem aguardar varredura; cupons sem ações duplicadas. Valores Awin eram kabum/Nike (criados 03:55:49/03:56:00 UTC), restaurados Kabum BR/Nike BR. Simulação autenticada atual: KaBuM 791/Nike 500 (não 789; feed atual). Lomadee 01:16:12 sem ator/origem persistidos, autoria não comprovável.
- [x] Etapa 2 A: partner_stores e RLS EXISTS user_roles aplicadas isoladamente, existência confirmada. B: SELECT CTE agregado validado e informado antes da inserção; 31 Lomadee habilitadas e 3 Awin (KaBuM/Nike habilitadas, Lauri não). Cadastro preenchido separado, produtos intactos.
- [x] Etapa 2: controles Importar/Exibir/Regras, URL da logo sem buckets/upload, iniciais, identidade pública segura e filtros. Lomadee: 132 lojas (119 autorizadas), 101 sem produtos; 101 cadastros adicionados apenas lendo a rede, 131 logos de origem e nenhuma descrição fornecida. Awin: KaBuM/Nike/Lauri existentes; Monsterpub bloqueada, Reserva sem ID/inscrição confirmados adicionados. Mercado Livre cadastrado. Visibilidade em lotes de 500 com prévia e retomada na sessão; preserva qualidade/status. Edição real salva e relida; nenhum produto ocultado/importado por esta tarefa.
- [x] Etapa 1: sete páginas, menu fixo/gaveta, mesmas ações e confirmações, histórico dez por fonte; navegador autenticado sem erros e 33 testes passaram. Nenhuma importação acionada.
- [x] Erro 42803 resolvido: criação isolada e preenchimento separado com CTE agregado e verificação da allowlist por campo escalar.
- [x] Etapa 3: indicadores e gráficos reais, cache de 5 minutos e Atualizar; cliques por dia/loja/produto; 87 cupons com busca/validade/contagens. Navegador autenticado validou parceiros, filtros, edição, visão geral, cliques, cupons e carrossel público; mobile sem overflow. 28 testes passaram. Sem importação/sincronização/exclusão acionada; rotinas agendadas existentes continuaram normalmente. Logos Awin/ML e descrições permanecem manuais; nenhuma logo nova anexada neste pedido. Ocultar/exibir implementado e testado em lógica, não executado contra produtos reais para preservar visibilidade atual.

## Revisão de preços suspeitos (pedido atual; sem importação/exclusão)
- [x] Diagnóstico: SSD PCYES 1TB veio da Lomadee com price=1, sem originalPrice/discountPercent; score 76 por GTIN+estoque+imagem+alta procura, não por desconto.
- [x] Desconto acima de 70% zera somente o bônus de desconto; 9.540 registros existentes recalculados, sem importação.
- [x] Regras < R$ 5 ou < 20% da mediana de família/categoria aplicadas; 290 pendentes (71 mínimo, 219 mediana). Decisões persistentes e separadas de site_hidden/qualidade/disponibilidade.
- [x] Fila em Busca e ranking com motivo, mediana e liberação confirmada; futuras sincronizações preservam pendentes/aprovados. Busca e página direta bloqueiam pendentes.
- [x] SSD R$ 1: mediana R$ 616,40, quatro semelhantes; busca SSD caiu 279→274. Liberação real testada (saiu da fila e voltou à busca) e desfeita para manter o preço inválido pendente; estado final oculto confirmado. 35 testes e typecheck passaram; nada importado ou apagado.

## Catálogo KaBuM e Nike (pedido atual; sem importação)
- [x] Agrupamento exclusivo Awin Nike por produto e cor: 779 linhas em 668 grupos (111 variantes ocultadas da repetição), 8.744 registros de outras fontes/lojas com chave única e zero colisões. 9.523 chaves aplicadas sem criar/apagar; principal e réplicas com distinct; cadastro e índice sem divergências.
- [x] KaBuM e Nike com todas as categorias (*) e somente gift card/cartão presente excluídos em merchant_category; limite 20.000. Abertura gravada somente após validar o agrupamento; nenhuma importação/simulação iniciada.
- [x] KaBuM: 1.071 atuais, 277 anteriores ao dia e 794 sincronizados hoje; zero duplicidades exatas por GTIN ou título, portanto nenhum registro ocultado. Filtro público site_hidden corrigido e ocultações manuais preservadas em futuras importações.
- [x] Buscas públicas concluídas sem importação: iPhone 157 resultados, tênis 479, SSD 279; dez primeiros de cada consulta capturados para o relatório. 29 testes passaram.

## Popularidade e catálogo amplo (sem importação)
- [x] Etapa 1 parcial: pontuação centralizada e integrada nos três syncs/revalidação, botão autenticado de recálculo somente de score; 7454 registros recalculados e distribuição conferida; 15 testes passaram.
- [x] Retomada: erro original reproduzido na leitura GET /rest/v1/partner_catalog com query de 28705 caracteres: HTTP 400, corpo de resposta literal Bad Request, corpo enviado vazio. Algolia browse funciona. customRanking isolado aplicado; réplicas de preço intactas.
- [x] Agrupamento retomado e concluído no pedido atual, substituindo as chaves parciais antigas; timeout anterior superado com lotes parciais sem criação e verificação completa.
- [x] Abertura Awin do pedido anterior concluída para KaBuM/Nike no pedido atual; demais lojas permanecem inalteradas.
- [x] Buscas iphone/tênis/ssd executadas no pedido atual; nenhuma simulação ou importação foi acionada.

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
