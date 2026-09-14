# Dados estruturados de produto e FAQ

## Objetivo
Adicionar marcação JSON-LD dinâmica às páginas de produto para habilitar a elegibilidade a resultados enriquecidos no Google.

## Implementação
- Carregar os detalhes do produto antes da renderização da página, permitindo que título, descrição, imagens e preço também alimentem os metadados.
- Gerar um bloco `Product` por produto, incluindo oferta, moeda BRL, disponibilidade, imagem e URL da loja quando os dados existirem.
- Gerar um bloco `FAQPage` usando exatamente as perguntas e respostas exibidas na página.
- Atualizar título, descrição e compartilhamento social com os dados reais de cada produto.
- Não publicar dados ausentes ou valores inválidos na marcação.

## Validação
- Abrir uma página real de produto e confirmar que os dois blocos JSON-LD aparecem no HTML.
- Verificar que os valores estruturados correspondem ao conteúdo visível e não geram erro no navegador.
- Marcar o alerta de SEO como corrigido após essa validação.

## Detalhes técnicos
A rota usará seu carregador existente no servidor como fonte única dos metadados. Os scripts serão incluídos por `head()` e serializados com `JSON.stringify`, sem adicionar marcação global à aplicação.
