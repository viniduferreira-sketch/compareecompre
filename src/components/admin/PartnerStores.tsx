import { useState, useEffect } from "react";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Settings, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoreLogo } from "@/components/marketplace/StoreLogo";
import { AdminAction, ActionNote, useAdminConfirmation } from "./AdminAction";
import { getPartnerStores, savePartnerStore, setStoreImport, storeVisibilityBatch, storeGroupingBatch, discoverPartnerStores } from "@/lib/partner-stores.functions";
import { normalizeAwinMerchantName } from "@/lib/awin-allowlist";
import { AwinFeeds } from "./AwinFeeds";
export const partnerStoresQuery = queryOptions({ queryKey: ["admin", "partner-stores"], queryFn: () => getPartnerStores(), staleTime: 300000 });
type Store = Awaited<ReturnType<typeof getPartnerStores>>[number];

function StoreRow({ store, refresh }: { store: Store; refresh: () => Promise<void> }) {
  const confirm = useAdminConfirmation();
  const save = useServerFn(savePartnerStore); const toggleImport = useServerFn(setStoreImport); const visibility = useServerFn(storeVisibilityBatch);
  const grouping = useServerFn(storeGroupingBatch);
  const [groupResume, setGroupResume] = useState<{ enabled: boolean; cursor?: string } | null>(null);
  useEffect(() => { try { const saved = sessionStorage.getItem(`store-grouping:${store.id}`); if (saved) setGroupResume(JSON.parse(saved)); } catch { /* No saved grouping. */ } }, [store.id]);
  const [editing, setEditing] = useState(false); const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState({ name: store.name, logo_url: store.logo_url ?? "", description: store.description, notes: store.notes });
  const [resume, setResume] = useState<{ enabled: boolean; cursor?: string } | null>(null);
  useEffect(() => { try { const saved = sessionStorage.getItem(`store-visibility:${store.id}`); if (saved) setResume(JSON.parse(saved)); } catch { /* No saved operation. */ } }, [store.id]);
  const [progress, setProgress] = useState("");
  const work = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } catch (error) { toast.error(error instanceof Error ? error.message : "Falha na alteração."); } finally { setBusy(false); } };
  const runGrouping = async (enabled: boolean, start?: string) => {
    let cursor = start; let count = 0;
    do {
      const checkpoint = { enabled, ...(cursor ? { cursor } : {}) };
      setGroupResume(checkpoint); sessionStorage.setItem(`store-grouping:${store.id}`, JSON.stringify(checkpoint));
      const result = await grouping({ data: { id: store.id, enabled, ...(cursor ? { cursor } : {}) } });
      count += result.count; cursor = result.cursor ?? undefined; setProgress(`${count} produtos com agrupamento atualizado`);
    } while (cursor);
    setGroupResume(null); sessionStorage.removeItem(`store-grouping:${store.id}`); await refresh(); toast.success("Agrupamento atualizado, sem importar nem apagar produtos.");
  };
  const runVisibility = async (enabled: boolean, preview: boolean, start?: string) => {
    let cursor = start; let count = 0;
    do {
      if (!preview) { const checkpoint = { enabled, ...(cursor ? { cursor } : {}) }; setResume(checkpoint); sessionStorage.setItem(`store-visibility:${store.id}`, JSON.stringify(checkpoint)); }
      const result = await visibility({ data: { id: store.id, enabled, preview, ...(cursor ? { cursor } : {}) } });
      count += result.count; cursor = result.cursor ?? undefined; setProgress(`${count} produtos ${preview ? "previstos" : "processados"}`);
    } while (cursor);
    if (!preview) { setResume(null); sessionStorage.removeItem(`store-visibility:${store.id}`); await refresh(); toast.success("Visibilidade atualizada, sem apagar produtos."); }
    return count;
  };
  return <article className="border-b border-border py-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><StoreLogo store={store.name} logoUrl={store.logo_url} registryOnly className="h-12 w-16" /><div className="min-w-0"><h3 className="break-words font-semibold">{store.name}</h3><p className="text-xs text-muted-foreground">{store.count.toLocaleString("pt-BR")} produtos no índice · {store.enrollment_status === "authorized" ? "Autorizada" : store.enrollment_status === "not_enrolled" ? "Não inscrito · bloqueado" : store.enrollment_status === "disabled" ? "Desabilitada na rede" : "Inscrição não confirmada"}</p>{store.description && <p className="mt-1 max-w-xl text-sm text-muted-foreground">{store.description}</p>}{store.enrollment_status === "not_enrolled" && <p className="text-xs text-destructive">Provavelmente não gera comissão.</p>}</div></div><div className="flex gap-2"><Button variant="ghost" size="icon" title="Editar loja" aria-label={`Editar ${store.name}`} onClick={() => setEditing(!editing)}><Pencil className="size-4" /></Button>{store.network === "awin" && <Button variant="outline" onClick={() => { const rules = [...document.querySelectorAll<HTMLElement>('[id^="rule-"]')]; const match=rules.find((element)=>normalizeAwinMerchantName(element.id.slice(5))===normalizeAwinMerchantName(store.merchant_name)); if (match) match.scrollIntoView({behavior:"smooth",block:"center"}); else { document.getElementById('awin-rules-title')?.scrollIntoView({behavior:"smooth"}); toast.info("Esta loja ainda não tem regra; adicione-a em Regras por loja Awin."); } }}><Settings className="size-4" />Regras</Button>}</div></div>
    <div className="mt-4 grid gap-4 md:grid-cols-2"><div><label className="flex items-center gap-3 text-sm"><Switch aria-label={`Importar ${store.name}`} checked={store.import_enabled} disabled={busy || store.enrollment_status === "not_enrolled"} onCheckedChange={(enabled) => work(async () => { if (!await confirm(`${enabled ? "Permitir" : "Impedir"} a importação de ${store.name} nas próximas execuções? Não altera produtos existentes; grava em segundos.`)) return; await toggleImport({ data: { id: store.id, enabled } }); await refresh(); })} />Importar</label><ActionNote writes description="Define se a loja entra nas próximas importações. Não inicia execução nem altera produtos existentes; leva segundos." /></div><div><label className="flex items-center gap-3 text-sm"><Switch aria-label={`Exibir ${store.name} no site`} checked={store.display_enabled} disabled={busy} onCheckedChange={(enabled) => work(async () => { const count = await runVisibility(enabled, true); if (!await confirm(`${enabled ? "Exibir" : "Ocultar"} ${store.name}? ${count} produtos no índice serão afetados, sem apagar nem alterar qualidade. Cada lote leva segundos; a operação completa pode levar minutos.`)) return; await runVisibility(enabled, false); })} />Exibir no site</label><ActionNote writes description="Conta antes e altera somente a visibilidade, preservando produtos e qualidade. Lotes de 500, retomáveis; pode levar minutos." /></div></div>
    <div className="mt-4"><label className="flex items-center gap-3 text-sm"><Switch aria-label={`Agrupar variantes de tamanho e cor de ${store.name}`} checked={store.group_variants} disabled={busy} onCheckedChange={(enabled) => work(async () => { if (!await confirm(`${enabled ? "Ativar" : "Desativar"} agrupamento de variantes de ${store.name}? Atualiza somente os cartões desta loja, sem unir lojas diferentes, importar ou apagar produtos. Pode levar minutos.`)) return; await runGrouping(enabled); })} />Agrupar variantes de tamanho e cor</label><ActionNote writes description="Agrupa tamanhos do mesmo produto e cor somente nesta loja. Sem identificação confiável, mantém cartões separados. Atualiza em lotes de 500, retomáveis; pode levar minutos." /></div>
    {groupResume && <Button disabled={busy} variant="outline" onClick={() => work(async () => { if (await confirm("Retomar o agrupamento desta loja, sem importar nem apagar produtos?")) await runGrouping(groupResume.enabled, groupResume.cursor); })}>Retomar agrupamento</Button>}
    {progress && <p role="status" className="mt-2 text-xs text-muted-foreground">{progress}</p>}{resume && <Button disabled={busy} variant="outline" onClick={() => work(async () => { if (await confirm("Retomar a alteração de visibilidade pendente, sem apagar produtos?")) await runVisibility(resume.enabled, false, resume.cursor); })}>Retomar visibilidade</Button>}
    {editing && <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void work(async () => { if (!await confirm("Salvar nome, logo e descrição da loja? Grava em segundos; não altera links nem produtos.")) return; await save({ data: { id: store.id, ...fields } }); await refresh(); setEditing(false); toast.success("Loja salva."); }); }}>{([['name','Nome'],['logo_url','URL da logo'],['description','Descrição'],['notes','Observações']] as const).map(([key,label]) => <label key={key} className="grid gap-1 text-xs">{label}<Input aria-label={`${label} de ${store.name}`} value={fields[key]} onChange={(event) => setFields({ ...fields, [key]: event.target.value })} required={key === "name"} /></label>)}<Button type="submit" disabled={busy}><Save className="size-4" />Salvar loja</Button><ActionNote writes description="Atualiza os dados da loja no cadastro. Nome, logo e descrição aparecem no site; observações ficam privadas. Leva segundos." /></form>}
  </article>;
}
export function PartnerStores() {
  const { data } = useSuspenseQuery(partnerStoresQuery); const client = useQueryClient(); const discover = useServerFn(discoverPartnerStores);
  const [tab, setTab] = useState("awin"); const [query, setQuery] = useState(""); const [filter, setFilter] = useState("all"); const [order, setOrder] = useState("count"); const [busy, setBusy] = useState(false);
  const refresh = async () => { await client.invalidateQueries({ queryKey: ["admin", "partner-stores"] }); await client.invalidateQueries({ queryKey: ["admin", "awin-allowlist"] }); await client.invalidateQueries({ queryKey: ["offers"] }); };
  const rows = data.filter((store) => store.network === tab && store.name.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")) && (filter === "all" || filter === "with" && store.count > 0 || filter === "without" && store.count === 0 || filter === "hidden" && !store.display_enabled)).sort((a,b) => order === "name" ? a.name.localeCompare(b.name) : b.count-a.count);
  return <section className="mb-8"><Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="awin">Awin</TabsTrigger><TabsTrigger value="lomadee">Lomadee</TabsTrigger><TabsTrigger value="mercadolivre">Mercado Livre</TabsTrigger></TabsList></Tabs>{tab === "awin" && <AwinFeeds />}<div className="my-4 flex flex-wrap gap-3"><Input className="max-w-xs" aria-label="Buscar lojas" placeholder="Buscar lojas" value={query} onChange={(e) => setQuery(e.target.value)} /><select aria-label="Filtrar lojas" className="rounded-md border border-input bg-background px-3 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">Todas</option><option value="with">Com produtos</option><option value="without">Sem produtos</option><option value="hidden">Ocultas</option></select><select aria-label="Ordenar lojas" className="rounded-md border border-input bg-background px-3 text-sm" value={order} onChange={(e) => setOrder(e.target.value)}><option value="count">Mais produtos</option><option value="name">Nome</option></select></div><p className="text-xs text-muted-foreground">{rows.length} lojas · contagem total no índice, incluindo ofertas indisponíveis e rejeitadas</p>{tab === "lomadee" && <AdminAction writes disabled={busy} variant="outline" description="Consulta somente a lista de lojas da rede e cadastra as que faltam, incluindo lojas sem produtos. Não importa nem sincroniza produtos; pode levar até um minuto." onClick={async () => { setBusy(true); try { const result = await discover(); await refresh(); toast.success(`${result.read} lojas lidas, ${result.added} cadastradas.`); } finally { setBusy(false); } }}>Ler lojas da Lomadee</AdminAction>}{rows.map((store) => <StoreRow key={store.id} store={store} refresh={refresh} />)}{rows.length === 0 && <p className="py-6 text-sm text-muted-foreground">Nenhuma loja neste filtro.</p>}</section>;
}