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
    throw new Error(
      `TDX Token 取得失敗: ${response.status} ${response.statusText}`,
    );
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
    throw new Error(
      `TDX API 錯誤: ${response.status} ${response.statusText}`,
    );
  }

  const data: any[] = await response.json();
  return data.map((item) => ({
    stopName: item.StopName?.Zh_tw ?? "未知站牌",
    estimateTime: item.EstimateTime ?? null,
    stopStatus: item.StopStatus ?? -1,
  }));
}
