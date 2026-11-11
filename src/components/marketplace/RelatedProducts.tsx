import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { OfferCard } from './OfferCard';
import { alternativesQuery, categoryRelatedQuery, relatedCurrentQuery } from '@/lib/related-products.queries';
import { relatedOffer, type RelatedHit } from '@/lib/related-products';

function RelatedCards({ title, hits }: { title: string; hits: RelatedHit[] }) {
  if (!hits.length) return null;
  return <section className="mt-8 border-t border-border pt-7" aria-label={title}>
    <h2 className="mb-5 font-display text-xl font-bold text-foreground">{title}</h2>
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-4 sm:overflow-visible">
      {hits.map(hit => <div key={hit.objectID} className="w-[220px] shrink-0 snap-start sm:w-auto"><OfferCard offer={relatedOffer(hit)} /></div>)}
    </div>
  </section>;
}
export function RelatedAlternatives({ id }: { id: string }) {
  const current = useQuery(relatedCurrentQuery(id));
  return current.data ? <Alternatives current={current.data} /> : null;
}
function Alternatives({ current }: { current: RelatedHit }) {
  const result = useQuery(alternativesQuery(current));
  return <RelatedCards title="Alternativas para comparar" hits={result.data ?? []} />;
}
export function RelatedCategory({ id }: { id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { setNear(true); observer.disconnect(); } }, { rootMargin: '350px' });
    observer.observe(element); return () => observer.disconnect();
  }, [id]);
  const current = useQuery({ ...relatedCurrentQuery(id), enabled: near });
  return <div ref={ref}>{near && current.data ? <CategorySelection current={current.data} /> : null}</div>;
}
function CategorySelection({ current }: { current: RelatedHit }) {
  const alternatives = useQuery(alternativesQuery(current));
  const exclude = (alternatives.data ?? []).map(hit => hit.objectID);
  const excludeGroups = (alternatives.data ?? []).flatMap(hit => hit.group_key ? [hit.group_key] : []);
  const query = useQuery({ ...categoryRelatedQuery(current, exclude, excludeGroups), enabled: alternatives.isSuccess });
  return <RelatedCards title={`Mais em ${current.categoryName ?? current.category ?? 'Produtos'}`} hits={query.data ?? []} />;
}