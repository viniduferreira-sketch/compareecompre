import { describe, it, expect } from "vitest";
import { recentImportsPerSource } from "./admin-history";
describe("admin execution history", () => {
  it("retains the latest 10 executions of each source even when Lomadee is more frequent", () => {
    const rows = ["awin", "lomadee", "mercadolivre"].flatMap((source) => Array.from({length: source === "lomadee" ? 50 : 12}, (_, n) => ({source, created_at: new Date(Date.UTC(2026,10,9, source === "lomadee" ? 3 : 1, n)).toISOString(), n})));
    const result = recentImportsPerSource(rows);
    expect(result).toHaveLength(30);
    for (const source of ["awin", "lomadee", "mercadolivre"]) {
      const selected = result.filter((r) => r.source === source);
      expect(selected).toHaveLength(10);
      expect(Math.min(...selected.map((r) => r.n))).toBe(source === "lomadee" ? 40 : 2);
    }
  });
});
