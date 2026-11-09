import { describe, expect, it } from "vitest";
import { ALGOLIA_SERVER_TIMEOUTS, isAlgoliaConnectionError, withAlgoliaConnectionRetry } from "./algolia-connection.ts";

describe("Algolia server connection resilience", () => {
  it("uses production-safe timeouts instead of the browser two-second read default", () => {
    expect(ALGOLIA_SERVER_TIMEOUTS).toEqual({ connect: 10000, read: 30000, write: 60000 });
  });

  it("recognizes only the SDK connection failure for retries", () => {
    expect(isAlgoliaConnectionError(Object.assign(new Error("Unreachable hosts"), { name: "RetryError" }))).toBe(true);
    expect(isAlgoliaConnectionError(new Error("Invalid API key"))).toBe(false);
  });

  it("creates a fresh client and succeeds after transient connection failures", async () => {
    let clients = 0;
    const result = await withAlgoliaConnectionRetry(async (client) => {
      if (clients < 3) throw Object.assign(new Error("Unreachable hosts"), { name: "RetryError" });
      return client;
    }, () => ({ id: ++clients }));
    expect(result).toEqual({ id: 3 });
    expect(clients).toBe(3);
  });

  it("does not retry data or permission errors", async () => {
    let calls = 0;
    await expect(withAlgoliaConnectionRetry(async () => {
      calls++;
      throw new Error("Invalid API key");
    }, () => ({}))).rejects.toThrow("Invalid API key");
    expect(calls).toBe(1);
  });
});
