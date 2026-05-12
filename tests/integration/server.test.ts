import { describe, it, expect } from "vitest";
import { createServer } from "../../src/server.js";

describe("MCP Server Integration", () => {
  it("should create server without throwing", () => {
    const server = createServer();
    expect(server).toBeDefined();
  });
});
