# opendata-mcp-server

公開資料的統一 MCP 入口 — 模組化架構，初期以台灣政府開放資料為第一批實作。

可直接供 Claude Desktop、Cursor 等 MCP 相容客戶端使用。

## Quick Start

```bash
npx opendata-mcp-server
```

### Claude Desktop 配置

在 `claude_desktop_config.json` 加入：

```json
{
  "mcpServers": {
    "opendata": {
      "command": "npx",
      "args": ["opendata-mcp-server"],
      "env": {
        "CWA_API_KEY": "your-cwa-api-key",
        "EPA_API_KEY": "your-epa-api-key",
        "TDX_CLIENT_ID": "your-tdx-client-id",
        "TDX_CLIENT_SECRET": "your-tdx-client-secret",
        "AFA_API_KEY": "your-afa-api-key"
      }
    }
  }
}
```

## Available Tools

| Tool | Module | Description |
|------|--------|-------------|
| `get_weather` | tw-environment | 各縣市 36 小時天氣預報 |
| `get_air_quality` | tw-environment | 即時 AQI、PM2.5 |
| `get_bus_arrivals` | tw-transit | 公車即時到站時間 |
| `get_agri_price` | tw-agriculture | 農產品批發市場行情 |
| `get_power_status` | tw-energy | 即時電力供需狀態 |
| `get_holidays` | tw-calendar | 國定假日、補班日、連假 |

## Environment Variables

| Variable | Required | Source |
|----------|----------|--------|
| `CWA_API_KEY` | Yes (weather) | [中央氣象署](https://opendata.cwa.gov.tw/) |
| `EPA_API_KEY` | Yes (air quality) | [環境部](https://data.moenv.gov.tw/) |
| `TDX_CLIENT_ID` | Yes (transit) | [TDX](https://tdx.transportdata.tw/) |
| `TDX_CLIENT_SECRET` | Yes (transit) | [TDX](https://tdx.transportdata.tw/) |
| `AFA_API_KEY` | Yes (agriculture) | [農業部](https://data.moa.gov.tw/) |

電力和節假日模組不需要 API Key。

## Development

```bash
npm install
npm run build    # 編譯 TypeScript
npm run dev      # 開發模式 (watch)
npm test         # 執行測試
npm run type-check
```

## License

MIT
