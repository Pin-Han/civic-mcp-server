# Phase 8：發布與部署

**目標：** 發布至 npm，並準備中期 Remote MCP 部署

## 8.1 npm 發布（初期）

### 發布前檢查
- [ ] `npm run build` 成功
- [ ] `npm test` 全部通過
- [ ] `package.json` 的 version 已更新
- [ ] `README.md` 使用說明完整
- [ ] `.npmignore` 或 `files` 欄位正確（只發布 `build/`）

### 發布步驟

```bash
npm login
npm publish --access public
```

### 使用者安裝方式

```bash
npx opendata-mcp-server
```

### Claude Desktop 配置

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

## 8.2 HTTP Remote MCP（中期）

### Transport 升級

從 `StdioServerTransport` 切換到 `StreamableHTTPServerTransport`：

```typescript
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const app = express();
app.use(express.json());

app.all("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport("/mcp");
  await server.connect(transport);
  await transport.handleRequest(req, res);
});

app.listen(3000);
```

### Fly.io 部署

```toml
# fly.toml
app = "opendata-mcp"
primary_region = "nrt"  # 東京（離台灣近）

[http_service]
  internal_port = 3000
  force_https = true

[env]
  NODE_ENV = "production"
```

```bash
fly launch
fly secrets set CWA_API_KEY=xxx EPA_API_KEY=xxx ...
fly deploy
```

### Remote MCP 使用

```json
{
  "mcpServers": {
    "opendata": {
      "url": "https://opendata-mcp.fly.dev/mcp"
    }
  }
}
```

## 8.3 Redis 快取（中期）

從 `node-cache` 切換到 Redis：

```typescript
// src/cache/index.ts（Redis 版本）
import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit) as T;
  const data = await fetcher();
  await redis.set(key, JSON.stringify(data), { EX: ttlSeconds });
  return data;
}
```

因為快取介面 `cached(key, ttl, fetcher)` 不變，所有模組無需修改。

## 驗證標準

- [ ] `npx opendata-mcp-server` 可正常啟動
- [ ] Claude Desktop 可透過 npx 連線使用
- [ ] （中期）Remote MCP URL 可連線
- [ ] （中期）Redis 快取正常運作
