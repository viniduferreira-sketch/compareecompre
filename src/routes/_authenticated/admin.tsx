import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Download, LogOut, RefreshCw, ExternalLink, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getImportStatus, startAwinImport, startLomadeeSync, startCouponSync } from "@/lib/admin-import.functions";

const importsQuery = queryOptions({ queryKey: ["admin", "awin-imports"], queryFn: () => getImportStatus(), refetchInterval: 10000 });
export const Route = createFileRoute("/_authenticated/admin")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Importações Awin | Compare e Compre" },
    { name: "description", content: "Controle administrativo de importações do catálogo Awin do Compare e Compre." },
    { property: "og:title", content: "Importações Awin | Compare e Compre" },
    { property: "og:description", content: "Área administrativa do catálogo Compare e Compre." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex,nofollow" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(importsQuery),
  errorComponent: () => <main className="mx-auto max-w-xl p-8"><h1 className="text-xl font-semibold">Acesso restrito</h1><p className="mt-3 text-muted-foreground">Esta conta não tem permissão para consultar importações.</p><Button asChild variant="outline" className="mt-5"><Link to="/auth">Trocar conta</Link></Button></main>,
  component: AdminImports,
});

const labels = { queued: "Aguardando GitHub", running: "Importando", completed: "Concluída", failed: "Falhou" };
function AdminImports() {
  const { data: imports } = useSuspenseQuery(importsQuery);
  const client = useQueryClient();
  const navigate = Route.useNavigate();
  const start = useServerFn(startAwinImport);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lomadeePending, setLomadeePending] = useState(false);
  const syncLomadee = useServerFn(startLomadeeSync);
  const syncCoupons = useServerFn(startCouponSync);
  const [couponPending, setCouponPending] = useState(false);
  const active = imports.some((job) => job.source !== "lomadee" && (job.status === "queued" || job.status === "running"));
  return <main className="mx-auto min-h-screen max-w-5xl px-5 py-10 text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
      <div><Link to="/" className="text-sm font-semibold text-primary">Compare e Compre</Link><h1 className="mt-2 text-2xl font-bold">Importações de parceiros</h1></div>
      <Button variant="outline" onClick={async () => { await client.cancelQueries(); client.clear(); await supabase.auth.signOut(); await navigate({ to: "/auth", replace: true }); }}><LogOut className="size-4" />Sair</Button>
    </header>
    <div className="flex flex-wrap items-center gap-3 py-6">
      <Button disabled={pending || active} onClick={async () => {
        setPending(true); setError("");
        try { await start(); await client.invalidateQueries({ queryKey: ["admin", "awin-imports"] }); }
        catch (e) { setError(e instanceof Error ? e.message : "Não foi possível iniciar a importação."); }
        finally { setPending(false); }
      }}><Download className="size-4" />{pending ? "Solicitando…" : "Sincronizar catálogo"}</Button>
      <Button variant="secondary" disabled={lomadeePending || couponPending || imports.some((j) => j.source === "lomadee" && j.status === "running")} onClick={async () => {
        setLomadeePending(true); setError(""); setNotice("");
        try { const r = await syncLomadee(); setNotice(`Lomadee: ${r.indexed} produtos enviados para a busca, ${r.coupons} cupons atualizados, ${r.skipped} descartados.${r.emptyStores.includes("Shopee") ? " Shopee: nenhum produto disponibilizado pela API nesta rodada." : ""}`); }
        catch (e) { setError(e instanceof Error ? e.message : "Não foi possível sincronizar a Lomadee."); }
        finally { setLomadeePending(false); await client.invalidateQueries({ queryKey: ["admin", "awin-imports"] }); }
      }}><Download className="size-4" />{lomadeePending ? "Sincronizando Lomadee… (até 1 min)" : "Sincronizar Lomadee"}</Button>
      <Button variant="outline" disabled={couponPending || lomadeePending || imports.some((j) => j.source === "lomadee" && j.status === "running")} onClick={async () => {
        setCouponPending(true); setError(""); setNotice("");
        try { const r = await syncCoupons(); setNotice(`Lomadee: ${r.coupons} cupons atualizados.`); }
        catch (e) { setError(e instanceof Error ? e.message : "Não foi possível sincronizar os cupons."); }
        finally { setCouponPending(false); await client.invalidateQueries({ queryKey: ["admin", "awin-imports"] }); }
      }}><Ticket className="size-4" />{couponPending ? "Sincronizando cupons…" : "Sincronizar cupons"}</Button>
      <Button variant="outline" size="icon" aria-label="Atualizar status" title="Atualizar status" onClick={() => client.invalidateQueries({ queryKey: ["admin", "awin-imports"] })}><RefreshCw className="size-4" /></Button>
      {active && <span role="status" className="text-sm text-muted-foreground">Importação em andamento</span>}
    </div>
    {notice && <p role="status" className="mb-5 text-sm text-foreground">{notice}</p>}
    {error && <p role="alert" className="mb-5 text-sm text-destructive">{error}</p>}
    <section aria-label="Últimas importações" className="overflow-x-auto">
      <table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr>{["Solicitada em", "Parceiro", "Status", "Produtos", "Descartados", "Execução"].map((label) => <th key={label} className="p-3 font-medium">{label}</th>)}</tr></thead><tbody>
        {imports.map((job) => <tr key={job.id} className="border-b border-border"><td className="p-3">{new Date(job.created_at).toLocaleString("pt-BR")}</td><td className="p-3">{job.source === "lomadee" ? "Lomadee" : "Awin"}</td><td className="p-3">{labels[job.status as keyof typeof labels]}{job.error && <p className="mt-1 max-w-xs text-xs text-destructive">{job.error}</p>}</td><td className="p-3">{job.indexed}</td><td className="p-3">{job.skipped}</td><td className="p-3">{job.github_run_id && <Button asChild variant="ghost" size="icon"><a title="Ver execução no GitHub" aria-label="Ver execução no GitHub" href={`https://github.com/viniduferreira-sketch/compareecompre/actions/runs/${job.github_run_id}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" /></a></Button>}</td></tr>)}
      </tbody></table>
      {!imports.length && <p className="py-12 text-center text-muted-foreground">Nenhuma importação realizada.</p>}
    </section>
  </main>;
}