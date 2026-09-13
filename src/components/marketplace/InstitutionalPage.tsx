import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { Header } from "@/components/marketplace/Header";
import { SiteFooter } from "@/components/marketplace/SiteFooter";

export function InstitutionalPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header initialTerm="" onSearch={(term) => { window.location.href = `/?q=${encodeURIComponent(term)}`; }} />
      <main>
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:py-14">
            <nav className="flex items-center gap-1 text-xs text-muted-foreground" aria-label="Trilha de navegação">
              <Link to="/" className="hover:text-primary">Início</Link>
              <ChevronRight className="size-3" />
              <span>{title}</span>
            </nav>
            <h1 className="mt-5 font-display text-3xl font-extrabold text-foreground sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>
          </div>
        </div>
        <article className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
          <div className="max-w-3xl space-y-8 text-sm leading-7 text-muted-foreground [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
            {children}
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}