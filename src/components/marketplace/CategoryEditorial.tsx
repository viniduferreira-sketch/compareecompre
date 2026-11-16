import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { BlogCard } from '@/components/blog/BlogPages';
import type { BlogArticle } from '@/lib/blog-public';
import { copySegments, type CategoryCopy } from '@/lib/category-copy';

export function CopyText({ text }: { text: string }) {
  return <>{copySegments(text).map((p, i) => p.href ? <a key={i} href={p.href} className="text-primary underline">{p.text}</a> : <span key={i}>{p.text}</span>)}</>;
}
export function CategoryIntroduction({ text, more }: { text: string; more?: string | undefined }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  return <div className="mt-3 max-w-4xl">
    <p className="text-sm leading-6 text-muted-foreground"><CopyText text={text} /></p>
    {more && <><p id="category-introduction-more" hidden={!expanded} className="mt-2 text-sm leading-6 text-muted-foreground"><CopyText text={more} /></p>
    <Button variant="link" className="mt-1 h-auto p-0" aria-expanded={expanded} aria-controls="category-introduction-more" onClick={() => setExpanded(v => !v)}>{expanded ? 'Ler menos' : 'Ler mais'}</Button></>}
  </div>;
}
export function CategoryEditorial({ name, copy, guides }: { name: string; copy?: CategoryCopy | null | undefined; guides: BlogArticle[] }) {
  return <div className="mx-auto max-w-7xl space-y-12 px-5 pb-8 pt-3 lg:px-8">
    {!!copy?.checklist.length && <section aria-labelledby="category-checklist"><h2 id="category-checklist" className="mb-5 font-display text-2xl font-bold">{copy.checklistTitle}</h2>
      <ul className="max-w-4xl list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">{copy.checklist.map((item, i) => <li key={i}><CopyText text={item} /></li>)}</ul>
      {copy.checklistNote && <p className="mt-4 max-w-4xl text-sm leading-7 text-muted-foreground"><CopyText text={copy.checklistNote} /></p>}
    </section>}
    {guides.length > 0 && <section aria-labelledby="category-guides">
      <h2 id="category-guides" className="mb-5 font-display text-2xl font-bold">Guias de compra</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{guides.map(post => <BlogCard key={post.id} post={post} />)}</div>
    </section>}
    {!!copy?.faq.length && <section aria-labelledby="category-faq"><h2 id="category-faq" className="mb-5 font-display text-2xl font-bold">Perguntas frequentes sobre {name}</h2>
      <div className="max-w-4xl">{copy.faq.map((item, i) => <details key={i} className="group border-b border-border"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-medium focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">{item.question}<ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"/></summary><p className="pb-4 text-sm leading-7 text-muted-foreground"><CopyText text={item.answer} /></p></details>)}</div>
    </section>}
  </div>;
}
