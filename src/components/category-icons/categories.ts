import { Headphones, Shirt, Armchair, Smartphone, Gamepad2, Droplets, Volleyball, type LucideIcon } from "lucide-react";

export type CategoryIconComponent = LucideIcon;

// Only user-supplied category assets belong here. Uploaded media use asset pointers.
const categoryImages = import.meta.glob<string>("/src/assets/categorias/*.{png,webp}", { eager: true, query: "?url", import: "default" });
const categoryPointers = import.meta.glob<{ url: string }>("/src/assets/categorias/*.{png,webp}.asset.json", { eager: true, import: "default" });

function imageFor(slug: string): string | undefined {
  for (const extension of ["png", "webp"]) {
    const path = `/src/assets/categorias/${slug}.${extension}`;
    const url = categoryPointers[`${path}.asset.json`]?.url ?? categoryImages[path];
    if (url) return url;
  }
  return undefined;
}

export interface CategoryItem {
  name: string;
  slug: string;
  term: string;
  icon?: CategoryIconComponent;
  imageSrc?: string;
}

export const CATEGORY_ITEMS: CategoryItem[] = [
  { name: "Eletrônicos", slug: "eletronicos", term: "Eletrônicos", icon: Headphones, imageSrc: imageFor("eletronicos") },
  { name: "Moda", slug: "moda", term: "Moda", icon: Shirt, imageSrc: imageFor("moda") },
  { name: "Casa", slug: "casa", term: "Casa", icon: Armchair, imageSrc: imageFor("casa") },
  { name: "Celulares", slug: "celulares", term: "Celulares", icon: Smartphone, imageSrc: imageFor("celulares") },
  { name: "Games", slug: "games", term: "Games", icon: Gamepad2, imageSrc: imageFor("games") },
  { name: "Beleza", slug: "beleza", term: "Beleza", icon: Droplets, imageSrc: imageFor("beleza") },
  { name: "Esportes", slug: "esportes", term: "Esportes", icon: Volleyball, imageSrc: imageFor("esportes") },
];
