import { createFileRoute } from "@tanstack/react-router";
import { outboundClickSchema } from "@/lib/outbound-clicks";

export const Route = createFileRoute("/api/public/outbound-click")({
  staticData: { sitemap: false },
  server: { handlers: { POST: async ({ request }) => {
    const headers = { "Cache-Control": "no-store" };
    // Public anonymous intake: authorize the app origin, not a visitor identity.
    const origin = request.headers.get("origin");
    const site = request.headers.get("sec-fetch-site");
    const allowed = new Set([new URL(request.url).origin, "https://compareecompre.com", "https://www.compareecompre.com", "https://compareecompre.lovable.app", "https://id-preview--257b71df-dcb0-431d-b3aa-761b624fd528.lovable.app"]);
    if (!origin || !allowed.has(origin) || (site && site !== "same-origin" && site !== "none")) return new Response(null, { status: 403, headers });
    if (!request.headers.get("content-type")?.startsWith("application/json")) return new Response(null, { status: 415, headers });
    try {
      // Bound streamed input too: Content-Length alone is caller-controlled.
      const reader = request.body?.getReader();
      if (!reader) return new Response(null, { status: 400, headers });
      let size = 0;
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 2048) { await reader.cancel(); return new Response(null, { status: 413, headers }); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      const parsed = outboundClickSchema.safeParse(JSON.parse(new TextDecoder().decode(bytes)));
      if (!parsed.success) return new Response(null, { status: 400, headers });
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin.rpc("record_outbound_click", { payload: parsed.data });
      return new Response(null, { status: error ? 503 : data ? 204 : 429, headers });
    } catch { return new Response(null, { status: 400, headers }); }
  } } },
});