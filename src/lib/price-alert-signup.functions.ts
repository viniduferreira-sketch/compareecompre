import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import { persistPriceAlertSignup, priceAlertSignupSchema } from "./price-alert-signup";

export const subscribeToPriceAlerts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => priceAlertSignupSchema.parse(input))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    setResponseHeader("Cache-Control", "no-store");
    try {
      // Public intake requires explicit consent; evidence is generated server-side.
      // No subscriber reads, IDs or existing-registration details are exposed.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      return await persistPriceAlertSignup(data, async (signup) => {
        const { error } = await supabaseAdmin.from("price_alert_subscribers").upsert(
          { ...signup, source: "homepage_price_alert" },
          { onConflict: "email", ignoreDuplicates: true },
        );
        if (error) throw new Error("Price alert persistence failed");
      });
    } catch {
      console.error("Price alert signup could not be saved");
      return { success: false };
    }
  });