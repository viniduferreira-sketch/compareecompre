# Roadmap — Filtro de qualidade Mercado Livre

## Diagnóstico de moeda Awin LG
- [x] Registrar contagem por currency e três exemplos seguros nos lotes idempotentes e agregar no histórico administrativo; execuções antigas sem evidência permanecem explicitamente sem diagnóstico, sem inventar contagens.
- [x] BRL normalizado por espaços/maiúsculas, sem conversão de outras moedas. Testes de moeda e leitor: 40 aprovados. Botão Testar autenticado LG: HTTP 200, gzip, 86 colunas, 200 linhas, USD:200; três exemplos reais search_price 3599.00, 25038.00 e 13510.71, todos currency USD. Resultado visual conferido, nenhuma importação iniciada; amostra atual não prova as 3.361 linhas históricas.

## Fotos e tipos de produto Stanley
- [x] Resolver compartilhado prioriza aw_image_url, merchant_image_url, large_image, alternate_image, aw_thumb_url e merchant_thumb_url; normalização, galeria e prioridade do workflow usam as mesmas alternativas. Feed real tem 122 linhas: aw_image_url/merchant_image_url/alternate_image/aw_thumb_url preenchidas em todas, large_image/merchant_thumb_url vazias; 120 alternate_image_two. Todas as 122 fotos merchant_image_url respondem 410; aw_image_url e aw_thumb_url devolvem placeholder genérico 70x70, não foto real.
- [x] Tipos explícitos Copo Térmico, Garrafa Térmica, Growler, Caneca Térmica e Cuia Térmica derivados dos títulos quando falta categoria, disponíveis imediatamente nas lojas e persistidos na próxima sincronização. Filtro Copo Térmico retorna só copos, 31 resultados; celular sem overflow. 33 Vitest + 6 Bun passaram, build OK; nenhuma importação ou alteração de registros existentes.
- [ ] Fotos reais Stanley dependem de a origem corrigir os endereços removidos ou fornecer novas URLs oficiais no feed; não inventar/substituir imagens de produtos.

## Cancelamento e expiração Awin
- [x] Execução indicada marcada Cancelada e relida no histórico autenticado, sem alterar produtos.
- [x] Passo final always() com identidade do workflow registra cancelled/failed; leitura administrativa e novos disparos reconciliam GitHub e expiram inatividade superior a 60 minutos sem tarefa recorrente. GitHub retornou HTTP 404 para a execução histórica; reconciliação real desse run não confirmada. Encerramento no GitHub depende da publicação e próxima execução; nenhum workflow iniciado para teste.
- [x] Cancelar confirmado para execuções Awin queued/running; teste temporário cancelado via UI e removido, trava exclui estados terminais e finish tardio não os sobrescreve. Testes e build OK; sem importações. Expiração é persistida ao consultar o painel ou tentar iniciar outra execução.

## Guias de compra nas lojas
- [x] Até quatro artigos publicados das duas categorias mais representadas no catálogo completo da loja, via mapeamento editorial existente, mais os dois gerais; leitura pública em cache e sem inferir categoria para brinquedos.
- [x] Bloco após paginação só na primeira página inclusive filtrada; Adidas/Nike mostram dois específicos + dois gerais, Lego/Funko só dois gerais. Links abertos, página 2 sem bloco, celular sem overflow e HTML inicial confirmados; 21 testes, build OK, sem importações.

## Filtros por tipo e público nas lojas
- [x] Classificador compartilhado preserva categorias reais Awin/Lomadee, usa palavras explícitas do título para registros antigos e grava tipo/público nas futuras sincronizações; facetas adicionadas ao principal e duas réplicas sem alterar ranking. Sem importação ou backfill.
- [x] Filtros tipo/público na URL em todas as lojas; Marca oculta com uma marca e mantida na KaBuM. Adidas atual só tem Infantil/Unissex identificáveis nos títulos; Masculino/Feminino aparecem quando houver evidência nos campos preservados pelo próximo feed.
- [x] Home reutiliza catálogo público em cache para mesma contagem deduplicada da loja: Adidas 3.055, Nike 2.912 na validação. 27 testes Vitest + 6 Bun, filtros tênis/unissex e celular sem overflow; build OK. Nenhuma importação acionada.

