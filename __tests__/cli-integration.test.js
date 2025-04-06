import { jest } from "@jest/globals";

// Mock parseSizes
jest.unstable_mockModule("../src/index.js", () => ({
  parseSizes: jest
    .fn()
    .mockResolvedValue(
      'sizes="(max-width: 600px) 500px, (max-width: 900px) 700px, 1000px"'
    ),
}));

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

// Mock prompts
jest.unstable_mockModule("prompts", () => ({
  default: jest.fn().mockResolvedValue({
    url: "https://example.com",
    selector: "test-selector",
    imageSizes: ["300", "400", "500", "600", "700", "800", "900", "1000"],
  }),
}));

// Mock fs/promises
jest.unstable_mockModule("fs/promises", () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue(
    JSON.stringify({
      url: "https://example.com",
      selector: "test-selector",
      imageSizes: [300, 400, 500, 600, 700, 800, 900, 1000],
    })
  ),
}));

// Mock fs
jest.unstable_mockModule("fs", () => ({
  existsSync: jest.fn().mockReturnValue(true),
}));

describe("CLI Integration", () => {
  let main;
  let parseSizes;
  let consoleSpy;

  beforeAll(async () => {
    // Import the modules after setting up the mocks
    const cliModule = await import("../cli.js");
    const indexModule = await import("../src/index.js");
    main = cliModule.main;
    parseSizes = indexModule.parseSizes;
  });

  beforeEach(() => {
    // Mock console methods
    consoleSpy = {
      log: jest.spyOn(console, "log").mockImplementation(),
      error: jest.spyOn(console, "error").mockImplementation(),
    };
  });

  afterEach(() => {
    // Restore console methods
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    jest.clearAllMocks();
  });

  it("should process user input and generate sizes attribute", async () => {
    // Call the main function
    await main();

    // Verify that parseSizes was called with the correct arguments
    expect(parseSizes).toHaveBeenCalledWith(
      "https://example.com",
      "test-selector",
      [300, 400, 500, 600, 700, 800, 900, 1000]
    );

    // Verify that the result was logged
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("Generated sizes attribute:")
    );
  }, 10000); // Increase timeout to 10 seconds

  it("should handle user cancellation", async () => {
    // Mock prompts to simulate cancellation
    const prompts = await import("prompts");
    prompts.default.mockResolvedValueOnce({
      url: undefined,
      selector: undefined,
      imageSizes: undefined,
    });

    // Mock process.exit
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});

    // Call the main function
    await main();

    // Verify that the cancellation message was logged
    expect(consoleSpy.log).toHaveBeenCalledWith("Operation cancelled.");
    expect(mockExit).toHaveBeenCalledWith(0);

    // Restore process.exit
    mockExit.mockRestore();
  });

  it("should handle errors gracefully", async () => {
    // Mock parseSizes to throw an error
    parseSizes.mockRejectedValueOnce(new Error("Test error"));

    // Mock process.exit
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});

    // Call the main function
    await main();

    // Verify that the error was logged
    expect(consoleSpy.error).toHaveBeenCalledWith("Error:", "Test error");
    expect(mockExit).toHaveBeenCalledWith(1);

    // Restore process.exit
    mockExit.mockRestore();
  });
});
