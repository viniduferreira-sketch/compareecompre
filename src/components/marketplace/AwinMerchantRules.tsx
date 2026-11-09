import { AdminAction, ActionNote, useAdminConfirmation } from "@/components/admin/AdminAction";
import { toast } from "sonner";
import { useState } from "react";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteAwinRule, getAwinRules, saveAwinRule, setAwinNotAllowedMark, simulateAwinFilter } from "@/lib/awin-rules.functions";
import { discardLabels } from "@/lib/import-discards";

export const awinRulesQuery = queryOptions({ queryKey: ["admin", "awin-rules"], queryFn: () => getAwinRules() });

type Simulation = Awaited<ReturnType<typeof simulateAwinFilter>>;
const label = (r: string) => discardLabels[r] ?? r;

function RuleForm({ initial, onSaved }: { initial?: { merchant: string; category_terms: string[]; excluded_category_terms: string[]; max_products: number }; onSaved: () => Promise<void> }) {
  const confirm = useAdminConfirmation();
  const save = useServerFn(saveAwinRule);
  const [merchant, setMerchant] = useState(initial?.merchant ?? "");
  const [terms, setTerms] = useState(initial?.category_terms.join(", ") ?? "");
  const [excludedTerms, setExcludedTerms] = useState(initial?.excluded_category_terms.join(", ") ?? "");
  const [max, setMax] = useState(String(initial?.max_products ?? 500));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <form className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_7rem_auto]" onSubmit={async (event) => {
      event.preventDefault();
      if (!await confirm("Salvar esta regra? Altera categorias, exclusões e limite das próximas importações. Não importa produtos; grava em segundos.")) return;
      setPending(true); setError("");
      try {
        await save({ data: { merchant, categoryTerms: terms.split(",").map((t) => t.trim()).filter(Boolean), excludedCategoryTerms: excludedTerms.split(",").map((t) => t.trim()).filter(Boolean), maxProducts: Number(max) } });
        if (!initial) { setMerchant(""); setTerms(""); setExcludedTerms(""); }
        await onSaved(); toast.success("Regra salva.");
      } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível salvar."); }
      finally { setPending(false); }
    }}>
      <Input aria-label="Loja (nome ou ID)" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Loja (nome ou merchant_id)" disabled={pending || !!initial} maxLength={200} required />
      <Input aria-label="Termos permitidos em merchant_category" value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Termos separados por vírgula" disabled={pending} />
      <Input aria-label="Limite por importação" type="number" min={1} max={100000} value={max} onChange={(e) => setMax(e.target.value)} disabled={pending} required />
      <Button type="submit" disabled={pending || !merchant.trim()}>{initial ? "Salvar" : "Adicionar"}</Button>
      <label className="grid gap-1 text-xs text-muted-foreground md:col-span-4">
        Termos excluídos na categoria do parceiro
        <Input aria-label="Termos excluídos em merchant_category" value={excludedTerms} onChange={(e) => setExcludedTerms(e.target.value)} placeholder="Termos excluídos separados por vírgula" disabled={pending} />
      </label>
      <div className="md:col-span-4"><ActionNote writes description="Salvar ou adicionar define a regra das próximas importações. Não altera produtos já gravados; leva segundos." /></div>
      {error && <p role="alert" className="text-sm text-destructive md:col-span-4">{error}</p>}
    </form>
  );
}

