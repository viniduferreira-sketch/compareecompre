import { createFileRoute } from "@tanstack/react-router";

import { InstitutionalPage } from "@/components/marketplace/InstitutionalPage";

export const Route = createFileRoute("/sobre-nos")({
  head: () => ({ meta: [
    { title: "Sobre Nós | Compare e Compre" },
    { name: "description", content: "Conheça o Compare e Compre, agregador de ofertas com curadoria de produtos anunciados no Mercado Livre." },
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
      <section><h2>O Compare e Compre</h2><p>O Compare e Compre é um agregador de ofertas criado para facilitar a pesquisa de produtos e preços. Reunimos, organizamos e apresentamos anúncios disponíveis no Mercado Livre para que você encontre oportunidades relevantes em uma experiência simples e objetiva.</p></section>
      <section><h2>Como ajudamos</h2><p>Nossa tecnologia pesquisa e classifica ofertas por critérios como preço, categoria, desconto e disponibilidade. Você pode navegar pelas seleções da página inicial ou usar a busca para encontrar um produto específico.</p></section>
      <section><h2>Nossa parceria comercial</h2><p>Atualmente, o Mercado Livre é nosso único parceiro comercial. Ao escolher uma oferta, você é direcionado ao ambiente oficial do parceiro, onde confere as condições finais e conclui a compra com o vendedor responsável.</p></section>
      <section><h2>Transparência</h2><p>Podemos receber uma comissão quando uma compra é realizada por meio dos nossos links, sem custo adicional para você. Essa remuneração ajuda a manter o serviço disponível e não altera o preço exibido pela loja.</p></section>
    </InstitutionalPage>
  );
}