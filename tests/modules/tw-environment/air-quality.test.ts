import { describe, it, expect, vi, beforeAll, afterAll, afterEach, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import epaResponse from "../../mocks/epa-response.json";

vi.mock("../../../src/config.js", () => ({
  config: { cwaApiKey: "test-key", epaApiKey: "test-key" },
}));

const mockServer = setupServer(
  http.get("https://data.moenv.gov.tw/api/v2/aqx_p_432", () => {
    return HttpResponse.json(epaResponse);
  }),
);

beforeAll(() => mockServer.listen());
afterEach(() => {
  mockServer.resetHandlers();
});
afterAll(() => mockServer.close());

describe("airQualityHandler", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns air quality data containing station name, AQI, and status", async () => {
    // Re-mock config after resetModules
    vi.doMock("../../../src/config.js", () => ({
      config: { cwaApiKey: "test-key", epaApiKey: "test-key" },
    }));

    const { airQualityHandler } = await import(
      "../../../src/modules/tw-environment/tools/air-quality.js"
    );

    const result = await airQualityHandler({ location: "臺北市" });

    expect(result.content).toHaveLength(1);
    const text = result.content[0].text;
    expect(text).toContain("士林");
    expect(text).toContain("42");
    expect(text).toContain("良好");
    expect(text).toContain("中山");
  });
});
