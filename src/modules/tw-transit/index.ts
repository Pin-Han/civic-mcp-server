import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { busArrivalsToolConfig, busArrivalsHandler } from "./tools/bus-arrivals.js";

export function registerTransit(server: McpServer): void {
  server.tool(
    "get_bus_arrivals",
    busArrivalsToolConfig.description,
    busArrivalsToolConfig.inputSchema,
    busArrivalsHandler,
  );
}
