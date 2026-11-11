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
import { adminShowcases,saveShowcase } from '@/lib/home-showcases.functions';
import { PRODUCT_CATEGORIES } from '@/lib/category-pages';
import type { Showcase } from '@/lib/home-showcases';
export const adminShowcasesQuery=queryOptions({queryKey:['admin','home-showcases'],queryFn:()=>adminShowcases()});
export function HomeShowcaseEditor(){
  const {data}=useSuspenseQuery(adminShowcasesQuery); const [adding,setAdding]=useState(false);
  return <div className="space-y-6"><div className="flex justify-end"><Button onClick={()=>setAdding(true)} disabled={adding}><Plus className="size-4"/>Adicionar vitrine</Button></div>{adding && <Editor key="new" row={{title:'',subtitle:'',category_slug:'games',terms:[],sort_order:data.length+1,active:true}} done={()=>setAdding(false)}/>}{data.map(row=><Editor key={`${row.id}:${JSON.stringify(row)}`} row={row}/>)}</div>;
}
function Editor({row,done}:{row:Omit<Showcase,'id'> & {id?:string};done?:()=>void}){
  const [form,setForm]=useState(row);const [terms,setTerms]=useState(row.terms.join(', '));const [busy,setBusy]=useState(false);
  const save=useServerFn(saveShowcase);const client=useQueryClient();const prefix=row.id ?? 'new';
  return <section className="border-b border-border pb-7"><h2 className="mb-4 text-lg font-semibold">{row.title || 'Nova vitrine'}</h2><div className="grid gap-4 sm:grid-cols-2">
    <div><Label htmlFor={`${prefix}-title`}>Título</Label><Input id={`${prefix}-title`} value={form.title} maxLength={160} onChange={e=>setForm({...form,title:e.target.value})}/></div>
    <div><Label htmlFor={`${prefix}-subtitle`}>Subtítulo</Label><Textarea id={`${prefix}-subtitle`} value={form.subtitle} maxLength={250} onChange={e=>setForm({...form,subtitle:e.target.value})}/></div>
    <div><Label htmlFor={`${prefix}-category`}>Categoria</Label><select id={`${prefix}-category`} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.category_slug} onChange={e=>setForm({...form,category_slug:e.target.value})}>{PRODUCT_CATEGORIES.map(c=><option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
    <div><Label htmlFor={`${prefix}-terms`}>Termos opcionais, separados por vírgula</Label><Input id={`${prefix}-terms`} value={terms} onChange={e=>setTerms(e.target.value)}/></div>
    <div><Label htmlFor={`${prefix}-order`}>Ordem</Label><Input id={`${prefix}-order`} type="number" min={0} max={1000} value={form.sort_order} onChange={e=>setForm({...form,sort_order:Number(e.target.value)})}/></div>
    <div className="flex items-center gap-3"><Switch id={`${prefix}-active`} checked={form.active} onCheckedChange={active=>setForm({...form,active})}/><Label htmlFor={`${prefix}-active`}>Ativa</Label></div>
  </div><div className="mt-5"><AdminAction writes disabled={busy} description="Salvar título, subtítulo, categoria, termos, ordem e ativação desta vitrine na home. Não altera produtos. Leva poucos segundos." onClick={async()=>{setBusy(true);try{await save({data:{...form,terms:[...new Set(terms.split(',').map(term=>term.trim()).filter(Boolean))]}});await client.invalidateQueries({queryKey:['admin','home-showcases']});await client.invalidateQueries({queryKey:['home-showcases']});toast.success('Vitrine salva.');done?.();}finally{setBusy(false);}}}><Save className="size-4"/>Salvar vitrine</AdminAction></div></section>;
}