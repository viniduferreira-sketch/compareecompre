import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { BlogCard } from '@/components/blog/BlogPages';
import type { CategoryContent } from '@/lib/category-content';
import type { BlogArticle } from '@/lib/blog-public';

export function CategoryIntroduction({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  return <div className="mt-3 max-w-4xl">
    <p id="category-introduction" className={`text-sm leading-6 text-muted-foreground ${expanded ? '' : 'line-clamp-3 md:line-clamp-none'}`}>{text}</p>
    <Button variant="link" className="mt-1 h-auto p-0 md:hidden" aria-expanded={expanded} aria-controls="category-introduction" onClick={() => setExpanded(value => !value)}>{expanded ? 'Ler menos' : 'Ler mais'}</Button>
  </div>;
}
export function CategoryEditorial({ name, content, guides }: { name: string; content: CategoryContent | null; guides: BlogArticle[] }) {
  return <div className="mx-auto max-w-7xl space-y-12 px-5 pb-8 pt-3 lg:px-8">
    {guides.length > 0 && <section aria-labelledby="category-guides">
      <h2 id="category-guides" className="mb-5 font-display text-2xl font-bold">Guias de compra</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{guides.map(post => <BlogCard key={post.id} post={post} />)}</div>
    </section>}
    {!!content?.faq.length && <section aria-labelledby="category-faq"><h2 id="category-faq" className="mb-5 font-display text-2xl font-bold">Perguntas frequentes sobre {name}</h2>
      <div className="max-w-4xl">{content.faq.map((item, i) => <details key={i} className="group border-b border-border"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-medium focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">{item.question}<ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"/></summary><p className="pb-4 text-sm leading-7 text-muted-foreground">{item.answer}</p></details>)}</div>
    </section>}
  </div>;
}