# Phase 6：tw-calendar 模組（節假日）

**目標：** 查詢台灣國定假日、補班日、連假區間

## 6.1 資料來源

### 決策：內嵌靜態 JSON（ADR-004）

人事行政總處無官方 API，採用以下方案：
- **資料來源：** https://github.com/ruyut/TaiwanCalendar
- **做法：** 下載 JSON 檔案，內嵌至 `src/modules/tw-calendar/data/`
- **更新頻率：** 每年政府公布行事曆後手動更新

### 檔案結構

```
src/modules/tw-calendar/
├── index.ts          # registerCalendar(server)
├── tools/
│   └── holidays.ts   # get_holidays handler
└── data/
    ├── 2025.json
    └── 2026.json
```

> **注意：** 不需要 `clients/` 資料夾，因為資料是靜態 JSON 內嵌，非 API 呼叫。

### JSON 結構（預期）

```json
[
  {
    "date": "2026-01-01",
    "name": "中華民國開國紀念日",
    "isHoliday": true,
    "description": "國定假日"
  },
  {
    "date": "2026-01-17",
    "name": "補班日",
    "isHoliday": false,
    "description": "補 01-30 彈性放假"
  }
]
```

## 6.2 get_holidays Tool

```typescript
server.tool(
  "get_holidays",
  "查詢台灣指定年份的國定假日、補班日與連假區間",
  {
    year: z.number().describe("西元年份，如 2026"),
  },
  holidaysHandler,
);
```

- **快取 TTL：** 86400 秒（24 小時）
- **快取 Key：** `holidays:{year}`

### 輸出格式

分三區段呈現：
1. **國定假日列表**（日期、名稱）
2. **補班日列表**（日期、補哪一天）
3. **連假區間**（起訖日期、天數、假日名稱）

### 邊界處理
- 查詢未收錄年份 → 回傳「目前尚無 {year} 年行事曆資料」
- 查詢過去年份 → 正常回傳（資料內嵌）

## 驗證標準

- [ ] `get_holidays` 傳入 2026 → 回傳完整假日列表
- [ ] 連假區間計算正確
- [ ] 補班日標示清楚
- [ ] 未收錄年份回傳友善訊息
