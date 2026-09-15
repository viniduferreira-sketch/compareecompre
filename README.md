# Compare e Compre

Atue como desenvolvedor Full-Stack e crie uma plataforma de Marketplace Agregador de Ofertas chamada "Compare e Compre".

REQUISITOS DE DESIGN E INTERFACE:

1. Header moderno com logo "Compare e Compre", barra de busca centralizada em destaque e categorias (Eletrônicos, Casa, Moda, etc.).

2. Hero Section com slogan atrativo: "Encontre a melhor oferta entre as maiores lojas do Brasil".

3. Grid de Ofertas Responsivo:

   - Cards de produtos exibindo: Foto do produto, Título, Badge com a loja de origem (ex: Mercado Livre), Preço Atual (com destaque de desconto) e Preço Original riscado.

   - Botão de ação destacado: "Ver Oferta na Loja".

4. Modal/Página de Comparação:

   - Ao clicar no produto, abrir visualização comparativa mostrando os preços e o botão de compra que redireciona para a loja parceira.

REQUISITOS DE LÓGICA E BACK-END (SUPABASE):

1. Crie uma Edge Function chamada `search-offers` que recebe um termo de busca e consulta a API pública do Mercado Livre (`https://api.mercadolibre.com/sites/MLB/search?q={termo}`).

2. A função deve transformar cada produto retornado injetando automaticamente os parâmetros de afiliado no final da URL:

   `?matt_tool=15523479&matt_word=compareecompre`

3. Salve/atualize as ofertas nas tabelas `products` e `offers` do Supabase e retorne os resultados ordenados do MENOR para o MAIOR preço.

4. Ao carregar a página inicial, busque automaticamente produtos populares de demonstração (ex: "iPhone", "Smart TV", "Air Fryer").

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://compareecompre.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/257b71df-dcb0-431d-b3aa-761b624fd528).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
