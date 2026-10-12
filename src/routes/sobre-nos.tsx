import { createFileRoute } from "@tanstack/react-router";

import { InstitutionalPage } from "@/components/marketplace/InstitutionalPage";

export const Route = createFileRoute("/sobre-nos")({
  staticData: { sitemap: true },
  head: () => ({ meta: [
    { title: "Sobre Nós | Compare e Compre" },
    { name: "description", content: "Conheça o Compare e Compre, comparador que busca ofertas nas melhores lojas da internet." },
    { property: "og:title", content: "Sobre Nós | Compare e Compre" },
    { property: "og:description", content: "Nossa missão é tornar a busca por boas ofertas mais simples, rápida e transparente." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <InstitutionalPage title="Sobre Nós" description="Tecnologia e curadoria para você encontrar boas ofertas com menos esforço.">
      <section className="space-y-3"><p>Criei o Compare e Compre depois de me cansar de fazer, toda vez que ia comprar alguma coisa, a mesma busca repetitiva: abrir várias lojas, comparar preço uma por uma, e só depois de tudo isso decidir onde realmente valia a pena comprar. Não existia um jeito rápido de saber, de cara, qual loja oferecia o melhor custo-benefício pra aquele produto específico.</p><p>O Compare e Compre nasceu pra resolver exatamente essa dor — reunir as ofertas das principais lojas num único lugar, pra você não precisar repetir essa busca cansativa toda vez que for comprar algo.</p></section>
      <section><h2>O Compare e Compre</h2><p>O Compare e Compre é um comparador criado para facilitar a pesquisa de produtos e preços. Buscamos nas melhores lojas da internet para você encontrar o menor preço em uma experiência simples, rápida e transparente.</p></section>
      <section><h2>Como ajudamos</h2><p>Nossa tecnologia pesquisa e classifica ofertas por critérios como preço, categoria, desconto e disponibilidade. Você pode navegar pelas seleções da página inicial ou usar a busca para encontrar um produto específico.</p></section>
      <section><h2>Lojas monitoradas</h2><p>Nossa cobertura cresce de forma contínua. Cada oferta identifica sua loja de origem e direciona você ao ambiente oficial para conferir condições, reputação, entrega e pagamento antes de concluir a compra.</p></section>
      <section><h2>Transparência</h2><p>Podemos receber uma comissão quando uma compra é realizada por meio dos nossos links, sem custo adicional para você. Essa remuneração ajuda a manter o serviço disponível e não altera o preço exibido pela loja.</p></section>
    </InstitutionalPage>
  );
}