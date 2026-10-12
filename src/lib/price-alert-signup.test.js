import { test } from "node:test";
import assert from "node:assert/strict";

import { persistPriceAlertSignup } from "./price-alert-signup.ts";

test("signup only confirms success after the email is persisted", async () => {
  let completeSave;
  let confirmed = false;
  let storedEmail;
  const pending = persistPriceAlertSignup({ email: " Visitor@Example.com " }, async (email) => {
    storedEmail = email;
    await new Promise((resolve) => { completeSave = resolve; });
  }).then((result) => { confirmed = result.success; });
  await Promise.resolve();
  assert.equal(confirmed, false);
  assert.equal(storedEmail, "visitor@example.com");
  completeSave();
  await pending;
  assert.equal(confirmed, true);
});

test("a failed save never returns success", async () => {
  await assert.rejects(persistPriceAlertSignup({ email: "visitor@example.com" }, async () => {
    throw new Error("Store unavailable");
  }), /Store unavailable/);
});

test("invalid email addresses are rejected without writing", async () => {
  let writes = 0;
  await assert.rejects(persistPriceAlertSignup({ email: "not-an-email" }, async () => { writes++; }));
  assert.equal(writes, 0);
});