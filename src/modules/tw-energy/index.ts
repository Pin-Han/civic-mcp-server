import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  powerStatusToolConfig,
  powerStatusHandler,
} from "./tools/power-status.js";

export function registerEnergy(server: McpServer): void {
  server.tool(
    "get_power_status",
    powerStatusToolConfig.description,
    powerStatusToolConfig.inputSchema,
    powerStatusHandler,
  );
}
