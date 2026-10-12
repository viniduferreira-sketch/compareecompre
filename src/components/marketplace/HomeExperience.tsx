import { BadgeCheck, BellRing, Building2, Check, Mail, ShieldCheck, Sparkles, Store } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { subscribeToPriceAlerts } from "@/lib/price-alert-signup.functions";

const FUTURE_STORES = ["Nova loja", "Nova loja", "Nova loja"];

export function TrustBanner() {
  return (
    <section className="bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-10 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center lg:px-8 lg:py-12">
        <span className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow">
          <ShieldCheck className="size-6" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase text-footer-accent">Compra mais tranquila</p>
          <h2 className="mt-1 max-w-3xl font-display text-2xl font-extrabold leading-tight md:text-3xl">
            Compre com segurança. Redirecionamos você apenas para lojas oficiais e verificadas.
          </h2>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-foreground/75">
          <BadgeCheck className="size-5 text-footer-accent" /> Verificação contínua
        </div>
      </div>
    </section>
  );
}

export function MonitoredStores() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase text-primary">Autoridade e transparência</p>
        <h2 className="mt-2 font-display text-2xl font-extrabold text-foreground md:text-3xl">Lojas monitoradas</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Acompanhamos ofertas publicadas em grandes lojas e mostramos a origem de cada preço antes do seu clique.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <article className="flex min-h-32 flex-col justify-between rounded-lg border border-store bg-store p-4 shadow-card">
          <span className="flex size-9 items-center justify-center rounded-md bg-card text-store-foreground">
            <Store className="size-5" />
          </span>
          <div>
            <h3 className="font-display text-base font-extrabold text-store-foreground">Mercado Livre</h3>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-store-foreground/75">
              <Check className="size-3.5" /> Loja monitorada
            </p>
          </div>
        </article>
        {FUTURE_STORES.map((label, index) => (
          <article key={`${label}-${index}`} className="flex min-h-32 flex-col justify-between rounded-lg border border-dashed border-border bg-card p-4">
            <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Building2 className="size-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-foreground">{label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Integração em breve</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PriceAlertSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const subscribe = useServerFn(subscribeToPriceAlerts);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || pending) return;
    setPending(true);
    setError("");
    try {
      const result = await subscribe({ data: { email: email.trim() } });
      if (!result.success) throw new Error("Signup failed");
      setSubmitted(true);
    } catch {
      setError("Não foi possível registrar seu interesse. Tente novamente.");
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="px-5 py-16 lg:px-8 lg:py-20">
      <div className="relative mx-auto grid max-w-7xl overflow-hidden rounded-xl bg-primary px-6 py-10 text-primary-foreground shadow-glow md:grid-cols-[minmax(0,1fr)_minmax(340px,0.75fr)] md:items-center md:gap-12 md:px-12 md:py-14">
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-md bg-primary-foreground/15 px-2.5 py-1 text-xs font-bold uppercase">
            <BellRing className="size-3.5" /> Alerta de preço
          </span>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-extrabold leading-tight md:text-4xl">
            Não encontrou o preço ideal?
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/80 md:text-base">
            Crie um alerta e avisaremos quando aparecer uma oportunidade melhor para o produto que você procura.
          </p>
        </div>

        {submitted ? (
          <div role="status" className="mt-7 flex min-h-24 items-center gap-3 rounded-lg bg-card p-5 text-card-foreground md:mt-0">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-savings text-savings-foreground">
              <Check className="size-5" />
            </span>
            <div>
              <p className="font-bold">Interesse registrado</p>
              <p className="mt-1 text-xs text-muted-foreground">Estamos preparando os alertas personalizados.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} aria-busy={pending} className="mt-7 rounded-lg bg-card p-2 shadow-lift md:mt-0">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex min-w-0 flex-1 items-center gap-2 px-3">
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                <span className="sr-only">Seu melhor e-mail</span>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  disabled={pending}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Seu melhor e-mail"
                  className="h-11 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </label>
              <Button type="submit" disabled={pending} variant="ink" size="lg" className="shrink-0">
                {pending ? "Registrando..." : "Criar alerta"} <Sparkles className="size-4" />
              </Button>
            </div>
            {error && <p role="alert" className="px-3 pt-2 text-xs text-destructive">{error}</p>}
            <p className="px-3 pb-1 pt-2 text-[11px] text-muted-foreground">Sem spam. Você poderá cancelar quando quiser.</p>
          </form>
        )}
      </div>
    </section>
  );
}