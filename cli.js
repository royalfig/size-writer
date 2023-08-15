#!/usr/bin/env node
import { program } from "commander";
import prompts from "prompts";
import { parseSizes } from "./src/index.js";
import { writeFile, readFile } from "fs/promises";
// Create a schema for the prompt

function tryUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

async function writeCache(url, selector, imageSizes) {
  try {
    writeFile(
      "cache.json",
      JSON.stringify({ url, selector, imageSizes }),
      "utf8"
    );
  } catch (error) {
    throw new Error("Could not create cache file", error);
  }
}

async function readCache() {
  try {
    const cache = await readFile("cache.json", "utf8");
    return JSON.parse(cache);
  } catch (error) {
    return null;
  }
}

function createNumberArray(imageSizes) {
  return imageSizes.map((size) => parseInt(size));
}

(async () => {
  let schema = [
    {
      type: "text",
      name: "url",
      message: "Enter the URL of the webpage",
      validate: (url) =>
        url.length > 0 && tryUrl(url) ? true : "Please enter a URL",
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
      message: "Enter available image sizes",
      initial: "300, 400, 500, 600, 700, 800, 900, 1000",
      validate: (imageSizes) => {
        return imageSizes.length > 0 ? true : "Please enter image sizes";
      },
    },
  ];

  const cacheExists = await readCache();

  if (cacheExists) {
    const { url, selector, imageSizes: imageSizesFromCache } = cacheExists;
    schema[0].initial = url;
    schema[1].initial = selector;
    schema[2].initial = imageSizesFromCache.join(", ");
  }

  const responses = await prompts(schema);

  const imageSizes = createNumberArray(responses.imageSizes);
  try {
    writeCache(responses.url, responses.selector, imageSizes);
  } catch (error) {
    throw new Error("Could not create cache file", error);
  }
  const sizesAttribute = await parseSizes(
    responses.url,
    responses.selector,
    imageSizes
  );

  console.log(sizesAttribute);
})();
