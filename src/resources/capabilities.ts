import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const CAPABILITIES_CONTENT = `# opendata-mcp-server 使用說明

## 模組與 Tools

### tw-environment（天氣 + 空品）
- get_weather：查詢縣市天氣預報，傳入縣市中文名稱（如「臺北市」）
- get_air_quality：查詢即時 AQI，傳入縣市中文名稱
- 更新頻率：每小時。不需要頻繁呼叫。

### tw-transit（交通）
- get_bus_arrivals：即時到站，每 30 秒更新，不做快取
  - city：城市代碼（Taipei, NewTaipei, Taoyuan, Taichung, Tainan, Kaohsiung）
  - routeName：路線名稱（如「307」「299」）

### tw-agriculture（農產品）
- get_agri_price：當日批發市場行情，傳入品項名稱（如「高麗菜」「香蕉」）
- 每日收盤後更新，不需要每小時查

### tw-energy（電力）
- get_power_status：各類發電即時佔比與總發電量，無需參數

### tw-calendar（節假日）
- get_holidays：傳入西元年份，回傳國定假日、補班日與連假區間

## 使用注意
- 縣市名稱需使用全稱（如「臺北市」而非「台北」）
- 即時需求（公車到站）→ 不快取，直接打 API
- 一般查詢（天氣、AQI）→ 有快取，不用擔心頻率
- 農產品行情每日才更新，不需要每小時查
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
