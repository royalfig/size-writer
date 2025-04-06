# @royalfig/size-writer

A utility to generate optimal image sizes for the CSS `sizes` attribute. This tool helps you create responsive images by determining the appropriate image sizes for different viewport widths.

## Installation

You can use this tool directly with npx:

```bash
# Always use the latest version
npx @royalfig/size-writer@latest

# Or force npx to download the latest version
npx --no-install @royalfig/size-writer
```

Or install it globally:

```bash
npm install -g @royalfig/size-writer
```

Or install it as a project dependency:

```bash
npm install --save-dev @royalfig/size-writer
```

## Usage

Run the tool with:

```bash
npx @royalfig/size-writer
```

The tool will prompt you for:

1. The URL of the webpage containing the image
2. The CSS selector for the image
3. The available image sizes (comma-separated)

After providing this information, the tool will:

1. Visit the webpage
2. Measure the image size at different viewport widths
3. Generate the optimal `sizes` attribute for your image
4. Automatically copy the result to your clipboard

### Example

```
Enter the URL of the webpage: https://example.com
Enter the CSS selector of the image: .hero-image
Enter available image sizes: 300, 400, 500, 600, 700, 800, 900, 1000

Output:
sizes="(max-width: 600px) 500px, (max-width: 900px) 700px, (max-width: 1200px) 900px, 1000px"
✅ Copied to clipboard! You can now paste it into your img tag's sizes property.
```

## How It Works

Size Writer uses Puppeteer to:

1. Load the webpage at different viewport widths
2. Measure the actual rendered size of the image
3. Find the closest available image size for each viewport width
4. Generate a `sizes` attribute that optimizes image loading

## Development

### Installation

```bash
git clone https://github.com/royalfig/size-writer.git
cd size-writer
npm install
```

### Testing

Run the tests with:

```bash
npm test
```

Or run tests in watch mode:

```bash
npm run test:watch
```

## Requirements

- Node.js 14 or higher
- A modern web browser (automatically installed with Puppeteer)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
