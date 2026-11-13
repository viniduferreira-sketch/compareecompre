import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRight, BookOpen } from 'lucide-react';
import { buyingGuideQuery, technicalSimilarsQuery } from '@/lib/product-buying.queries';
import { technicalAttributes } from '@/lib/product-buying';
import { Button } from '@/components/ui/button';
import { ProductImage } from './ProductImage';
import { formatBRL } from './OfferCard';

export function ProductBuying({ id, title }: { id: string; title: string }) {
  const { data: guide } = useSuspenseQuery(buyingGuideQuery(title));
  const { data: products = [] } = useQuery(technicalSimilarsQuery(id));
  const labels = [...new Set(products.flatMap(product => technicalAttributes(product).map(attr => attr.name)))].slice(0, 8);
  if (!guide && products.length < 2) return null;
  return <>
    {guide && <section className="mt-8 border-y border-border py-5" aria-labelledby="buying-guide-heading">
      <h2 id="buying-guide-heading" className="mb-2 flex items-center gap-2 font-display text-lg font-semibold"><BookOpen className="size-5 text-primary" />Antes de comprar</h2>
      <Button asChild variant="link" className="h-auto whitespace-normal px-0 text-left">
        <Link to="/blog/$slug" params={{ slug: guide.slug }}>{guide.titulo}<ArrowRight className="size-4 shrink-0" /></Link>
      </Button>
    </section>}
    {products.length >= 2 && labels.length > 0 && <section className="mt-8" aria-labelledby="similar-comparison-heading">
      <h2 id="similar-comparison-heading" className="mb-3 font-display text-lg font-semibold">Compare com similares</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] table-fixed text-sm">
          <thead><tr className="border-b border-border align-top">
            <th scope="col" className="w-32 px-3 py-3 text-left">Produto</th>
            {products.map(product => <th key={product.objectID} scope="col" className="px-3 py-3 text-left">
              <ProductImage src={product.imageUrl ?? null} alt={product.title} className="mb-3 h-24 w-full object-contain" />
              <Button variant="link" asChild className="h-auto whitespace-normal px-0 text-left"><Link to="/produto/$id" params={{ id: product.objectID }}>{product.title}</Link></Button>
              <p className="mt-2 font-semibold">{formatBRL(product.price)}</p>
              <p className="mt-1 text-xs font-normal text-muted-foreground">{product.store ?? product.merchant_name}</p>
            </th>)}
          </tr></thead>
          <tbody>{labels.map(label => <tr key={label} className="border-b border-border">
            <th scope="row" className="break-words px-3 py-3 text-left font-medium">{label}</th>
            {products.map(product => <td key={product.objectID} className="break-words px-3 py-3 align-top">{technicalAttributes(product).find(attr => attr.name === label)?.value ?? null}</td>)}
          </tr>)}</tbody>
        </table>
      </div>
    </section>}
  </>;
}