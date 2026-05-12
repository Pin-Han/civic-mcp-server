# Phase 7：測試與 CI

**目標：** 建立完整的測試策略與 CI 流程

## 7.1 測試框架

- **框架：** `vitest`（與 TypeScript ESM 原生相容）
- **API Mock：** `msw`（Mock Service Worker）模擬政府 API 回應

### 安裝

```bash
npm install -D vitest msw
```

## 7.2 測試結構

```
tests/
├── setup.ts                    # msw server 設定
├── mocks/
│   ├── handlers.ts             # 所有 API mock handlers
│   ├── cwa-response.json       # CWA 回應範例
│   ├── epa-response.json       # EPA 回應範例
│   ├── tdx-response.json       # TDX 回應範例
│   ├── afa-response.json       # 農產品回應範例
│   └── taipower-response.json  # 台電回應範例
├── cache/
│   └── cache.test.ts           # 快取層測試
├── modules/
│   ├── tw-environment/
│   │   ├── weather.test.ts     # get_weather 測試
│   │   └── air-quality.test.ts # get_air_quality 測試
│   ├── tw-transit/
│   │   └── bus-arrivals.test.ts
│   ├── tw-agriculture/
│   │   └── agri-price.test.ts
│   ├── tw-energy/
│   │   └── power-status.test.ts
│   └── tw-calendar/
│       └── holidays.test.ts
└── integration/
    └── server.test.ts          # MCP Server 整合測試
```

## 7.3 測試分層

### Unit Tests — 每個 tool handler
- 輸入驗證（正確/錯誤的縣市名稱）
- API 回傳解析（mock 回應 → 預期輸出）
- 快取行為（第二次呼叫不打 API）
- 錯誤處理（API 失敗、timeout、回傳格式異常）

### Client Tests — 每個 API client
- 認證機制正確（API Key 帶入 query / header）
- TDX OAuth2 token 取得與刷新
- HTTP error 處理（4xx、5xx）

### Integration Test — MCP 協議
- Server 啟動 → list tools → 確認所有 tools 存在
- 呼叫 tool → 確認回傳格式正確
- 讀取 Resource → 確認 CAPABILITIES.md 內容

## 7.4 GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm
      - run: npm ci
      - run: npm run type-check
      - run: npm test
      - run: npm run build
```

### CI 步驟
1. **type-check** — `tsc --noEmit`
2. **test** — vitest
3. **build** — 確認可成功編譯

> **注意：** ESLint 暫不加入 MVP。如未來需要，再新增 `lint` script 與 CI 步驟。

## 驗證標準

- [ ] `npm test` 全部通過
- [ ] GitHub Actions 在 Node 18/20/22 都通過
- [ ] 測試覆蓋所有 tool handler 的正常與錯誤路徑
- [ ] msw 正確模擬所有政府 API
