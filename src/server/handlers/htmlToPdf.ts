import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { execSafe, hasBinary } from '../utils/execHelper';

// Common executable paths for Chrome/Edge/Chromium on Windows, Linux, and Mac
const BROWSER_PATHS = [
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
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

    // Method 1: Try Puppeteer if a browser binary exists
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

    // Method 2: LibreOffice converts HTML to PDF cleanly
    const isSofficeAvailable = (await hasBinary('soffice')) || (await hasBinary('libreoffice'));
    if (isSofficeAvailable) {
      try {
        const binary = (await hasBinary('soffice')) ? 'soffice' : 'libreoffice';
        await execSafe(
          binary,
          ['--headless', '--convert-to', 'pdf', '--outdir', outputDir, inputFile.filepath],
          { timeoutMs: 60000 }
        );

        const generatedFiles = fs.readdirSync(outputDir).filter((f) => f.endsWith('.pdf'));
        if (generatedFiles.length > 0) {
          return {
            outputPath: path.join(outputDir, generatedFiles[0]),
            outputFilename: generatedFiles[0],
            mimeType: 'application/pdf',
          };
        }
      } catch (e) {
        console.warn('LibreOffice HTML-to-PDF failed, falling back...', e);
      }
    }

    // Method 3: Pure Node.js fallback via pdf-lib (100% Vercel Serverless compatible)
    const rawHtml = fs.readFileSync(inputFile.filepath, 'utf8');

    // Extract title
    const titleMatch = rawHtml.match(/<title[^>]*>(.*?)<\/title>/i);
    const docTitle = titleMatch ? titleMatch[1].trim() : baseName;

    // Strip scripts and styles
    let cleaned = rawHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
    cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');

    // Convert breaks and block elements to newlines
    cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
    cleaned = cleaned.replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n');

    // Strip all remaining HTML tags
    cleaned = cleaned.replace(/<[^>]+>/g, ' ');

    // Decode basic HTML entities
    cleaned = cleaned
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');

    const rawLines = cleaned.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const lines = rawLines.length > 0 ? rawLines : ['[Empty Document]'];

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595.28; // A4
    const pageHeight = 841.89;
    const margin = 50;
    const usableWidth = pageWidth - margin * 2;
    const lineHeight = 18;

    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - margin - 20;

    // Draw document title
    currentPage.drawText(docTitle, {
      x: margin,
      y: currentY,
      size: 20,
      font: fontBold,
      color: rgb(0.24, 0.05, 0.08),
    });
    currentY -= 35;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isSubHeading = line.length < 50 && (i === 0 || lines[i - 1].length === 0);
      const fontSize = isSubHeading ? 14 : 11;
      const activeFont = isSubHeading ? fontBold : font;
      const fontColor = isSubHeading ? rgb(0.24, 0.05, 0.08) : rgb(0.15, 0.15, 0.15);

      if (currentY < margin + 40) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin - 20;
      }

      // Word wrapping
      const words = line.split(' ');
      let currentLineText = '';

      for (const w of words) {
        const testLine = currentLineText ? `${currentLineText} ${w}` : w;
        const textWidth = activeFont.widthOfTextAtSize(testLine, fontSize);
        if (textWidth > usableWidth && currentLineText) {
          currentPage.drawText(currentLineText, {
            x: margin,
            y: currentY,
            size: fontSize,
            font: activeFont,
            color: fontColor,
          });
          currentY -= lineHeight;
          currentLineText = w;
          if (currentY < margin + 40) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            currentY = pageHeight - margin - 20;
          }
        } else {
          currentLineText = testLine;
        }
      }

      if (currentLineText) {
        currentPage.drawText(currentLineText, {
          x: margin,
          y: currentY,
          size: fontSize,
          font: activeFont,
          color: fontColor,
        });
        currentY -= isSubHeading ? 24 : lineHeight + 2;
      }
    }

    const outputBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, outputBytes);

    return {
      outputPath,
      outputFilename,
      mimeType: 'application/pdf',
    };
  },
};
