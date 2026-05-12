import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { agriPriceToolConfig, agriPriceHandler } from "./tools/agri-price.js";

export function registerAgriculture(server: McpServer): void {
  server.tool(
    "get_agri_price",
    agriPriceToolConfig.description,
    agriPriceToolConfig.inputSchema,
    agriPriceHandler,
  );
}
