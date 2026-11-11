import { Headphones, Shirt, Armchair, Smartphone, Gamepad2, Droplets, Volleyball, type LucideIcon } from "lucide-react";
import type { CategoryBlobColor } from "./CategoryBlob";
import {categorySlug} from '@/lib/category-pages';

export type CategoryIconComponent = LucideIcon;

// Only user-supplied category assets belong here. Uploaded media use asset pointers.
const categoryImages = import.meta.glob<string>("/src/assets/categorias/*.{png,webp}", { eager: true, query: "?url", import: "default" });
const categoryPointers = import.meta.glob<{ url: string }>("/src/assets/categorias/*.{png,webp}.asset.json", { eager: true, import: "default" });
const publicImages = import.meta.glob<string>("/public/categorias/*.{png,webp}", { eager: true, query: "?url", import: "default" });

function imageFor(slug: string): string | undefined {
  for (const extension of ["png", "webp"]) {
    const path = `/src/assets/categorias/${slug}.${extension}`;
    const url = categoryPointers[`${path}.asset.json`]?.url ?? categoryImages[path] ?? publicImages[`/public/categorias/${slug}.${extension}`];
    if (url) return url;
  }
  return undefined;
}

export interface CategoryItem {
  name: string;
  slug: string;
  term: string;
  icon?: CategoryIconComponent;
  imageSrc?: string | undefined;
  imageAlt: string;
  blobColor: CategoryBlobColor;
  blobVariant: 1 | 2 | 3;
}

export const CATEGORY_ITEMS: CategoryItem[] = ([
  { name: "Eletrônicos", slug: "eletronicos", term: "Eletrônicos", icon: Headphones, imageSrc: imageFor("eletronicos"), imageAlt: "TV Smart 40 polegadas", blobColor: "electronics", blobVariant: 1 },
  { name: "Moda", slug: "moda", term: "Moda", icon: Shirt, imageSrc: imageFor("moda"), imageAlt: "Tênis ou jaqueta da categoria Moda", blobColor: "fashion", blobVariant: 2 },
  { name: "Casa", slug: "casa", term: "Casa", icon: Armchair, imageSrc: imageFor("casa"), imageAlt: "Sofá cinza com planta e luminária", blobColor: "home", blobVariant: 3 },
  { name: "Celulares", slug: "celulares", term: "Celulares", icon: Smartphone, imageSrc: imageFor("celulares"), imageAlt: "Smartphone moderno", blobColor: "phones", blobVariant: 2 },
  { name: "Games", slug: "games", term: "Games", icon: Gamepad2, imageSrc: imageFor("games"), imageAlt: "Controle de videogame", blobColor: "games", blobVariant: 1 },
  { name: "Beleza", slug: "beleza", term: "Beleza", icon: Droplets, imageSrc: imageFor("beleza"), imageAlt: "Perfume ou kit de skincare", blobColor: "beauty", blobVariant: 3 },
  { name: "Esportes", slug: "esportes", term: "Esportes", icon: Volleyball, imageSrc: imageFor("esportes"), imageAlt: "Bicicleta, raquete e óculos esportivos", blobColor: "sports", blobVariant: 2 },
] satisfies CategoryItem[]).map(item=>({...item,slug:categorySlug(item.name)}));
