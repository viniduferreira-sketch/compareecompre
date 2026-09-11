import { Search, Tag } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export const CATEGORIES = [
  "Eletrônicos",
  "Moda",
  "Casa",
  "Celulares",
  "Games",
  "Beleza",
  "Esportes",
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
    <header className="relative z-40 bg-primary-gradient shadow-glow">
      <div className="mx-auto flex max-w-6xl flex-col gap-2.5 px-5 py-2.5 md:flex-row md:items-center md:gap-6 lg:px-8">
        <a
          href="/"
          className="flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-card px-3 py-1.5 shadow-card"
        >
          <Tag className="size-4 text-primary" />
          <span className="font-display text-base font-extrabold tracking-tight text-primary">
            Compare e Compre
          </span>
        </a>

        <form
          className="flex flex-1 items-center gap-2 rounded-full bg-card p-1 pl-3.5 shadow-lift md:mx-auto md:max-w-xl"
          onSubmit={(event) => {
            event.preventDefault();
            if (term.trim()) onSearch(term.trim());
          }}
        >
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Pesquise no Compare e Compre"
            aria-label="Pesquise no Compare e Compre"
            className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" variant="hero" className="h-8 shrink-0 rounded-full px-4 text-sm font-semibold">
            Buscar
          </Button>
        </form>
      </div>

      <nav className="border-t border-primary-foreground/15">
        <ul className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-5 py-1.5 text-xs [scrollbar-width:none] lg:px-8 [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((category) => (
            <li key={category}>
              <button
                type="button"
                onClick={() => {
                  setTerm(category);
                  onSearch(category);
                }}
                className="whitespace-nowrap rounded-full px-3 py-1 font-semibold text-primary-foreground/85 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground"
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
