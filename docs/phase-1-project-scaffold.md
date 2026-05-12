# Phase 1：專案骨架與基礎設施

**目標：** 建立可運行的空 MCP Server，確認 stdio transport 正常

## 1.1 初始化專案

```bash
npm init -y
npm install @modelcontextprotocol/sdk zod node-cache
npm install -D typescript @types/node vitest
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "tests"]
}
```

### package.json 重點配置

```json
{
  "name": "opendata-mcp-server",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "opendata-mcp-server": "./build/index.js"
  },
  "files": ["build"],
  "scripts": {
    "build": "tsc && chmod 755 build/index.js",
    "dev": "tsc --watch",
    "test": "vitest"
  }
}
```

## 1.2 Server 入口 (`src/index.ts`)

```typescript
#!/usr/bin/env node
import { createServer } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = createServer();
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("opendata-mcp-server running on stdio");
```

## 1.3 Server 初始化 (`src/server.ts`)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerEnvironment } from "./modules/tw-environment/index.js";
// 未來：import { registerTransit } from "./modules/tw-transit/index.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "opendata-mcp-server",
    version: "0.1.0",
  });

  // 註冊模組
  registerEnvironment(server);

  return server;
}
```

## 1.4 模組註冊介面

每個模組的 `index.ts` 匯出一個 `register` 函式：

```typescript
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerEnvironment(server: McpServer): void {
  // 在此註冊該模組的所有 tools
}
```

## 1.5 快取層 (`src/cache/index.ts`)

```typescript
import NodeCache from "node-cache";

const cache = new NodeCache();

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const hit = cache.get<T>(key);
  if (hit !== undefined) return hit;
  const data = await fetcher();
  cache.set(key, data, ttlSeconds);
  return data;
}
```

## 1.6 環境變數 (`src/config.ts`)

```typescript
export const config = {
  cwaApiKey: process.env.CWA_API_KEY ?? "",
  epaApiKey: process.env.EPA_API_KEY ?? "",
  tdxClientId: process.env.TDX_CLIENT_ID ?? "",
  tdxClientSecret: process.env.TDX_CLIENT_SECRET ?? "",
  afaApiKey: process.env.AFA_API_KEY ?? "",
};
```

## 1.7 MCP Resources (`src/resources/capabilities.ts`)

暴露 CAPABILITIES.md 讓 Claude 知道有哪些 Tools 可用、各自的使用場景與注意事項。

## 驗證標準

- [ ] `npm run build` 成功
- [ ] `node build/index.js` 啟動不報錯
- [ ] MCP Inspector 可連線
