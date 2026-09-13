import { AirVent, Gamepad2, Laptop, Refrigerator, Smartphone, Tv, WashingMachine, type LucideIcon } from "lucide-react";

const CATEGORIES: { name: string; term: string; Icon: LucideIcon }[] = [
  { name: "Celulares", term: "Celular", Icon: Smartphone },
  { name: "Notebooks", term: "Notebook", Icon: Laptop },
  { name: "Geladeiras", term: "Geladeira", Icon: Refrigerator },
  { name: "Lavadoras", term: "Lavadora de roupas", Icon: WashingMachine },
  { name: "Ar condicionado", term: "Ar condicionado", Icon: AirVent },
  { name: "Games", term: "Console de videogame", Icon: Gamepad2 },
  { name: "TV", term: "Smart TV", Icon: Tv },
];

export function PopularCategories({ onSearch }: { onSearch: (term: string) => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-9 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase text-primary">Atalhos para economizar</p>
      <h2 className="mb-5 mt-1 font-display text-2xl font-extrabold">O que você está procurando?</h2>

      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-7 md:gap-4 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map(({ name, term, Icon }) => (
          <li key={name} className="w-24 shrink-0 snap-start md:w-auto">
            <button
              type="button"
              onClick={() => onSearch(term)}
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
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
