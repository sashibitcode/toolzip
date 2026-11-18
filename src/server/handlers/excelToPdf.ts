import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { execSafe, hasBinary } from '../utils/execHelper';

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

export const excelToPdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input Excel file provided');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const outputFilename = `${baseName}.pdf`;
    const outputPath = path.join(outputDir, outputFilename);

    // Method 1: Try LibreOffice if available
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
        console.warn('LibreOffice Excel-to-PDF failed, falling back to SheetJS + Puppeteer...', err?.message);
      }
    }

    // Method 2: SheetJS (XLSX to styled HTML) + Puppeteer (Edge/Chromium to PDF)
    const browserPath = getBrowserPath();
    if (browserPath) {
      try {
        const workbook = XLSX.readFile(inputFile.filepath);
        let combinedHtml = '';

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const tableHtml = XLSX.utils.sheet_to_html(sheet);
          combinedHtml += `
            <div class="sheet-container">
              <h2>${sheetName}</h2>
              ${tableHtml}
            </div>
          `;
        }

        const styledDoc = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      padding: 30px;
      color: #1a1a1a;
      font-size: 12px;
    }
    .sheet-container { margin-bottom: 40px; page-break-after: auto; }
    h2 { font-size: 16px; border-bottom: 2px solid #059669; padding-bottom: 4px; color: #065f46; margin-bottom: 12px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
    tr:nth-child(even) { background-color: #f8fafc; }
    tr:first-child { background-color: #f1f5f9; font-weight: bold; }
  </style>
</head>
<body>
  ${combinedHtml}
</body>
</html>
`;
        const tempHtmlPath = path.join(outputDir, `${baseName}_excel.html`);
        fs.writeFileSync(tempHtmlPath, styledDoc);

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
          landscape: true, // Spreadsheets look best in landscape
          printBackground: true,
          margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        });

        await browser.close();
        try { fs.unlinkSync(tempHtmlPath); } catch { }

        if (fs.existsSync(outputPath)) {
          return {
            outputPath,
            outputFilename,
            mimeType: 'application/pdf',
          };
        }
      } catch (err: any) {
        console.warn('SheetJS + Puppeteer Excel-to-PDF conversion failed...', err?.message);
      }
    }

    throw new Error(
      'Excel to PDF requires LibreOffice or Microsoft Edge/Chromium. Please run TOOLZIP via Docker (`docker compose up`) where LibreOffice is installed.'
    );
  },
};
