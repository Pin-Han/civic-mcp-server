import { z } from "zod";
import { cached } from "../../../cache/index.js";
import { fetchWeather } from "../clients/cwa.js";

export const weatherToolConfig = {
  description: "查詢台灣各縣市天氣預報（36小時內），包含天氣描述、溫度範圍、降雨機率",
  inputSchema: {
    location: z
      .string()
      .describe('縣市名稱，如「臺北市」「高雄市」「新北市」'),
  },
};

export async function weatherHandler({
  location,
}: {
  location: string;
}) {
  try {
    const forecasts = await cached(
      `weather:${location}`,
      1800,
      () => fetchWeather(location),
    );

    if (forecasts.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `找不到「${location}」的天氣資料，請確認縣市名稱（如「臺北市」「高雄市」）`,
          },
        ],
      };
    }

    const result = forecasts
      .map(
        (f) =>
          `${f.locationName}：${f.description}，溫度 ${f.minTemp}~${f.maxTemp}°C，降雨機率 ${f.rainProbability}%，${f.comfort}`,
      )
      .join("\n");

    return {
      content: [{ type: "text" as const, text: result }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `查詢天氣失敗: ${error instanceof Error ? error.message : "未知錯誤"}`,
        },
      ],
      isError: true,
    };
  }
}
