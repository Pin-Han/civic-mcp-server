# opendata-mcp-server Phase 3–8 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all remaining modules (transit, agriculture, energy, calendar), add tests, and prepare for npm publish.

**Architecture:** Plugin-based MCP server. Each module exports a `register*(server)` function called from `src/server.ts`. API clients live in `clients/`, tool handlers in `tools/`. Shared cache via `src/cache/index.ts`.

**Tech Stack:** TypeScript, @modelcontextprotocol/sdk, Zod, node-cache, vitest, msw

**Current State:** Phase 1 (scaffold) and Phase 2 (tw-environment) are complete and building. Phases 3–8 remain.

---

## File Structure Overview

### New files to create

```
src/
├── utils/
│   └── fetch.ts                              # Shared fetch wrapper with timeout + retry
├── modules/
│   ├── tw-transit/
│   │   ├── index.ts                          # registerTransit(server)
│   │   ├── clients/
│   │   │   └── tdx.ts                        # TDX OAuth2 client
│   │   └── tools/
│   │       └── bus-arrivals.ts               # get_bus_arrivals handler
│   ├── tw-agriculture/
│   │   ├── index.ts                          # registerAgriculture(server)
│   │   ├── clients/
│   │   │   └── afa.ts                        # 農業部 API client
│   │   └── tools/
│   │       └── agri-price.ts                 # get_agri_price handler
│   ├── tw-energy/
│   │   ├── index.ts                          # registerEnergy(server)
│   │   ├── clients/
│   │   │   └── taipower.ts                   # 台電 API client
│   │   └── tools/
│   │       └── power-status.ts               # get_power_status handler
│   └── tw-calendar/
│       ├── index.ts                          # registerCalendar(server)
│       ├── data/
│       │   ├── 2025.json                     # 靜態假日資料
│       │   └── 2026.json
│       └── tools/
│           └── holidays.ts                   # get_holidays handler
tests/
├── setup.ts
├── mocks/
│   ├── handlers.ts
│   ├── cwa-response.json
│   ├── epa-response.json
│   ├── tdx-token-response.json
│   ├── tdx-bus-response.json
│   ├── afa-response.json
│   └── taipower-response.json
├── cache/
│   └── cache.test.ts
├── modules/
│   ├── tw-environment/
│   │   ├── weather.test.ts
│   │   └── air-quality.test.ts
│   ├── tw-transit/
│   │   └── bus-arrivals.test.ts
│   ├── tw-agriculture/
│   │   └── agri-price.test.ts
│   ├── tw-energy/
│   │   └── power-status.test.ts
│   └── tw-calendar/
│       └── holidays.test.ts
└── integration/
    └── server.test.ts
.github/workflows/ci.yml
```

### Files to modify

```
src/server.ts                    # 加入新模組的 register 呼叫
src/resources/capabilities.ts    # 更新 CAPABILITIES 文字涵蓋所有模組
```

---

## Task 1: Shared Fetch Wrapper

**Files:**
- Create: `src/utils/fetch.ts`
- Test: `tests/utils/fetch.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/utils/fetch.test.ts
import { describe, it, expect, vi } from "vitest";
import { fetchWithTimeout } from "../src/utils/fetch.js";

describe("fetchWithTimeout", () => {
  it("should throw on timeout", async () => {
    // Use a server that never responds
    await expect(
      fetchWithTimeout("http://localhost:1", { timeoutMs: 100 }),
    ).rejects.toThrow();
  });

  it("should return response on success", async () => {
    const response = await fetchWithTimeout("https://httpbin.org/get", {
      timeoutMs: 5000,
    });
    expect(response.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/utils/fetch.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/utils/fetch.ts
export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const { timeoutMs = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/utils/fetch.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/fetch.ts tests/utils/fetch.test.ts
git commit -m "feat: add shared fetch wrapper with timeout support"
```

---

## Task 2: TDX OAuth2 Client

**Files:**
- Create: `src/modules/tw-transit/clients/tdx.ts`
- Test: `tests/modules/tw-transit/tdx-client.test.ts`
- Reference: `docs/phase-3-tw-transit.md`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/modules/tw-transit/tdx-client.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const TDX_TOKEN_URL =
  "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token";

