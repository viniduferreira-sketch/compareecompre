import type { ReactNode } from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Header } from './Header';
import { SiteFooter } from './SiteFooter';

export const informationCard = 'rounded-lg border border-border bg-card p-6 shadow-card transition-transform duration-200 motion-safe:hover:-translate-y-1 hover:shadow-lift';
export const contactHref = 'mailto:contato@compareecompre.com.br';

export function InformationIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="size-6" aria-hidden="true" /></span>;
}

export function PartnerInformationPage({ title, breadcrumb, subtitle, children }: { title: string; breadcrumb: string; subtitle: string; children: ReactNode }) {
  return <div className="min-h-screen bg-background">
    <Header initialTerm="" onSearch={term => { window.location.href = `/?q=${encodeURIComponent(term)}`; }} />
    <main>
      <header className="border-b border-border bg-ink text-ink-foreground">
        <div className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8 sm:py-14">
          <nav aria-label="Trilha de navegação" className="flex flex-wrap items-center gap-2 text-sm text-ink-foreground/75"><a href="/" className="hover:underline">Início</a><ChevronRight className="size-4 text-primary" aria-hidden="true" /><span aria-current="page">{breadcrumb}</span></nav>
          <h1 className="mt-6 font-display text-3xl font-extrabold sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink-foreground/85">{subtitle}</p>
        </div>
      </header>
      <div className="mx-auto max-w-[1100px] space-y-12 px-5 py-10 sm:px-8 sm:py-12">{children}</div>
    </main>
    <SiteFooter />
  </div>;
}