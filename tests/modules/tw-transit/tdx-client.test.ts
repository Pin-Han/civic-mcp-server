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
const BUS_URL =
  "https://tdx.transportdata.tw/api/basic/v2/Bus/EstimatedTimeOfArrival/City/Taipei/307";

let tokenRequestCount = 0;

const server = setupServer(
  http.post(TOKEN_URL, async ({ request }) => {
    tokenRequestCount++;
    const body = await request.text();
    const params = new URLSearchParams(body);

    expect(params.get("grant_type")).toBe("client_credentials");
    expect(params.get("client_id")).toBe("test-id");
    expect(params.get("client_secret")).toBe("test-secret");

    return HttpResponse.json({
      access_token: "mock-access-token",
      expires_in: 86400,
      token_type: "Bearer",
    });
  }),

  http.get(BUS_URL, ({ request }) => {
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
        EstimateTime: null,
        StopStatus: 1,
      },
      {
        StopStatus: 3,
      },
    ]);
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(async () => {
  tokenRequestCount = 0;
  vi.resetModules();
});

async function importModule() {
  const mod = await import(
    "../../../src/modules/tw-transit/clients/tdx.js"
  );
  return mod;
}

describe("TDX OAuth2 Client", () => {
  it("should fetch an access token", async () => {
    const { getAccessToken } = await importModule();
    const token = await getAccessToken();
    expect(token).toBe("mock-access-token");
    expect(tokenRequestCount).toBe(1);
  });

  it("should cache the token on subsequent calls", async () => {
    const { getAccessToken } = await importModule();
    await getAccessToken();
    await getAccessToken();
    expect(tokenRequestCount).toBe(1);
  });

  it("should fetch and parse bus arrivals", async () => {
    const { fetchBusArrivals } = await importModule();
    const arrivals = await fetchBusArrivals("Taipei", "307");

    expect(arrivals).toHaveLength(3);
    expect(arrivals[0]).toEqual({
      stopName: "捷運公館站",
      estimateTime: 120,
      stopStatus: 0,
    });
    expect(arrivals[1]).toEqual({
      stopName: "台大",
      estimateTime: null,
      stopStatus: 1,
    });
    expect(arrivals[2]).toEqual({
      stopName: "未知站牌",
      estimateTime: null,
      stopStatus: 3,
    });
  });
});
