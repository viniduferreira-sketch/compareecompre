const origin = 'https://compareecompre.com';
export function informationHead(path: string, title: string, description: string, name: string, extra: object[] = []) {
  return {
    meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { property: 'og:url', content: `${origin}${path}` }, { name: 'twitter:card', content: 'summary_large_image' }],
    links: [{ rel: 'canonical', href: `${origin}${path}` }],
    scripts: [{ type: 'application/ld+json', children: JSON.stringify([{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Início', item: origin }, { '@type': 'ListItem', position: 2, name, item: `${origin}${path}` }] }, ...extra]) }],
  };
}

export const comparisonFaq = [
  { question: 'O Compare e Compre vende produtos?', answer: 'Não. Você compra direto na loja que escolher.' },
  { question: 'O preço é igual ao da loja?', answer: 'É o preço que a loja informou na última atualização. Confirme sempre na página da loja antes de finalizar.' },
  { question: 'Vocês cobram alguma coisa?', answer: 'Não. O uso do site é gratuito.' },
  { question: 'Encontrei um preço errado. O que faço?', answer: 'Fale conosco informando o produto e a loja, e vamos verificar.', href: 'mailto:contato@compareecompre.com.br', label: 'Fale conosco' },
  { question: 'De onde vêm os produtos?', answer: 'Das lojas parceiras, por integrações oficiais. Veja a lista em Lojas monitoradas.', href: '/lojas-monitoradas', label: 'Lojas monitoradas' },
];