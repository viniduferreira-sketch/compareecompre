import {useEffect,useRef,useState} from 'react';
import {ArrowRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {prepareBlogReading} from '@/lib/blog-portal';

export function CompareCallout({compact=false}:{compact?:boolean}) {
 return <section className={compact?'border-t border-border pt-6':'col-span-full flex flex-col items-start justify-between gap-4 border-y border-border bg-secondary px-6 py-7 sm:flex-row sm:items-center'}>
  <h2 className={compact?'mb-3 text-lg font-bold':'text-xl font-bold'}>{compact?'Compare preços':'Já escolheu o produto? Compare o preço nas lojas'}</h2>
  <Button asChild><a href="/?q=">{compact?'Buscar ofertas':'Comparar preços'}<ArrowRight className="size-4"/></a></Button>
 </section>;
}
export function BlogReading({html}:{html:string}) {
 const {body,headings}=prepareBlogReading(html);
 const content=useRef<HTMLDivElement>(null),progress=useRef<HTMLDivElement>(null);
 const [active,setActive]=useState('');
 useEffect(()=>{
  const update=()=>{
   const node=content.current;if(!node)return;
   const top=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'))||120;
   const rect=node.getBoundingClientRect();
   const fraction=Math.max(0,Math.min(1,(top-rect.top)/Math.max(1,rect.height-window.innerHeight+top)));
   progress.current?.style.setProperty('--reading-progress',String(fraction));
   const sections=Array.from(node.querySelectorAll('h2[id]'));
   const current=sections.filter(h=>h.getBoundingClientRect().top<=top+90).at(-1)??sections[0];
   setActive(current?.id??'');
  };
  let frame=0;
  const scroll=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);};
  update();window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',scroll);
  return ()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',scroll);window.removeEventListener('resize',scroll);};
 },[html]);
 const toc=<nav aria-label="Neste artigo" className="space-y-1">{headings.map(h=><a key={h.id} href={`#${h.id}`} aria-current={active===h.id?'location':undefined} className={`block border-l-2 py-2 pl-3 text-sm leading-6 ${active===h.id?'border-primary font-semibold text-primary':'border-border text-muted-foreground hover:text-foreground'}`}>{h.title}</a>)}</nav>;
 return <>
  <div ref={progress} className="blog-reading-progress" aria-hidden="true"/>
  <div className="blog-reading-layout">
   {headings.length>0&&<details className="mb-7 border-y border-border py-4 lg:hidden"><summary className="cursor-pointer text-sm font-bold">Neste artigo</summary><div className="mt-3">{toc}</div></details>}
   <div ref={content} className="blog-prose blog-reading min-w-0 text-[18px]" dangerouslySetInnerHTML={{__html:body}}/>
   <aside className="blog-reading-sidebar hidden lg:block"><div className="blog-reading-sticky space-y-6">{headings.length>0&&<div><h2 className="mb-4 text-sm font-bold uppercase">Neste artigo</h2>{toc}</div>}<CompareCallout compact/></div></aside>
  </div>
 </>;
}