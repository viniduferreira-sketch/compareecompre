import { createFileRoute } from '@tanstack/react-router';
import { Download, Layers, ShieldCheck, ShoppingBag, TrendingUp, RefreshCw, Handshake, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { PartnerInformationPage, InformationIcon, informationCard } from '@/components/marketplace/PartnerInformationPage';
import { comparisonFaq, informationHead } from '@/lib/partner-information';

export const Route = createFileRoute('/como-comparamos')({
  staticData: { sitemap: true },
  head: () => informationHead('/como-comparamos', 'Como comparamos preços nas lojas | Compare e Compre', 'Entenda como o Compare e Compre reúne, organiza e compara preços de lojas parceiras, como ordenamos os resultados e como ganhamos comissão sem custo extra.', 'Como comparamos', [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: comparisonFaq.map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) }]),
  component: ComparisonPage,
});

const steps = [
  { icon: Download, title: 'Reunimos as ofertas', text: 'Recebemos produtos e preços das lojas parceiras por integrações oficiais, como APIs e catálogos de produtos.' },
  { icon: Layers, title: 'Organizamos', text: 'Padronizamos os dados disponíveis de nome, marca, categoria e imagem. Nas lojas com agrupamento ativado, reunimos tamanhos do mesmo produto e cor em um cartão, sem misturar lojas diferentes.' },
  { icon: ShieldCheck, title: 'Conferimos', text: 'Preços abaixo de R$ 5 ou de 20% da mediana de produtos semelhantes ficam ocultos até revisão. Bloqueamos conteúdo adulto nas importações. No Mercado Livre, revalidamos a disponibilidade dos produtos.' },
  { icon: ShoppingBag, title: 'Mostramos para você', text: 'Você ordena por Mais populares, Menor preço ou Maior preço. Ao clicar em Ir para a loja, finaliza a compra no site da loja.' },
];
function ComparisonPage() {
  return <PartnerInformationPage title="Como comparamos preços" breadcrumb="Como comparamos" subtitle="Do catálogo das lojas até a sua tela: veja em 4 passos como encontramos e organizamos as ofertas.">
    <section aria-label="Como funciona" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{steps.map((step, i) => <article key={step.title} className={informationCard}><div className="flex items-center justify-between"><InformationIcon icon={step.icon} /><span className="text-3xl font-bold text-primary/70">{i + 1}</span></div><h2 className="mb-3 mt-5 text-lg font-bold">{step.title}</h2><p className="text-sm leading-7 text-muted-foreground">{step.text}</p></article>)}</section>
    <section className="grid gap-8 border-y border-border py-9 md:grid-cols-[auto_1fr]"><InformationIcon icon={TrendingUp} /><div><h2 className="mb-4 text-2xl font-bold">Como funciona a ordem “Mais populares”</h2><p className="max-w-3xl text-sm leading-7 text-muted-foreground">A pontuação combina a identificação do produto (GTIN), disponibilidade informada, imagem, desconto e categorias de maior procura. Também considera os cliques nos links das ofertas nos últimos 30 dias, com peso crescente conforme esse interesse aumenta. Descontos acima de 70% não recebem bônus. Não é um ranking de vendas comprovadas: a relevância para o termo pesquisado também influencia a ordem. Os filtros de Menor preço e Maior preço ordenam pelo valor. A comissão não entra nessa pontuação.</p></div></section>
    <div className="grid gap-8 md:grid-cols-2"><section><InformationIcon icon={RefreshCw} /><h2 className="mb-4 mt-5 text-2xl font-bold">Preços e atualização</h2><p className="text-sm leading-7 text-muted-foreground">Atualizamos os preços várias vezes ao dia. Mesmo assim, preço, estoque e frete podem mudar rápido: o valor que vale é sempre o da página da loja. O valor exibido é o do produto e não inclui frete nem cupons. Falhas na integração podem atrasar uma atualização.</p></section><section><InformationIcon icon={Handshake} /><h2 className="mb-4 mt-5 text-2xl font-bold">Como o site se mantém</h2><p className="text-sm leading-7 text-muted-foreground">O Compare e Compre é gratuito para você. Quando você compra pelos nossos links, a loja pode nos pagar uma comissão, sem custo extra para você. A comissão não altera o preço que você paga.</p></section></div>
    <section className="max-w-3xl"><h2 className="mb-5 text-2xl font-bold">Perguntas frequentes</h2><Accordion type="single" collapsible>{comparisonFaq.map((faq, i) => <AccordionItem key={faq.question} value={`faq-${i}`} className="[&>div[data-state=closed]]:hidden"><AccordionTrigger className="text-base font-semibold">{faq.question}</AccordionTrigger><AccordionContent forceMount><p className="leading-7 text-muted-foreground">{faq.answer}</p>{faq.href && <a href={faq.href} className="mt-2 inline-block font-semibold text-primary underline">{faq.label}</a>}</AccordionContent></AccordionItem>)}</Accordion></section>
    <section className="flex flex-wrap gap-4 border-t border-border pt-8"><Button asChild><a href="/lojas-monitoradas">Ver lojas monitoradas<ArrowRight className="size-4" /></a></Button><Button asChild variant="outline"><a href="/">Buscar produtos</a></Button></section>
  </PartnerInformationPage>;
}