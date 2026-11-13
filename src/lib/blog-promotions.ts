export const GENERAL_BLOG_GUIDES = [
  "como-saber-se-o-desconto-e-real",
  "como-saber-se-uma-loja-online-e-confiavel",
] as const;

export type BlogPromotionArticle = {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  imagem_url: string;
  imagem_alt: string;
  publicado_em: string | null;
  category: { nome: string; slug: string } | null;
};

export type BlogPromotionCandidate = {
  id: string;
  slug: string;
  categoria_id: string | null;
  status: string;
  publicado_em: string | null;
};

const PRODUCT_CATEGORY_TO_BLOG: Record<string, string> = {
  celulares: "celulares",
  eletrônicos: "informatica",
  informática: "informatica",
  games: "games",
  casa: "casa-e-cozinha",
  moda: "moda-e-esporte",
  esportes: "moda-e-esporte",
  beleza: "beleza",
};

export function blogCategorySlugForProduct(categoryName: string | null | undefined) {
  if (!categoryName) return null;
  return PRODUCT_CATEGORY_TO_BLOG[categoryName.trim().toLocaleLowerCase("pt-BR")] ?? null;
}

export function isPromotableBlogPost(
  post: Pick<BlogPromotionCandidate, "status" | "publicado_em">,
  now = Date.now(),
) {
  if (post.status !== "publicado" || !post.publicado_em) return false;
  const publishedAt = Date.parse(post.publicado_em);
  return Number.isFinite(publishedAt) && publishedAt <= now;
}

export function selectProductBlogArticles<T extends BlogPromotionCandidate>({
  categoryPosts,
  guidePosts,
  recentPosts,
  excludeSlug,
}: {
  categoryPosts: T[];
  guidePosts: T[];
  recentPosts: T[];
  excludeSlug?: string;
}): T[] {
  const selected: T[] = [];
  const add = (post: T | undefined) => {
    if (post && post.slug !== excludeSlug && !selected.some((item) => item.id === post.id)) selected.push(post);
  };

  add(categoryPosts[0]);
  for (const slug of GENERAL_BLOG_GUIDES) add(guidePosts.find((post) => post.slug === slug));
  return selected.slice(0, 3);
}
