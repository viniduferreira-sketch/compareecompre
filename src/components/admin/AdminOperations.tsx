import { toast } from "sonner";
import { AdminAction } from "./AdminAction";
import { importsQuery } from "./admin-shared";
import { Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Download, RefreshCw, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImportStatus, startAwinImport, startLomadeeSync, startCouponSync, revalidateMlDryRun, revalidateMlApply, mlQualityDryRun, partnerQualityDryRun } from "@/lib/admin-import.functions";
import type { MlQualityResult } from "@/lib/ml-quality.server";
import type { PartnerQualitySimulation } from "@/lib/partner-quality.server";

export function AdminOperations({ section }: { section: "sync" | "quality" }) {
  const { data: imports } = useSuspenseQuery(importsQuery);
  const client = useQueryClient();
  const start = useServerFn(startAwinImport);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lomadeePending, setLomadeePending] = useState(false);
  const syncLomadee = useServerFn(startLomadeeSync);
  const syncCoupons = useServerFn(startCouponSync);
  const [couponPending, setCouponPending] = useState(false);
  const dryRunMl = useServerFn(revalidateMlDryRun);
  const applyMl = useServerFn(revalidateMlApply);
  const [mlPending, setMlPending] = useState<"dry" | "apply" | null>(null);
  const qualityDryRun = useServerFn(mlQualityDryRun);
  const [qualityPending, setQualityPending] = useState(false);
  const [qualityResult, setQualityResult] = useState<MlQualityResult | null>(null);
  const partnerQuality = useServerFn(partnerQualityDryRun);
  const [partnerQualityPending, setPartnerQualityPending] = useState(false);
  const [partnerQualityResult, setPartnerQualityResult] = useState<PartnerQualitySimulation | null>(null);
  useEffect(() => { if (notice) toast.success(notice); }, [notice]);
  useEffect(() => { if (error) toast.error(error); }, [error]);
  const mlRunning = imports.some((j) => j.source === "mercadolivre" && (j.status === "queued" || j.status === "running"));
  const active = imports.some((job) => job.source !== "lomadee" && job.source !== "mercadolivre" && (job.status === "queued" || job.status === "running"));
  return <div>
    {section === "quality" && <p className="mb-6 rounded-md border border-seal-border bg-seal-soft p-4 text-sm text-seal-foreground">Lojas parceiras confiáveis não passam por filtro de qualidade; use só para auditar.</p>}
    <div className="grid gap-6 lg:grid-cols-2">
      {section === "sync" && <>
      <AdminAction writes={true} description="Solicita uma importação do feed Awin pelo GitHub. Use para atualizar o catálogo. Grava o histórico e os produtos. Disparo em segundos; processamento pode levar dezenas de minutos." disabled={pending || active} onClick={async () => {
        setPending(true); setError("");
        try { await start(); await client.invalidateQueries({ queryKey: ["admin", "awin-imports"] }); }
        catch (e) { setError(e instanceof Error ? e.message : "Não foi possível iniciar a importação."); }
        finally { setPending(false); }
      }}><Download className="size-4" />{pending ? "Solicitando…" : "Sincronizar catálogo"}</AdminAction>
      <AdminAction writes={true} description="Atualiza produtos e cupons autorizados da Lomadee, retomando o cursor. Use para atualizar ofertas. Grava dados; cerca de 1 minuto, dependendo da API." variant="secondary" disabled={lomadeePending || couponPending || imports.some((j) => j.source === "lomadee" && j.status === "running")} onClick={async () => {
        setLomadeePending(true); setError(""); setNotice("");
        try { const r = await syncLomadee(); setNotice(`Lomadee: ${r.indexed} produtos enviados para a busca, ${r.coupons} cupons atualizados, ${r.skipped} descartados.${r.emptyStores.includes("Shopee") ? " Shopee: nenhum produto disponibilizado pela API nesta rodada." : ""}`); }
        catch (e) { setError(e instanceof Error ? e.message : "Não foi possível sincronizar a Lomadee."); }
        finally { setLomadeePending(false); await client.invalidateQueries({ queryKey: ["admin", "awin-imports"] }); }
      }}><Download className="size-4" />{lomadeePending ? "Sincronizando Lomadee… (até 1 min)" : "Sincronizar Lomadee"}</AdminAction>
      <AdminAction writes={true} description="Atualiza somente cupons da Lomadee. Use para renovar códigos e validade. Grava dados; cerca de 1 minuto, dependendo da API." variant="outline" disabled={couponPending || lomadeePending || imports.some((j) => j.source === "lomadee" && j.status === "running")} onClick={async () => {
        setCouponPending(true); setError(""); setNotice("");
        try { const r = await syncCoupons(); setNotice(`Lomadee: ${r.coupons} cupons atualizados.`); }
        catch (e) { setError(e instanceof Error ? e.message : "Não foi possível sincronizar os cupons."); }
        finally { setCouponPending(false); await client.invalidateQueries({ queryKey: ["admin", "awin-imports"] }); }
      }}><Ticket className="size-4" />{couponPending ? "Sincronizando cupons…" : "Sincronizar cupons"}</AdminAction>
      </>}
      {section === "quality" && <>
      <AdminAction writes={false} description="Consulta até 200 ofertas antigas do Mercado Livre e mostra quais ficariam indisponíveis. Não grava. Pode levar alguns minutos." variant="outline" disabled={mlPending !== null} onClick={async () => {
        setMlPending("dry"); setError(""); setNotice("");
        try { const r = await dryRunMl(); setNotice(`${r.message}${r.sampleUnavailable.length ? ` Exemplos: ${r.sampleUnavailable.join(", ")}` : ""}`); }
        catch (e) { setError(e instanceof Error ? e.message : "Não foi possível simular a revalidação."); }
        finally { setMlPending(null); }
      }}><RefreshCw className="size-4" />{mlPending === "dry" ? "Simulando…" : "Revalidar ML (simulação)"}</AdminAction>
      <AdminAction writes={true} description="Reconsulta até 200 ofertas antigas do Mercado Livre e atualiza preço ou marca indisponibilidade explícita. Não apaga; erros ficam desconhecidos e o disjuntor de 30% impede alterações. Pode levar alguns minutos." variant="secondary" disabled={mlPending !== null || mlRunning} onClick={async () => {
        setMlPending("apply"); setError(""); setNotice("");
        try { const r = await applyMl(); setNotice(r.message); }
        catch (e) { setError(e instanceof Error ? e.message : "Não foi possível revalidar o Mercado Livre."); }
        finally { setMlPending(null); await client.invalidateQueries({ queryKey: ["admin", "awin-imports"] }); }
      }}><Download className="size-4" />{mlPending === "apply" ? "Revalidando ML…" : "Revalidar ML"}</AdminAction>
      <AdminAction writes={false} description="Avalia uma amostra do Mercado Livre por vendedor, procura e preço de 0,5 a 1,6 vez a mediana. Não grava; pode levar alguns minutos." variant="outline" disabled={qualityPending} onClick={async () => {
        setQualityPending(true); setError(""); setNotice(""); setQualityResult(null);
        try { const r = await qualityDryRun(); setQualityResult(r); setNotice(r.message); }
        catch (e) { setError(e instanceof Error ? e.message : "Não foi possível simular a qualidade do ML."); }
        finally { setQualityPending(false); }
      }}><RefreshCw className="size-4" />{qualityPending ? "Avaliando qualidade… (alguns minutos)" : "Qualidade ML (simulação)"}</AdminAction>
      <AdminAction writes={false} description="Audita os dados Awin e Lomadee, autorização, disponibilidade e preços comparáveis. Não grava. Pode levar alguns minutos." variant="outline" disabled={partnerQualityPending} onClick={async () => {
        setPartnerQualityPending(true); setError(""); setNotice(""); setPartnerQualityResult(null);
        try { const r = await partnerQuality(); setPartnerQualityResult(r); setNotice(r.message); }
        catch (e) { setError(e instanceof Error ? e.message : "Não foi possível simular a qualidade dos parceiros."); }
        finally { setPartnerQualityPending(false); }
      }}><RefreshCw className="size-4" />{partnerQualityPending ? "Avaliando parceiros…" : "Qualidade parceiros (simulação)"}</AdminAction>
      </>}
      <Button variant="outline" size="icon" aria-label="Atualizar status" title="Atualizar status" onClick={() => client.invalidateQueries({ queryKey: ["admin", "awin-imports"] })}><RefreshCw className="size-4" /></Button>
      {active && <span role="status" className="text-sm text-muted-foreground">Importação em andamento</span>}
    </div>
    {notice && <p role="status" className="mb-5 text-sm text-foreground">{notice}</p>}
    {error && <p role="alert" className="mb-5 text-sm text-destructive">{error}</p>}
    {qualityResult && (
      <section aria-label="Resultado da simulação de qualidade" className="mb-8 rounded-xl border border-border bg-card p-5 text-sm">
        <h2 className="text-base font-semibold">Qualidade ML — simulação (nada foi gravado)</h2>
        <p className="mt-2 text-muted-foreground">
          {qualityResult.evaluated} avaliados · {qualityResult.approved} aprovados · {qualityResult.rejected} rejeitados · {qualityResult.unknown} desconhecidos · {qualityResult.skipped} ignorados
        </p>
        {Object.keys(qualityResult.byReason).length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {Object.entries(qualityResult.byReason).map(([reason, count]) => (
              <li key={reason} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs">{reason}: {count}</li>
            ))}
          </ul>
        )}
        {qualityResult.rejectedSample.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">Rejeitados (até 30)</h3>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {qualityResult.rejectedSample.map((s) => (
                <li key={s.id} className="border-b border-border pb-1">
                  <span className="font-mono">{s.id}</span> — {s.title.slice(0, 70)} — R$ {s.price.toFixed(2)} — {s.seller || "vendedor desconhecido"} — <span className="text-destructive">{s.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {qualityResult.approvedSample.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">Aprovados (até 15)</h3>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {qualityResult.approvedSample.map((s) => (
                <li key={s.id} className="border-b border-border pb-1">
                  <span className="font-mono">{s.id}</span> — {s.title.slice(0, 70)} — R$ {s.price.toFixed(2)} — {s.seller || "vendedor desconhecido"} — <span className="text-foreground">{s.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    )}
    {partnerQualityResult && (
      <section aria-label="Resultado da simulação de qualidade dos parceiros" className="mb-8 rounded-xl border border-border bg-card p-5 text-sm">
        <h2 className="text-base font-semibold">Qualidade Awin e Lomadee — simulação (nada foi gravado)</h2>
        <p className="mt-2 text-muted-foreground">
          {partnerQualityResult.evaluated} avaliados · {partnerQualityResult.approved} aprovados · {partnerQualityResult.rejected} rejeitados · {partnerQualityResult.withoutCategory} sem categoria
        </p>
        <p className="mt-1 text-muted-foreground">
          {partnerQualityResult.sharedGtins} GTINs comparáveis nesta simulação · {partnerQualityResult.allSourcesSharedGtins} GTINs em 2+ lojas no catálogo inteiro
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {Object.entries(partnerQualityResult.bySource).map(([source, row]) => (
            <li key={source} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs">
              {source === "awin" ? "Awin" : "Lomadee"}: {row.evaluated} avaliados, {row.approved} aprovados, {row.rejected} rejeitados
            </li>
          ))}
        </ul>
        {Object.keys(partnerQualityResult.byReason).length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {Object.entries(partnerQualityResult.byReason).map(([reason, count]) => (
              <li key={reason} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs">{reason}: {count}</li>
            ))}
          </ul>
        )}
        {partnerQualityResult.rejectedSample.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">Rejeitados (até 30)</h3>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {partnerQualityResult.rejectedSample.map((sample) => (
                <li key={sample.id} className="border-b border-border pb-1">
                  <span className="font-mono">{sample.id}</span> — {sample.title.slice(0, 70)} — R$ {sample.price.toFixed(2)} — {sample.store} — <span className="text-destructive">{sample.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {partnerQualityResult.approvedSample.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">Aprovados (até 15)</h3>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {partnerQualityResult.approvedSample.map((sample) => (
                <li key={sample.id} className="border-b border-border pb-1">
                  <span className="font-mono">{sample.id}</span> — {sample.title.slice(0, 70)} — R$ {sample.price.toFixed(2)} — {sample.store}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    )}
  </div>;
}
