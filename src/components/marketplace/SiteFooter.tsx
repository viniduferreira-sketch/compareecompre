import { Link } from "@tanstack/react-router";
import { CreditCard, LockKeyhole, ShieldCheck } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

const linkClass = "text-sm text-footer-muted transition-colors hover:text-footer-accent";

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t border-footer-border bg-footer text-footer-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <BrandLogo footer />
          <p className="mt-4 max-w-sm text-sm leading-6 text-footer-muted">
            Buscamos nas melhores lojas da internet para você encontrar o menor preço com rapidez e confiança.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-footer-border px-2.5 py-1.5 text-xs font-semibold text-footer-foreground">
              <ShieldCheck className="size-4 text-savings" /> Site seguro
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-footer-border px-2.5 py-1.5 text-xs font-semibold text-footer-foreground">
              <LockKeyhole className="size-4 text-savings" /> Conexão protegida
            </span>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-bold text-footer-foreground">Sobre</h2>
          <ul className="space-y-3">
            <li><Link to="/sobre-nos" className={linkClass}>Quem somos</Link></li>
            <li><Link to="/" className={linkClass}>Como comparamos</Link></li>
            <li><Link to="/" className={linkClass}>Lojas monitoradas</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-bold text-footer-foreground">Ajuda e Suporte</h2>
          <ul className="space-y-3">
            <li><Link to="/" className={linkClass}>Buscar produtos</Link></li>
            <li><Link to="/" className={linkClass}>Alerta de preço</Link></li>
            <li><a href="mailto:contato@compareecompre.com.br" className={linkClass}>Fale conosco</a></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-bold text-footer-foreground">Legal</h2>
          <ul className="space-y-3">
            <li><Link to="/termos-de-uso" className={linkClass}>Termos de Uso</Link></li>
            <li><Link to="/politica-de-privacidade" className={linkClass}>Política de Privacidade</Link></li>
          </ul>
          <div className="mt-6">
            <p className="flex items-center gap-2 text-xs font-semibold text-footer-foreground"><CreditCard className="size-4 text-footer-accent" /> Pagamento na loja escolhida</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-footer-muted">
              <span className="rounded border border-footer-border px-2 py-1">Pix</span>
              <span className="rounded border border-footer-border px-2 py-1">Cartões</span>
              <span className="rounded border border-footer-border px-2 py-1">Boleto</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-footer-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs leading-5 text-footer-muted lg:px-8">
          <p>© 2026 Compare e Compre. Todos os direitos reservados.</p>
          <p>Os preços, condições, estoque e entrega são definidos pelas lojas e podem mudar sem aviso. Podemos receber comissão por compras realizadas pelos nossos links.</p>
        </div>
      </div>
    </footer>
  );
}