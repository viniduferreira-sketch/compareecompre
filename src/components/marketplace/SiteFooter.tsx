import { Link } from "@tanstack/react-router";
import { CreditCard, LockKeyhole, ShieldCheck, Tag } from "lucide-react";

const linkClass = "text-sm text-muted-foreground transition-colors hover:text-primary";

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 font-display text-lg font-extrabold text-foreground">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Tag className="size-4" />
            </span>
            Compare <span className="text-primary">e Compre</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            Curadoria de ofertas para ajudar você a encontrar bons preços no Mercado Livre com mais rapidez.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground">
              <ShieldCheck className="size-4 text-savings" /> Site seguro
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground">
              <LockKeyhole className="size-4 text-savings" /> Conexão protegida
            </span>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-bold text-foreground">Sobre Nós</h2>
          <ul className="space-y-3">
            <li><Link to="/sobre-nos" className={linkClass}>Quem somos</Link></li>
            <li><Link to="/" className={linkClass}>Ofertas em destaque</Link></li>
            <li><a href="https://www.mercadolivre.com.br" target="_blank" rel="noopener noreferrer" className={linkClass}>Mercado Livre</a></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-bold text-foreground">Ajuda e Suporte</h2>
          <ul className="space-y-3">
            <li><Link to="/" className={linkClass}>Buscar produtos</Link></li>
            <li><a href="https://www.mercadolivre.com.br/ajuda" target="_blank" rel="noopener noreferrer" className={linkClass}>Ajuda do Mercado Livre</a></li>
            <li><a href="mailto:contato@compareecompre.com.br" className={linkClass}>Fale conosco</a></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-bold text-foreground">Legal</h2>
          <ul className="space-y-3">
            <li><Link to="/termos-de-uso" className={linkClass}>Termos de Uso</Link></li>
            <li><Link to="/politica-de-privacidade" className={linkClass}>Política de Privacidade</Link></li>
          </ul>
          <div className="mt-6">
            <p className="flex items-center gap-2 text-xs font-semibold text-foreground"><CreditCard className="size-4" /> Pagamento no parceiro</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <span className="rounded border border-border px-2 py-1">Pix</span>
              <span className="rounded border border-border px-2 py-1">Cartões</span>
              <span className="rounded border border-border px-2 py-1">Boleto</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs leading-5 text-muted-foreground lg:px-8">
          <p>© 2026 Compare e Compre. Todos os direitos reservados.</p>
          <p>Os preços, condições de pagamento, estoque e entrega são definidos pelo Mercado Livre e podem mudar sem aviso. Podemos receber comissão por compras realizadas pelos nossos links.</p>
        </div>
      </div>
    </footer>
  );
}