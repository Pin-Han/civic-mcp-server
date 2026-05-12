import { config } from "../../../config.js";
import { fetchWithTimeout } from "../../../utils/fetch.js";

const BASE_URL =
  "https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx";

export interface AgriPrice {
  交易日期: string;
  作物代號: string;
  作物名稱: string;
  市場代號: string;
  市場名稱: string;
  上價: number;
  中價: number;
  下價: number;
  平均價: number;
  交易量: number;
}

const CROP_ALIASES: Record<string, string> = {
  高麗菜: "甘藍",
  空心菜: "蕹菜",
  地瓜葉: "甘薯葉",
  小白菜: "青江白菜",
  大白菜: "包心白菜",
  番茄: "蕃茄",
};

export function resolveCropName(input: string): string {
  return CROP_ALIASES[input] ?? input;
}

function toMinguoDate(date: Date): string {
  const year = date.getFullYear() - 1911;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export async function fetchAgriPrice(product: string): Promise<AgriPrice[]> {
  const resolved = resolveCropName(product);

  const url = new URL(BASE_URL);
  url.searchParams.set("$top", "50");
  url.searchParams.set("Crop", resolved);

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 3);
  url.searchParams.set("StartDate", toMinguoDate(startDate));
  url.searchParams.set("EndDate", toMinguoDate(today));

  if (config.afaApiKey) {
    url.searchParams.set("ApiKey", config.afaApiKey);
  }

  const response = await fetchWithTimeout(url.toString(), { timeoutMs: 10000 });
  if (!response.ok) {
    throw new Error(
      `農業部 API 錯誤: ${response.status} ${response.statusText}`,
    );
  }

  const data: AgriPrice[] = await response.json();
  return data;
}
