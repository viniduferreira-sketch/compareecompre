import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const recalculatePopularity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ cursor: z.string().max(10000).optional() }))
  .handler(async ({ data, context }) => {
    setResponseHeader("Cache-Control", "no-store");
    const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
    const { recalculatePopularityPage } = await import("./popularity.server");
    return recalculatePopularityPage(data.cursor);
  });