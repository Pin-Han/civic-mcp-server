import { cached } from "../../../cache/index.js";
import { fetchPowerStatus } from "../clients/taipower.js";

function formatMW(value: number): string {
  return value
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export const powerStatusToolConfig = {
  description: "查詢台灣即時電力狀態，包含各類發電佔比與總發電量",
  inputSchema: {},
};

export async function powerStatusHandler() {
  try {
    const summary = await cached("power-status", 180, fetchPowerStatus);

    const sorted = Object.entries(summary.byType).sort(
      (a, b) => b[1].generation - a[1].generation,
    );

    const typeLines = sorted
      .map(
        ([type, info]) =>
          `  - ${type}：${info.percentage.toFixed(1)}%（${formatMW(info.generation)} MW）`,
      )
      .join("\n");

    const text = [
      "台灣即時電力狀態",
      "──────────────────────────────",
      `總淨發電量：${formatMW(summary.totalGeneration)} MW`,
      "各類發電佔比：",
      typeLines,
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
