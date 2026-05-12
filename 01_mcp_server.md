# opendata-mcp-server

> 公開資料的統一 MCP 入口——模組化架構，初期以台灣政府開放資料為第一批實作

**Repo 名稱：** `opendata-mcp-server`
**主要技術：** TypeScript + MCP SDK（Tools + Resources）
**定位：** 資料層。面向開發者與上層應用（travel-agent、PWA 通知等）
**GitHub 標籤：** `mcp` `open-data` `typescript` `ai-tools` `taiwan`

> **命名說明：** 不以地區命名，保留未來擴充其他國家或類型公開資料的彈性。
> 台灣政府資料是第一批模組，未來可新增其他資料來源而不需改名或重開 repo。

---

## 在整體藍圖中的角色

```
【本專案】opendata-mcp-server     ← 資料層（你在這裡）
         ↓ 提供結構化資料
travel-agent-orchestrator         ← AI 規劃層
         ↓
PWA Siri 介面層（未來）            ← 介面 + 通知層

也可直接供 Claude Desktop / Cursor 使用（不需要其他專案）
```

---

## 架構設計：Plugin 模式

每個資料來源是一個獨立模組，主 Server 負責組裝。
新增資料來源只需加一個模組，不動其他程式碼。

```
opendata-mcp-server/
├── src/
│   ├── index.ts                  # Server 入口，載入所有模組
│   ├── modules/                  # 每個資料來源一個資料夾
│   │   ├── tw-environment/       # 台灣天氣 + 空品
│   │   │   ├── tools/
│   │   │   │   ├── weather.ts
│   │   │   │   └── air-quality.ts
│   │   │   └── clients/
│   │   │       ├── cwa.ts        # 中央氣象署 API client
│   │   │       └── epa.ts        # 環境部 API client
│   │   ├── tw-transit/           # 台灣交通
│   │   │   ├── tools/
│   │   │   │   ├── bus-arrivals.ts
│   │   │   │   ├── tra-schedule.ts
│   │   │   │   ├── thsr-schedule.ts
│   │   │   │   └── youbike.ts
│   │   │   └── clients/
│   │   │       └── tdx.ts        # TDX API client（含 OAuth2）
│   │   ├── tw-agriculture/       # 台灣農產品
│   │   │   ├── tools/
│   │   │   │   └── agri-price.ts
│   │   │   └── clients/
│   │   │       └── afa.ts
│   │   ├── tw-energy/            # 台灣電力
│   │   │   ├── tools/
│   │   │   │   └── power-status.ts
│   │   │   └── clients/
│   │   │       └── taipower.ts
│   │   └── tw-calendar/          # 台灣節假日
│   │       ├── tools/
│   │       │   └── holidays.ts
│   │       └── clients/
│   │           └── dgpa.ts
│   ├── resources/                # MCP Resources（給 Claude 讀的說明文件）
│   │   └── capabilities.ts       # 暴露 CAPABILITIES.md 給 Claude
│   └── cache/
│       └── index.ts              # TTL 快取（MVP: node-cache；中期: Redis）
├── tests/
├── .github/workflows/ci.yml
└── README.md
```

---

## MCP Resources：讓 Claude 知道怎麼用你的 Server

MCP 除了 Tools 之外還有 **Resources** 功能——可以讓 Claude 讀取說明文件，
就像 Claude Code 讀 `CLAUDE.md` 那樣。

這個 Server 會暴露一個 `CAPABILITIES.md` Resource，內容說明每個 Tool 的使用場景和注意事項：

```markdown
# opendata-mcp-server 使用說明

## 模組與 Tools

### tw-environment（天氣 + 空品）
- get_weather：查詢縣市天氣預報，傳入縣市中文名稱
- get_air_quality：查詢即時 AQI，傳入縣市名稱
- 更新頻率：每小時。不需要頻繁呼叫。

### tw-transit（交通）
- get_bus_arrivals：即時到站，每 30 秒更新，不做快取
- get_tra_schedule：臺鐵時刻，傳入出發站、到達站、日期
- get_thsr_schedule：高鐵時刻，同上
- get_youbike_stations：傳入 GPS 座標，回傳半徑內可借站點

### tw-agriculture（農產品）
- get_agri_price：當日行情，每日收盤後更新，傳入品項名稱

### tw-energy（電力）
- get_power_status：備轉容量率 + 各類發電即時佔比

### tw-calendar（節假日）
- get_holidays：傳入年份，回傳國定假日與補班日

## 使用注意
- 即時需求（公車到站）→ 不快取，直接打 API
- 一般查詢（天氣、AQI）→ 有快取，不用擔心頻率
- 農產品行情每日才更新，不需要每小時查
```

Claude 連上這個 MCP Server 後可以先讀這份 Resource，
就能準確判斷什麼情境該用哪個 Tool。

---

## 完整 Tools 規劃

### tw-environment 模組

| Tool | 資料來源 | 更新頻率 | 說明 |
|------|---------|---------|------|
| `get_weather` | 中央氣象署 CWA | 每小時 | 各縣市天氣預報、降雨機率 |
| `get_air_quality` | 環境部 EPA | 每小時 | AQI、PM2.5、PM10，支援縣市或座標 |

