import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(context: { userId: string; supabase: { from: (table: string) => any } }) {
  const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
}

export const getPriceReviewQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "no-store");
    await requireAdmin(context);
    const result = await context.supabase.from("price_review_items").select("object_id,source,store,title,price,median_price,peer_count,reason,detected_at").eq("status", "pending").order("detected_at", { ascending: false }).limit(500);
    if (result.error) throw new Error("Não foi possível ler a fila de preços suspeitos.");
    return result.data ?? [];
  });

export const scanPriceReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "no-store");
    await requireAdmin(context);
    const { scanPriceReviewCatalog } = await import("./price-review.server");
    return scanPriceReviewCatalog();
  });

export const releasePriceReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ objectID: z.string().min(3).max(180) }))
  .handler(async ({ data, context }) => {
    setResponseHeader("Cache-Control", "no-store");
    await requireAdmin(context);
    const { approvePriceReview } = await import("./price-review.server");
    return approvePriceReview(data.objectID, context.userId);
  });
