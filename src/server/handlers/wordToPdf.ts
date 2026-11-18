import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { execSafe, hasBinary } from '../utils/execHelper';

// Browser search paths for Edge / Chrome / Chromium
const BROWSER_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
];

function getBrowserPath(): string | null {
  for (const p of BROWSER_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export const wordToPdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input Word file provided');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const outputFilename = `${baseName}.pdf`;
    const outputPath = path.join(outputDir, outputFilename);

    // Method 1: LibreOffice if available
    const isSofficeAvailable = (await hasBinary('soffice')) || (await hasBinary('libreoffice'));
    if (isSofficeAvailable) {
      try {
        const binary = (await hasBinary('soffice')) ? 'soffice' : 'libreoffice';
        await execSafe(binary, [
          '--headless',
          '--convert-to',
          'pdf',
          '--outdir',
          outputDir,
          inputFile.filepath,
        ], { timeoutMs: 60000 });

        const generatedFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.pdf'));
        if (generatedFiles.length > 0) {
          return {
            outputPath: path.join(outputDir, generatedFiles[0]),
            outputFilename: generatedFiles[0],
            mimeType: 'application/pdf',
          };
        }
      } catch (err: any) {
        console.warn('LibreOffice Word-to-PDF failed, falling back to mammoth engine...', err?.message);
      }
    }

    // Method 2: Mammoth (DOCX to HTML) + Puppeteer (Edge/Chrome to PDF)
    const browserPath = getBrowserPath();
    if (browserPath && inputFile.originalFilename.toLowerCase().endsWith('.docx')) {
      try {
        const mammothResult = await mammoth.convertToHtml({ path: inputFile.filepath });
        const htmlBody = mammothResult.value;

        const styledHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      padding: 40px;
      font-size: 14px;
    }
    h1, h2, h3, h4, h5 { color: #111; margin-top: 1.2em; margin-bottom: 0.6em; }
    p { margin-bottom: 0.8em; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background-color: #f7f7f7; font-weight: bold; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>
`;
        const tempHtmlPath = path.join(outputDir, `${baseName}_temp.html`);
        fs.writeFileSync(tempHtmlPath, styledHtml);

        const puppeteer = await import('puppeteer-core');
        const browser = await puppeteer.default.launch({
          executablePath: browserPath,
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
        });

        const page = await browser.newPage();
        const fileUrl = `file://${path.resolve(tempHtmlPath).replace(/\\/g, '/')}`;
        await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

        await page.pdf({
          path: outputPath,
          format: 'A4',
          printBackground: true,
          margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        });

        await browser.close();
        try { fs.unlinkSync(tempHtmlPath); } catch {}

        if (fs.existsSync(outputPath)) {
          return {
            outputPath,
            outputFilename,
            mimeType: 'application/pdf',
          };
        }
      } catch (err: any) {
        console.warn('Mammoth + Puppeteer conversion failed...', err?.message);
      }
    }

    throw new Error(
      'Word to PDF requires LibreOffice or Microsoft Edge/Chromium. Please run TOOLZIP via Docker (`docker compose up`) where LibreOffice is installed.'
    );
  },
};
