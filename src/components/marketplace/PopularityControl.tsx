import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recalculatePopularity } from "@/lib/popularity.functions";

export function PopularityControl() {
  const recalculate = useServerFn(recalculatePopularity);
  const [busy, setBusy] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [count, setCount] = useState(0);
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  return <section className="mb-8 border-b border-border pb-5" aria-label="Popularidade">
    <Button variant="outline" disabled={busy} onClick={async () => {
      setBusy(true); setError("");
      let next = cursor;
      if (!next) { setCount(0); setDistribution({}); }
      try {
        do {
          const result = await recalculate({ data: { cursor: next } });
          setCount((n) => n + result.updated);
          setDistribution((previous) => {
            const merged = { ...previous };
            for (const [bucket, n] of Object.entries(result.distribution)) merged[bucket] = (merged[bucket] ?? 0) + n;
            return merged;
          });
          next = result.cursor ?? undefined;
          setCursor(next);
        } while (next);
      } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível recalcular."); }
      finally { setBusy(false); }
    }}><RefreshCw className="size-4" />{busy ? "Recalculando popularidade…" : cursor ? "Continuar recálculo de popularidade" : "Recalcular popularidade"}</Button>
    {count > 0 && <p role="status" className="mt-3 text-sm">{count} registros atualizados{busy ? "…" : "."} {Object.entries(distribution).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([bucket, n]) => `${bucket}: ${n}`).join(" · ")}</p>}
    {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
  </section>;
}