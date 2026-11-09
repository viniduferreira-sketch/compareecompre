import { useAdminConfirmation, ActionNote } from "@/components/admin/AdminAction";
import { useState } from "react";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addAwinAllowedMerchant, getAwinAllowlist, removeAwinAllowedMerchant } from "@/lib/awin-allowlist.functions";

export const awinAllowlistQuery = queryOptions({
  queryKey: ["admin", "awin-allowlist"],
  queryFn: () => getAwinAllowlist(),
});

export function AwinAllowlist() {
  const { data: merchants } = useSuspenseQuery(awinAllowlistQuery);
  const confirm = useAdminConfirmation();
  const client = useQueryClient();
  const add = useServerFn(addAwinAllowedMerchant);
  const remove = useServerFn(removeAwinAllowedMerchant);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => client.invalidateQueries({ queryKey: ["admin", "awin-allowlist"] });

  return (
    <section aria-labelledby="awin-allowlist-title" className="mb-8 border-b border-border pb-6">
      <h2 id="awin-allowlist-title" className="text-base font-semibold">Anunciantes Awin permitidos</h2>
      <p className="mt-1 text-sm text-muted-foreground">Somente estes anunciantes entram nas próximas importações. KaBuM também reconhece “Kabum BR” no feed.</p>
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Anunciantes permitidos">
        {merchants.map((merchant) => (
          <li key={merchant} className="flex items-center gap-1 rounded-full border border-border bg-muted/40 py-1 pl-3 pr-1 text-sm">
            <span>{merchant}</span>
            <Button type="button" variant="ghost" size="icon" className="size-7" aria-label={`Remover ${merchant}`} disabled={pending} onClick={async () => {
              if (!await confirm(`Remover ${merchant} dos anunciantes permitidos? Afeta somente as próximas importações. Grava a configuração em segundos.`)) return;
              setPending(true); setError("");
              try { await remove({ data: merchant }); await refresh(); }
              catch (e) { setError(e instanceof Error ? e.message : "Não foi possível remover o anunciante."); }
              finally { setPending(false); }
            }}><X className="size-3.5" /></Button>
          </li>
        ))}
        {!merchants.length && <li className="text-sm text-muted-foreground">Nenhum anunciante permitido; toda a importação Awin será descartada.</li>}
      </ul>
      <form className="mt-4 flex max-w-md gap-2" onSubmit={async (event) => {
        event.preventDefault();
        if (!name.trim()) return;
        if (!await confirm(`Permitir ${name} nas próximas importações Awin? Grava a configuração em segundos.`)) return;
        setPending(true); setError("");
        try { await add({ data: name }); setName(""); await refresh(); }
        catch (e) { setError(e instanceof Error ? e.message : "Não foi possível adicionar o anunciante."); }
        finally { setPending(false); }
      }}>
        <Input aria-label="Nome do anunciante Awin" value={name} onChange={(event) => setName(event.target.value)} maxLength={200} placeholder="Nome do anunciante no feed" disabled={pending} />
        <Button type="submit" disabled={pending || !name.trim()}><Plus className="size-4" />Adicionar</Button>
      </form>
      <ActionNote writes description="Adicionar ou remover altera os anunciantes permitidos nas próximas importações; não modifica produtos existentes. Grava a configuração em segundos." />
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
  );
}
