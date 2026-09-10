import { Search, Tag } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export const CATEGORIES = [
  "Eletrônicos",
  "Casa",
  "Moda",
  "Games",
  "Beleza",
  "Esportes",
  "Celulares",
] as const;

export function Header({
  onSearch,
  initialTerm,
}: {
  onSearch: (term: string) => void;
  initialTerm: string;
}) {
  const [term, setTerm] = useState(initialTerm);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:gap-6">
        <a href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-gradient text-primary-foreground shadow-glow">
            <Tag className="size-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            Compare <span className="text-primary">e</span> Compre
          </span>
        </a>

        <form
          className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 shadow-card focus-within:border-primary"
          onSubmit={(event) => {
            event.preventDefault();
            if (term.trim()) onSearch(term.trim());
          }}
        >
          <Search className="ml-2 size-4 shrink-0 text-muted-foreground" />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Busque por iPhone, Air Fryer, Smart TV..."
            aria-label="Buscar ofertas"
            className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" variant="hero" className="rounded-full px-5">
            Buscar
          </Button>
        </form>
      </div>

      <nav className="mx-auto max-w-7xl px-4 pb-3">
        <ul className="flex gap-2 overflow-x-auto pb-1 text-sm">
          {CATEGORIES.map((category) => (
            <li key={category}>
              <button
                type="button"
                onClick={() => {
                  setTerm(category);
                  onSearch(category);
                }}
                className="whitespace-nowrap rounded-full border border-border bg-card px-4 py-1.5 font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
