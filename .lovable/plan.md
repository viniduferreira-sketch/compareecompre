# Home profissional e páginas institucionais

## Objetivo
Transformar a Home em uma vitrine completa de ofertas, seguindo a direção visual **Pro commerce showcase**: laranja energético, fundo off-white, superfícies brancas, tipografia clara e navegação rápida. Manter o Mercado Livre como único parceiro e preservar a busca inteligente já existente.

## Home
- Reestruturar o cabeçalho em duas faixas, fixo no topo: marca à esquerda, busca central proeminente com o texto solicitado e categorias horizontais roláveis.
- Adaptar o carrossel principal para dois banners: parceria com o Mercado Livre e proposta de economia do Compare e Compre, com chamadas que iniciam buscas reais.
- Reduzir as categorias populares para os sete atalhos solicitados: Celulares, Notebooks, Geladeiras, Lavadoras, Ar-condicionado, Games e TV.
- Criar duas esteiras horizontais responsivas com ofertas reais do índice atual:
  - **Ofertas Imperdíveis**, priorizando itens com desconto e frete grátis.
  - **Os Mais Buscados**, focada em eletrônicos e smartphones.
- Reutilizar o cartão de produto com imagem, título, preço anterior, preço atual, desconto, frete grátis e CTA laranja **Ver no Mercado Livre**.
- Inserir uma faixa intermediária de confiança sobre Compra Garantida e frete rápido, sem atribuir benefícios inexistentes a todos os produtos.
- Manter a página de resultados atual ao pesquisar, incluindo filtros, ordenação, paginação, carregamento e estado vazio.

## Rodapé e páginas obrigatórias
- Criar um rodapé completo em colunas: **Sobre Nós**, **Ajuda e Suporte** e **Legal**.
- Incluir indicação visual de site seguro, formas de pagamento disponíveis no parceiro e aviso transparente de afiliação.
- Criar rotas próprias, responsivas e com metadados exclusivos para:
  - **Sobre Nós**: missão, curadoria e parceria comercial.
  - **Termos de Uso**: ofertas de terceiros, variação de preço/estoque, redirecionamento e remuneração por afiliação.
  - **Política de Privacidade**: cookies, dados técnicos, finalidade, direitos LGPD, retenção e contato.
- Usar texto final em português claro, com ressalva de que o conteúdo é informativo e não substitui revisão jurídica profissional.

## Direção visual e responsividade
- Evoluir os tokens existentes para a estética selecionada, mantendo laranja como ação principal, verde apenas para economia/frete e cinzas claros nas superfícies.
- Usar espaçamento consistente, sombras suaves, cantos moderados e estados de foco acessíveis.
- No celular: busca em linha própria, menus e esteiras com swipe, banners mais compactos e rodapé empilhado.
- Usar apenas componentes e tokens do sistema visual; sem cores soltas nos arquivos da interface.

## Implementação técnica
- Criar componentes focados para esteiras, rodapé e estrutura das páginas institucionais.
- Consultar o índice de ofertas pelo servidor para preencher as duas vitrines, sem expor credenciais e sem voltar a consultar o banco da aplicação na busca.
- Preservar URLs de afiliado e abrir compras diretamente no Mercado Livre.
- Garantir títulos, descrições e dados sociais exclusivos em todas as novas páginas.

## Validação
- Conferir a Home e as páginas institucionais em desktop e celular.
- Testar busca, categorias, rotação dos banners, navegação das esteiras, links do rodapé e CTAs externos.
- Confirmar estados de carregamento/vazio e ausência de sobreposição, cortes de texto ou mudanças de layout durante o carregamento.
