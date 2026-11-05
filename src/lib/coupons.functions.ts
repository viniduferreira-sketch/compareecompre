import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

export const getActiveCoupons = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeader("Cache-Control", "no-store");
  const supabase = createClient(import.meta.env["VITE_SUPABASE_URL"], import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"], { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("partner_coupons")
    .select("id,source,store,logo_url,title,description,code,affiliate_url,starts_at,expires_at,last_synced_at")
    .eq("status", "active").or(`starts_at.is.null,starts_at.lte.${now}`).or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("last_synced_at", { ascending: false });
  if (error) { console.error("Coupon read failed", error.code, error.message); throw new Error("Não foi possível carregar os cupons. Tente novamente."); }
  return data ?? [];
});