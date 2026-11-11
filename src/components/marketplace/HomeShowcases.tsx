import { useEffect, useRef, useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ProductRail } from './ProductRail';
import { relatedOffer, type RelatedHit } from '@/lib/related-products';
import { homeShowcasesQuery } from '@/lib/home-showcases.queries';
import type { Showcase } from '@/lib/home-showcases';
export function HomeShowcases({categorySlug,excludeCategorySlug}:{categorySlug?:string;excludeCategorySlug?:string}={}) {
  const {data}=useSuspenseQuery(homeShowcasesQuery());
  const showcases=data.filter(showcase=>(!categorySlug||showcase.category_slug===categorySlug)&&showcase.category_slug!==excludeCategorySlug);
  return <>{showcases.map((showcase,index)=><ShowcaseRail key={showcase.id} showcase={showcase} first={Boolean(categorySlug)&&index===0}/>)}</>;
}
function ShowcaseRail({showcase,first}:{showcase:Showcase & {hits:RelatedHit[]};first:boolean}) {
  const root=useRef<HTMLDivElement>(null);
  const [near,setNear]=useState(first);
  useEffect(()=>{if(near)return;const element=root.current;if(!element)return;const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setNear(true);observer.disconnect();}},{rootMargin:'350px'});observer.observe(element);return ()=>observer.disconnect();},[near]);
  const href=showcase.label==='GAMES' ? '/?q=gamer' : showcase.store_quota ? '/categoria/esportes' : showcase.category_slug==='all' ? '/?q=' : `/categoria/${showcase.category_slug}`;
  return <div ref={root}>{near ? <ProductRail showcase title={showcase.title} description={showcase.subtitle} eyebrow={showcase.label} viewAllHref={href} offers={showcase.hits.map(relatedOffer)} isLoading={false}/> : <div className="h-[420px]" aria-hidden="true"/>}</div>;
}