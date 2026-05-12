import { z } from "zod";
import { cached } from "../../../cache/index.js";
import { fetchAirQuality } from "../clients/epa.js";

export const airQualityToolConfig = {
  description: "查詢台灣各縣市即時空氣品質（AQI、PM2.5），回傳該縣市所有監測站資料",
  inputSchema: {
    location: z
      .string()
      .describe('縣市名稱，如「臺北市」「高雄市」「新北市」'),
  },
};

export async function airQualityHandler({
  location,
}: {
  location: string;
}) {
  try {
    const stations = await cached(
      `air-quality:${location}`,
      300,
      () => fetchAirQuality(location),
    );

    if (stations.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `找不到「${location}」的空品資料，請確認縣市名稱（如「臺北市」「高雄市」）`,
          },
        ],
      };
    }

    const result = stations
      .map(
        (s) =>
          `${s.siteName}（${s.county}）：AQI ${s.aqi}（${s.status}），PM2.5 ${s.pm25} μg/m³，PM10 ${s.pm10} μg/m³`,
      )
      .join("\n");

    const header = `${location} 空氣品質（${stations[0].publishTime}）\n${"─".repeat(40)}\n`;

    return {
      content: [{ type: "text" as const, text: header + result }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `查詢空品失敗: ${error instanceof Error ? error.message : "未知錯誤"}`,
        },
      ],
      isError: true,
    };
  }
}
