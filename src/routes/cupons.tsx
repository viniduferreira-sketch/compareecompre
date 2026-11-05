import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Copy, ExternalLink, Ticket, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/marketplace/Header";
import { SiteFooter } from "@/components/marketplace/SiteFooter";
import { StoreLogo } from "@/components/marketplace/StoreLogo";
import { getActiveCoupons } from "@/lib/coupons.functions";

const couponsQuery = queryOptions({ queryKey: ["active-coupons"], queryFn: () => getActiveCoupons(), staleTime: 60_000 });
export const Route = createFileRoute("/cupons")({
  staticData: { sitemap: true },
  head: () => ({ meta: [
    { title: "Cupons de Desconto | Compare e Compre" },
    { name: "description", content: "Cupons ativos das lojas parceiras do Compare e Compre, com códigos de desconto, validade e links de afiliado." },
    { property: "og:title", content: "Cupons de Desconto | Compare e Compre" },
    { property: "og:description", content: "Encontre códigos de desconto reais das lojas parceiras e confira a validade antes de comprar." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(couponsQuery),
  component: CouponsPage,
  errorComponent: ({ reset }) => <main className="mx-auto max-w-7xl px-5 py-12"><h1 className="text-2xl font-bold">Cupons de Desconto</h1><p className="my-5 text-muted-foreground">Não foi possível carregar os cupons.</p><Button onClick={reset}>Tentar novamente</Button></main>,
});

type CouponRow = Awaited<ReturnType<typeof getActiveCoupons>>[number];
function CouponCard({ coupon }: { coupon: CouponRow }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  return <article className="flex h-full flex-col rounded-lg border border-border bg-card p-5 shadow-card">
    <div className="flex items-center justify-between gap-3">
      <StoreLogo store={coupon.store} logoUrl={coupon.logo_url} className="h-10 w-28" />
      <span className="text-xs font-semibold text-muted-foreground">{coupon.store}</span>
    </div>
    <h2 className="mt-5 break-words text-lg font-bold leading-relaxed">{coupon.title}</h2>
    {coupon.description && <p className="mt-2 text-sm text-muted-foreground">{coupon.description}</p>}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-primary/40 bg-primary/5 p-3">
      <code className="min-w-0 break-all text-base font-bold text-primary">{coupon.code}</code>
      <Button size="sm" variant="outline" aria-label={`Copiar código ${coupon.code}`} onClick={async () => {
        setError("");
        try { await navigator.clipboard.writeText(coupon.code); setCopied(true); }
        catch { setError("Não foi possível copiar. Selecione o código acima."); }
      }}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? "Copiado!" : "Copiar Código"}</Button>
    </div>
    <span role="status" className="sr-only">{copied ? `Código ${coupon.code} copiado` : ""}</span>
    {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
    <div className="mt-auto pt-5">
      <p className="mb-3 text-xs text-muted-foreground">{coupon.expires_at ? `Válido até ${new Date(coupon.expires_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : "Validade não informada pela loja"}</p>
      <Button asChild className="w-full"><a href={coupon.affiliate_url} target="_blank" rel="sponsored noopener noreferrer">Ir para a loja<ExternalLink className="size-4" /></a></Button>
      <p className="mt-3 text-xs text-muted-foreground">Verificado em {new Date(coupon.last_synced_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}</p>
    </div>
  </article>;
}

function CouponsPage() {
  const { data: coupons } = useSuspenseQuery(couponsQuery);
  const navigate = Route.useNavigate();
  const [term, setTerm] = useState("");
  const filtered = coupons.filter((c) => `${c.store} ${c.title} ${c.code}`.toLocaleLowerCase("pt-BR").includes(term.toLocaleLowerCase("pt-BR")));
  return <><Header initialTerm="" onSearch={(q) => { void navigate({ to: "/", search: { q } }); }} />
    <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-7">
        <div><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><Ticket className="size-5" />Lojas parceiras</div><h1 className="font-display text-3xl font-extrabold">Cupons de Desconto</h1><p className="mt-3 text-sm text-muted-foreground">{coupons.length} {coupons.length === 1 ? "cupom ativo" : "cupons ativos"} · Condições e disponibilidade definidas pela loja.</p></div>
        <label className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 sm:w-80"><Search className="size-4 text-muted-foreground" /><input aria-label="Buscar cupons por loja" placeholder="Buscar loja ou cupom" value={term} onChange={(e) => setTerm(e.target.value)} className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
      </div>
      <p className="py-5 text-xs text-muted-foreground">Os links são de afiliado: podemos receber comissão, sem custo adicional para você.</p>
      {filtered.length ? <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">{filtered.map((coupon) => <CouponCard key={coupon.id} coupon={coupon} />)}</div> : <div className="py-16 text-center"><Ticket className="mx-auto mb-4 size-10 text-muted-foreground" /><p className="font-semibold">{term ? "Nenhum cupom encontrado para esta busca." : "Nenhum cupom ativo disponível no momento."}</p></div>}
    </main><SiteFooter /></>;
}