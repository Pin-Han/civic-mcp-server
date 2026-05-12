import { config } from "../../../config.js";

const BASE_URL = "https://opendata.cwa.gov.tw/api/v1/rest/datastore";
const DATASET_ID = "F-C0032-001"; // 一般天氣預報 - 今明 36 小時

export interface WeatherForecast {
  locationName: string;
  description: string;
  rainProbability: string;
  minTemp: string;
  maxTemp: string;
  comfort: string;
}

export async function fetchWeather(
  location: string,
): Promise<WeatherForecast[]> {
  if (!config.cwaApiKey) {
    throw new Error("CWA_API_KEY 未設定，請至 https://opendata.cwa.gov.tw/ 申請");
  }

  const url = new URL(`${BASE_URL}/${DATASET_ID}`);
  url.searchParams.set("Authorization", config.cwaApiKey);
  url.searchParams.set("locationName", location);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`CWA API 錯誤: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const locations = data?.records?.location ?? [];

  return locations.map((loc: any) => {
    const elements = loc.weatherElement ?? [];
    const getElement = (name: string) =>
      elements.find((e: any) => e.elementName === name)?.time?.[0]?.parameter
        ?.parameterName ?? "N/A";

    return {
      locationName: loc.locationName,
      description: getElement("Wx"),
      rainProbability: getElement("PoP"),
      minTemp: getElement("MinT"),
      maxTemp: getElement("MaxT"),
      comfort: getElement("CI"),
    };
  });
}
