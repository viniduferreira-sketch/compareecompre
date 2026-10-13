import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/sync-algolia")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authenticateCronRequest } = await import("@/integrations/supabase/cron-auth");
        const authError = await authenticateCronRequest(request);
        if (authError) return authError;

        let body: unknown;
        try { body = await request.json(); } catch { return Response.json({ error: "Corpo inválido." }, { status: 400 }); }
        const { z } = await import("zod");
        const schema = z.object({ category: z.enum(["Eletrônicos", "Moda", "Casa", "Celulares", "Games", "Beleza", "Esportes"]) });
        const parsed = schema.safeParse(body);
        if (!parsed.success) return Response.json({ error: "Categoria inválida." }, { status: 400 });
        try {
          const { syncOffersToAlgolia } = await import("@/lib/sync-offers.server");
          const result = await syncOffersToAlgolia({ category: parsed.data.category, targetPerCategory: 100 });
          return Response.json(result, { status: result.success ? 200 : 503 });
        } catch (error) {
          console.error("Scheduled Algolia sync failed", error);
          return Response.json(
            { success: false, error: "Não foi possível atualizar as ofertas." },
            { status: 500 },
          );
        }
      },
    },
  },
});