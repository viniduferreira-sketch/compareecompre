import type { ComponentType, SVGProps } from "react";

import {
  BeautyIcon,
  ElectronicsIcon,
  FashionIcon,
  GamesIcon,
  HomeIcon,
  PhonesIcon,
  SportsIcon,
} from "./index";

export type CategoryIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface CategoryItem {
  name: string;
  slug: string;
  term: string;
  icon?: CategoryIconComponent;
  imageSrc?: string;
  accentClass: string;
}

export const CATEGORY_ITEMS: CategoryItem[] = [
  { name: "Eletrônicos", slug: "eletronicos", term: "Eletrônicos", icon: ElectronicsIcon, accentClass: "category-accent-electronics" },
  { name: "Moda", slug: "moda", term: "Moda", icon: FashionIcon, accentClass: "category-accent-fashion" },
  { name: "Casa", slug: "casa", term: "Casa", icon: HomeIcon, accentClass: "category-accent-home" },
  { name: "Celulares", slug: "celulares", term: "Celulares", icon: PhonesIcon, accentClass: "category-accent-phones" },
  { name: "Games", slug: "games", term: "Games", icon: GamesIcon, accentClass: "category-accent-games" },
  { name: "Beleza", slug: "beleza", term: "Beleza", icon: BeautyIcon, accentClass: "category-accent-beauty" },
  { name: "Esportes", slug: "esportes", term: "Esportes", icon: SportsIcon, accentClass: "category-accent-sports" },
];