## Guias de compra abaixo da abertura das categorias
- [x] Mapeamento solicitado das sete categorias; até quatro artigos recentes da categoria mais dois gerais publicados, bloco vazio oculto e sem duplicação no rodapé da lista. Mantida exibição editorial na primeira página.
- [x] Oito testes e navegador validaram sete categorias, links dos dois gerais, posição após abertura e celular sem overflow; build OK. Nenhum artigo/importação alterado.

## Texto e dados dos parceiros na página de produto
- [x] Entidades decodificadas e tags removidas. Descrição persistida do MSI já começava completa com 23.6; divisão incorreta no ponto decimal cortava o início. Corrigida sem alterar/inventar texto.
- [x] Somente guia do tipo e dois gerais, excluindo guia já ligado; ficha sem limite de oito campos, campos persistidos complementados e futuros feeds preservam modelo alternativo/garantia/EAN. Descrição recolhida com Ler mais. Monitor real confirmou marca/EAN, acentos e início completo; modelo/cor/dimensões/garantia não constam nos campos persistidos e não foram inferidos do título. 77 testes Vitest + 6 Bun passaram, build OK, celular sem overflow; aviso de hidratação inicial preexistente exigiu aguardar antes da interação. Sem importações.

## Guias e ficha comparativa de similares
- [x] Guia publicado “Como escolher” correspondente ao tipo de produto, no HTML inicial; oculto quando não existe, sem confundir acessórios/computadores com peças citadas no título.
- [x] Tabela com dois ou três modelos diferentes da mesma família/categoria, preço 70–130%, somente atributos reais e exclusão por GTIN/modelo; oculta sem evidência. 29 testes passaram; SSD real abriu guia publicado, celular sem overflow e tabela corretamente oculta (feed atual traz só marca, sem modelo/ficha). Renderização da tabela preenchida não verificada com dados reais por essa ausência. Sem importações; build OK.

## Sincronização individual de feeds Awin
- [x] Botão confirmado em cada feed, usando a mesma rotina e reserva exclusiva da sincronização geral; seleção persistida antes do disparo, sem ler outros feeds ou alterar outras lojas. Nenhuma alteração no workflow ou horários.
- [x] Data, resultado e andamento no próprio feed, com atualização a cada 15 segundos; falha de outro feed não muda o resultado dos concluídos. Mensagem quando há execução ativa; pausa automática preservada mesmo em execução manual.
- [x] Testes de isolamento, concorrência, histórico e painel autenticado; cinco botões, confirmação/cancelamento e celular sem overflow verificados. Nenhuma importação real disparada durante a validação; execução completa no GitHub depende de publicar. Aviso de hidratação no primeiro acesso causado por anúncio Google preexistente, fora desta tarefa.

## Comparação exata entre lojas
- [x] Chave gerada na sincronização por GTIN normalizado ou marca/modelo com atributos estruturados completos para variantes suportadas; identificadores Awin/ML já eram preservados. Chave independente do distinct por loja.
- [x] Projeção pública mínima com RLS, gatilho Awin/Lomadee e persistência ML na sincronização/revalidação, inclusive indisponibilidade. Cache de cinco minutos no servidor e navegador; zero buscas Algolia para comparação. Catálogo parceiro existente reaproveitado sem importar; ML passa a preencher na próxima sincronização publicada.
- [x] Tabela menor preço por loja, frete somente quando informado, vendedor real e destinos originais. Sem identificação segura ou com uma loja, seção oculta.
- [x] 51 testes passaram; navegador confirmou mesmo GTIN KaBuM R$ 79,99/PCYES R$ 101,90, links originais, outra página da mesma chave e oferta única sem seção. Tabela rola horizontalmente no celular. Build OK. Aviso externo de hidratação provocado por anúncio Google preexistente; sem anúncios externos o fluxo não apresentou erros. Nenhuma importação acionada.

