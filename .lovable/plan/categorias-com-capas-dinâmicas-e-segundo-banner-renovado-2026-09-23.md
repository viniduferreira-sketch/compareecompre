# Categorias com capas dinâmicas e segundo banner renovado

## Objetivo
Melhorar a leitura visual das sete categorias existentes e enriquecer somente o segundo banner da Home, preservando navegação, textos, ações e o primeiro banner.

## O que será alterado
- Consultar no índice atual uma oferta válida e com imagem para cada categoria: Eletrônicos, Moda, Casa, Celulares, Games, Beleza e Esportes.
- Reaproveitar essas imagens como capas dinâmicas da seção “O que você está procurando?”, sem cadastrar arquivos estáticos nem mudar o índice.
- Manter exatamente os mesmos sete nomes e os mesmos termos acionados ao selecionar cada categoria.
- Trocar os atalhos circulares por cards uniformes inspirados nos cards de produto: imagem no topo, nome abaixo, cantos arredondados, borda e sombra leve.
- Exibir carregamento visual enquanto as capas chegam e um estado neutro sem imagem caso uma categoria ainda não tenha produto válido.
- Manter o banner “Não compre antes de comparar” sem alterações.
- Criar um recorte visual transparente com celular, tênis e fone de ouvido para o lado direito do segundo banner.
- Preservar integralmente no segundo banner o gradiente atual, a tag “COMPARE E COMPRE”, o título, o subtítulo e o botão “Encontrar menor preço”.
- Ajustar apenas a distribuição interna do segundo banner para o recorte não competir com o texto em telas grandes e permanecer legível no celular.
- Registrar no componente do banner um comentário com o padrão obrigatório para futuros banners: recorte real, botão e título consistentes; fundo variável com contraste branco; copy em tag, título verdadeiro de urgência/facilidade, benefício concreto e ação.

## Detalhes técnicos
- A função já usada pela Home retornará também um mapa de capas por categoria, obtido por buscas paralelas no mesmo índice e limitado a um resultado válido por categoria.
- Nenhum campo do índice, rota, categoria ou comportamento de busca será alterado.
- O componente de categorias receberá somente as URLs das capas e continuará chamando os mesmos termos de busca atuais.
- O novo recorte será um único arquivo transparente otimizado, evitando múltiplas requisições e mantendo composição estável.

## Validação
- Conferir as sete capas e os sete nomes em desktop e celular.
- Confirmar que cada card dispara exatamente a busca anterior correspondente.
- Confirmar visualmente que o primeiro banner não mudou.
- Confirmar que o segundo banner mantém gradiente e copy, com o novo recorte à direita sem sobreposição.
- Verificar ausência de erros no console e de quebras durante o carregamento das imagens.
