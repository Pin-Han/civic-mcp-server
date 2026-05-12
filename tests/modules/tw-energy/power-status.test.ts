import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
} from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const mockTaipowerResponse = {
  aaData: [
    ["1", "燃氣", "大潭CC#1", "742.7", "608.7", "", "", ""],
    ["2", "燃煤", "林口#1", "800.0", "762.5", "", "", ""],
    ["3", "核能", "核二#2", "985.0", "0.0", "", "", ""],
    ["4", "風力", "風力合計", "200.0", "85.3", "", "", ""],
    ["5", "太陽能", "太陽能合計", "500.0", "320.1", "", "", ""],
    ["6", "水力", "德基", "234.0", "120.0", "", "", ""],
  ],
};

const mockServer = setupServer(
  http.get(
    "https://service.taipower.com.tw/data/opendata/apply/file/d006001/001.json",
    () => {
      return HttpResponse.json(mockTaipowerResponse);
    },
  ),
);

beforeAll(() => mockServer.listen());
afterEach(() => {
  mockServer.resetHandlers();
});
afterAll(() => mockServer.close());

describe("powerStatusHandler", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns text with generation types and MW values", async () => {
    const { powerStatusHandler } = await import(
      "../../../src/modules/tw-energy/tools/power-status.js"
    );

    const result = await powerStatusHandler();

    expect(result.content).toHaveLength(1);
    const text = result.content[0].text;
    expect(text).toContain("台灣即時電力狀態");
    expect(text).toContain("總淨發電量：");
    expect(text).toContain("燃氣");
    expect(text).toContain("燃煤");
    expect(text).toContain("風力");
    expect(text).toContain("太陽能");
    expect(text).toContain("水力");
    expect(text).toContain("MW");
  });

  it("calculates percentages correctly", async () => {
    const { powerStatusHandler } = await import(
      "../../../src/modules/tw-energy/tools/power-status.js"
    );

    const result = await powerStatusHandler();
    const text = result.content[0].text;

    // Total = 608.7 + 762.5 + 0 + 85.3 + 320.1 + 120.0 = 1896.6
    const total = 1896.6;
    const gasPercent = ((608.7 / total) * 100).toFixed(1);
    const coalPercent = ((762.5 / total) * 100).toFixed(1);

    expect(text).toContain(`燃氣：${gasPercent}%`);
    expect(text).toContain(`燃煤：${coalPercent}%`);
    expect(text).toContain(`總淨發電量：1,897 MW`);
  });

  it("sorts by generation descending", async () => {
    const { powerStatusHandler } = await import(
      "../../../src/modules/tw-energy/tools/power-status.js"
    );

    const result = await powerStatusHandler();
    const text = result.content[0].text;

    const lines = text.split("\n");
    const typeLines = lines.filter((l: string) => l.startsWith("  - "));

    // Extract MW values from each line
    const mwValues = typeLines.map((line: string) => {
      const match = line.match(/（([\d,]+) MW）/);
      return match ? parseFloat(match[1].replace(/,/g, "")) : 0;
    });

    // Verify descending order
    for (let i = 0; i < mwValues.length - 1; i++) {
      expect(mwValues[i]).toBeGreaterThanOrEqual(mwValues[i + 1]);
    }
  });
});
