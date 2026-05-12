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

const mockAfaResponse = [
  {
    交易日期: "115.05.12",
    作物代號: "LA1",
    作物名稱: "甘藍",
    市場代號: "104",
    市場名稱: "台北二",
    上價: 25.3,
    中價: 18.7,
    下價: 10.2,
    平均價: 18.1,
    交易量: 52340,
  },
  {
    交易日期: "115.05.12",
    作物代號: "LA1",
    作物名稱: "甘藍",
    市場代號: "109",
    市場名稱: "台中",
    上價: 22.0,
    中價: 16.5,
    下價: 9.8,
    平均價: 16.1,
    交易量: 31200,
  },
];

vi.mock("../../../src/config.js", () => ({
  config: { afaApiKey: "test-key" },
}));

const mockServer = setupServer(
  http.get(
    "https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx",
    ({ request }) => {
      const url = new URL(request.url);
      const crop = url.searchParams.get("Crop");
      if (crop === "甘藍") {
        return HttpResponse.json(mockAfaResponse);
      }
      return HttpResponse.json([]);
    },
  ),
);

beforeAll(() => mockServer.listen());
afterEach(() => {
  mockServer.resetHandlers();
});
afterAll(() => mockServer.close());

describe("agriPriceHandler", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns market prices for a valid crop", async () => {
    vi.doMock("../../../src/config.js", () => ({
      config: { afaApiKey: "test-key" },
    }));

    const { agriPriceHandler } = await import(
      "../../../src/modules/tw-agriculture/tools/agri-price.js"
    );

    const result = await agriPriceHandler({ product: "甘藍" });

    expect(result.content).toHaveLength(1);
    const text = result.content[0].text;
    expect(text).toContain("台北二");
    expect(text).toContain("均價 18.1 元/kg");
    expect(text).toContain("10.2~25.3");
    expect(text).toContain("交易量 52340 kg");
    expect(text).toContain("台中");
  });

  it("resolves crop alias correctly (高麗菜 → 甘藍)", async () => {
    vi.doMock("../../../src/config.js", () => ({
      config: { afaApiKey: "test-key" },
    }));

    const { agriPriceHandler } = await import(
      "../../../src/modules/tw-agriculture/tools/agri-price.js"
    );

    const result = await agriPriceHandler({ product: "高麗菜" });

    expect(result.content).toHaveLength(1);
    const text = result.content[0].text;
    expect(text).toContain("台北二");
    expect(text).toContain("均價 18.1 元/kg");
  });

  it("returns friendly message for unknown crop", async () => {
    vi.doMock("../../../src/config.js", () => ({
      config: { afaApiKey: "test-key" },
    }));

    const { agriPriceHandler } = await import(
      "../../../src/modules/tw-agriculture/tools/agri-price.js"
    );

    const result = await agriPriceHandler({ product: "不存在的作物" });

    expect(result.content).toHaveLength(1);
    const text = result.content[0].text;
    expect(text).toContain("找不到");
    expect(text).toContain("不存在的作物");
  });
});

describe("resolveCropName", () => {
  it("resolves known aliases", async () => {
    vi.doMock("../../../src/config.js", () => ({
      config: { afaApiKey: "test-key" },
    }));

    const { resolveCropName } = await import(
      "../../../src/modules/tw-agriculture/clients/afa.js"
    );

    expect(resolveCropName("高麗菜")).toBe("甘藍");
    expect(resolveCropName("空心菜")).toBe("蕹菜");
    expect(resolveCropName("地瓜葉")).toBe("甘薯葉");
    expect(resolveCropName("小白菜")).toBe("青江白菜");
    expect(resolveCropName("大白菜")).toBe("包心白菜");
    expect(resolveCropName("番茄")).toBe("蕃茄");
  });

  it("returns input unchanged for unknown names", async () => {
    vi.doMock("../../../src/config.js", () => ({
      config: { afaApiKey: "test-key" },
    }));

    const { resolveCropName } = await import(
      "../../../src/modules/tw-agriculture/clients/afa.js"
    );

    expect(resolveCropName("香蕉")).toBe("香蕉");
  });
});
