import { useEffect, useRef, useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OfferCard } from './OfferCard';
import { relatedOffer, type RelatedHit } from '@/lib/related-products';
import { homeShowcasesQuery } from '@/lib/home-showcases.queries';
import type { Showcase } from '@/lib/home-showcases';
export function HomeShowcases() {
  const {data}=useSuspenseQuery(homeShowcasesQuery());
  return <>{data.map((showcase,index)=><ShowcaseRail key={showcase.id} showcase={showcase} first={index===0}/>)}</>;
}
function ShowcaseRail({showcase,first}:{showcase:Showcase & {hits:RelatedHit[]};first:boolean}) {
  const root=useRef<HTMLElement>(null); const rail=useRef<HTMLDivElement>(null);
  const [near,setNear]=useState(first); const [position,setPosition]=useState({start:true,end:false});
  useEffect(()=>{if(near)return;const element=root.current;if(!element)return;const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setNear(true);observer.disconnect();}},{rootMargin:'350px'});observer.observe(element);return ()=>observer.disconnect();},[near]);
  const update=()=>{const el=rail.current;if(el)setPosition({start:el.scrollLeft<2,end:el.scrollLeft+el.clientWidth>=el.scrollWidth-2});};
  useEffect(()=>{update();const el=rail.current;if(!el)return;const observer=new ResizeObserver(update);observer.observe(el);return ()=>observer.disconnect();},[near]);
  return <section ref={root} aria-label={showcase.title} className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-5 flex items-start justify-between gap-4"><div className="min-w-0"><h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">{showcase.title}</h2><p className="mt-2 text-sm text-muted-foreground">{showcase.subtitle}</p></div><Button asChild variant="link" className="shrink-0 px-0"><a href={`/categoria/${showcase.category_slug}`}>Ver todos<ArrowRight className="size-4"/></a></Button></div>
    {near ? <><div ref={rail} onScroll={update} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:gap-4">{showcase.hits.map(hit=><div key={hit.objectID} className="w-[calc((100%-24px)/2.5)] shrink-0 snap-start sm:w-[calc((100%-48px)/4)]"><OfferCard offer={relatedOffer(hit)}/></div>)}</div><div className="mt-2 flex justify-end gap-2"><Button variant="outline" size="icon" aria-label={`Voltar em ${showcase.title}`} disabled={position.start} onClick={()=>rail.current?.scrollBy({left:-(rail.current?.clientWidth ?? 0),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}><ChevronLeft className="size-4"/></Button><Button variant="outline" size="icon" aria-label={`Avançar em ${showcase.title}`} disabled={position.end} onClick={()=>rail.current?.scrollBy({left:rail.current?.clientWidth ?? 0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}><ChevronRight className="size-4"/></Button></div></> : <div className="h-[350px]" aria-hidden="true"/>}
  </section>;
}