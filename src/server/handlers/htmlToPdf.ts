import fs from 'fs';
import path from 'path';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { execSafe, hasBinary } from '../utils/execHelper';

// Common executable paths for Chrome/Edge/Chromium on Windows, Linux, and Mac
const BROWSER_PATHS = [
  // Linux / Docker
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  // Windows
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  // Mac
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

function findBrowserPath(): string | null {
  for (const p of BROWSER_PATHS) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

export const htmlToPdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input HTML file provided');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const outputFilename = `${baseName}.pdf`;
    const outputPath = path.join(outputDir, outputFilename);

    // Try Puppeteer if a browser binary exists
    const executablePath = findBrowserPath();
    if (executablePath) {
      try {
        const puppeteer = await import('puppeteer-core');
        const browser = await puppeteer.default.launch({
          executablePath,
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
          ],
        });

        const page = await browser.newPage();
        const fileUrl = `file://${path.resolve(inputFile.filepath).replace(/\\/g, '/')}`;
        await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

        await page.pdf({
          path: outputPath,
          format: 'A4',
          printBackground: true,
          margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        });

        await browser.close();

        return {
          outputPath,
          outputFilename,
          mimeType: 'application/pdf',
        };
      } catch (err: any) {
        console.warn('Puppeteer conversion failed, trying fallback:', err?.message);
      }
    }

    // Fallback: LibreOffice converts HTML to PDF cleanly
    const isSofficeAvailable = (await hasBinary('soffice')) || (await hasBinary('libreoffice'));
    if (isSofficeAvailable) {
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
    }

    throw new Error(
      'HTML to PDF requires Chromium or LibreOffice. Please run via Docker (`docker compose up`) where Chrome/Chromium and LibreOffice are installed.'
    );
  },
};
