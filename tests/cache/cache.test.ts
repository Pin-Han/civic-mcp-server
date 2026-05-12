import { describe, it, expect, vi, beforeEach } from "vitest";

describe("cached()", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("calls fetcher on cache miss", async () => {
    const { cached } = await import("../../src/cache/index.js");
    const fetcher = vi.fn().mockResolvedValue("data-from-api");

    const result = await cached("test-miss-key", 60, fetcher);

    expect(fetcher).toHaveBeenCalledOnce();
    expect(result).toBe("data-from-api");
  });

  it("returns cached value on cache hit (fetcher called only once)", async () => {
    const { cached } = await import("../../src/cache/index.js");
    const fetcher = vi.fn().mockResolvedValue("data-from-api");

    const first = await cached("test-hit-key", 60, fetcher);
    const second = await cached("test-hit-key", 60, fetcher);

    expect(fetcher).toHaveBeenCalledOnce();
    expect(first).toBe("data-from-api");
    expect(second).toBe("data-from-api");
  });
});
