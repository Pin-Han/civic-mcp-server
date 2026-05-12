import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerEnvironment } from "./modules/tw-environment/index.js";
import { registerTransit } from "./modules/tw-transit/index.js";
import { registerCapabilities } from "./resources/capabilities.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "opendata-mcp-server",
    version: "0.1.0",
  });

  // 註冊 Resources
  registerCapabilities(server);

  // 註冊模組
  registerEnvironment(server);
  registerTransit(server);

  return server;
}
