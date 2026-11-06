import { Link } from "@tanstack/react-router";
import logo from "@/assets/approved-logo.png.asset.json";
import contrastLogo from "@/assets/approved-logo-contrast.png.asset.json";

export function BrandLogo({ footer = false }: { footer?: boolean }) {
  return (
    <Link to="/" aria-label="Compare e Compre — página inicial" className="inline-flex w-fit shrink-0 items-center">
      <img
        src={footer ? contrastLogo.url : logo.url}
        alt="Compare e Compre — Encontre o menor preço"
        width={1438}
        height={499}
        className={footer ? "block h-[35px] w-auto object-contain" : "block h-10 w-auto object-contain dark:brightness-0 dark:invert"}
      />
    </Link>
  );
}