import { createFileRoute } from "@tanstack/react-router";

import { InstitutionalPage } from "@/components/marketplace/InstitutionalPage";

export const Route = createFileRoute("/politica-de-privacidade")({
  staticData: { sitemap: true },
  head: () => ({ meta: [
    { title: "Política de Privacidade | Compare e Compre" },
    { name: "description", content: "Saiba como o Compare e Compre trata cookies e dados pessoais conforme a LGPD." },
    { property: "og:title", content: "Política de Privacidade | Compare e Compre" },
    { property: "og:description", content: "Informações sobre cookies, segurança, direitos e tratamento de dados." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <InstitutionalPage title="Política de Privacidade" description="Última atualização: 7 de novembro de 2026.">
      <section><h2>1. Nosso compromisso</h2><p>O Compare e Compre respeita a sua privacidade e trata dados pessoais de acordo com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD). Esta política explica quais informações podem ser coletadas e como elas são utilizadas.</p></section>
      <section><h2>2. Dados coletados</h2><p>Podemos coletar dados técnicos necessários ao funcionamento e à segurança do site, como endereço IP, tipo de navegador, dispositivo, páginas acessadas, data e duração da visita. Caso você entre em contato conosco, também trataremos os dados que decidir fornecer na mensagem.</p></section>
      <section><h2>3. Cookies e tecnologias semelhantes</h2><p>Cookies podem ser usados para manter preferências, medir o desempenho do site, entender a navegação e atribuir corretamente acessos aos links de parceiros. Também podemos utilizar cookies de terceiros, como os do Google, para personalizar anúncios de acordo com seus interesses e sua navegação. Você pode gerenciar suas preferências diretamente nas <a href="https://adssettings.google.com" target="_blank" rel="noreferrer" className="font-semibold text-primary underline-offset-4 hover:underline">configurações de anúncios do Google</a>, além de limitar ou excluir cookies nas configurações do seu navegador, sabendo que algumas funções podem ser afetadas.</p></section>
      <section><h2>4. Finalidades e bases legais</h2><ul><li>Operar, proteger e melhorar o serviço;</li><li>medir o uso e corrigir falhas;</li><li>responder a solicitações enviadas pelo usuário;</li><li>cumprir obrigações legais e exercer direitos;</li><li>mensurar redirecionamentos e comissões de afiliação.</li></ul><p>O tratamento poderá se basear na execução do serviço solicitado, no cumprimento de obrigação legal, no legítimo interesse ou no consentimento, conforme cada situação.</p></section>
      <section><h2>5. Compartilhamento</h2><p>Podemos compartilhar dados estritamente necessários com fornecedores de infraestrutura, análise e segurança. Ao clicar em uma oferta, você acessa o site da loja responsável e passa a estar sujeito também à política de privacidade dessa empresa.</p></section>
      <section><h2>6. Segurança e retenção</h2><p>Adotamos medidas técnicas e organizacionais razoáveis para proteger os dados. As informações são mantidas somente pelo período necessário às finalidades informadas ou ao cumprimento de obrigações legais.</p></section>
      <section><h2>7. Seus direitos</h2><p>Nos termos da LGPD, você pode solicitar confirmação de tratamento, acesso, correção, anonimização, bloqueio, eliminação, portabilidade e informações sobre compartilhamento. Também pode revogar o consentimento quando essa for a base legal aplicável.</p></section>
      <section><h2>8. Lista de e-mails</h2><p>Ao entrar na lista, coletamos seu e-mail e a data do aceite, e registramos a versão do texto de consentimento. Usamos esses dados para avisar quando os alertas de preço estiverem disponíveis e enviar novidades do Compare e Compre. A base legal desse tratamento é o seu consentimento, fornecido ao marcar a caixa de aceite no formulário.</p><p>Mantemos esses dados até o cancelamento. Para revogar o consentimento e solicitar a remoção do seu e-mail, escreva para <a href="mailto:contato@compareecompre.com.br" className="font-semibold text-primary underline-offset-4 hover:underline">contato@compareecompre.com.br</a>. Seu e-mail não é vendido nem compartilhado.</p></section>
      <section><h2>9. Cliques de saída</h2><p>Registramos anonimamente os cliques nos links de lojas parceiras para fins estatísticos. Esse registro não utiliza cookies nem identificadores persistentes e não armazena dados pessoais, como IP, e-mail ou identificação do visitante. Guardamos apenas informações da oferta, do local do clique, do tipo de dispositivo, do domínio de referência e, quando disponíveis, códigos de campanha.</p></section>
      <section><h2>10. Contato</h2><p>Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, escreva para contato@compareecompre.com.br. Poderemos solicitar informações adicionais para confirmar sua identidade e proteger seus dados.</p></section>
    </InstitutionalPage>
  );
}