import { ArrowRight, BookOpen } from "lucide-react";
import { blogDate } from "@/lib/blog-public";
import type { BlogPromotionArticle } from "@/lib/blog-promotions";
import { cn } from "@/lib/utils";

function PromotionCard({ post, compact }: { post: BlogPromotionArticle; compact: boolean }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-card transition-shadow hover:shadow-lift motion-reduce:transition-none">
      <a href={`/blog/${post.slug}`} className="group flex h-full flex-col">
        {post.imagem_url ? (
          <img
            src={post.imagem_url}
            alt={post.imagem_alt}
            width={640}
            height={360}
            loading="lazy"
            decoding="async"
            className="aspect-[16/9] w-full bg-muted object-cover"
          />
        ) : (
          <div className="flex aspect-[16/9] w-full items-center justify-center bg-muted text-muted-foreground">
            <BookOpen className="size-10" aria-hidden="true" />
          </div>
        )}
        <div className={cn("flex flex-1 flex-col", compact ? "space-y-2 p-4" : "space-y-3 p-5")}>
          {post.category ? <p className="text-xs font-bold uppercase text-primary">{post.category.nome}</p> : null}
          <h3 className={cn("font-display font-bold leading-snug group-hover:text-primary", compact ? "text-base" : "text-lg")}>
            {post.titulo}
          </h3>
          {post.resumo ? <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{post.resumo}</p> : null}
          {post.publicado_em ? (
            <time dateTime={post.publicado_em} className="mt-auto block pt-1 text-xs text-muted-foreground">
              {blogDate(post.publicado_em)}
            </time>
          ) : null}
        </div>
      </a>
    </article>
  );
}

export function BlogPromotions({
  posts,
  variant,
}: {
  posts: BlogPromotionArticle[];
  variant: "home" | "product";
}) {
  if (posts.length === 0) return null;
  const isHome = variant === "home";
  return (
    <section
      aria-labelledby={isHome ? "home-blog-title" : "product-blog-title"}
      className={isHome ? "border-t border-border bg-muted/30" : "mt-8 border-t border-border pt-8"}
    >
      <div className={isHome ? "mx-auto max-w-7xl px-5 py-12 lg:px-8" : undefined}>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            {isHome ? <p className="mb-1 text-xs font-bold uppercase text-primary">Blog Compare e Compre</p> : null}
            <h2 id={isHome ? "home-blog-title" : "product-blog-title"} className="font-display text-2xl font-extrabold text-foreground">
              {isHome ? "Dicas para comprar melhor" : "Antes de comprar, leia"}
            </h2>
          </div>
          {isHome ? (
            <a href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              Ver todos os artigos <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          ) : null}
        </div>
        <div className={cn("grid gap-5", isHome ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-3")}>
          {posts.map((post) => <PromotionCard key={post.id} post={post} compact={!isHome} />)}
        </div>
      </div>
    </section>
  );
}
