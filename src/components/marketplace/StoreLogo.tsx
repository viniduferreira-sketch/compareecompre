import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { officialStoreLogo } from "@/lib/store-logos";

// Known merchant domains; unknown stores fall back to an initials badge (never a fake logo).
const STORE_DOMAINS: Record<string, string> = {
  "mercado livre": "mercadolivre.com.br",
  kabum: "kabum.com.br",
  "kabum!": "kabum.com.br",
  reserva: "usereserva.com",
  magalu: "magazineluiza.com.br",
  "magazine luiza": "magazineluiza.com.br",
  "ponto frio": "pontofrio.com.br",
  "casas bahia": "casasbahia.com.br",
  americanas: "americanas.com.br",
  samsung: "samsung.com.br",
  dell: "dell.com.br",
  lenovo: "lenovo.com.br",
  nike: "nike.com.br",
  centauro: "centauro.com.br",
  netshoes: "netshoes.com.br",
  "época cosméticos": "epocacosmeticos.com.br",
  sephora: "sephora.com.br",
};

export function storeDomain(store: string) {
  const key = store.trim().toLocaleLowerCase("pt-BR");
  return STORE_DOMAINS[key] ?? Object.entries(STORE_DOMAINS).find(([name]) => key.startsWith(name))?.[1] ?? null;
}

export function StoreLogo({ store, logoUrl, className }: { store: string; logoUrl?: string | null | undefined; className?: string }) {
  const official = officialStoreLogo(store);
  const sources = [...new Set([logoUrl?.startsWith("https://") ? logoUrl : null, official?.url].filter((url): url is string => Boolean(url)))];
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const src = sources.find((url) => !failedUrls.includes(url));
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (src && img && img.complete && img.naturalWidth === 0) setFailedUrls((urls) => [...urls, src]);
  }, [src]);
  const initials = store.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

  return (
    <span className={cn("inline-flex h-6 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-card text-[9px] font-extrabold text-foreground", className, src === official?.url && official?.inverse && "bg-ink", !src && "bg-muted font-bold text-graphite")}>
      {src ? (
        <img
          ref={ref}
          src={src}
          alt={`Logotipo de ${store}`}
          width={112}
          height={40}
          loading="lazy"
          className="size-full object-contain"
          onError={() => setFailedUrls((urls) => [...urls, src])}
        />
      ) : (
        <span title={store} aria-label={`Loja ${store}`}>{initials}</span>
      )}
    </span>
  );
}
