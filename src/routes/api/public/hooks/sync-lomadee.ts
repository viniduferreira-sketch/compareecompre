import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/sync-lomadee")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authenticateCronRequest } = await import("@/integrations/supabase/cron-auth");
        const authError = await authenticateCronRequest(request);
        if (authError) return authError;
        try {
          const { runLomadeeSync } = await import("@/lib/lomadee-sync.server");
          return Response.json({ success: true, ...(await runLomadeeSync()) });
        } catch (error) {
          console.error("Scheduled Lomadee sync failed", error instanceof Error ? error.message : error);
          return Response.json({ success: false, error: "Não foi possível sincronizar a Lomadee." }, { status: 500 });
        }
      },
    },
  },
});