## Remover suposições das páginas de produto
- [x] Removidos prós/contras genéricos, descrição substituta ML, parcelamento calculado em 10× e promessa diária; descrição aparece apenas com texto parceiro e histórico só com evidência real. Ficha técnica e perguntas preservadas.
- [x] Onze testes e página real HTTP 200 confirmaram ausência das suposições e presença de perguntas/ficha; build OK. Gravação de preços confirmada para Awin/Lomadee pelo catálogo e ML por sincronização/revalidação, este último após publicação. Nenhuma importação acionada.

## Histórico real de preços
- [x] Gráfico condicionado a dois registros reais em datas diferentes; removido selo fixo Menor preço. Comparação de ofertas atuais e descontos fornecidos pelo parceiro preservados.
- [x] Histórico real por produto/loja com primeiro preço observado e mudanças, datas do servidor, gravações serializadas e sem retroagir. Awin/Lomadee via sincronização do catálogo; ML via sincronização/revalidação verificada. HTML e sitemap leem a mesma fonte real. Armazenamento 23% usado/150 MB, sem alerta atual.
- [x] 28 testes, incluindo persistência real, preço repetido, concorrência e lojas distintas; registros de teste removidos. Página real HTTP 200 sem histórico/selo inventado, perguntas/prós preservados; build OK. Rotinas agendadas preexistentes já registraram 1.261 observações reais (1.100 Awin, 161 Lomadee) durante o trabalho; nenhuma importação acionada pelo agente. ML precisa da publicação para iniciar a gravação.

## Indexação automática de produtos (sem feeds ou exclusões)
- [x] Compartilhar regra de conteúdo real, disponibilidade e sete dias entre HTML inicial e sitemap; preservar páginas não relacionadas e busca interna. Data de sincronização já existente, sem campo novo.
- [x] Histórico existente era estimado, não evidência real; gráfico substituído por registros reais quando disponíveis. Vinte testes passaram; HTML inicial de três produtos e sitemap HTTP 200 confirmados: 108 indexáveis e 49.397 fora entre 49.505 registros, às 04:15 UTC de 13/11. Blog, categorias e institucionais preservados, nenhum feed/registro alterado; efeito publicado depende de publicação.

## Títulos e descrições específicos por página
- [x] Atualizar títulos/descrições e Open Graph da home, padrão raiz, busca por termo, produto, ofertas, lojas monitoradas, sobre nós e blog sem promessas de menor preço; conteúdo e regras de busca preservados.
- [x] HTML inicial validado em dez URLs, descrições diferentes por busca e canonical único apontando para a própria página; navegação pública e 28 testes passaram, build OK. Correções SEO registradas; versão ao vivo depende da próxima publicação.

## Google Search Console — domínio próprio
- [x] Conta vinculada consultada: nenhuma propriedade verificada; token META solicitado e acrescido ao HTML inicial preservando etiqueta anterior; sitemap existente válido com 48.270 URLs do domínio.
- [x] Publicação solicitada; checagem única após 65 segundos recebeu HTTP 403, impedindo confirmar a etiqueta publicada.
- [ ] Confirmar etiqueta em https://compareecompre.com/, verificar propriedade, adicioná-la, relistar propriedades e enviar sitemap; bloqueado pelo HTTP 403 na checagem publicada. Finding gsc:gsc permanece não resolvido.

## Teste parcial do feed Awin
- [x] Redirect manual no leitor compartilhado (teste, simulação e workflow): até três destinos HTTPS no host exato productdata.awin.com, um timeout para a cadeia, bloqueios sem revelar Location; 27 testes passaram (10 regressões falhavam antes) e botão autenticado retornou HTTP 200/182 linhas/92 colunas. Sem importações; versão publicada depende de publicar.
- [x] Corrigir leitura gzip em streaming, corte de 300 KB e tempo de 60 segundos; exibir diagnóstico seguro, sem URLs/chaves.
- [x] 18 testes passaram; regressão de magic bytes divididos reproduzida antes/corrigida depois; botão autenticado no feed atual: HTTP 200, gzip, 307.200 bytes CSV, 182 linhas, 92 colunas, 0,3 s, sem importações.
- [ ] Validar especificamente Lego e Stanley: feed não consta no cadastro acessível nesta sessão (apenas Feed Adidas e Feed atual); exige disponibilizar esse feed na sessão.

