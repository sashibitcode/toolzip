import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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
      } catch (err: any) {
        console.warn('LibreOffice Excel-to-PDF failed, falling back...', err?.message);
      }
    }

    // Method 2: SheetJS + Puppeteer if browser is available
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
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #1a1a1a; font-size: 12px; }
    .sheet-container { margin-bottom: 40px; page-break-after: auto; }
    h2 { font-size: 16px; border-bottom: 2px solid #7A1F2B; padding-bottom: 4px; color: #3D0C14; margin-bottom: 12px; }
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
          landscape: true,
          printBackground: true,
          margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        });

        await browser.close();
        try {
          fs.unlinkSync(tempHtmlPath);
        } catch {}

        if (fs.existsSync(outputPath)) {
          return {
            outputPath,
            outputFilename,
            mimeType: 'application/pdf',
          };
        }
      } catch (err: any) {
        console.warn('SheetJS + Puppeteer Excel-to-PDF conversion failed, falling back...', err?.message);
      }
    }

    // Method 3: Pure Node.js fallback via SheetJS & pdf-lib (100% Vercel Serverless compatible)
    const workbook = XLSX.readFile(inputFile.filepath);
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Landscape A4 dimensions: 841.89 x 595.28
    const pageWidth = 841.89;
    const pageHeight = 595.28;
    const margin = 35;
    const usableWidth = pageWidth - margin * 2;
    const rowHeight = 22;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!rows || rows.length === 0) continue;

      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let currentY = pageHeight - margin - 20;

      // Sheet Title
      currentPage.drawText(`Sheet: ${sheetName}`, {
        x: margin,
        y: currentY,
        size: 15,
        font: fontBold,
        color: rgb(0.24, 0.05, 0.08),
      });
      currentY -= 30;

      // Calculate column count & width
      let maxCols = 1;
      for (const r of rows) {
        if (Array.isArray(r) && r.length > maxCols) maxCols = r.length;
      }
      const colWidth = Math.min(180, Math.max(70, usableWidth / Math.min(maxCols, 8)));

      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];
        if (!Array.isArray(row)) continue;

        if (currentY < margin + 30) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin - 20;
        }

        const isHeader = rIdx === 0;

        // Background row shading
        if (isHeader) {
          currentPage.drawRectangle({
            x: margin,
            y: currentY - 4,
            width: usableWidth,
            height: rowHeight,
            color: rgb(0.92, 0.94, 0.96),
          });
        } else if (rIdx % 2 === 1) {
          currentPage.drawRectangle({
            x: margin,
            y: currentY - 4,
            width: usableWidth,
            height: rowHeight,
            color: rgb(0.98, 0.98, 0.98),
          });
        }

        for (let cIdx = 0; cIdx < Math.min(row.length, 8); cIdx++) {
          const val = String(row[cIdx] ?? '').trim();
          if (!val) continue;

          const cellText = val.length > 25 ? `${val.substring(0, 22)}...` : val;
          currentPage.drawText(cellText, {
            x: margin + 5 + cIdx * colWidth,
            y: currentY + 3,
            size: isHeader ? 10 : 9,
            font: isHeader ? fontBold : font,
            color: isHeader ? rgb(0.1, 0.1, 0.1) : rgb(0.2, 0.2, 0.2),
          });
        }

        currentY -= rowHeight;
      }
    }

    if (pdfDoc.getPageCount() === 0) {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawText('Empty Spreadsheet', {
        x: margin,
        y: pageHeight / 2,
        size: 16,
        font,
      });
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
