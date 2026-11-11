import { BookOpen, Search, Ticket, Tags } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./BrandLogo";
import { safeAnalyticsText, trackEvent } from '@/lib/analytics';

export function Header({
  onSearch,
  initialTerm,
}: {
  onSearch: (term: string) => void;
  initialTerm: string;
}) {
  const [term, setTerm] = useState(initialTerm);
  const navigate = useNavigate();
  useEffect(()=>setTerm(initialTerm),[initialTerm]);
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
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 md:flex md:gap-8 lg:px-8">
        <BrandLogo />

        <form
          className="col-span-2 row-start-2 flex min-w-0 flex-1 items-center gap-2 rounded-xl border-2 border-transparent bg-muted p-1 pl-3.5 transition-colors focus-within:border-primary/30 focus-within:bg-card md:mx-auto md:max-w-2xl"
          onSubmit={(event) => {
            event.preventDefault();
            if (term.trim()) {
              const search_term = safeAnalyticsText(term);
              if (search_term) trackEvent('search', { search_term });
              void navigate({to:'/busca',search:{q:term.trim()}});
            }
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
        <nav aria-label="Atalhos" className="col-start-2 row-start-1 flex shrink-0 items-center">
          <Button asChild variant="ghost" className="px-2 text-xs font-semibold sm:text-sm"><Link to="/ofertas"><Tags className="size-4" aria-hidden="true"/>Ofertas</Link></Button>
          <Button asChild variant="ghost" className="px-2 text-xs font-semibold sm:text-sm">
            <Link to="/cupons"><Ticket className="size-4" aria-hidden="true" />Cupons</Link>
          </Button>
          <Button asChild variant="ghost" className="px-2 text-xs font-semibold sm:text-sm">
            <Link to="/blog"><BookOpen className="size-4" aria-hidden="true" />Blog</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
