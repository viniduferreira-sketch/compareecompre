# Busca profissional com filtros e paginação

## Objetivo
Transformar os resultados de busca em uma experiência de e-commerce com filtros reais do Mercado Livre, ordenação e navegação por páginas, sem dados estáticos.

## Implementação
- Ampliar a consulta ao Mercado Livre para aceitar ordenação, página e filtros selecionados.
- Solicitar 40 itens por página, calcular o `offset` e retornar o total informado em `paging.total`.
- Mapear `available_filters` para uma estrutura segura de títulos, opções e contagens.
- Manter imagens em alta resolução, links afiliados baseados no `permalink` e persistência dos itens retornados.
- Preservar a ordem escolhida pelo usuário ao reler as ofertas armazenadas.
- Reorganizar a área de resultados em duas colunas: filtros à esquerda e produtos à direita.
- Adicionar o seletor “Ordenar por” com relevância, menor preço e maior preço.
- Tornar cada opção de filtro clicável, refazendo a busca e retornando à primeira página.
- Criar paginação clássica baseada no total real, com páginas próximas, reticências e botão “Seguinte”.
- Exibir skeletons tanto nos filtros quanto no grid durante cada consulta e uma mensagem amigável quando não houver resultados.
- Manter carrossel e categorias apenas antes de uma busca; durante resultados, priorizar a estrutura de catálogo.

## Detalhes técnicos
- A função de busca receberá `query`, `sort`, `offset`, `limit` e filtros validados.
- Os parâmetros de filtro serão enviados no formato esperado pela API (`filterId=valueId`).
- A resposta incluirá `offers`, `availableFilters`, `paging` e o diagnóstico de persistência existente.
- Caso o endpoint principal esteja indisponível, o catálogo autenticado continuará como contingência; nessa situação, filtros e total refletirão os itens efetivamente disponíveis.

## Validação
- Verificar tipos e execução da busca.
- Testar pesquisa, alteração de ordem, seleção de filtro, paginação e estados de carregamento/vazio em desktop e celular.
