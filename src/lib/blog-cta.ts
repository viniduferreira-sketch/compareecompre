export type BlogArticleCta = { href: string; label: string };

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function blogArticleCta(title: string): BlogArticleCta {
  const subject = normalize(title);

  if (subject.includes('celular')) return { href: '/categoria/celulares', label: 'Comparar preços de celulares' };
  if (subject.includes('console') || subject.includes('pc gamer')) return { href: '/categoria/games', label: 'Comparar preços de games' };
  if (subject.includes('desconto real') || (subject.includes('desconto') && subject.includes('real'))) return { href: '/ofertas', label: 'Comparar ofertas e descontos' };
  if (subject.includes('loja') && subject.includes('confiavel')) return { href: '/lojas-monitoradas', label: 'Comparar preços em lojas confiáveis' };
  if (subject.includes('notebook')) return { href: '/busca?q=notebook', label: 'Comparar preços de notebooks' };
  if (subject.includes('smart tv') || subject.includes(' tv') || subject.startsWith('tv ')) return { href: '/busca?q=smart+tv', label: 'Comparar preços de smart TVs' };
  if (subject.includes('fone')) return { href: '/busca?q=fone+bluetooth', label: 'Comparar preços de fones Bluetooth' };
  if (subject.includes('air fryer')) return { href: '/busca?q=air+fryer', label: 'Comparar preços de air fryers' };
  if (subject.includes('tenis de corrida')) return { href: '/busca?q=tenis+de+corrida', label: 'Comparar preços de tênis de corrida' };
  if (subject.includes('protetor solar')) return { href: '/busca?q=protetor+solar', label: 'Comparar preços de protetores solares' };

  return { href: '/ofertas', label: 'Comparar preços' };
}
