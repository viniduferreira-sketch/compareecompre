import { z } from "zod";

export const PRICE_ALERT_CONSENT_VERSION = "2026-11-07-v1";

export const priceAlertSignupSchema = z.object({
  email: z.string().trim().max(254).email().transform((email) => email.toLowerCase()),
  consent: z.literal(true),
});

type ConsentedSignup = {
  email: string;
  consent_at: string;
  consent_text_version: string;
};

export async function persistPriceAlertSignup(
  input: unknown,
  save: (signup: ConsentedSignup) => Promise<void>,
): Promise<{ success: true }> {
  const { email } = priceAlertSignupSchema.parse(input);
  await save({
    email,
    consent_at: new Date().toISOString(),
    consent_text_version: PRICE_ALERT_CONSENT_VERSION,
  });
  return { success: true };
}