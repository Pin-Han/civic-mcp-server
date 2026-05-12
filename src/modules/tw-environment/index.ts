import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { weatherToolConfig, weatherHandler } from "./tools/weather.js";
import {
  airQualityToolConfig,
  airQualityHandler,
} from "./tools/air-quality.js";

export function registerEnvironment(server: McpServer): void {
  server.tool(
    "get_weather",
    weatherToolConfig.description,
    weatherToolConfig.inputSchema,
    weatherHandler,
  );

  server.tool(
    "get_air_quality",
    airQualityToolConfig.description,
    airQualityToolConfig.inputSchema,
    airQualityHandler,
  );
}
