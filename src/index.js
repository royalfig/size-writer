import puppeteer from "puppeteer";

let viewports = [
  300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000,
  1050, 1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450, 1500, 1550, 1600, 1650,
  1700, 1750, 1800, 1850, 1900, 1950, 2000, 2050, 2100, 2150, 2200, 2250, 2300,
  2350, 2400, 2450, 2500, 2550, 2600, 2650,
];

function createNumberArray(str) {
  const arr = str.split(",").map((item) => {
    return parseInt(item.trim());
  });
  return arr;
}

export async function parseSizes(url, selector, imageSizes) {
  // const imageSizesAsNum = createNumberArray(imageSizes);

  const sizes = await generateSizesAttribute(
    url,
    selector,
    imageSizes,
    viewports
  );

  return sizes;
}

async function generateSizesAttribute(url, selector, imageSizes, viewports) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto(url);

  let sizes = [];
  let prev = 0;

  for (let viewport of viewports) {
    await page.setViewport({ width: viewport, height: 800 });

    try {
      let size = await page.evaluate((selector) => {
        const img = document.querySelector(selector);
        return Math.round(img.getBoundingClientRect().width);
      }, selector);

      const imgSize = findClosestMatch(size, imageSizes);

      prev = size;
      sizes.push({ viewport, imgSize });
    } catch (error) {
      throw new Error("Selector not found. Please try again.", error);
    }
  }

  console.table(sizes);

  await browser.close();

  const optimalSizes = [];

  for (let size of sizes) {
    optimalSizes.push(findClosestMatch(size.size, imageSizes));
  }

  return writeSizesAttribute(sizes, optimalSizes);
}

function determineDelta(size, prev) {
  return Math.abs(((size - prev) / prev) * 100);
}

function writeSizesAttribute(sizes, optimalSizes) {
  let generatedSizes = [];

  for (let i = 0; i < sizes.length - 1; i++) {
    if (sizes[i].imgSize === sizes[i - 1]?.imgSize) {
      continue;
    }

    generatedSizes.push({
      viewport: sizes[i].viewport,
      imgSize: sizes[i - 1]?.imgSize ? sizes[i - 1].imgSize : sizes[i].imgSize,
    });

    // generatedSizes += `(max-width: ${sizes[i].viewport}px) ${sizes[i - 1]?.imgSize ? sizes[i - 1].imgSize : sizes[i].imgSize}px, `;
  }

  if (generatedSizes[0]?.imgSize === generatedSizes[1]?.imgSize) {
    generatedSizes.shift();
  }

  let sizeAttributeText = generatedSizes.map((item) => {
    return `(max-width: ${item.viewport}px) ${item.imgSize}px`;
  });

  return `sizes="${sizeAttributeText.join(", ")}, ${
    sizes[sizes.length - 1].imgSize
  }px"`;
}

function findClosestMatch(num, numList) {
  const filteredNumList = numList.filter((item) => item >= num);

  let closestNum = filteredNumList[0];
  let minDiff = Math.abs(num - closestNum);

  for (let i = 0; i < filteredNumList.length; i++) {
    const currentNum = filteredNumList[i];
    const diff = Math.abs(num - currentNum);

    if (diff < minDiff) {
      minDiff = diff;
      closestNum = currentNum;
    }
  }

  return closestNum;
}
