import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";

export const getHomeBlogPromotions = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  try {
    const { listHomeBlogPromotions } = await import("./blog-promotions.server");
    return await listHomeBlogPromotions(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!);
  } catch (error) {
    console.error("Homepage blog promotions unavailable", error);
    return [];
  }
});

export const getProductBlogPromotions = createServerFn({ method: "GET" })
  .inputValidator((data: { categoryName: string | null; title?: string }) =>
    z.object({ categoryName: z.string().trim().max(100).nullable(), title: z.string().max(2000).optional() }).parse(data),
  )
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    try {
      const { listProductBlogPromotions } = await import("./blog-promotions.server");
      return await listProductBlogPromotions(
        process.env["SUPABASE_URL"]!,
        process.env["SUPABASE_PUBLISHABLE_KEY"]!,
        data.categoryName,
        data.title,
      );
    } catch (error) {
      console.error("Product blog promotions unavailable", error);
      return [];
    }
  });
