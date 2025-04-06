import { jest } from "@jest/globals";

// Mock puppeteer
jest.unstable_mockModule("puppeteer", () => ({
  default: {
    launch: jest.fn().mockResolvedValue({
      newPage: jest.fn().mockResolvedValue({
        goto: jest.fn().mockResolvedValue(undefined),
        setViewport: jest.fn().mockResolvedValue(undefined),
        evaluate: jest.fn().mockImplementation((fn, selector) => {
          // Mock different image sizes based on viewport
          if (selector === "test-selector") {
            return 500; // Mock image width
          }
          return 0;
        }),
        close: jest.fn().mockResolvedValue(undefined),
      }),
      close: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

describe("parseSizes", () => {
  let parseSizes;

  beforeAll(async () => {
    // Import the module after setting up the mock
    const module = await import("../src/index.js");
    parseSizes = module.parseSizes;
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it("should generate a sizes attribute", async () => {
    const url = "https://example.com";
    const selector = "test-selector";
    const imageSizes = [300, 400, 500, 600, 700, 800, 900, 1000];

    const result = await parseSizes(url, selector, imageSizes);

    expect(result).toContain("sizes=");
    expect(result).toContain("max-width");
    expect(result).toContain("px");
  });

  it("should handle errors gracefully", async () => {
    const puppeteer = await import("puppeteer");
    const mockLaunch = jest
      .fn()
      .mockRejectedValue(new Error("Browser launch failed"));
    puppeteer.default.launch = mockLaunch;

    const url = "https://example.com";
    const selector = "test-selector";
    const imageSizes = [300, 400, 500, 600, 700, 800, 900, 1000];

    await expect(parseSizes(url, selector, imageSizes)).rejects.toThrow(
      "Browser launch failed"
    );
  });
});
