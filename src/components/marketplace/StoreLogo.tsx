import { useState } from "react";

import { cn } from "@/lib/utils";

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

export function StoreLogo({ store, className }: { store: string; className?: string }) {
  const domain = storeDomain(store);
  const [failed, setFailed] = useState(false);
  const initials = store.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

  return (
    <span className={cn("inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card text-[9px] font-extrabold text-foreground", className)} aria-hidden="true">
      {domain && !failed ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
          alt=""
          width={20}
          height={20}
          loading="lazy"
          className="size-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        initials
      )}
    </span>
  );
}
