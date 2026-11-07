import { BadgeCheck, BellRing, Check, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { subscribeToPriceAlerts } from "@/lib/price-alert-signup.functions";
import { priceAlertSignupSchema } from "@/lib/price-alert-signup";

import { StoreLogo } from "@/components/marketplace/StoreLogo";

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

export function MonitoredStores({ stores = [], onSelect }: { stores?: Array<{ name: string; count: number; logoUrl?: string | null }>; onSelect?: (store: string) => void }) {
  const active = stores.filter((store) => store.count > 0);
  return (
    <section className="mx-auto max-w-7xl px-5 py-4 lg:px-8">
      <h2 className="font-display text-sm font-bold uppercase text-muted-foreground">Lojas monitoradas</h2>
      <Carousel opts={{ align: "start", dragFree: true, containScroll: "trimSnaps" }} aria-label="Lojas monitoradas" className="mt-2 px-9">
        <CarouselContent className="-ml-2 cursor-grab touch-pan-y active:cursor-grabbing">
        {active.map((store, index) => (
          <CarouselItem key={store.name} aria-label={`${index + 1} de ${active.length}: ${store.name}`} className="basis-[108px] pl-2">
          <Button
            variant="ghost"
            type="button"
            onClick={() => onSelect?.(store.name)}
            aria-label={`Ver ofertas de ${store.name}`}
            className="group flex h-auto w-full flex-col justify-start gap-1.5 whitespace-normal rounded-none p-1 text-center hover:bg-transparent"
          >
            <span className="flex size-[88px] shrink-0 items-center justify-center rounded-full border border-border bg-card transition-colors duration-200 group-hover:border-primary/40 motion-reduce:transition-none">
              <StoreLogo store={store.name} logoUrl={store.logoUrl} className="h-11 w-[60px] rounded-sm text-[11px]" />
            </span>
            <div className="w-full">
              <h3 className="w-full truncate text-xs font-medium leading-4 text-foreground">{store.name}</h3>
              <p className="text-[9px] leading-3 text-muted-foreground">
                {`${store.count.toLocaleString("pt-BR")} ${store.count === 1 ? "oferta" : "ofertas"}`}
              </p>
            </div>
          </Button>
          </CarouselItem>
        ))}
        </CarouselContent>
        <CarouselPrevious aria-label="Lojas anteriores" title="Lojas anteriores" className="left-0 top-10 size-8 bg-card shadow-sm" />
        <CarouselNext aria-label="Próximas lojas" title="Próximas lojas" className="right-0 top-10 size-8 bg-card shadow-sm" />
      </Carousel>
    </section>
  );
}

export function PriceAlertSignup() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const subscribe = useServerFn(subscribeToPriceAlerts);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!consent || pending) return;
    const validated = priceAlertSignupSchema.safeParse({ email, consent });
    if (!validated.success) {
      setError("Informe um e-mail válido e aceite a Política de Privacidade.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await subscribe({ data: validated.data });
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
            <BellRing className="size-3.5" /> Em breve
          </span>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-extrabold leading-tight md:text-4xl">
            Alertas de preço em breve
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/80 md:text-base">
            Entre na lista e avisamos quando os alertas estiverem no ar
          </p>
        </div>

        <div className="mt-7 min-w-0 md:mt-0">
        {submitted ? (
          <div role="status" className="mt-7 flex min-h-24 items-center gap-3 rounded-lg bg-card p-5 text-card-foreground md:mt-0">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-savings text-savings-foreground">
              <Check className="size-5" />
            </span>
            <div>
              <p className="font-bold">Interesse registrado</p>
              <p className="text-xs leading-5 text-muted-foreground">Avisaremos quando os alertas estiverem no ar.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} aria-busy={pending} className="rounded-lg bg-card p-2 shadow-lift">
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
              <Button type="submit" disabled={pending || !consent} variant="ink" size="lg" className="shrink-0">
                {pending ? "Registrando..." : "Entrar na lista"} <Sparkles className="size-4" />
              </Button>
            </div>
            <div className="flex items-start gap-2 px-3 pb-1 pt-3">
              <input
                id="price-alert-consent"
                name="consent"
                type="checkbox"
                required
                checked={consent}
                disabled={pending}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
              />
              <label htmlFor="price-alert-consent" className="text-xs leading-5 text-card-foreground">
                Concordo em receber e-mails do Compare e Compre e aceito a{" "}
                <Link to="/politica-de-privacidade" className="font-semibold text-primary underline underline-offset-2">Política de Privacidade</Link>
              </label>
            </div>
            {error && <p role="alert" className="px-3 pt-2 text-xs text-destructive">{error}</p>}
          </form>
        )}
          <p className="mt-3 text-xs leading-5 text-primary-foreground">
            Para cancelar, escreva para{" "}
            <a href="mailto:contato@compareecompre.com.br" className="break-all font-semibold underline underline-offset-2">contato@compareecompre.com.br</a>{" "}
            e removemos seu e-mail.
          </p>
        </div>
      </div>
    </section>
  );
}