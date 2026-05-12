import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const CAPABILITIES_CONTENT = `# opendata-mcp-server 使用說明

## 模組與 Tools

### tw-environment（天氣 + 空品）
- get_weather：查詢縣市天氣預報，傳入縣市中文名稱
- get_air_quality：查詢即時 AQI，傳入縣市中文名稱
- 更新頻率：每小時。不需要頻繁呼叫。

## 使用注意
- 縣市名稱需使用全稱（如「臺北市」而非「台北」）
- 一般查詢（天氣、AQI）→ 有快取，不用擔心頻率
`;

export function registerCapabilities(server: McpServer): void {
  server.resource("capabilities", "opendata://capabilities", async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: CAPABILITIES_CONTENT,
      },
    ],
  }));
}
