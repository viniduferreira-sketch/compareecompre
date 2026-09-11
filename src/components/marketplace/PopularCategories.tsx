import {
  AirVent,
  Gamepad2,
  Headphones,
  Laptop,
  Refrigerator,
  Shirt,
  Smartphone,
  Sofa,
  Tv,
  WashingMachine,
  type LucideIcon,
} from "lucide-react";

const CATEGORIES: { name: string; term: string; Icon: LucideIcon }[] = [
  { name: "TVs", term: "Smart TV", Icon: Tv },
  { name: "Celulares", term: "Celular", Icon: Smartphone },
  { name: "Notebooks", term: "Notebook", Icon: Laptop },
  { name: "Geladeiras", term: "Geladeira", Icon: Refrigerator },
  { name: "Lavadoras", term: "Lavadora de roupas", Icon: WashingMachine },
  { name: "Ar condicionado", term: "Ar condicionado", Icon: AirVent },
  { name: "Games", term: "Console de videogame", Icon: Gamepad2 },
  { name: "Fones", term: "Fone de ouvido", Icon: Headphones },
  { name: "Moda", term: "Tênis", Icon: Shirt },
  { name: "Casa", term: "Sofá", Icon: Sofa },
];

export function PopularCategories({ onSearch }: { onSearch: (term: string) => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-10">
      <h2 className="mb-4 font-display text-xl font-bold md:text-2xl">Categorias populares</h2>

      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-10 md:gap-4 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map(({ name, term, Icon }) => (
          <li key={name} className="w-24 shrink-0 snap-start md:w-auto">
            <button
              type="button"
              onClick={() => onSearch(term)}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center shadow-card transition-transform hover:-translate-y-0.5 hover:border-primary/40"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Icon className="size-7" strokeWidth={1.75} />
              </span>
              <span className="line-clamp-2 text-xs font-semibold leading-tight text-foreground">
                {name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
