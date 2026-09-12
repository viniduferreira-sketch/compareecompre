import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/sync-algolia")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authenticateCronRequest } = await import("@/integrations/supabase/cron-auth");
        const authError = await authenticateCronRequest(request);
        if (authError) return authError;

        try {
          const { configureDailyAlgoliaSync, syncOffersToAlgolia } = await import("@/lib/sync-offers.server");
          await configureDailyAlgoliaSync();
          const result = await syncOffersToAlgolia({ maxProducts: 800 });
          return Response.json({ success: true, ...result });
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