#!/usr/bin/env node
import { program } from "commander";
import prompts from "prompts";
import { parseSizes } from "./src/index.js";
import { writeFile, readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import clipboardy from "clipboardy";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a schema for the prompt
export function tryUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch (error) {
    return false;
  }
}

export async function writeCache(url, selector, imageSizes) {
  try {
    const cachePath = join(__dirname, "cache.json");
    await writeFile(
      cachePath,
      JSON.stringify({ url, selector, imageSizes }),
      "utf8"
    );
  } catch (error) {
    console.error("Warning: Could not create cache file", error.message);
  }
}

export async function readCache() {
  try {
    const cachePath = join(__dirname, "cache.json");
    if (!existsSync(cachePath)) {
      return null;
    }
    const cache = await readFile(cachePath, "utf8");
    return JSON.parse(cache);
  } catch (error) {
    return null;
  }
}

export function createNumberArray(imageSizes) {
  return imageSizes.map((size) => parseInt(size));
}

// Set up the CLI program
program
  .name("size-writer")
  .description("Generate optimal image sizes for the CSS sizes attribute")
  .version("1.0.0");

// Main function
export async function main() {
  let schema = [
    {
      type: "text",
      name: "url",
      message: "Enter the URL of the webpage",
      validate: (url) =>
        url.length > 0 && tryUrl(url) ? true : "Please enter a valid URL",
    },
    {
      type: "text",
      name: "selector",
      message: "Enter the CSS selector of the image",
      validate: (selector) => {
        return selector.length > 0 ? true : "Please enter a CSS selector";
      },
      format: (selector) => selector.replace(/^['"`]|['"`]$/g, ""),
    },
    {
      type: "list",
      name: "imageSizes",
      message: "Enter available image sizes (comma-separated)",
      initial: "300, 400, 500, 600, 700, 800, 900, 1000",
      validate: (imageSizes) => {
        return imageSizes.length > 0 ? true : "Please enter image sizes";
      },
    },
  ];

  try {
    const cacheExists = await readCache();

    if (cacheExists) {
      const { url, selector, imageSizes: imageSizesFromCache } = cacheExists;
      schema[0].initial = url;
      schema[1].initial = selector;
      schema[2].initial = imageSizesFromCache.join(", ");
    }

    const responses = await prompts(schema);

    // Handle cancellation
    if (!responses.url || !responses.selector || !responses.imageSizes) {
      console.log("Operation cancelled.");
      return;
    }

    const imageSizes = createNumberArray(responses.imageSizes);

    try {
      await writeCache(responses.url, responses.selector, imageSizes);
    } catch (error) {
      console.error("Warning: Could not create cache file", error.message);
    }

    console.log("\nAnalyzing image sizes...\n\n");
    const { sizes, sizesAttribute } = await parseSizes(
      responses.url,
      responses.selector,
      imageSizes
    );

    // Filter out repeated values
    const uniqueSizes = sizes.reduce((acc, curr, index) => {
      if (index === 0 || curr.imgSize !== sizes[index - 1].imgSize) {
        acc.push(curr);
      }
      return acc;
    }, []);

    // Calculate column widths
    const viewportWidth = Math.max(
      "Viewport Width".length,
      ...uniqueSizes.map((s) => s.viewport.toString().length)
    );
    const imageSizeWidth = Math.max(
      "Image Size".length,
      ...uniqueSizes.map((s) => s.imgSize.toString().length)
    );

    // Create separator line
    const separator = `+${"-".repeat(viewportWidth + 2)}+${"-".repeat(
      imageSizeWidth + 2
    )}+`;

    // Print table header
    console.log(separator);
    console.log(
      `| ${"Viewport Width".padEnd(viewportWidth)} | ${"Image Size".padEnd(
        imageSizeWidth
      )} |`
    );
    console.log(separator);

    // Print table rows
    uniqueSizes.forEach(({ viewport, imgSize }) => {
      console.log(
        `| ${viewport.toString().padEnd(viewportWidth)} | ${imgSize
          .toString()
          .padEnd(imageSizeWidth)} |`
      );
    });
    console.log(separator);

    console.log("\nGenerated sizes attribute:");
    console.log(sizesAttribute);

    // Copy to clipboard
    try {
      await clipboardy.write(sizesAttribute);
      console.log(
        "\n✅ Copied to clipboard! You can now paste it into your img tag's sizes property."
      );
    } catch (error) {
      console.log("\nCopy this attribute to your img tag's sizes property.");
    }
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
}

// Only run the main function if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Parse command line arguments and run the main function
  program.parse();
  main().catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });
}

function createAsciiGraph(sizes, width = 60, height = 15) {
  // Find min/max values for scaling
  const minViewport = Math.min(...sizes.map((s) => s.viewport));
  const maxViewport = Math.max(...sizes.map((s) => s.viewport));
  const minSize = Math.min(...sizes.map((s) => s.imgSize));
  const maxSize = Math.max(...sizes.map((s) => s.imgSize));

  // Create empty grid
  const grid = Array(height)
    .fill()
    .map(() => Array(width).fill(" "));

  // Plot points
  sizes.forEach(({ viewport, imgSize }) => {
    const x = Math.round(
      ((viewport - minViewport) / (maxViewport - minViewport)) * (width - 1)
    );
    const y = Math.round(
      ((imgSize - minSize) / (maxSize - minSize)) * (height - 1)
    );
    grid[height - 1 - y][x] = "•";
  });

  // Add axis labels
  const viewportLabels = sizes
    .filter((_, i) => i % 8 === 0)
    .map((s) => s.viewport.toString().padStart(4, " "))
    .join(" ");

  const sizeLabels = sizes
    .filter((_, i) => i % 8 === 0)
    .map((s) => s.imgSize.toString().padStart(4, " "))
    .join(" ");

  // Convert grid to string
  const graph = grid.map((row) => row.join("")).join("\n");

  return `
${graph}
${" ".repeat(4)}${viewportLabels}
${" ".repeat(4)}${sizeLabels}
`;
}
