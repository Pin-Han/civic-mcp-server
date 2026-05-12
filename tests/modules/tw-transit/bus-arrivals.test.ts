import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
  vi,
} from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

vi.mock("../../../src/config.js", () => ({
  config: {
    tdxClientId: "test-id",
    tdxClientSecret: "test-secret",
  },
}));

const TOKEN_URL =
  "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token";
const BUS_URL_TAIPEI_307 =
  "https://tdx.transportdata.tw/api/basic/v2/Bus/EstimatedTimeOfArrival/City/Taipei/307";
const BUS_URL_KAOHSIUNG_RED =
  "https://tdx.transportdata.tw/api/basic/v2/Bus/EstimatedTimeOfArrival/City/Kaohsiung/%E7%B4%8528";

const server = setupServer(
  http.post(TOKEN_URL, () => {
    return HttpResponse.json({
      access_token: "mock-access-token",
      expires_in: 86400,
      token_type: "Bearer",
    });
  }),

  http.get(BUS_URL_TAIPEI_307, ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== "Bearer mock-access-token") {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json([
      {
        StopName: { Zh_tw: "捷運公館站", En: "MRT Gongguan Sta." },
        EstimateTime: 120,
        StopStatus: 0,
      },
      {
        StopName: { Zh_tw: "台大", En: "NTU" },
        EstimateTime: 300,
        StopStatus: 0,
      },
      {
        StopName: { Zh_tw: "景美站", En: "Jingmei" },
        EstimateTime: 45,
        StopStatus: 0,
      },
      {
        StopName: { Zh_tw: "萬隆站", En: "Wanlong" },
        EstimateTime: null,
        StopStatus: 1,
      },
      {
        StopName: { Zh_tw: "新店", En: "Xindian" },
        EstimateTime: null,
        StopStatus: 3,
      },
    ]);
  }),

  http.get(BUS_URL_KAOHSIUNG_RED, ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== "Bearer mock-access-token") {
      return new HttpResponse(null, { status: 401 });
    }
    return HttpResponse.json([]);
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  vi.resetModules();
});

async function importHandler() {
  vi.doMock("../../../src/config.js", () => ({
    config: {
      tdxClientId: "test-id",
      tdxClientSecret: "test-secret",
    },
  }));
  const mod = await import(
    "../../../src/modules/tw-transit/tools/bus-arrivals.js"
  );
  return mod;
}

describe("busArrivalsHandler", () => {
  it("returns formatted arrival times with 分鐘 text", async () => {
    const { busArrivalsHandler } = await importHandler();
    const result = await busArrivalsHandler({ city: "Taipei", routeName: "307" });

    expect(result.content).toHaveLength(1);
    const text = result.content[0].text;
    expect(text).toContain("公車 307（Taipei）即時到站");
    expect(text).toContain("捷運公館站：2 分鐘");
    expect(text).toContain("台大：5 分鐘");
    expect(text).toContain("景美站：進站中");
    expect(text).toContain("萬隆站：尚未發車");
    expect(text).toContain("新店：末班車已過");
  });

  it("handles empty results", async () => {
    const { busArrivalsHandler } = await importHandler();
    const result = await busArrivalsHandler({ city: "Kaohsiung", routeName: "紅28" });

    expect(result.content).toHaveLength(1);
    const text = result.content[0].text;
    expect(text).toContain("找不到");
    expect(text).toContain("紅28");
  });

  it("handles API errors gracefully", async () => {
    server.use(
      http.post(TOKEN_URL, () => {
        return new HttpResponse(null, { status: 500, statusText: "Internal Server Error" });
      }),
    );

    const { busArrivalsHandler } = await importHandler();
    const result = await busArrivalsHandler({ city: "Taipei", routeName: "307" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("查詢公車到站失敗");
  });
});

describe("formatEstimateTime", () => {
  it("returns 尚未發車 for status 1", async () => {
    const { formatEstimateTime } = await importHandler();
    expect(formatEstimateTime(null, 1)).toBe("尚未發車");
  });

  it("returns 交管不停靠 for status 2", async () => {
    const { formatEstimateTime } = await importHandler();
    expect(formatEstimateTime(null, 2)).toBe("交管不停靠");
  });

  it("returns 末班車已過 for status 3", async () => {
    const { formatEstimateTime } = await importHandler();
    expect(formatEstimateTime(null, 3)).toBe("末班車已過");
  });

  it("returns 今日未營運 for status 4", async () => {
    const { formatEstimateTime } = await importHandler();
    expect(formatEstimateTime(null, 4)).toBe("今日未營運");
  });

  it("returns 未知 for null seconds with normal status", async () => {
    const { formatEstimateTime } = await importHandler();
    expect(formatEstimateTime(null, 0)).toBe("未知");
  });

  it("returns 進站中 for <= 60 seconds", async () => {
    const { formatEstimateTime } = await importHandler();
    expect(formatEstimateTime(60, 0)).toBe("進站中");
    expect(formatEstimateTime(30, 0)).toBe("進站中");
  });

  it("returns minutes for > 60 seconds", async () => {
    const { formatEstimateTime } = await importHandler();
    expect(formatEstimateTime(120, 0)).toBe("2 分鐘");
    expect(formatEstimateTime(300, 0)).toBe("5 分鐘");
    expect(formatEstimateTime(90, 0)).toBe("1 分鐘");
  });
});