## Cartões de produtos nos artigos do Blog
- [x] Interpretar {{produtos}} e {{produto}} no Markdown/editor e na prévia administrativa, sem alterar o restante do Blog.
- [x] Consultar apenas o catálogo público perto da tela, com filtros, popularidade, deduplicação, limite por loja e blocos insuficientes ocultos.
- [x] Renderizar cards/lista responsivos, links de detalhes/loja e aviso de preço; registrar saída anônima com origem blog_card e slug no banco/GA4.
- [x] Testar regras e fluxo real no navegador; não tocar em Awin, importações, vitrines, categorias ou páginas de loja.

## Páginas próprias das lojas (sem importações)
- [x] Criar /loja/<slug> para lojas visíveis com descrição, logo, catálogo SSR, filtros e 24 produtos por página; quatro descrições fornecidas cadastradas sem alterar outros dados.
- [x] Home, 123 links do diretório e nomes das lojas nas ofertas levam às páginas próprias; URLs antigas retornam 301; sitemap com lojas visíveis, canonical e dados estruturados.
- [x] Vinte testes; quatro lojas principais com 24 cartões e H1 único, categoria, marca, preço, ordem, página 2, histórico, HTML inicial e celular sem overflow. Angeloni desativada e slug inexistente retornam 404; sitemap HTTP 200. Nenhuma importação.

## Ofertas, busca e destinos dos botões (sem importações)
- [x] Criar /ofertas com descontos reais, filtros, três ordens, 24 por página, fallback popular, SEO e sitemap automático sem lastmod artificial.
- [x] Criar /busca com estado na URL, noindex e recuperação de busca vazia com oito populares; header global e redirecionamento de URLs antigas.
- [x] Banners KaBuM/Nike para catálogo da loja, Explorar ofertas e CTAs do blog para /ofertas; Games para /categoria/games, vitrines gerais para /ofertas. Quinze testes; clique do banner, 24 produtos SSR, filtros, página 2/canonical, vazio com oito, fallback popular e celular sem overflow confirmados. Nenhuma importação.

## Conteúdo das categorias
- [x] Sete textos e 28 perguntas/respostas gravados em category_content, leitura pública e escrita com o padrão admin existente.
- [x] Introdução de três linhas expansível no celular, FAQ nativo acessível e BlogCard só na página 1 inclusive filtrada; HTML inicial e FAQPage derivados das mesmas respostas.
- [x] 12 testes e navegador confirmaram sete categorias SSR, pergunta aberta, página 2 sem conteúdo, primeira filtrada com conteúdo e celular sem overflow. Eletrônicos/Games têm um guia publicado cada, links abertos; demais escondem guias vazios. Nenhuma importação ou alteração de filtros/produtos.

## Consentimento de cookies e GA4
- [x] Aviso, personalização, escolha por 12 meses e preferências no rodapé; política atualizada.
- [x] GA4 bloqueado sem Estatísticas, fora dos domínios publicados e para administradores; eventos no ponto de saída existente, sem alterar importações ou artigos.
- [x] 16 testes passaram; navegador confirmou aceitar/personalizar/recusar, persistência, reabertura, Esc e revogação; celular com aviso de 194px (< 1/3), zero envios GA na prévia e sem erros. Recebimento real no Google depende de publicação e permanece não verificado.

## Cozinha após Lojas monitoradas
- [x] Casa e Cozinha imediatamente após Lojas monitoradas; Games continua após a faixa de segurança e as demais seções ficaram inalteradas. Desktop e celular validados, 12 produtos em cada vitrine e sem overflow.

## Home com exatamente três vitrines (sem importações)
- [x] Somente Mais buscados (mínimo R$ 50), Cozinha e Games, com 12 cartões e seis por vez no desktop; alertas e Blog permanecem após Games.
- [x] Demais vitrines ocultas reversivelmente; painel e servidor limitam a três no total, incluindo Mais buscados, com aviso ao tentar ativar a quarta.
- [x] Games em todas as categorias, oito termos OU, mínimo R$ 150, oito exclusões, quatro por loja e Ver todos em “gamer”; 12 testes, desktop/mobile e build OK, sem importações.

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
