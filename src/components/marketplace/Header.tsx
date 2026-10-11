import { Search, Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { CATEGORY_ITEMS } from "@/components/category-icons/categories";
import { cn } from "@/lib/utils";

export const CATEGORIES = CATEGORY_ITEMS.map(({ name }) => name);

export function Header({
  onSearch,
  initialTerm,
}: {
  onSearch: (term: string) => void;
  initialTerm: string;
}) {
  const [term, setTerm] = useState(initialTerm);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateHeaderShadow = () => setIsScrolled(window.scrollY > 8);
    updateHeaderShadow();
    window.addEventListener("scroll", updateHeaderShadow, { passive: true });
    return () => window.removeEventListener("scroll", updateHeaderShadow);
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const updateHeight = () => {
      document.documentElement.style.setProperty("--header-height", `${header.getBoundingClientRect().height}px`);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--header-height");
    };
  }, []);

  return (
    <header
      ref={headerRef}
      data-scrolled={isScrolled}
      className={cn(
        "sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md transition-shadow duration-200",
        isScrolled && "shadow-card",
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:gap-8 lg:px-8">
        <a
          href="/"
          className="flex w-fit shrink-0 items-center gap-2"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow"><Tag className="size-4" /></span>
          <span className="font-display text-lg font-extrabold text-foreground">
            Compare <span className="text-primary">e Compre</span>
          </span>
        </a>

        <form
          className="flex flex-1 items-center gap-2 rounded-xl border-2 border-transparent bg-muted p-1 pl-3.5 transition-colors focus-within:border-primary/30 focus-within:bg-card md:mx-auto md:max-w-2xl"
          onSubmit={(event) => {
            event.preventDefault();
            if (term.trim()) onSearch(term.trim());
          }}
        >
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Busque produtos, marcas e muito mais..."
            aria-label="Busque produtos, marcas e muito mais"
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" variant="hero" className="h-9 shrink-0 rounded-lg px-5 text-sm font-bold">
            Buscar
          </Button>
        </form>
      </div>

      <nav className="border-t border-border">
        <ul className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 py-2 text-xs [scrollbar-width:none] lg:px-8 [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((category) => (
            <li key={category}>
              <button
                type="button"
                onClick={() => {
                  setTerm(category);
                  onSearch(category);
                }}
                className="whitespace-nowrap font-semibold text-muted-foreground transition-colors hover:text-primary"
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
