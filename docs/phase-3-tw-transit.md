# Phase 3：tw-transit 模組（交通）

**目標：** 實作 TDX OAuth2 認證 + 公車到站（MVP），其餘排中期

## 3.1 TDX Client (`src/modules/tw-transit/clients/tdx.ts`)

### OAuth2 認證

- **Token Endpoint：** `https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token`
- **grant_type：** `client_credentials`
- **環境變數：** `TDX_CLIENT_ID` + `TDX_CLIENT_SECRET`
- **TLS：** 1.2+ 必要

### Token 管理

```typescript
// Token 快取邏輯
let token: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (token && Date.now() < tokenExpiresAt - 60000) return token;
  
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.tdxClientId,
      client_secret: config.tdxClientSecret,
    }),
  });
  
  const data = await response.json();
  token = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return token;
}
```

### Rate Limit
- Token Endpoint：每 IP 20 次/分鐘
- API 呼叫頻率依訂閱方案而定

## 3.2 get_bus_arrivals Tool（MVP）

```typescript
server.tool(
  "get_bus_arrivals",
  "查詢公車即時到站時間",
  {
    city: z.string().describe("城市代碼，如「Taipei」「NewTaipei」「Taichung」"),
    routeName: z.string().describe("路線名稱，如「307」「299」"),
  },
  busArrivalsHandler,
);
```

- **API：** `/v2/Bus/EstimatedTimeOfArrival/City/{city}/{routeName}`
- **不快取**（每 30 秒更新的即時資料）
- 回傳：站牌名、預估到站時間、車輛狀態

### 城市代碼對照

| 中文 | 代碼 |
|------|------|
| 臺北市 | Taipei |
| 新北市 | NewTaipei |
| 桃園市 | Taoyuan |
| 臺中市 | Taichung |
| 臺南市 | Tainan |
| 高雄市 | Kaohsiung |

## 3.3 中期 Tools（Phase 3b）

### get_tra_schedule
- 臺鐵站對站時刻表
- API：`/v2/Rail/TRA/DailyTimetable/OD/{OriginStationID}/to/{DestinationStationID}/{TrainDate}`
- TTL：21600 秒（6 小時）

### get_thsr_schedule
- 高鐵時刻表
- API：`/v2/Rail/THSR/DailyTimetable/OD/{OriginStationID}/to/{DestinationStationID}/{TrainDate}`
- TTL：21600 秒（6 小時）

### get_youbike_stations
- 附近 YouBike 站點即時可借輛數
- Input：GPS 座標 + 半徑
- TTL：60 秒（1 分鐘）

## 驗證標準

- [ ] TDX OAuth2 token 取得成功
- [ ] Token 過期自動刷新
- [ ] `get_bus_arrivals` 傳入 Taipei + 307 → 回傳各站到站時間
- [ ] TDX credentials 缺失時回傳明確錯誤
