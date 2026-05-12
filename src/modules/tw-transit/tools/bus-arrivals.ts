import { z } from "zod";
import { fetchBusArrivals } from "../clients/tdx.js";

export const busArrivalsToolConfig = {
  description: "查詢公車即時到站時間，回傳指定路線各站預估到站分鐘數",
  inputSchema: {
    city: z.string().describe("城市代碼：Taipei, NewTaipei, Taoyuan, Taichung, Tainan, Kaohsiung"),
    routeName: z.string().describe("路線名稱，如「307」「299」「藍28」"),
  },
};

export function formatEstimateTime(seconds: number | null, status: number): string {
  if (status === 1) return "尚未發車";
  if (status === 2) return "交管不停靠";
  if (status === 3) return "末班車已過";
  if (status === 4) return "今日未營運";
  if (seconds === null) return "未知";
  if (seconds <= 60) return "進站中";
  return `${Math.floor(seconds / 60)} 分鐘`;
}

export async function busArrivalsHandler({ city, routeName }: { city: string; routeName: string }) {
  try {
    const arrivals = await fetchBusArrivals(city, routeName);
    if (arrivals.length === 0) {
      return { content: [{ type: "text" as const, text: `找不到 ${city} 路線「${routeName}」的到站資料，請確認城市代碼與路線名稱` }] };
    }
    const result = arrivals.map((a) => `${a.stopName}：${formatEstimateTime(a.estimateTime, a.stopStatus)}`).join("\n");
    const header = `公車 ${routeName}（${city}）即時到站\n${"─".repeat(30)}\n`;
    return { content: [{ type: "text" as const, text: header + result }] };
  } catch (error) {
    return { content: [{ type: "text" as const, text: `查詢公車到站失敗: ${error instanceof Error ? error.message : "未知錯誤"}` }], isError: true };
  }
}
