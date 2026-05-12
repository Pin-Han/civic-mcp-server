# opendata-mcp-server

> 公開資料的統一 MCP 入口 — 模組化架構，初期以台灣政府開放資料為第一批實作

## 快速導覽

- **技術棧：** TypeScript + MCP SDK + Zod + node-cache
- **架構：** Plugin 模式，每個資料來源一個模組
- **Transport：** stdio（初期）→ HTTP/SSE（中期）
- **npm 套件名：** `opendata-mcp-server`

## 專案結構

```
src/
├── index.ts              # Server 入口 (stdio transport)
├── server.ts             # McpServer 初始化 + 模組註冊
├── config.ts             # 環境變數集中管理
├── cache/index.ts        # TTL 快取 (node-cache)
├── resources/            # MCP Resources
│   └── capabilities.ts   # CAPABILITIES.md 暴露給 Claude
└── modules/
    ├── tw-environment/   # 天氣 + 空品 (CWA, EPA)
    ├── tw-transit/       # 交通 (TDX OAuth2)
    ├── tw-agriculture/   # 農產品行情
    ├── tw-energy/        # 台電即時發電
    └── tw-calendar/      # 節假日 (靜態 JSON)
```

## 開發文件索引

| Phase | 文件 | 說明 |
|-------|------|------|
| 1 | [docs/phase-1-project-scaffold.md](docs/phase-1-project-scaffold.md) | 專案骨架與基礎設施 |
| 2 | [docs/phase-2-tw-environment.md](docs/phase-2-tw-environment.md) | 天氣 + 空品模組 |
| 3 | [docs/phase-3-tw-transit.md](docs/phase-3-tw-transit.md) | 交通模組 |
| 4 | [docs/phase-4-tw-agriculture.md](docs/phase-4-tw-agriculture.md) | 農產品模組 |
| 5 | [docs/phase-5-tw-energy.md](docs/phase-5-tw-energy.md) | 電力模組 |
| 6 | [docs/phase-6-tw-calendar.md](docs/phase-6-tw-calendar.md) | 節假日模組 |
| 7 | [docs/phase-7-testing-ci.md](docs/phase-7-testing-ci.md) | 測試與 CI |
| 8 | [docs/phase-8-publish-deploy.md](docs/phase-8-publish-deploy.md) | 發布與部署 |

## 架構決策

- **ADR-001** Plugin 模組架構：每個模組匯出 `register(server)` 函式
- **ADR-002** 套件命名 `opendata-mcp-server`，不以地區命名
- **ADR-003** 快取：node-cache (MVP) → Redis (中期)，介面抽象為 `cached(key, ttl, fetcher)`
- **ADR-004** 節假日：內嵌靜態 JSON，不依賴第三方 API
- **ADR-005** 台電資料：官方 data.gov.tw 直打

## API 認證速查

| API | 認證方式 | 環境變數 |
|-----|---------|---------|
| CWA 氣象 | API Key | `CWA_API_KEY` |
| EPA 空品 | API Key | `EPA_API_KEY` |
| TDX 交通 | OAuth2 | `TDX_CLIENT_ID` + `TDX_CLIENT_SECRET` |
| 農業部 | API Key | `AFA_API_KEY` |
| Taipower | 免認證或 data.gov.tw key | — |
| DGPA 假日 | 內嵌資料 | — |

## 常用指令

```bash
npm run build    # 編譯 TypeScript
npm run dev      # 開發模式
npm test         # 執行測試
```
