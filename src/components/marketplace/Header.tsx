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
    <header className="sticky top-0 z-40 bg-primary-gradient shadow-glow">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:gap-8">
        <a href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary-foreground/15 text-primary-foreground backdrop-blur">
            <Tag className="size-5" />
          </span>
          <span className="font-display text-2xl font-extrabold tracking-tight text-primary-foreground">
            Compare <span className="text-savings-foreground/90">e</span> Compre
          </span>
        </a>

        <form
          className="flex flex-1 items-center gap-2 rounded-full bg-card p-1.5 pl-4 shadow-lift md:mx-auto md:max-w-2xl"
          onSubmit={(event) => {
            event.preventDefault();
            if (term.trim()) onSearch(term.trim());
          }}
        >
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Pesquise no Compare e Compre"
            aria-label="Pesquise no Compare e Compre"
            className="h-10 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" variant="hero" className="h-10 shrink-0 rounded-full px-6 text-base font-semibold">
            Buscar
          </Button>
        </form>
      </div>

      <nav className="border-t border-primary-foreground/15">
        <ul className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2.5 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((category) => (
            <li key={category}>
              <button
                type="button"
                onClick={() => {
                  setTerm(category);
                  onSearch(category);
                }}
                className="whitespace-nowrap rounded-full px-4 py-1.5 font-semibold text-primary-foreground/85 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground"
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
