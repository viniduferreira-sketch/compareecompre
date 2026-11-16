import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { searchPublicProducts, PUBLIC_PRODUCT_INDEX } from '@/lib/public-product-search';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductImage } from '@/components/marketplace/ProductImage';
import { formatBRL } from '@/components/marketplace/OfferCard';
import { blogProductBlockVisible, selectBlogOffers, type BlogProductDirective } from '@/lib/blog-product-blocks';
import { type RelatedHit } from '@/lib/related-products';
import { recordOutboundClick } from '@/lib/outbound-clicks';
import type { Offer } from '@/lib/search-offers.functions';

async function fetchBlogOffers(directive: BlogProductDirective): Promise<Offer[]> {
  const app = import.meta.env['VITE_LOVABLE_CONNECTOR_ALGOLIA_APPLICATION_ID'];
  const key = import.meta.env['VITE_LOVABLE_CONNECTOR_ALGOLIA_PUBLIC_API_KEY'];
  if (!app || !key) throw new Error('A busca não está configurada.');
  if (directive.kind === 'product') {
    // Only this uncommon directive loads the full client; normal article searches stay on the lite bundle.
    const { algoliasearch } = await import('algoliasearch');
    const hit = await algoliasearch(app, key).getObject<RelatedHit>({ indexName: PUBLIC_PRODUCT_INDEX, objectID: directive.id });
    return selectBlogOffers([hit], directive);
  }
  const filters = [`price >= ${directive.minPrice}`, ...(directive.maxPrice !== null ? [`price <= ${directive.maxPrice}`] : [])].join(' AND ');
  const facetFilters = [
    ...(directive.category ? [[`categoryName:${directive.category}`]] : []),
    ...(directive.store ? [[`store:${directive.store}`]] : []),
  ];
  const result = await searchPublicProducts({ query: directive.query, limit: 100, filters, facetFilters });
  return selectBlogOffers(result.hits, directive);
}

function StoreLink({ offer, articleSlug, compact = false }: { offer: Offer; articleSlug: string; compact?: boolean }) {
  return <Button asChild size="sm" className={compact ? 'shrink-0' : 'w-full'}>
    <a href={offer.affiliateUrl} target="_blank" rel="sponsored nofollow noopener" onClick={() => recordOutboundClick(offer, 'blog_card', { articleSlug })}>
      Ir à loja<ExternalLink className="size-3.5"/>
    </a>
  </Button>;
}

function ProductCard({ offer, articleSlug }: { offer: Offer; articleSlug: string }) {
  return <article className="flex w-[82%] max-w-72 shrink-0 snap-start flex-col rounded-lg border border-border bg-card p-3 shadow-sm sm:w-auto sm:max-w-none">
    <Link to="/produto/$id" params={{ id: offer.id }} className="group flex flex-1 flex-col" aria-label={`Ver detalhes de ${offer.title}`}>
      <div className="h-36 overflow-hidden rounded-md bg-card">
        <ProductImage src={offer.imageUrl} alt={offer.title} width={400} height={300} loading="lazy" className="size-full object-contain p-2 transition-transform group-hover:scale-105"/>
      </div>
      <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold leading-5">{offer.title}</h3>
      <div className="mt-auto pt-3"><p className="font-display text-xl font-bold">{formatBRL(offer.price)}</p><p className="mt-1 truncate text-xs text-muted-foreground">{offer.store}</p></div>
    </Link>
    <div className="mt-3 space-y-2"><StoreLink offer={offer} articleSlug={articleSlug}/><Button asChild size="sm" variant="outline" className="w-full"><Link to="/produto/$id" params={{ id: offer.id }}>Ver detalhes</Link></Button></div>
  </article>;
}

function ProductList({ offers, articleSlug, directive }: { offers: Offer[]; articleSlug: string; directive: Extract<BlogProductDirective, { kind: 'products' }> }) {
  return <>
    <ol className="divide-y divide-border rounded-lg border border-border bg-card">
      {offers.slice(0, 5).map((offer, index) => <li key={offer.id} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
        <span className="w-7 shrink-0 font-display text-sm font-extrabold text-primary">#{index + 1}</span>
        <Link to="/produto/$id" params={{ id: offer.id }} className="size-16 shrink-0 sm:size-20" aria-label={`Ver detalhes de ${offer.title}`}><ProductImage src={offer.imageUrl} alt={offer.title} width={160} height={160} loading="lazy" className="size-full object-contain"/></Link>
        <div className="min-w-0 flex-1"><Link to="/produto/$id" params={{ id: offer.id }} className="line-clamp-2 text-sm font-semibold leading-5 hover:text-primary">{offer.title}</Link><p className="mt-1 font-display text-lg font-bold">{formatBRL(offer.price)}</p><p className="truncate text-xs text-muted-foreground">{offer.store}</p></div>
        <StoreLink offer={offer} articleSlug={articleSlug} compact/>
      </li>)}
    </ol>
    {offers.length > 5 && <Button asChild variant="outline" size="sm" className="mt-3"><a href={`/busca?q=${encodeURIComponent(directive.query)}`}>Ver todos</a></Button>}
  </>;
}

export function BlogProductBlock({ directive, articleSlug }: { directive: BlogProductDirective; articleSlug: string }) {
  const container = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    if (!('IntersectionObserver' in window)) { setNear(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      setNear(true); observer.disconnect();
    }, { rootMargin: '600px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const query = useQuery({ queryKey: ['blog-product-block', directive], queryFn: () => fetchBlogOffers(directive), enabled: near, staleTime: 5 * 60 * 1000, retry: 1 });
  const offers = query.data ?? [];
  if (query.isError || (query.data && !blogProductBlockVisible(directive, offers.length))) return null;
  const isProducts = directive.kind === 'products';
  return <section ref={container} aria-label={isProducts ? directive.title || 'Ofertas para comparar' : 'Produto para comparar'} className={`not-prose my-8 ${!query.data ? isProducts && directive.layout === 'lista' ? 'min-h-[360px]' : 'min-h-[460px]' : ''}`}>
    {query.data && <>
      {isProducts && <h2 className="mb-4 font-display text-xl font-bold">{directive.title || 'Ofertas para comparar'}</h2>}
      {isProducts && directive.layout === 'lista'
        ? <ProductList offers={offers} articleSlug={articleSlug} directive={directive}/>
        : <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible md:grid-cols-3">{offers.map(offer => <ProductCard key={offer.id} offer={offer} articleSlug={articleSlug}/>)}</div>}
      <p className="mt-4 text-xs leading-5 text-muted-foreground">Preços informados pelas lojas na última atualização, sujeitos a alteração. Podemos receber comissão pelos links, sem custo extra para você.</p>
    </>}
  </section>;
}
