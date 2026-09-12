# Busca inteligente com Algolia

## Objetivo
Substituir a consulta de resultados ao Mercado Livre por pesquisas no índice `produtos_mercado_livre`, mantendo o grid, a ordenação, os filtros, a paginação e os estados atuais.

## Implementação
- Instalar o cliente oficial `algoliasearch`.
- Guardar a chave fornecida como segredo do servidor; ela não será incluída no código entregue ao navegador.
- Criar uma rotina de sincronização no servidor que:
  - consulta categorias populares do catálogo atual do Mercado Livre;
  - elimina registros sem preço válido;
  - normaliza título, imagem, preço, categoria, frete e link afiliado;
  - remove duplicados por ID;
  - envia os registros em lotes ao índice com `saveObjects`.
- Trocar a função usada pela página inicial para consultar somente o Algolia, com tolerância a erros de digitação, 40 resultados por página e ordenação por preço.
- Transformar os resultados do Algolia no formato já aceito pelos cards, sem alterar o desenho da página.
- Gerar os filtros laterais a partir das facetas do índice e manter o contador e a paginação baseados no resultado real do Algolia.
- Exibir a mensagem exata de falha da pesquisa sem derrubar a página.

## Validação
- Executar uma sincronização real e confirmar que o índice recebeu produtos válidos.
- Testar uma busca normal e outra com erro de digitação.
- Confirmar paginação, ordenação crescente/decrescente, filtros, ausência de preços zerados e estados de carregamento/vazio.

## Detalhes técnicos
- A página continuará chamando uma função segura do aplicativo; essa função consulta o Algolia em vez do Mercado Livre. Assim, a credencial de escrita necessária ao `saveObjects` não fica exposta no navegador.
- O Mercado Livre será usado apenas pela rotina de sincronização, nunca pela busca feita pelo visitante.
