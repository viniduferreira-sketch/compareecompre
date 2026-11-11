import type { Database } from "@/integrations/supabase/types";
import { blogPublicClient } from "./blog-public.server";
import {
  GENERAL_BLOG_GUIDES,
  blogCategorySlugForProduct,
  isPromotableBlogPost,
  selectProductBlogArticles,
  type BlogPromotionArticle,
  type BlogPromotionCandidate,
} from "./blog-promotions";

const promotionColumns = "id,titulo,slug,resumo,imagem_url,imagem_alt,categoria_id,status,publicado_em";
type Category = { id: string; nome: string; slug: string };
type PromotionRow = Pick<
  Database["public"]["Tables"]["posts"]["Row"],
  "id" | "titulo" | "slug" | "resumo" | "imagem_url" | "imagem_alt" | "categoria_id" | "status" | "publicado_em"
>;

type Client = ReturnType<typeof blogPublicClient>;

function publicPosts(db: Client, now: string) {
  return db.from("posts")
    .select(promotionColumns)
    .eq("status", "publicado")
    .not("publicado_em", "is", null)
    .lte("publicado_em", now)
    .order("publicado_em", { ascending: false });
}

function mapArticles(rows: PromotionRow[], categories: Category[], now: number): BlogPromotionArticle[] {
  return rows.filter((post) => isPromotableBlogPost(post, now)).map((post) => {
    const category = categories.find((item) => item.id === post.categoria_id);
    return {
      id: post.id,
      titulo: post.titulo,
      slug: post.slug,
      resumo: post.resumo,
      imagem_url: post.imagem_url,
      imagem_alt: post.imagem_alt,
      publicado_em: post.publicado_em,
      category: category ? { nome: category.nome, slug: category.slug } : null,
    };
  });
}

async function allCategories(db: Client) {
  const result = await db.from("categorias").select("id,nome,slug");
  if (result.error) throw new Error("Não foi possível carregar as categorias do blog.");
  return result.data ?? [];
}

export async function listHomeBlogPromotions(url: string, key: string) {
  const db = blogPublicClient(url, key);
  const now = new Date();
  const [posts, categories] = await Promise.all([
    publicPosts(db, now.toISOString()).limit(3),
    allCategories(db),
  ]);
  if (posts.error) throw new Error("Não foi possível carregar os artigos recentes.");
  return mapArticles(posts.data ?? [], categories, now.getTime());
}

export async function listProductBlogPromotions(url: string, key: string, categoryName: string | null) {
  const db = blogPublicClient(url, key);
  const now = new Date();
  const categories = await allCategories(db);
  const categorySlug = blogCategorySlugForProduct(categoryName);
  const category = categories.find((item) => item.slug === categorySlug);
  const emptyCategory: { data: PromotionRow[]; error: null } = { data: [], error: null };
  const [categoryPosts, guidePosts, recentPosts] = await Promise.all([
    category ? publicPosts(db, now.toISOString()).eq("categoria_id", category.id).limit(4) : Promise.resolve(emptyCategory),
    publicPosts(db, now.toISOString()).in("slug", [...GENERAL_BLOG_GUIDES]).limit(2),
    publicPosts(db, now.toISOString()).limit(6),
  ]);
  if (categoryPosts.error || guidePosts.error || recentPosts.error) {
    throw new Error("Não foi possível carregar as recomendações do blog.");
  }
  const selected = selectProductBlogArticles<BlogPromotionCandidate>({
    categoryPosts: categoryPosts.data ?? [],
    guidePosts: guidePosts.data ?? [],
    recentPosts: recentPosts.data ?? [],
  }) as PromotionRow[];
  return mapArticles(selected, categories, now.getTime());
}
