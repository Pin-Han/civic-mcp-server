import { describe, it, expect, vi, beforeAll, afterAll, afterEach, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import cwaResponse from "../../mocks/cwa-response.json";

vi.mock("../../../src/config.js", () => ({
  config: { cwaApiKey: "test-key", epaApiKey: "test-key" },
}));

const mockServer = setupServer(
  http.get("https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001", () => {
    return HttpResponse.json(cwaResponse);
  }),
);

beforeAll(() => mockServer.listen());
afterEach(() => {
  mockServer.resetHandlers();
});
afterAll(() => mockServer.close());

describe("weatherHandler", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns weather data containing location, description, and temperatures", async () => {
    // Re-mock config after resetModules
    vi.doMock("../../../src/config.js", () => ({
      config: { cwaApiKey: "test-key", epaApiKey: "test-key" },
    }));

    const { weatherHandler } = await import(
      "../../../src/modules/tw-environment/tools/weather.js"
    );

    const result = await weatherHandler({ location: "臺北市" });

    expect(result.content).toHaveLength(1);
    const text = result.content[0].text;
    expect(text).toContain("臺北市");
    expect(text).toContain("多雲");
    expect(text).toContain("24");
    expect(text).toContain("31");
    expect(text).toContain("30");
    expect(text).toContain("舒適");
  });
});
