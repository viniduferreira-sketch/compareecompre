import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/awin/import")({
  staticData: { sitemap: false },
  server: { handlers: { POST: async ({ request }) => {
    const { verifyAwinWorkflow, importRequestSchema, handleAwinImport } = await import("@/lib/awin-import.server");
    let runId: string;
    try { runId = await verifyAwinWorkflow(request); }
    catch { return Response.json({ error: "Unauthorized" }, { status: 401 }); }
    const body = await request.text();
    if (body.length > 2_000_000) return Response.json({ error: "Lote muito grande" }, { status: 413 });
    let json: unknown;
    try { json = JSON.parse(body); }
    catch { return Response.json({ error: "Dados inválidos" }, { status: 400 }); }
    const parsed = importRequestSchema.safeParse(json);
    if (!parsed.success) return Response.json({ error: "Dados inválidos" }, { status: 400 });
    try {
      return Response.json(await handleAwinImport(runId, parsed.data), { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      // Never log request bodies, feed URLs, bearer tokens or raw fetch errors.
      console.error("Awin import operation failed", { runId });
      return Response.json({ error: "Não foi possível concluir esta etapa da importação." }, { status: 500 });
    }
  } } },
});