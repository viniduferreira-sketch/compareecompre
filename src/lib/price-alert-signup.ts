import { z } from "zod";

export const priceAlertSignupSchema = z.object({
  email: z.string().trim().max(254).email().transform((email) => email.toLowerCase()),
});

export async function persistPriceAlertSignup(
  input: unknown,
  save: (email: string) => Promise<void>,
): Promise<{ success: true }> {
  const { email } = priceAlertSignupSchema.parse(input);
  await save(email);
  return { success: true };
}