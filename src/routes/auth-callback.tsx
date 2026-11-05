import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth-callback")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Confirmando acesso | Compare e Compre" }, { name: "description", content: "Confirmação segura do acesso administrativo Compare e Compre." },
    { property: "og:title", content: "Confirmando acesso | Compare e Compre" }, { property: "og:description", content: "Confirmação do acesso administrativo." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex,nofollow" },
  ] }),
  component: Callback,
});
function Callback() {
  const navigate = Route.useNavigate();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    async function confirm() {
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getUser();
        if (disposed) return;
        if (data.user) { await navigate({ to: "/admin", replace: true }); return; }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      if (!disposed) setFailed(true);
    }
    void confirm();
    return () => { disposed = true; };
  }, [navigate]);
  return <main className="mx-auto max-w-md px-6 py-20 text-foreground"><h1 className="text-xl font-semibold">{failed ? "Não foi possível confirmar o acesso" : "Confirmando acesso…"}</h1>{failed && <Link to="/auth" className="mt-5 block text-primary underline">Tentar novamente</Link>}</main>;
}