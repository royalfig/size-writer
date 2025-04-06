import { jest } from "@jest/globals";

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

// Mock parseSizes
jest.unstable_mockModule("../src/index.js", () => ({
  parseSizes: jest
    .fn()
    .mockResolvedValue(
      'sizes="(max-width: 600px) 500px, (max-width: 900px) 700px, 1000px"'
    ),
}));

describe("CLI Utility Functions", () => {
  let tryUrl, writeCache, readCache, createNumberArray, writeFile, existsSync;

  beforeAll(async () => {
    // Import the modules after setting up the mocks
    const cliModule = await import("../cli.js");
    const fsPromisesModule = await import("fs/promises");
    const fsModule = await import("fs");

    tryUrl = cliModule.tryUrl;
    writeCache = cliModule.writeCache;
    readCache = cliModule.readCache;
    createNumberArray = cliModule.createNumberArray;
    writeFile = fsPromisesModule.writeFile;
    existsSync = fsModule.existsSync;
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("tryUrl", () => {
    it("should return true for valid URLs", () => {
      expect(tryUrl("https://example.com")).toBe(true);
      expect(tryUrl("http://example.com")).toBe(true);
      expect(tryUrl("https://sub.example.com/path?query=1")).toBe(true);
    });

    it("should return false for invalid URLs", () => {
      expect(tryUrl("not-a-url")).toBe(false);
      expect(tryUrl("")).toBe(false);
      expect(tryUrl("ftp://example.com")).toBe(false);
      expect(tryUrl("file:///path/to/file")).toBe(false);
    });
  });

  describe("writeCache", () => {
    it("should write cache data to a file", async () => {
      const url = "https://example.com";
      const selector = "test-selector";
      const imageSizes = [300, 400, 500];

      await writeCache(url, selector, imageSizes);

      expect(writeFile).toHaveBeenCalled();
      const writeFileArgs = writeFile.mock.calls[0];
      expect(writeFileArgs[1]).toContain(url);
      expect(writeFileArgs[1]).toContain(selector);
      expect(writeFileArgs[1]).toContain("300");
    });

    it("should handle write errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      writeFile.mockRejectedValueOnce(new Error("Write failed"));

      await writeCache("test", "test", []);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Warning: Could not create cache file",
        "Write failed"
      );
      consoleSpy.mockRestore();
    });
  });

  describe("readCache", () => {
    it("should read and parse cache data when file exists", async () => {
      const cache = await readCache();

      expect(cache).toEqual({
        url: "https://example.com",
        selector: "test-selector",
        imageSizes: [300, 400, 500, 600, 700, 800, 900, 1000],
      });
    });

    it("should return null when file does not exist", async () => {
      existsSync.mockReturnValueOnce(false);

      const cache = await readCache();

      expect(cache).toBeNull();
    });
  });

  describe("createNumberArray", () => {
    it("should convert string array to number array", () => {
      const input = ["300", "400", "500"];
      const expected = [300, 400, 500];

      expect(createNumberArray(input)).toEqual(expected);
    });

    it("should handle empty array", () => {
      expect(createNumberArray([])).toEqual([]);
    });

    it("should handle invalid numbers", () => {
      const input = ["300", "invalid", "500"];
      const result = createNumberArray(input);
      expect(result[0]).toBe(300);
      expect(isNaN(result[1])).toBe(true);
      expect(result[2]).toBe(500);
    });
  });
});
