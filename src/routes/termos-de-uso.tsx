import { createFileRoute } from "@tanstack/react-router";

import { InstitutionalPage } from "@/components/marketplace/InstitutionalPage";

export const Route = createFileRoute("/termos-de-uso")({
  head: () => ({ meta: [
    { title: "Termos de Uso | Compare e Compre" },
    { name: "description", content: "Consulte as regras para utilizar o Compare e Compre e acessar ofertas de terceiros." },
    { property: "og:title", content: "Termos de Uso | Compare e Compre" },
    { property: "og:description", content: "Entenda como exibimos ofertas, preços e links de afiliação." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <InstitutionalPage title="Termos de Uso" description="Última atualização: 13 de setembro de 2026.">
      <section><h2>1. Aceitação</h2><p>Ao acessar ou utilizar o Compare e Compre, você declara ter lido e aceitado estes Termos de Uso. Caso não concorde com alguma condição, interrompa a utilização do site.</p></section>
      <section><h2>2. Natureza do serviço</h2><p>O Compare e Compre é um comparador de preços e agregador de ofertas. Não vendemos, armazenamos, transportamos ou entregamos produtos. Os anúncios são fornecidos por terceiros e a compra é concluída fora do nosso site, no ambiente oficial da loja escolhida.</p></section>
      <section><h2>3. Preços, estoque e condições</h2><p>Os valores e informações apresentados servem como referência e podem mudar a qualquer momento. Antes da compra, confira no site do parceiro o preço final, o estoque, o frete, o prazo, as características do produto e as condições do vendedor. Em caso de divergência, prevalecem as informações exibidas na página final da oferta.</p></section>
      <section><h2>4. Links e afiliação</h2><p>Alguns links são identificados para fins de afiliação. Podemos receber comissão por compras elegíveis realizadas após o redirecionamento, sem acréscimo ao preço pago pelo usuário.</p></section>
      <section><h2>5. Responsabilidades</h2><p>A negociação, o pagamento, a emissão de nota fiscal, a garantia, a troca, a devolução e o atendimento pós-venda são de responsabilidade do vendedor e da plataforma onde a compra foi concluída. Não garantimos disponibilidade contínua do site ou ausência total de erros nas informações recebidas de terceiros.</p></section>
      <section><h2>6. Uso adequado</h2><p>É proibido tentar comprometer a segurança do site, automatizar acessos abusivos, copiar o conteúdo em escala ou utilizar o serviço para finalidades ilícitas.</p></section>
      <section><h2>7. Alterações e contato</h2><p>Estes termos podem ser atualizados para refletir mudanças no serviço ou na legislação. Dúvidas podem ser enviadas para contato@compareecompre.com.br.</p></section>
      <p className="border-t border-border pt-6 text-xs">Este texto apresenta regras gerais para o serviço e deve passar por revisão jurídica antes do uso definitivo.</p>
    </InstitutionalPage>
  );
}