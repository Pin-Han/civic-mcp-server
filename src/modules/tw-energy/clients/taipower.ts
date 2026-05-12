import { fetchWithTimeout } from "../../../utils/fetch.js";

const TAIPOWER_URL =
  "https://service.taipower.com.tw/data/opendata/apply/file/d006001/001.json";

export interface PowerUnit {
  type: string;
  name: string;
  capacity: number;
  generation: number;
}

export interface PowerSummary {
  units: PowerUnit[];
  totalGeneration: number;
  byType: Record<string, { generation: number; percentage: number }>;
}

export async function fetchPowerStatus(): Promise<PowerSummary> {
  const response = await fetchWithTimeout(TAIPOWER_URL, { timeoutMs: 10000 });
  if (!response.ok) {
    throw new Error(
      `台電 API 錯誤: ${response.status} ${response.statusText}`,
    );
  }

  const data: { aaData: string[][] } = await response.json();

  const units: PowerUnit[] = data.aaData.map((row) => ({
    type: row[1],
    name: row[2],
    capacity: parseFloat(row[3]) || 0,
    generation: parseFloat(row[4]) || 0,
  }));

  const totalGeneration = units.reduce((sum, u) => sum + u.generation, 0);

  const byType: Record<string, { generation: number; percentage: number }> = {};
  for (const unit of units) {
    if (!byType[unit.type]) {
      byType[unit.type] = { generation: 0, percentage: 0 };
    }
    byType[unit.type].generation += unit.generation;
  }

  for (const entry of Object.values(byType)) {
    entry.percentage =
      totalGeneration > 0 ? (entry.generation / totalGeneration) * 100 : 0;
  }

  return { units, totalGeneration, byType };
}
