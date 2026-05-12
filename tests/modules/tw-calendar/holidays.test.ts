import { describe, it, expect } from "vitest";
import { holidaysHandler } from "../../../src/modules/tw-calendar/tools/holidays.js";

describe("holidaysHandler", () => {
  it("returns holidays for 2026 with national holidays section", async () => {
    const result = await holidaysHandler({ year: 2026 });

    expect(result.content).toHaveLength(1);
    const text = result.content[0].text;
    expect(text).toContain("2026 年台灣假日一覽");
    expect(text).toContain("【國定假日】");
    expect(text).toContain("中華民國開國紀念日");
    expect(text).toContain("農曆除夕");
    expect(text).toContain("和平紀念日");
    expect(text).toContain("端午節");
    expect(text).toContain("中秋節");
    expect(text).toContain("國慶日");
  });

  it("returns friendly message for unknown year", async () => {
    const result = await holidaysHandler({ year: 2099 });

    expect(result.content).toHaveLength(1);
    const text = result.content[0].text;
    expect(text).toContain("目前沒有 2099 年的假日資料");
    expect(text).toContain("目前支援年份");
  });

  it("contains consecutive holiday (連假) information", async () => {
    const result = await holidaysHandler({ year: 2026 });

    const text = result.content[0].text;
    expect(text).toContain("【連假區間】");
    // Spring Festival should be a consecutive block of 6 days
    expect(text).toMatch(/2026-01-28 ~ 2026-02-02/);
    expect(text).toContain("天");
  });

  it("contains makeup workday (補班日) information", async () => {
    const result = await holidaysHandler({ year: 2026 });

    const text = result.content[0].text;
    expect(text).toContain("【補班日】");
    expect(text).toContain("補班日");
  });

  it("returns holidays for 2025", async () => {
    const result = await holidaysHandler({ year: 2025 });

    const text = result.content[0].text;
    expect(text).toContain("2025 年台灣假日一覽");
    expect(text).toContain("中華民國開國紀念日");
  });
});
