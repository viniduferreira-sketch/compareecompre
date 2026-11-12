import { useState } from 'react';
import { queryOptions, useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Plus, FlaskConical, Save, Pencil, Trash2, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminAction, ActionNote, useAdminConfirmation } from './AdminAction';
import { getAwinFeeds, testAwinFeed, testSavedAwinFeed, saveAwinFeed, changeAwinFeed, bringAwinSecret } from '@/lib/awin-feeds.functions';
export const awinFeedsQuery = queryOptions({queryKey:['admin','awin-feeds'],queryFn:()=>getAwinFeeds(),staleTime:300000});
type TestResult = Awaited<ReturnType<typeof testAwinFeed>>;
export function AwinFeeds() {
  const {data} = useSuspenseQuery(awinFeedsQuery); const client=useQueryClient(); const confirm=useAdminConfirmation();
  const test=useServerFn(testAwinFeed), savedTest=useServerFn(testSavedAwinFeed), save=useServerFn(saveAwinFeed), change=useServerFn(changeAwinFeed), bring=useServerFn(bringAwinSecret);
  const [form,setForm]=useState<{id?:string;nome:string;url:string}|null>(null); const [result,setResult]=useState<TestResult|null>(null); const [busy,setBusy]=useState(false);
  const refresh=async()=>{ for (const key of ['awin-feeds','partner-stores','awin-allowlist','awin-rules']) await client.invalidateQueries({queryKey:['admin',key]}); };
  const work=async(fn:()=>Promise<void>)=>{setBusy(true);try{await fn();}catch(e){toast.error(e instanceof Error?e.message:'Não foi possível concluir.');}finally{setBusy(false);}};
  const date=(v:string|null)=>v?new Date(v).toLocaleString('pt-BR'):'—';
  return <section className="mt-4 border-b border-border pb-6" aria-labelledby="awin-feeds-title">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="awin-feeds-title" className="text-xl font-bold">Feeds de dados</h2><Button disabled={busy} onClick={()=>{setForm({nome:'',url:''});setResult(null);}}><Plus className="size-4"/>Adicionar feed</Button></div>
    {form && <form className="mt-4 grid gap-3" onSubmit={e=>{e.preventDefault();void work(async()=>{if(!await confirm('Salvar o feed e cadastrar os anunciantes novos com todas as categorias, limite de 20.000 e exclusão de gift card/cartão presente? Não importa nem altera produtos; leva até 60 segundos.'))return;await save({data:form});setForm(null);setResult(null);await refresh();toast.success('Feed salvo. Nenhum produto importado.');});}}>
      <label className="grid gap-1 text-sm">Nome (opcional)<Input aria-label="Nome do feed" value={form.nome} maxLength={200} onChange={e=>setForm({...form,nome:e.target.value})}/></label>
      <label className="grid gap-1 text-sm">URL do feed<Input type="password" autoComplete="off" aria-label="URL do feed" value={form.url} required onChange={e=>{setForm({...form,url:e.target.value});setResult(null);}}/></label>
      <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={busy||!form.url} onClick={()=>work(async()=>setResult(await test({data:form})))}><FlaskConical className="size-4"/>Testar</Button><Button type="submit" disabled={busy||!result?.valid}><Save className="size-4"/>Salvar</Button><Button type="button" variant="ghost" disabled={busy} onClick={()=>{setForm(null);setResult(null);}}>Cancelar</Button></div>
      <ActionNote writes={false} description="Teste parcial: até 300 KB ou 200 linhas, em até 60 segundos. Não importa produtos. O cadastro é salvo somente após um teste válido."/>
    </form>}
    {result&&<div role="status" className="my-4 space-y-2 border-l-2 border-primary pl-4 text-sm"><p>{result.rows} linhas lidas · {result.valid?'Teste válido':'Teste incompleto'}</p>{result.error&&<p className="break-words text-destructive">Motivo: {result.error}</p>}<p>HTTP: {result.diagnostics.httpStatus??'Sem resposta'} · Tempo: {(result.diagnostics.elapsedMs/1000).toFixed(1)} s · Bytes lidos (CSV): {result.diagnostics.bytesRead.toLocaleString('pt-BR')} · Bytes recebidos: {result.diagnostics.downloadedBytes.toLocaleString('pt-BR')} · {result.diagnostics.gzip?'gzip':'CSV'}</p>{result.diagnostics.truncated&&<p>Amostra limitada a 300 KB; última linha incompleta descartada.</p>}<details><summary>Cabeçalho encontrado ({result.diagnostics.header.length} colunas)</summary><p className="break-words">{result.diagnostics.header.join(', ')||'Não encontrado'}</p></details><p>Anunciantes encontrados: {result.merchants.map(m=>m.name).join(', ')||'Nenhum'}</p><p>Colunas presentes: {result.present.join(', ')}</p><p>Colunas faltando: {result.missing.join(', ')||'Nenhuma'}</p><ul className="space-y-1">{result.examples.map((p,i)=><li key={i} className="break-words">{p.title} · {p.merchant} · {p.price} · {p.category}</li>)}</ul></div>}
    <div className="mt-4 divide-y divide-border">{data.feeds.map(feed=><article key={feed.id} className="py-4"><h3 className="font-semibold">{feed.nome} <span className="text-sm font-normal text-muted-foreground">· {feed.ativo?'Ativo':'Pausado'}</span></h3><p className="break-words text-sm">{feed.anunciantes.join(', ')}</p><p className="break-all text-xs text-muted-foreground">{feed.url_mascarada}</p><p className="mt-2 text-xs text-muted-foreground">Último teste: {date(feed.ultimo_teste_em)} · {feed.ultimo_teste_status||'Não testado'}<br/>Última importação: {date(feed.ultima_importacao_em)} · {feed.ultima_importacao_linhas??'—'} linhas</p><div className="mt-3 flex flex-wrap gap-2">
      <Button variant="outline" disabled={busy} onClick={()=>work(async()=>{setResult(await savedTest({data:feed.id}));await refresh();})}><FlaskConical className="size-4"/>Testar</Button>
      <Button variant="outline" disabled={busy} onClick={()=>work(async()=>{if(!await confirm(`${feed.ativo?'Pausar':'Ativar'} este feed nas próximas execuções? Não altera produtos existentes.`))return;await change({data:{id:feed.id,action:feed.ativo?'pause':'activate'}});await refresh();})}>{feed.ativo?<Pause className="size-4"/>:<Play className="size-4"/>}{feed.ativo?'Pausar':'Ativar'}</Button>
      <Button variant="outline" disabled={busy} onClick={()=>{setForm({id:feed.id,nome:feed.nome,url:''});setResult(null);}}><Pencil className="size-4"/>Substituir URL</Button>
      <Button variant="ghost" disabled={busy} onClick={()=>work(async()=>{if(!await confirm('Remover definitivamente apenas este feed? Não apaga produtos. Se a lista ficar vazia, o segredo AWIN_FEED_URL volta a ser usado.'))return;await change({data:{id:feed.id,action:'remove'}});await refresh();})}><Trash2 className="size-4"/>Remover</Button>
    </div></article>)}</div>
    {!data.feeds.length&&<p className="py-4 text-sm text-muted-foreground">Nenhum feed cadastrado. O importador continua usando o feed atual.</p>}
    {data.canBringSecret&&<AdminAction writes disabled={busy} variant="outline" description="Traz o segredo AWIN_FEED_URL para este cadastro uma única vez, após teste parcial. Não mostra a URL e não importa produtos; até 60 segundos." onClick={()=>work(async()=>{await bring();await refresh();toast.success('Feed atual cadastrado.');})}>Trazer o feed atual (segredo AWIN_FEED_URL) para esta lista</AdminAction>}
  </section>;
}
