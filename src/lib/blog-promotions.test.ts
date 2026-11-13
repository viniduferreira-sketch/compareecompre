import { describe, expect, it } from "vitest";
import {
  GENERAL_BLOG_GUIDES,
  blogCategorySlugForProduct,
  isPromotableBlogPost,
  selectProductBlogArticles,
  type BlogPromotionCandidate,
} from "./blog-promotions";

function post(id: string, slug = id, overrides: Partial<BlogPromotionCandidate> = {}): BlogPromotionCandidate {
  return {
    id,
    slug,
    categoria_id: null,
    status: "publicado",
    publicado_em: "2026-11-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("Blog promotions", () => {
  it("admits only published posts whose publication date has arrived", () => {
    const now = Date.parse("2026-11-11T00:00:00.000Z");
    expect(isPromotableBlogPost(post("published"), now)).toBe(true);
    expect(isPromotableBlogPost(post("draft", "draft", { status: "rascunho" }), now)).toBe(false);
    expect(isPromotableBlogPost(post("scheduled", "scheduled", { status: "agendado" }), now)).toBe(false);
    expect(isPromotableBlogPost(post("future", "future", { publicado_em: "2026-11-12T00:00:00.000Z" }), now)).toBe(false);
  });

  it("maps each storefront category to its editorial counterpart", () => {
    expect(blogCategorySlugForProduct("Eletrônicos")).toBe("informatica");
    expect(blogCategorySlugForProduct("Casa")).toBe("casa-e-cozinha");
    expect(blogCategorySlugForProduct("Esportes")).toBe("moda-e-esporte");
    expect(blogCategorySlugForProduct("Celulares")).toBe("celulares");
  });

  it("puts one same-category article first and completes with both general guides", () => {
    const category = post("category", "guia-de-celulares", { categoria_id: "cat-1" });
    const discount = post("discount", GENERAL_BLOG_GUIDES[0]);
    const trust = post("trust", GENERAL_BLOG_GUIDES[1]);
    const selected = selectProductBlogArticles({
      categoryPosts: [category],
      guidePosts: [trust, discount],
      recentPosts: [post("recent")],
    });
    expect(selected.map((item) => item.id)).toEqual(["category", "discount", "trust"]);
  });

  it("deduplicates guides and never fills missing positions with unrelated recent articles", () => {
    const discount = post("discount", GENERAL_BLOG_GUIDES[0]);
    const recent = post("recent");
    const selected = selectProductBlogArticles({
      categoryPosts: [discount],
      guidePosts: [discount],
      recentPosts: [discount, recent],
    });
    expect(selected.map((item) => item.id)).toEqual(["discount"]);
  });
  it('excludes the category guide already linked under Antes de comprar', () => {
    const guide = post('ssd', 'como-escolher-ssd');
    expect(selectProductBlogArticles({ categoryPosts:[guide], guidePosts:[post('discount',GENERAL_BLOG_GUIDES[0]),post('trust',GENERAL_BLOG_GUIDES[1])],recentPosts:[],excludeSlug:guide.slug }).map(p => p.id)).toEqual(['discount','trust']);
  });
});