const mockServer = setupServer(
  http.post(TDX_TOKEN_URL, () => {
    return HttpResponse.json({
      access_token: "mock-token-123",
      expires_in: 86400,
      token_type: "Bearer",
    });
  }),
);

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe("TDX Client", () => {
  it("should fetch access token", async () => {
    const { getAccessToken } = await import(
      "../../src/modules/tw-transit/clients/tdx.js"
    );
    const token = await getAccessToken();
    expect(token).toBe("mock-token-123");
  });

  it("should reuse cached token", async () => {
    const { getAccessToken } = await import(
      "../../src/modules/tw-transit/clients/tdx.js"
    );
    const token1 = await getAccessToken();
    const token2 = await getAccessToken();
    expect(token1).toBe(token2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/modules/tw-transit/tdx-client.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/modules/tw-transit/clients/tdx.ts
import { config } from "../../../config.js";
import { fetchWithTimeout } from "../../../utils/fetch.js";

const TOKEN_URL =
  "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token";
const TDX_API_BASE = "https://tdx.transportdata.tw/api/basic";

let token: string | null = null;
let tokenExpiresAt = 0;

export async function getAccessToken(): Promise<string> {
  if (token && Date.now() < tokenExpiresAt - 60_000) return token;

  if (!config.tdxClientId || !config.tdxClientSecret) {
    throw new Error(
      "TDX_CLIENT_ID 或 TDX_CLIENT_SECRET 未設定，請至 https://tdx.transportdata.tw/ 申請",
    );
  }

  const response = await fetchWithTimeout(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.tdxClientId,
      client_secret: config.tdxClientSecret,
    }),
    timeoutMs: 10000,
  });

  if (!response.ok) {
    throw new Error(`TDX Token 取得失敗: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  token = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return token!;
}

export interface BusArrival {
  stopName: string;
  estimateTime: number | null;
  stopStatus: number;
}

export async function fetchBusArrivals(
  city: string,
  routeName: string,
): Promise<BusArrival[]> {
  const accessToken = await getAccessToken();

  const url = `${TDX_API_BASE}/v2/Bus/EstimatedTimeOfArrival/City/${city}/${routeName}`;
  const response = await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeoutMs: 10000,
  });

  if (!response.ok) {
    throw new Error(`TDX API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data: any[] = await response.json();

  return data.map((item) => ({
    stopName: item.StopName?.Zh_tw ?? "未知站牌",
    estimateTime: item.EstimateTime ?? null,
    stopStatus: item.StopStatus ?? -1,
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/modules/tw-transit/tdx-client.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/tw-transit/clients/tdx.ts tests/modules/tw-transit/tdx-client.test.ts
git commit -m "feat: add TDX OAuth2 client with token caching"
```

---

## Task 3: get_bus_arrivals Tool

**Files:**
- Create: `src/modules/tw-transit/tools/bus-arrivals.ts`
- Create: `src/modules/tw-transit/index.ts`
- Modify: `src/server.ts`
- Test: `tests/modules/tw-transit/bus-arrivals.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/modules/tw-transit/bus-arrivals.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const TDX_TOKEN_URL =
  "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token";
const TDX_BUS_URL =
  "https://tdx.transportdata.tw/api/basic/v2/Bus/EstimatedTimeOfArrival/City/Taipei/307";

const mockServer = setupServer(
  http.post(TDX_TOKEN_URL, () => {
    return HttpResponse.json({
      access_token: "mock-token",
      expires_in: 86400,
      token_type: "Bearer",
    });
  }),
  http.get(TDX_BUS_URL, () => {
    return HttpResponse.json([
      {
        StopName: { Zh_tw: "臺北車站" },
        EstimateTime: 180,
        StopStatus: 0,
      },
      {
        StopName: { Zh_tw: "中山站" },
        EstimateTime: 420,
        StopStatus: 0,
      },
    ]);
  }),
);

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe("busArrivalsHandler", () => {
  it("should return formatted bus arrival times", async () => {
    const { busArrivalsHandler } = await import(
      "../../src/modules/tw-transit/tools/bus-arrivals.js"
    );
    const result = await busArrivalsHandler({ city: "Taipei", routeName: "307" });
    expect(result.content[0].text).toContain("臺北車站");
    expect(result.content[0].text).toContain("3 分鐘");
    expect(result.isError).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/modules/tw-transit/bus-arrivals.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write bus-arrivals tool**

```typescript
// src/modules/tw-transit/tools/bus-arrivals.ts
import { z } from "zod";
import { fetchBusArrivals } from "../clients/tdx.js";

export const busArrivalsToolConfig = {
  description: "查詢公車即時到站時間，回傳指定路線各站預估到站分鐘數",
  inputSchema: {
    city: z.string().describe("城市代碼：Taipei, NewTaipei, Taoyuan, Taichung, Tainan, Kaohsiung"),
    routeName: z.string().describe("路線名稱，如「307」「299」「藍28」"),
  },
};

function formatEstimateTime(seconds: number | null, status: number): string {
  if (status === 1) return "尚未發車";
  if (status === 2) return "交管不停靠";
  if (status === 3) return "末班車已過";
  if (status === 4) return "今日未營運";
  if (seconds === null) return "未知";
  if (seconds <= 60) return "進站中";
  return `${Math.floor(seconds / 60)} 分鐘`;
}

export async function busArrivalsHandler({
  city,
  routeName,
}: {
  city: string;
  routeName: string;
}) {
  try {
    const arrivals = await fetchBusArrivals(city, routeName);

    if (arrivals.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `找不到 ${city} 路線「${routeName}」的到站資料，請確認城市代碼與路線名稱`,
          },
        ],
      };
    }

    const result = arrivals
      .map(
        (a) =>
          `${a.stopName}：${formatEstimateTime(a.estimateTime, a.stopStatus)}`,
      )
      .join("\n");

    const header = `公車 ${routeName}（${city}）即時到站\n${"─".repeat(30)}\n`;

    return {
      content: [{ type: "text" as const, text: header + result }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `查詢公車到站失敗: ${error instanceof Error ? error.message : "未知錯誤"}`,
        },
      ],
      isError: true,
    };
  }
}
```

- [ ] **Step 4: Write module register**

```typescript
// src/modules/tw-transit/index.ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  busArrivalsToolConfig,
  busArrivalsHandler,
} from "./tools/bus-arrivals.js";

export function registerTransit(server: McpServer): void {
  server.tool(
    "get_bus_arrivals",
    busArrivalsToolConfig.description,
    busArrivalsToolConfig.inputSchema,
    busArrivalsHandler,
  );
}
```

- [ ] **Step 5: Register module in server.ts**

Add to `src/server.ts`:

```typescript
import { registerTransit } from "./modules/tw-transit/index.js";
// ... inside createServer():
registerTransit(server);
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tests/modules/tw-transit/bus-arrivals.test.ts`
Expected: PASS

- [ ] **Step 7: Run build to verify no type errors**

Run: `npm run build`
Expected: Success

- [ ] **Step 8: Commit**

```bash
git add src/modules/tw-transit/ src/server.ts tests/modules/tw-transit/bus-arrivals.test.ts
git commit -m "feat: add tw-transit module with get_bus_arrivals tool"
```

---

## Task 4: Agriculture Client + get_agri_price Tool

**Files:**
- Create: `src/modules/tw-agriculture/clients/afa.ts`
- Create: `src/modules/tw-agriculture/tools/agri-price.ts`
- Create: `src/modules/tw-agriculture/index.ts`
- Modify: `src/server.ts`
- Test: `tests/modules/tw-agriculture/agri-price.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/modules/tw-agriculture/agri-price.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const AFA_URL =
  "https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx";

const mockServer = setupServer(
  http.get(AFA_URL, ({ request }) => {
    const url = new URL(request.url);
    const crop = url.searchParams.get("Crop");
    if (crop === "甘藍") {
      return HttpResponse.json([
        {
          交易日期: "115.05.12",
          作物代號: "LA1",
          作物名稱: "甘藍",
          市場代號: "104",
          市場名稱: "台北二",
          上價: 25.3,
          中價: 18.7,
          下價: 10.2,
          平均價: 18.1,
          交易量: 52340,
        },
        {
          交易日期: "115.05.12",
          作物代號: "LA1",
          作物名稱: "甘藍",
          市場代號: "109",
          市場名稱: "台中",
          上價: 22.0,
          中價: 16.5,
          下價: 9.8,
          平均價: 16.1,
          交易量: 31200,
        },
      ]);
    }
    return HttpResponse.json([]);
  }),
);

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe("agriPriceHandler", () => {
  it("should return market prices for a crop", async () => {
    const { agriPriceHandler } = await import(
      "../../src/modules/tw-agriculture/tools/agri-price.js"
    );
    const result = await agriPriceHandler({ product: "高麗菜" });
    expect(result.content[0].text).toContain("台北二");
    expect(result.content[0].text).toContain("18.1");
    expect(result.isError).toBeUndefined();
  });

  it("should return empty message for unknown crop", async () => {
    const { agriPriceHandler } = await import(
      "../../src/modules/tw-agriculture/tools/agri-price.js"
    );
    const result = await agriPriceHandler({ product: "不存在的作物" });
    expect(result.content[0].text).toContain("找不到");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/modules/tw-agriculture/agri-price.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write AFA client**

```typescript
// src/modules/tw-agriculture/clients/afa.ts
import { config } from "../../../config.js";
import { fetchWithTimeout } from "../../../utils/fetch.js";

const API_URL =
  "https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx";

// 常見別名對照表
const CROP_ALIASES: Record<string, string> = {
  高麗菜: "甘藍",
  空心菜: "蕹菜",
  地瓜葉: "甘薯葉",
  小白菜: "青江白菜",
  大白菜: "包心白菜",
  番茄: "蕃茄",
};

export interface AgriPrice {
  date: string;
  cropName: string;
  marketName: string;
  highPrice: number;
  midPrice: number;
  lowPrice: number;
  avgPrice: number;
  volume: number;
}

function toMinguoDate(date: Date): string {
  const year = date.getFullYear() - 1911;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export function resolveCropName(input: string): string {
  return CROP_ALIASES[input] ?? input;
}

export async function fetchAgriPrice(
  product: string,
): Promise<AgriPrice[]> {
  if (!config.afaApiKey) {
    throw new Error(
      "AFA_API_KEY 未設定，請至 https://data.moa.gov.tw/ 申請",
    );
  }

  const cropName = resolveCropName(product);
  const today = new Date();
  const dateStr = toMinguoDate(today);

  const url = new URL(API_URL);
  url.searchParams.set("$top", "100");
  url.searchParams.set("$skip", "0");
  url.searchParams.set("Crop", cropName);
  url.searchParams.set("StartDate", dateStr);
  url.searchParams.set("EndDate", dateStr);

  const response = await fetchWithTimeout(url.toString(), { timeoutMs: 10000 });
  if (!response.ok) {
    throw new Error(`農業部 API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data: any[] = await response.json();

  return data.map((item) => ({
    date: item["交易日期"],
    cropName: item["作物名稱"],
    marketName: item["市場名稱"],
    highPrice: Number(item["上價"]),
    midPrice: Number(item["中價"]),
    lowPrice: Number(item["下價"]),
    avgPrice: Number(item["平均價"]),
    volume: Number(item["交易量"]),
  }));
}
```

- [ ] **Step 4: Write agri-price tool**

```typescript
// src/modules/tw-agriculture/tools/agri-price.ts
import { z } from "zod";
import { cached } from "../../../cache/index.js";
import { fetchAgriPrice, resolveCropName } from "../clients/afa.js";

export const agriPriceToolConfig = {
  description:
    "查詢台灣農產品（蔬菜、水果、花卉）當日批發市場交易行情，回傳各市場價格與交易量",
  inputSchema: {
    product: z
      .string()
      .describe("品項名稱，如「高麗菜」「香蕉」「玫瑰」"),
  },
};

export async function agriPriceHandler({
  product,
}: {
  product: string;
}) {
  try {
    const prices = await cached(
      `agri-price:${resolveCropName(product)}`,
      3600,
      () => fetchAgriPrice(product),
    );

    if (prices.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `找不到「${product}」的交易行情，請確認品項名稱（如「高麗菜」「香蕉」「玫瑰」）`,
          },
        ],
      };
    }

    const result = prices
      .map(
        (p) =>
          `${p.marketName}：均價 ${p.avgPrice} 元/kg（${p.lowPrice}~${p.highPrice}），交易量 ${p.volume.toLocaleString()} kg`,
      )
      .join("\n");

    const header = `${prices[0].cropName} 交易行情（${prices[0].date}）\n${"─".repeat(40)}\n`;

    return {
      content: [{ type: "text" as const, text: header + result }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `查詢農產品行情失敗: ${error instanceof Error ? error.message : "未知錯誤"}`,
        },
      ],
      isError: true,
    };
  }
}
```

- [ ] **Step 5: Write module register**

```typescript
// src/modules/tw-agriculture/index.ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  agriPriceToolConfig,
  agriPriceHandler,
} from "./tools/agri-price.js";

export function registerAgriculture(server: McpServer): void {
  server.tool(
    "get_agri_price",
    agriPriceToolConfig.description,
    agriPriceToolConfig.inputSchema,
    agriPriceHandler,
  );
}
```

- [ ] **Step 6: Register in server.ts**

Add to `src/server.ts`:

```typescript
import { registerAgriculture } from "./modules/tw-agriculture/index.js";
// ... inside createServer():
registerAgriculture(server);
```

- [ ] **Step 7: Run tests and build**

Run: `npx vitest run tests/modules/tw-agriculture/agri-price.test.ts && npm run build`
Expected: PASS + build success

- [ ] **Step 8: Commit**

```bash
git add src/modules/tw-agriculture/ src/server.ts tests/modules/tw-agriculture/
git commit -m "feat: add tw-agriculture module with get_agri_price tool"
```

---

## Task 5: Taipower Client + get_power_status Tool

**Files:**
- Create: `src/modules/tw-energy/clients/taipower.ts`
- Create: `src/modules/tw-energy/tools/power-status.ts`
- Create: `src/modules/tw-energy/index.ts`
- Modify: `src/server.ts`
- Test: `tests/modules/tw-energy/power-status.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/modules/tw-energy/power-status.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const TAIPOWER_URL =
  "https://service.taipower.com.tw/data/opendata/apply/file/d006001/001.json";

const mockServer = setupServer(
  http.get(TAIPOWER_URL, () => {
    return HttpResponse.json({
      "": "台灣電力公司_各機組發電量即時資訊",
      aaData: [
        ["1", "燃氣", "大潭CC#1", "742.7", "608.7", "", "", ""],
        ["2", "燃煤", "林口#1", "800.0", "762.5", "", "", ""],
        ["3", "核能", "核二#2", "985.0", "0.0", "", "", ""],
        ["4", "風力", "風力合計", "200.0", "85.3", "", "", ""],
        ["5", "太陽能", "太陽能合計", "500.0", "320.1", "", "", ""],
        ["6", "水力", "德基", "234.0", "120.0", "", "", ""],
      ],
    });
  }),
);

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe("powerStatusHandler", () => {
  it("should return categorized power generation", async () => {
    const { powerStatusHandler } = await import(
      "../../src/modules/tw-energy/tools/power-status.js"
    );
    const result = await powerStatusHandler({});
    const text = result.content[0].text;
    expect(text).toContain("燃氣");
    expect(text).toContain("燃煤");
    expect(text).toContain("MW");
    expect(result.isError).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/modules/tw-energy/power-status.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write Taipower client**

```typescript
// src/modules/tw-energy/clients/taipower.ts
import { fetchWithTimeout } from "../../../utils/fetch.js";

const API_URL =
  "https://service.taipower.com.tw/data/opendata/apply/file/d006001/001.json";

export interface PowerUnit {
  type: string;
  name: string;
  capacity: number;
  generation: number;
}

export interface PowerSummary {
  updatedAt: string;
  units: PowerUnit[];
  totalGeneration: number;
  byType: Record<string, { generation: number; percentage: number }>;
}

export async function fetchPowerStatus(): Promise<PowerSummary> {
  const response = await fetchWithTimeout(API_URL, { timeoutMs: 10000 });
  if (!response.ok) {
    throw new Error(`台電 API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rows: string[][] = data.aaData ?? [];

  const units: PowerUnit[] = rows.map((row) => ({
    type: row[1],
    name: row[2],
    capacity: parseFloat(row[3]) || 0,
    generation: parseFloat(row[4]) || 0,
  }));

  const totalGeneration = units.reduce((sum, u) => sum + u.generation, 0);

  // 依類型彙總
  const typeMap: Record<string, number> = {};
  for (const unit of units) {
    typeMap[unit.type] = (typeMap[unit.type] ?? 0) + unit.generation;
  }

  const byType: Record<string, { generation: number; percentage: number }> = {};
  for (const [type, generation] of Object.entries(typeMap)) {
    byType[type] = {
      generation,
      percentage: totalGeneration > 0 ? (generation / totalGeneration) * 100 : 0,
    };
  }

  return {
    updatedAt: Object.values(data).find((v) => typeof v === "string" && /\d{4}/.test(v as string)) as string ?? "未知",
    units,
    totalGeneration,
    byType,
  };
}
```

- [ ] **Step 4: Write power-status tool**

```typescript
// src/modules/tw-energy/tools/power-status.ts
import { cached } from "../../../cache/index.js";
import { fetchPowerStatus } from "../clients/taipower.js";

export const powerStatusToolConfig = {
  description:
    "查詢台灣即時電力供需狀態，包含各類發電佔比與總發電量",
  inputSchema: {},
};

export async function powerStatusHandler(_args: Record<string, never>) {
  try {
    const status = await cached("power-status", 180, fetchPowerStatus);

    // 依發電量降序排列
    const sorted = Object.entries(status.byType).sort(
      (a, b) => b[1].generation - a[1].generation,
    );

    const breakdown = sorted
      .map(
        ([type, info]) =>
          `  - ${type}：${info.percentage.toFixed(1)}%（${info.generation.toFixed(0)} MW）`,
      )
      .join("\n");

    const text = [
      `台灣即時電力狀態`,
      "─".repeat(30),
      `總淨發電量：${status.totalGeneration.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} MW`,
      `各類發電佔比：`,
      breakdown,
    ].join("\n");

    return {
      content: [{ type: "text" as const, text }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `查詢電力狀態失敗: ${error instanceof Error ? error.message : "未知錯誤"}`,
        },
      ],
      isError: true,
    };
  }
}
```

- [ ] **Step 5: Write module register**

```typescript
// src/modules/tw-energy/index.ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  powerStatusToolConfig,
  powerStatusHandler,
} from "./tools/power-status.js";

export function registerEnergy(server: McpServer): void {
  server.tool(
    "get_power_status",
    powerStatusToolConfig.description,
    powerStatusToolConfig.inputSchema,
    powerStatusHandler,
  );
}
```

- [ ] **Step 6: Register in server.ts**

Add to `src/server.ts`:

```typescript
import { registerEnergy } from "./modules/tw-energy/index.js";
// ... inside createServer():
registerEnergy(server);
```

- [ ] **Step 7: Run tests and build**

Run: `npx vitest run tests/modules/tw-energy/power-status.test.ts && npm run build`
Expected: PASS + build success

- [ ] **Step 8: Commit**

```bash
git add src/modules/tw-energy/ src/server.ts tests/modules/tw-energy/
git commit -m "feat: add tw-energy module with get_power_status tool"
```

---

## Task 6: Calendar Static Data + get_holidays Tool

**Files:**
- Create: `src/modules/tw-calendar/data/2025.json`
- Create: `src/modules/tw-calendar/data/2026.json`
- Create: `src/modules/tw-calendar/tools/holidays.ts`
- Create: `src/modules/tw-calendar/index.ts`
- Modify: `src/server.ts`
- Test: `tests/modules/tw-calendar/holidays.test.ts`

- [ ] **Step 1: Download calendar data**

Download from https://github.com/ruyut/TaiwanCalendar and transform into the expected format. Place in `src/modules/tw-calendar/data/2025.json` and `2026.json`.

Each entry:
```json
{
  "date": "2026-01-01",
  "name": "中華民國開國紀念日",
  "isHoliday": true,
  "description": "國定假日"
}
```

- [ ] **Step 2: Write the failing test**

```typescript
// tests/modules/tw-calendar/holidays.test.ts
import { describe, it, expect } from "vitest";

describe("holidaysHandler", () => {
  it("should return holidays for a known year", async () => {
    const { holidaysHandler } = await import(
      "../../src/modules/tw-calendar/tools/holidays.js"
    );
    const result = await holidaysHandler({ year: 2026 });
    expect(result.content[0].text).toContain("國定假日");
    expect(result.isError).toBeUndefined();
  });

  it("should return friendly message for unknown year", async () => {
    const { holidaysHandler } = await import(
      "../../src/modules/tw-calendar/tools/holidays.js"
    );
    const result = await holidaysHandler({ year: 2099 });
    expect(result.content[0].text).toContain("尚無");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/modules/tw-calendar/holidays.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Write holidays tool**

```typescript
// src/modules/tw-calendar/tools/holidays.ts
import { z } from "zod";
import { cached } from "../../../cache/index.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export const holidaysToolConfig = {
  description: "查詢台灣指定年份的國定假日、補班日與連假區間",
  inputSchema: {
    year: z.number().describe("西元年份，如 2026"),
  },
};

interface CalendarEntry {
  date: string;
  name: string;
  isHoliday: boolean;
  description: string;
}

function loadCalendarData(year: number): CalendarEntry[] | null {
  try {
    return require(`../data/${year}.json`);
  } catch {
    return null;
  }
}

function findConsecutiveHolidays(entries: CalendarEntry[]): string[] {
  const holidays = entries
    .filter((e) => e.isHoliday)
    .sort((a, b) => a.date.localeCompare(b.date));

  const groups: CalendarEntry[][] = [];
  let current: CalendarEntry[] = [];

  for (const h of holidays) {
    if (current.length === 0) {
      current.push(h);
      continue;
    }
    const lastDate = new Date(current[current.length - 1].date);
    const thisDate = new Date(h.date);
    const diffDays =
      (thisDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 1) {
      current.push(h);
    } else {
      if (current.length >= 3) groups.push([...current]);
      current = [h];
    }
  }
  if (current.length >= 3) groups.push(current);

  return groups.map((g) => {
    const start = g[0].date;
    const end = g[g.length - 1].date;
    const names = [...new Set(g.map((e) => e.name).filter((n) => n !== ""))];
    return `${start} ~ ${end}（${g.length} 天，${names.join("、") || "週末連假"}）`;
  });
}

export async function holidaysHandler({ year }: { year: number }) {
  const data = await cached(`holidays:${year}`, 86400, async () =>
    loadCalendarData(year),
  );

  if (!data) {
    return {
      content: [
        {
          type: "text" as const,
          text: `目前尚無 ${year} 年行事曆資料，已收錄年份：2025、2026`,
        },
      ],
    };
  }

  const holidays = data.filter(
    (e) => e.isHoliday && e.description.includes("國定假日"),
  );
  const makeupDays = data.filter((e) => !e.isHoliday && e.name.includes("補班"));
  const longWeekends = findConsecutiveHolidays(data);

  const sections: string[] = [];

  sections.push(`${year} 年台灣行事曆\n${"─".repeat(30)}`);

  if (holidays.length > 0) {
    sections.push("【國定假日】");
    sections.push(holidays.map((h) => `  ${h.date}  ${h.name}`).join("\n"));
  }

  if (makeupDays.length > 0) {
    sections.push("\n【補班日】");
    sections.push(
      makeupDays.map((m) => `  ${m.date}  ${m.description}`).join("\n"),
    );
  }

  if (longWeekends.length > 0) {
    sections.push("\n【連假區間】（3 天以上）");
    sections.push(longWeekends.map((lw) => `  ${lw}`).join("\n"));
  }

  return {
    content: [{ type: "text" as const, text: sections.join("\n") }],
  };
}
```

- [ ] **Step 5: Write module register**

```typescript
// src/modules/tw-calendar/index.ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  holidaysToolConfig,
  holidaysHandler,
} from "./tools/holidays.js";

export function registerCalendar(server: McpServer): void {
  server.tool(
    "get_holidays",
    holidaysToolConfig.description,
    holidaysToolConfig.inputSchema,
    holidaysHandler,
  );
}
```

- [ ] **Step 6: Register in server.ts**

Add to `src/server.ts`:

```typescript
import { registerCalendar } from "./modules/tw-calendar/index.js";
// ... inside createServer():
registerCalendar(server);
```

- [ ] **Step 7: Run tests and build**

Run: `npx vitest run tests/modules/tw-calendar/holidays.test.ts && npm run build`
Expected: PASS + build success

- [ ] **Step 8: Commit**

```bash
git add src/modules/tw-calendar/ src/server.ts tests/modules/tw-calendar/
git commit -m "feat: add tw-calendar module with get_holidays tool"
```

---

## Task 7: Tests for Existing Modules (tw-environment)

**Files:**
- Create: `tests/setup.ts`
- Create: `tests/mocks/handlers.ts`
- Create: `tests/mocks/cwa-response.json`
- Create: `tests/mocks/epa-response.json`
- Create: `tests/modules/tw-environment/weather.test.ts`
- Create: `tests/modules/tw-environment/air-quality.test.ts`
- Create: `tests/cache/cache.test.ts`
- Modify: `vitest.config.ts` (create if not exists)

- [ ] **Step 1: Create vitest config with msw setup**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

- [ ] **Step 2: Write cache unit test**

```typescript
// tests/cache/cache.test.ts
import { describe, it, expect, vi } from "vitest";
import { cached } from "../../src/cache/index.js";

describe("cached", () => {
  it("should call fetcher on cache miss", async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: "test" });
    const result = await cached("test-key-1", 60, fetcher);
    expect(result).toEqual({ data: "test" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("should return cached value on cache hit", async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: "fresh" });
    await cached("test-key-2", 60, fetcher);
    const result = await cached("test-key-2", 60, fetcher);
    expect(result).toEqual({ data: "fresh" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: Write CWA mock response and weather test**

```json
// tests/mocks/cwa-response.json
{
  "records": {
    "location": [
      {
        "locationName": "臺北市",
        "weatherElement": [
          { "elementName": "Wx", "time": [{ "parameter": { "parameterName": "多雲" } }] },
          { "elementName": "PoP", "time": [{ "parameter": { "parameterName": "30" } }] },
          { "elementName": "MinT", "time": [{ "parameter": { "parameterName": "24" } }] },
          { "elementName": "MaxT", "time": [{ "parameter": { "parameterName": "31" } }] },
          { "elementName": "CI", "time": [{ "parameter": { "parameterName": "舒適" } }] }
        ]
      }
    ]
  }
}
```

```typescript
// tests/modules/tw-environment/weather.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import cwaResponse from "../../mocks/cwa-response.json";

const CWA_URL = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001";

const mockServer = setupServer(
  http.get(CWA_URL, () => HttpResponse.json(cwaResponse)),
);

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe("weatherHandler", () => {
  it("should return formatted weather for valid location", async () => {
    const { weatherHandler } = await import(
      "../../src/modules/tw-environment/tools/weather.js"
    );
    const result = await weatherHandler({ location: "臺北市" });
    expect(result.content[0].text).toContain("臺北市");
    expect(result.content[0].text).toContain("多雲");
    expect(result.content[0].text).toContain("24");
  });
});
```

- [ ] **Step 4: Write EPA mock response and air quality test**

```json
// tests/mocks/epa-response.json
{
  "records": [
    {
      "sitename": "士林",
      "county": "臺北市",
      "aqi": "42",
      "pm2.5": "12",
      "pm10": "25",
      "status": "良好",
      "publishtime": "2026-05-12 14:00"
    },
    {
      "sitename": "中山",
      "county": "臺北市",
      "aqi": "45",
      "pm2.5": "14",
      "pm10": "28",
      "status": "良好",
      "publishtime": "2026-05-12 14:00"
    }
  ]
}
```

```typescript
// tests/modules/tw-environment/air-quality.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import epaResponse from "../../mocks/epa-response.json";

const EPA_URL = "https://data.moenv.gov.tw/api/v2/aqx_p_432";

const mockServer = setupServer(
  http.get(EPA_URL, () => HttpResponse.json(epaResponse)),
);

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe("airQualityHandler", () => {
  it("should return AQI data for valid location", async () => {
    const { airQualityHandler } = await import(
      "../../src/modules/tw-environment/tools/air-quality.js"
    );
    const result = await airQualityHandler({ location: "臺北市" });
    expect(result.content[0].text).toContain("士林");
    expect(result.content[0].text).toContain("42");
    expect(result.content[0].text).toContain("良好");
  });
});
```

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add tests/ vitest.config.ts
git commit -m "test: add unit tests for cache and tw-environment module"
```

---

## Task 8: Integration Test

**Files:**
- Create: `tests/integration/server.test.ts`

- [ ] **Step 1: Write integration test**

```typescript
// tests/integration/server.test.ts
import { describe, it, expect } from "vitest";
import { createServer } from "../../src/server.js";

describe("MCP Server Integration", () => {
  it("should create server with all tools registered", () => {
    const server = createServer();
    expect(server).toBeDefined();
  });
});
```

> **Note:** Full MCP protocol integration test (list tools, call tool) requires MCP client transport setup. Start with a smoke test that the server creates without throwing, and expand later.

- [ ] **Step 2: Run test**

Run: `npx vitest run tests/integration/server.test.ts`
Expected: PASS

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add tests/integration/
git commit -m "test: add MCP server integration smoke test"
```

---

## Task 9: Update Capabilities Resource

**Files:**
- Modify: `src/resources/capabilities.ts`

- [ ] **Step 1: Update CAPABILITIES_CONTENT to include all modules**

```typescript
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
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: Success

- [ ] **Step 3: Commit**

```bash
git add src/resources/capabilities.ts
git commit -m "docs: update CAPABILITIES resource with all modules"
```

---

## Task 10: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

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

- [ ] **Step 2: Run the CI steps locally to verify**

Run: `npm run type-check && npm test && npm run build`
Expected: All pass

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Actions workflow for Node 18/20/22"
```

---

## Task 11: npm Publish Preparation

**Files:**
- Modify: `package.json` (version bump, keywords, etc.)
- Create: `README.md` (if not exists)
- Verify: `.env.example`, `.gitignore`

- [ ] **Step 1: Verify package.json is publish-ready**

Check:
- `"name": "opendata-mcp-server"`
- `"version": "0.1.0"` → bump to `"1.0.0"` when shipping
- `"files": ["build"]` — only publishes compiled output
- `"bin"` points to `./build/index.js`
- `"keywords"` includes: `mcp`, `open-data`, `typescript`, `taiwan`
- `"license": "MIT"`

- [ ] **Step 2: Verify .gitignore excludes build and env**

Ensure `.gitignore` contains:
```
node_modules/
build/
.env
```

- [ ] **Step 3: Write README.md**

Write a concise README with:
- What this is (1 paragraph)
- Quick start (npx + Claude Desktop config)
- Available tools table
- Environment variables table
- License

- [ ] **Step 4: Dry-run publish**

Run: `npm pack --dry-run`
Expected: Only `build/` files listed, no `.env` or `node_modules`

- [ ] **Step 5: Commit**

```bash
git add package.json README.md .gitignore .env.example
git commit -m "chore: prepare for npm publish"
```

---

## Execution Order

```
Task 1 (fetch wrapper)
   ↓
Task 2 (TDX client)  →  Task 3 (bus arrivals tool)
   ↓ (independent after Task 1)
Task 4 (agriculture)
Task 5 (energy)
Task 6 (calendar)
   ↓ (all modules done)
Task 7 (tw-environment tests)  — can run in parallel with 2-6
Task 8 (integration test)      — after all modules registered
Task 9 (capabilities update)   — after all modules done
Task 10 (CI)                   — after tests exist
Task 11 (publish prep)         — last
```

Tasks 2-6 depend on Task 1 (fetch wrapper). Tasks 4, 5, 6 are independent of each other. Task 7 is independent of 2-6. Tasks 8-11 are sequential after everything else.
