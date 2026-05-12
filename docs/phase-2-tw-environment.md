# Phase 2：tw-environment 模組（天氣 + 空品）

**目標：** 第一個完整模組，驗證整體架構可行

## 2.1 CWA Client (`src/modules/tw-environment/clients/cwa.ts`)

### API 資訊
- **Base URL：** `https://opendata.cwa.gov.tw/api/v1/rest/datastore/`
- **Dataset：** `F-C0032-001`（一般天氣預報 - 今明 36 小時天氣預報）
- **認證：** Query param `Authorization={CWA_API_KEY}`
- **註冊：** https://opendata.cwa.gov.tw/ 申請帳號後取得 API Key

### 回傳結構重點

```
records.location[] → {
  locationName: "臺北市",
  weatherElement[] → {
    elementName: "Wx" | "PoP" | "MinT" | "MaxT" | "CI",
    time[] → { startTime, endTime, parameter: { parameterName, parameterValue } }
  }
}
```

### 需解析欄位
- `Wx`：天氣現象（如「多雲」「短暫雨」）
- `PoP`：降雨機率（%）
- `MinT`：最低溫度（°C）
- `MaxT`：最高溫度（°C）
- `CI`：舒適度

## 2.2 get_weather Tool

```typescript
server.tool(
  "get_weather",
  "查詢台灣各縣市天氣預報（36小時內）",
  { location: z.string().describe("縣市名稱，如「臺北市」「高雄市」") },
  weatherHandler,
);
```

- **快取 TTL：** 1800 秒（30 分鐘）
- **快取 Key：** `weather:{location}`

## 2.3 EPA Client (`src/modules/tw-environment/clients/epa.ts`)

### API 資訊
- **URL：** `https://data.moenv.gov.tw/api/v2/aqx_p_432`
- **認證：** Query param `api_key={EPA_API_KEY}`
- **註冊：** https://data.moenv.gov.tw/ 申請帳號

### 回傳結構重點

```json
{
  "records": [{
    "sitename": "士林",
    "county": "臺北市",
    "aqi": "42",
    "pm2.5": "12",
    "pm10": "25",
    "status": "良好",
    "publishtime": "2026-05-11 14:00"
  }]
}
```

## 2.4 get_air_quality Tool

```typescript
server.tool(
  "get_air_quality",
  "查詢台灣各縣市即時空氣品質（AQI）",
  { location: z.string().describe("縣市名稱，如「臺北市」") },
  airQualityHandler,
);
```

- **快取 TTL：** 300 秒（5 分鐘）
- **快取 Key：** `air-quality:{location}`
- 一個縣市可能有多個監測站，回傳所有站點資料

## 2.5 模組註冊 (`src/modules/tw-environment/index.ts`)

```typescript
export function registerEnvironment(server: McpServer): void {
  server.tool("get_weather", weatherToolConfig.description, weatherToolConfig.inputSchema, weatherHandler);
  server.tool("get_air_quality", airQualityToolConfig.description, airQualityToolConfig.inputSchema, airQualityHandler);
}
```

## 驗證標準

- [ ] `get_weather` 傳入「臺北市」回傳天氣描述、溫度、降雨機率
- [ ] `get_air_quality` 傳入「臺北市」回傳 AQI、PM2.5、狀態
- [ ] 快取正常運作（重複呼叫不重打 API）
- [ ] API Key 缺失時回傳明確錯誤訊息
- [ ] Claude Desktop 問「今天台北適合出門嗎？」→ 整合天氣 + AQI 回答
