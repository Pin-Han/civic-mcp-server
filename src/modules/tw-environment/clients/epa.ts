import { config } from "../../../config.js";

const API_URL = "https://data.moenv.gov.tw/api/v2/aqx_p_432";

export interface AirQualityStation {
  siteName: string;
  county: string;
  aqi: string;
  pm25: string;
  pm10: string;
  status: string;
  publishTime: string;
}

export async function fetchAirQuality(
  location: string,
): Promise<AirQualityStation[]> {
  if (!config.epaApiKey) {
    throw new Error(
      "EPA_API_KEY 未設定，請至 https://data.moenv.gov.tw/ 申請",
    );
  }

  const url = new URL(API_URL);
  url.searchParams.set("api_key", config.epaApiKey);
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`EPA API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const records: any[] = Array.isArray(data) ? data : data?.records ?? [];

  return records
    .filter((r: any) => r.county === location)
    .map((r: any) => ({
      siteName: r.sitename,
      county: r.county,
      aqi: r.aqi,
      pm25: r["pm2.5"],
      pm10: r.pm10,
      status: r.status,
      publishTime: r.publishtime,
    }));
}
