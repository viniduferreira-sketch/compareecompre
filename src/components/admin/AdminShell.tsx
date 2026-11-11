import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LayoutDashboard, Store, RefreshCw, ShieldCheck, Search, MousePointerClick, Ticket, NotebookPen, Menu, LogOut, ExternalLink, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { BrandLogo } from "@/components/marketplace/BrandLogo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmationProvider } from "./AdminAction";
const pages = [
  { to: "/admin", title: "Visão geral", icon: LayoutDashboard },
  { to: "/admin/parceiros", title: "Parceiros", icon: Store },
  { to: "/admin/sincronizacao", title: "Sincronização", icon: RefreshCw },
  { to: "/admin/qualidade", title: "Mercado Livre e qualidade", icon: ShieldCheck },
  { to: "/admin/busca", title: "Busca e ranking", icon: Search },
  { to: "/admin/cliques", title: "Cliques de saída", icon: MousePointerClick },
  { to: "/admin/cupons", title: "Cupons", icon: Ticket },
  { to: "/admin/blog", title: "Blog", icon: NotebookPen },
  { to: "/admin/vitrines", title: "Vitrines da home", icon: Store },
] as const;
export function AdminPending() { return <div className="space-y-6 p-6"><Skeleton className="h-8 w-60" /><div className="grid gap-4 sm:grid-cols-3">{[1,2,3].map((n) => <Skeleton key={n} className="h-28 w-full rounded-lg" />)}</div><Skeleton className="h-80 w-full rounded-lg" /></div>; }
export function AdminShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate(); const client = useQueryClient();
  const [drawer, setDrawer] = useState(false); const [collapsed, setCollapsed] = useState(false);
  const title = pages.find((p) => p.to === path)?.title ?? "Administração";
  const navigation = (mini = false) => <nav aria-label="Menu administrativo" className="space-y-1 p-3">{pages.map((p) => <Button key={p.to} asChild variant="ghost" className={`h-auto min-h-11 w-full justify-start rounded-md ${path === p.to ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}><Link to={p.to} activeOptions={{ exact: true }} onClick={() => setDrawer(false)} title={mini ? p.title : undefined}><p.icon className="size-4 shrink-0" />{!mini && <span className="whitespace-normal">{p.title}</span>}</Link></Button>)}</nav>;
  return <ConfirmationProvider><div className="admin-workspace min-h-screen bg-background text-foreground"><aside className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-card md:flex ${collapsed ? "w-16" : "w-64"}`}><div className="flex h-24 items-center border-b border-border px-4">{!collapsed && <BrandLogo />}</div>{navigation(collapsed)}<div className="mt-auto border-t border-border p-3"><Button variant="ghost" size="icon" title={collapsed ? "Expandir menu" : "Recolher menu"} aria-label={collapsed ? "Expandir menu" : "Recolher menu"} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}</Button>{!collapsed && <p className="mt-3 text-xs text-muted-foreground">Compare e Compre<br />Administração</p>}</div></aside><div className={collapsed ? "md:ml-16" : "md:ml-64"}><header className="sticky top-0 z-20 flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-4 lg:px-8"><div className="flex min-w-0 items-center gap-3"><Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" onClick={() => setDrawer(true)}><Menu className="size-5" /></Button><h1 className="text-lg font-bold lg:text-xl">{title}</h1></div><div className="flex items-center gap-2"><Button asChild variant="outline" size="sm"><Link to="/"><ExternalLink className="size-4" />Ver site</Link></Button><Button variant="ghost" size="sm" onClick={async () => { await client.cancelQueries(); client.clear(); await supabase.auth.signOut(); await navigate({ to: "/auth", replace: true }); }}><LogOut className="size-4" />Sair</Button></div></header><main className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8"><Outlet /></main></div><Sheet open={drawer} onOpenChange={setDrawer}><SheetContent side="left" className="w-72 bg-card p-0"><div className="border-b border-border p-5"><BrandLogo /><SheetTitle className="mt-4 text-sm">Administração</SheetTitle><SheetDescription className="sr-only">Páginas do painel administrativo</SheetDescription></div>{navigation()}</SheetContent></Sheet></div></ConfirmationProvider>;
}