export function AwinMerchantRules() {
  const { data: rules } = useSuspenseQuery(awinRulesQuery);
  const confirm = useAdminConfirmation();
  const client = useQueryClient();
  const remove = useServerFn(deleteAwinRule);
  const simulate = useServerFn(simulateAwinFilter);
  const markFn = useServerFn(setAwinNotAllowedMark);
  const [sim, setSim] = useState<Simulation | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const refresh = async () => { await client.invalidateQueries({ queryKey: ["admin", "awin-rules"] }); };

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setMessage("");
    try { await fn(); } catch (e) { setMessage(e instanceof Error ? e.message : "Falha na operação."); }
    finally { setBusy(null); }
  };

  return (
    <section aria-labelledby="awin-rules-title" className="mb-8 border-b border-border pb-6">
      <h2 id="awin-rules-title" className="text-base font-semibold">Regras por loja Awin</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Ordem: anunciante permitido → conteúdo adulto → moeda BRL → categoria do parceiro → limite. Os termos valem só para a categoria do parceiro (palavra inteira, sem diferenciar maiúsculas e acentos; plural simples aceito). Loja sem regra é descartada. Dentro do limite, entram primeiro produtos com GTIN, em estoque e com imagem.
      </p>
      <div className="mt-4 space-y-3">
        {rules.map((rule) => (
          <div id={`rule-${rule.merchant}`} key={rule.merchant} className="flex items-start gap-2">
            <div className="flex-1"><RuleForm initial={rule} onSaved={refresh} /></div>
            <Button type="button" variant="ghost" size="icon" aria-label={`Remover regra ${rule.merchant}`} disabled={!!busy}
              onClick={async () => { if (!await confirm("Remover esta regra? A loja sem regra será descartada nas próximas importações. Grava em segundos.")) return; await run("del", async () => { await remove({ data: rule.merchant }); await refresh(); }); }}><Trash2 className="size-4" /></Button>
          </div>
        ))}
        <RuleForm onSaved={refresh} />
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-3">
        <AdminAction description="Lê o feed atual e conta o que entraria por loja, categoria e limite. Não grava; pode levar alguns minutos." type="button" variant="outline" disabled={!!busy} onClick={() => run("sim", async () => setSim(await simulate()))}>
          {busy === "sim" ? "Simulando…" : "Simular filtro Awin"}
        </AdminAction>
        <AdminAction writes description="Marca ofertas Awin fora da lista permitida como rejeitadas, sem apagar. Use para ocultar ofertas antigas; grava no catálogo e na busca, pode levar alguns minutos." type="button" variant="outline" disabled={!!busy} onClick={() => run("mark", async () => {
          const r = await markFn({ data: { mark: true } });
          setMessage(`${r.changed} registros marcados como “anunciante não permitido”: ${Object.entries(r.byStore).map(([s, n]) => `${s} ${n}`).join(", ") || "nenhum"}.`);
        })}>{busy === "mark" ? "Marcando…" : "Ocultar anunciantes não permitidos"}</AdminAction>
        <AdminAction writes description="Remove somente a marca anunciante não permitido, restaurando as ofertas. Grava no catálogo e na busca, sem apagar; pode levar alguns minutos." type="button" variant="outline" disabled={!!busy} onClick={() => run("unmark", async () => {
          const r = await markFn({ data: { mark: false } });
          setMessage(`${r.changed} registros restaurados: ${Object.entries(r.byStore).map(([s, n]) => `${s} ${n}`).join(", ") || "nenhum"}.`);
        })}>{busy === "unmark" ? "Restaurando…" : "Reverter ocultação"}</AdminAction>
      </div>
      {message && <p role="status" className="mt-3 text-sm">{message}</p>}

      {sim && (
        <div className="mt-5 space-y-5">
          <p className="text-sm">Simulação sem gravação: {sim.totalRows} linhas no feed, {sim.accepted} entrariam.</p>
          {sim.stores.map((s) => (
            <div key={s.merchant} className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold">{s.merchant} <span className="font-normal text-muted-foreground">(ID {s.merchantId}{s.rule ? ` · regra “${s.rule}”, limite ${s.limit}` : " · sem regra"})</span></h3>
              <p className="mt-1 text-sm">{s.rows} linhas · <strong>{s.accepted} entrariam</strong></p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {Object.entries(s.discards).map(([r, n]) => <li key={r} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs">{label(r)}: {n}</li>)}
              </ul>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted-foreground">Categorias do parceiro (até 40)</summary>
                <ul className="mt-2 space-y-0.5 text-xs">
                  {s.categories.map((c) => <li key={c.category}>{c.category}: {c.accepted} de {c.rows}</li>)}
                </ul>
              </details>
              {s.examples.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {s.examples.map((e) => <li key={e.id} className="border-b border-border pb-1"><span className="font-mono">{e.id}</span> — {e.title} — R$ {e.price} — {e.category}{e.gtin ? " — GTIN" : ""}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