### tw-transit 模組

| Tool | 資料來源 | 更新頻率 | 說明 |
|------|---------|---------|------|
| `get_bus_arrivals` | TDX | 每 30 秒 | 指定路線 / 站牌即時到站時間 |
| `get_tra_schedule` | TDX | 每日 | 臺鐵站對站時刻表與票價 |
| `get_thsr_schedule` | TDX | 每日 | 高鐵時刻表與票價 |
| `get_youbike_stations` | 各縣市 API | 每分鐘 | 附近 YouBike 站點即時可借輛數 |

### tw-agriculture 模組

| Tool | 資料來源 | 更新頻率 | 說明 |
|------|---------|---------|------|
| `get_agri_price` | 農業部 | 每日收盤 | 蔬菜、水果、花卉當日交易行情 |

### tw-energy 模組

| Tool | 資料來源 | 更新頻率 | 說明 |
|------|---------|---------|------|
| `get_power_status` | 台灣電力公司 | 每 10 分鐘 | 備轉容量率、各類發電佔比 |

### tw-calendar 模組

| Tool | 資料來源 | 更新頻率 | 說明 |
|------|---------|---------|------|
| `get_holidays` | 人事行政總處 | 每年 | 國定假日、補班日、連假區間 |

---

## 快取策略

| Tool | TTL | 原因 |
|------|-----|------|
| `get_weather` | 30 分鐘 | 每小時更新 |
| `get_air_quality` | 5 分鐘 | 每小時更新 |
| `get_bus_arrivals` | 不快取 | 30 秒更新，快取無意義 |
| `get_tra_schedule` | 6 小時 | 每日更新 |
| `get_agri_price` | 1 小時 | 每日收盤後更新 |
| `get_power_status` | 3 分鐘 | 每 10 分鐘更新 |
| `get_holidays` | 24 小時 | 年曆不變 |

---

## 部署方式

### Stdio Transport（初期，GitHub + npm）

```json
// Claude Desktop claude_desktop_config.json
{
  "mcpServers": {
    "opendata": {
      "command": "npx",
      "args": ["opendata-mcp-server"]
    }
  }
}
```

```typescript
// travel-agent-orchestrator 本機（同 Tavily 接法）
const transport = new StdioClientTransport({
  command: "npx",
  args: ["opendata-mcp-server"]
});
```

### HTTP Remote MCP（中期）

```json
{ "url": "https://opendata-mcp.fly.dev/mcp" }
```

---

## 短期目標（Week 1–4）：MVP

**核心目標：** 發布 npm 可安裝版本，tw-environment + tw-transit 模組完成

- [ ] TypeScript 專案骨架 + plugin 模組結構建立
- [ ] `tw-environment` 模組：`get_weather`、`get_air_quality`
- [ ] `tw-transit` 模組：`get_bus_arrivals`（其餘排中期）
- [ ] MCP Resources：暴露 `CAPABILITIES.md`
- [ ] Zod schema 驗證（自動生成 MCP inputSchema）
- [ ] in-memory 快取 + TTL 設定
- [ ] 政府 API token 管理（TDX OAuth2、CWA token）
- [ ] Unit Tests + API Mock
- [ ] GitHub Actions CI
- [ ] 發布至 npm（`opendata-mcp-server`）

**驗收標準：**
1. Claude Desktop 讀取 `CAPABILITIES.md` 後，問「今天台北適合出門嗎？」→ 正確整合天氣 + AQI 回答
2. travel-agent 本機接入，Transportation Agent 可查公車到站

---

## 中期目標（Month 2–3）：完整模組 + 升級部署

- [ ] 完成 `tw-transit` 剩餘 Tools（臺鐵、高鐵、YouBike）
- [ ] 完成 `tw-agriculture`、`tw-energy`、`tw-calendar` 模組
- [ ] HTTP/SSE Remote MCP Transport
- [ ] 部署至 Fly.io
- [ ] Redis 快取取代 in-memory
- [ ] 更新 `CAPABILITIES.md`，涵蓋所有模組說明
- [ ] travel-agent Phase 13 整合（Transportation Agent 用 MCP 取代 Tavily）
- [ ] travel-agent Phase 14 整合（天氣 + 節假日 context）

---

## 長期目標（Month 4–6）：擴充與 Travel Siri 完備

- [ ] 支援 GPS 座標輸入（`get_air_quality`、`get_youbike_stations` 等）
- [ ] 多語言 Tool / Resource descriptions（中文 + 英文）
- [ ] PWA 通知系統整合（AQI + 天氣 + 行事曆 Push）
- [ ] 考慮新增非台灣資料模組（視需求決定）

---

## 潛在 SaaS 方向

### 方向 A：Hosted Remote MCP（開發者訂閱）
- 免費：每日 500 次
- Pro：$5 USD / 月，10 萬次

### 方向 B：Taiwan Travel AI 白標
- 搭配 travel-agent，授權旅遊業者使用

### 方向 C：Open Data API Gateway（B2B）
- 統一格式、穩定 SLA 的政府資料 REST API
