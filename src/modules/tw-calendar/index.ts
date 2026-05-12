import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { holidaysToolConfig, holidaysHandler } from "./tools/holidays.js";

export function registerCalendar(server: McpServer): void {
  server.tool(
    "get_holidays",
    holidaysToolConfig.description,
    holidaysToolConfig.inputSchema,
    holidaysHandler,
  );
}
