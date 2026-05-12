# Phase 4：tw-agriculture 模組（農產品）

**目標：** 查詢蔬菜、水果、花卉每日交易行情

## 4.1 AFA Client (`src/modules/tw-agriculture/clients/afa.ts`)

### API 資訊
- **平台：** 農業部開放資料平台
- **Dataset ID：** 037（農產品交易行情）
- **Base URL：** `https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx`
- **認證：** API Key（`AFA_API_KEY`），帶在 query param
- **更新頻率：** 每日收盤後更新
- **資料範圍：** 各批發市場蔬菜、水果、花卉交易行情
- **註冊：** https://data.moa.gov.tw/ 申請帳號後取得 API Key

### 請求參數

| 參數 | 說明 | 範例 |
|------|------|------|
| `$top` | 回傳筆數上限 | `100` |
| `$skip` | 跳過前 N 筆 | `0` |
| `StartDate` | 起始日期（民國年） | `115.05.12` |
| `EndDate` | 結束日期（民國年） | `115.05.12` |
| `Market` | 市場名稱（選填） | `台北二` |
| `Crop` | 作物名稱（選填） | `甘藍` |

> **注意：** 日期格式為民國年 `YYY.MM.DD`，需從西元年轉換（西元 - 1911）
> 若不帶日期，預設回傳最近四天資料

### 請求範例

```
GET https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx?$top=100&$skip=0&Crop=甘藍&StartDate=115.05.12&EndDate=115.05.12
```

### 回傳結構

```json
[
  {
    "交易日期": "115.05.12",
    "作物代號": "LA1",
    "作物名稱": "甘藍",
    "市場代號": "104",
    "市場名稱": "台北二",
    "上價": 25.3,
    "中價": 18.7,
    "下價": 10.2,
    "平均價": 18.1,
    "交易量": 52340
  }
]
```

> **注意：** 回傳為 JSON 陣列（非包在 `records` 裡），直接解析即可

### 常見作物名稱對照

使用者可能說「高麗菜」，但 API 裡的品名是「甘藍」。需建立常見別名對照表：

| 使用者輸入 | API 品名 |
|-----------|---------|
| 高麗菜 | 甘藍 |
| 空心菜 | 蕹菜 |
| 地瓜葉 | 甘薯葉 |
| 小白菜 | 青江白菜 |
| 蘋果 | 蘋果 |
| 香蕉 | 香蕉 |

## 4.2 get_agri_price Tool

```typescript
server.tool(
  "get_agri_price",
  "查詢台灣農產品（蔬菜、水果、花卉）當日批發市場交易行情",
  {
    product: z.string().describe("品項名稱，如「高麗菜」「香蕉」「玫瑰」"),
  },
  agriPriceHandler,
);
```

- **快取 TTL：** 3600 秒（1 小時）
- **快取 Key：** `agri-price:{product}`

### 輸出格式

回傳該品項在各主要市場的當日行情，包含：
- 市場名稱
- 平均價格
- 交易量
- 上價 / 下價

### 日期轉換邏輯

```typescript
function toMinguoDate(date: Date): string {
  const year = date.getFullYear() - 1911;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}
```

## 驗證標準

- [ ] `get_agri_price` 傳入「高麗菜」→ 回傳各市場價格
- [ ] 收盤前查詢回傳前一日資料
- [ ] 品項名稱模糊匹配（「高麗菜」→「甘藍」）
- [ ] API Key 缺失時回傳明確錯誤訊息
