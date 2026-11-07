import { test } from "node:test";
import assert from "node:assert/strict";

import { persistPriceAlertSignup } from "./price-alert-signup.ts";

test("signup only confirms success after the email is persisted", async () => {
  let completeSave;
  let confirmed = false;
  let storedEmail;
  const pending = persistPriceAlertSignup({ email: " Visitor@Example.com ", consent: true }, async (signup) => {
    storedEmail = signup.email;
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
  await assert.rejects(persistPriceAlertSignup({ email: "visitor@example.com", consent: true }, async () => {
    throw new Error("Store unavailable");
  }), /Store unavailable/);
});

test("invalid email addresses are rejected without writing", async () => {
  let writes = 0;
  await assert.rejects(persistPriceAlertSignup({ email: "not-an-email", consent: true }, async () => { writes++; }));
  assert.equal(writes, 0);
});

test("missing consent rejects signup without writing", async () => {
  let writes = 0;
  await assert.rejects(persistPriceAlertSignup({ email: "visitor@example.com" }, async () => { writes++; }));
  assert.equal(writes, 0);
});

test("unchecked consent rejects signup without writing", async () => {
  let writes = 0;
  await assert.rejects(persistPriceAlertSignup({ email: "visitor@example.com", consent: false }, async () => { writes++; }));
  assert.equal(writes, 0);
});

test("new signup records server timestamp and consent version", async () => {
  const started = Date.now();
  let stored;
  await persistPriceAlertSignup({ email: "visitor@example.com", consent: true, consent_at: "2000-01-01", consent_text_version: "untrusted" }, async (signup) => { stored = signup; });
  assert.equal(stored.consent_text_version, "2026-11-07-v1");
  const acceptedAt = Date.parse(stored.consent_at);
  assert.ok(acceptedAt >= started && acceptedAt <= Date.now());
});