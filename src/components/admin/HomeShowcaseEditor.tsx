import { useState } from 'react';
import { useSuspenseQuery, queryOptions, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AdminAction } from './AdminAction';
import { adminShowcases, saveShowcase } from '@/lib/home-showcases.functions';
import { PRODUCT_CATEGORIES } from '@/lib/category-pages';
import { canActivateShowcase, MAX_THEMATIC_SHOWCASES, SHOWCASE_ACTIVE_LIMIT_MESSAGE, type Showcase } from '@/lib/home-showcases';

export const adminShowcasesQuery = queryOptions({ queryKey: ['admin', 'home-showcases'], queryFn: () => adminShowcases() });
export function HomeShowcaseEditor() {
  const { data } = useSuspenseQuery(adminShowcasesQuery); const [adding, setAdding] = useState(false);
  const activeCount = data.filter(row => row.active).length;
  return <div className="space-y-6"><p className="text-sm text-muted-foreground">A home tem no máximo 3 vitrines: “Os mais buscados da semana” e até {MAX_THEMATIC_SHOWCASES} vitrines temáticas.</p><div className="flex justify-end"><Button onClick={() => setAdding(true)} disabled={adding}><Plus className="size-4" />Adicionar vitrine</Button></div>{adding && <Editor key="new" activeCount={activeCount} row={{ title: '', subtitle: '', label: '', category_slug: 'games', terms: [], stores: [], min_price: null, max_price: null, store_quota: null, sort_order: data.length + 1, active: activeCount < MAX_THEMATIC_SHOWCASES }} done={() => setAdding(false)} />}{data.map(row => <Editor key={`${row.id}:${JSON.stringify(row)}`} row={row} activeCount={activeCount} />)}</div>;
}
function Editor({ row, done, activeCount }: { row: Omit<Showcase, 'id'> & { id?: string }; done?: () => void; activeCount: number }) {
  const [form, setForm] = useState(row); const [terms, setTerms] = useState(row.terms.join(', ')); const [stores, setStores] = useState(row.stores.join(', ')); const [busy, setBusy] = useState(false);
  const save = useServerFn(saveShowcase); const client = useQueryClient(); const prefix = row.id ?? 'new';
  const changeActive = (active: boolean) => {
    if (!canActivateShowcase(activeCount, row.active ?? false, active)) { toast.error(SHOWCASE_ACTIVE_LIMIT_MESSAGE); return; }
    setForm({ ...form, active });
  };
  return <section className="border-b border-border pb-7"><h2 className="mb-4 text-lg font-semibold">{row.title || 'Nova vitrine'}</h2><div className="grid gap-4 sm:grid-cols-2">
    <div><Label htmlFor={`${prefix}-title`}>Título</Label><Input id={`${prefix}-title`} value={form.title} maxLength={160} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
    <div><Label htmlFor={`${prefix}-subtitle`}>Subtítulo</Label><Textarea id={`${prefix}-subtitle`} value={form.subtitle} maxLength={250} onChange={e => setForm({ ...form, subtitle: e.target.value })} /></div>
    <div><Label htmlFor={`${prefix}-label`}>Etiqueta</Label><Input id={`${prefix}-label`} value={form.label} maxLength={60} onChange={e => setForm({ ...form, label: e.target.value })} /></div>
    <div><Label htmlFor={`${prefix}-category`}>Categoria</Label><select id={`${prefix}-category`} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.category_slug} onChange={e => setForm({ ...form, category_slug: e.target.value })}><option value="all">Todas as categorias</option>{PRODUCT_CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
    <div><Label htmlFor={`${prefix}-terms`}>Termos opcionais, separados por vírgula</Label><Input id={`${prefix}-terms`} value={terms} onChange={e => setTerms(e.target.value)} /></div>
    <div><Label htmlFor={`${prefix}-stores`}>Lojas, separadas por vírgula</Label><Input id={`${prefix}-stores`} value={stores} onChange={e => setStores(e.target.value)} /></div>
    <div><Label htmlFor={`${prefix}-min`}>Preço mínimo (R$)</Label><Input id={`${prefix}-min`} type="number" min={0} step="0.01" value={form.min_price ?? ''} onChange={e => setForm({ ...form, min_price: e.target.value === '' ? null : Number(e.target.value) })} /></div>
    <div><Label htmlFor={`${prefix}-max`}>Preço máximo (R$)</Label><Input id={`${prefix}-max`} type="number" min={form.min_price ?? 0} step="0.01" value={form.max_price ?? ''} onChange={e => setForm({ ...form, max_price: e.target.value === '' ? null : Number(e.target.value) })} /></div>
    {form.store_quota && <div><Label htmlFor={`${prefix}-quota`}>Quantidade por loja</Label><Input id={`${prefix}-quota`} type="number" min={1} max={4} value={form.store_quota} onChange={e => setForm({ ...form, store_quota: Number(e.target.value) })} /></div>}
    <div><Label htmlFor={`${prefix}-order`}>Ordem</Label><Input id={`${prefix}-order`} type="number" min={0} max={1000} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
    <div className="flex items-center gap-3"><Switch id={`${prefix}-active`} checked={form.active} onCheckedChange={changeActive} /><Label htmlFor={`${prefix}-active`}>Ativa</Label></div>
  </div><div className="mt-5"><AdminAction writes disabled={busy} description="Salvar textos, etiqueta, categoria, termos, lojas, faixa de preço, ordem e ativação desta vitrine na home. Não altera produtos. Leva poucos segundos." onClick={async () => { if (!canActivateShowcase(activeCount, row.active ?? false, form.active)) throw new Error(SHOWCASE_ACTIVE_LIMIT_MESSAGE); setBusy(true); try { await save({ data: { ...form, terms: [...new Set(terms.split(',').map(term => term.trim()).filter(Boolean))], stores: [...new Set(stores.split(',').map(store => store.trim()).filter(Boolean))] } }); await client.invalidateQueries({ queryKey: ['admin', 'home-showcases'] }); await client.invalidateQueries({ queryKey: ['home-showcases'] }); toast.success('Vitrine salva.'); done?.(); } finally { setBusy(false); } }}><Save className="size-4" />Salvar vitrine</AdminAction></div></section>;
}
