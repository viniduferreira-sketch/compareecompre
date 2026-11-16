import { createFileRoute, Link } from "@tanstack/react-router";
import {useSuspenseQuery} from '@tanstack/react-query';
import {eduardoProfileQuery} from '@/lib/author-profile.queries';

import { InstitutionalPage } from "@/components/marketplace/InstitutionalPage";

export const Route = createFileRoute("/sobre-nos")({
  staticData: { sitemap: true },
  loader:({context})=>context.queryClient.ensureQueryData(eduardoProfileQuery()),
  head: () => ({ meta: [
    { title: "Sobre Nós | Compare e Compre" },
    { name: "description", content: "Conheça a história do Compare e Compre, como reunimos ofertas de lojas parceiras e como os links de afiliado ajudam a manter o comparador." },
    { property: "og:title", content: "Sobre Nós | Compare e Compre" },
    { property: "og:description", content: "Conheça a história do Compare e Compre, como reunimos ofertas de lojas parceiras e como os links de afiliado ajudam a manter o comparador." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AboutPage,
});

function AboutPage() {
  const {data:author}=useSuspenseQuery(eduardoProfileQuery());
  return (
    <InstitutionalPage title="Sobre Nós" description="A história de como criei o Compare e Compre.">
      <section className="flex flex-col items-start gap-5 sm:flex-row">{author.foto_url&&<img src={author.foto_url} alt="Eduardo Ferreira" width={128} height={128} className="size-28 shrink-0 rounded-full object-cover"/>}<div><h2><Link to="/autor/eduardo-ferreira">Eduardo Ferreira, criador do Compare e Compre</Link></h2></div></section>
      <section><p>Eu compro quase tudo pela internet e, muitas vezes, precisava abrir várias lojas diferentes para achar o produto que procurava. Foi assim quando quis comprar uma camisa polo e, de novo, quando fui atrás de um fone de ouvido. Pensando nessa dor, criei o Compare e Compre: um site que reúne ofertas de várias lojas para você comparar e encontrar o que procura em um só lugar.</p></section>
      <section><h2>De onde vêm as ofertas</h2><p>Reúno os dados dos feeds — catálogos de produtos — das lojas parceiras e de integrações oficiais, como a API do Mercado Livre. Atualizo os preços periodicamente nas sincronizações desses dados, mas preço, estoque e frete podem mudar; por isso, peço que você confira as condições na loja antes de comprar. Recebo comissão quando uma compra é realizada pelos links de afiliado do site, sem custo adicional para você, e a compra é sempre concluída na loja escolhida.</p></section>
      <section><h2>Fale comigo</h2><p>Você pode entrar em contato pelo e-mail <a href="mailto:contato@compareecompre.com.br" className="text-primary underline">contato@compareecompre.com.br</a>.</p></section>
    </InstitutionalPage>
  );
}