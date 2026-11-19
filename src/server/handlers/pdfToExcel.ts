import '../utils/nodePolyfill';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { execSafe, hasBinary } from '../utils/execHelper';

export const pdfToExcelHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF file provided');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const outputFilename = `${baseName}.xlsx`;
    const outputPath = path.join(outputDir, outputFilename);

    // Method 1: LibreOffice if available
    const isSofficeAvailable = (await hasBinary('soffice')) || (await hasBinary('libreoffice'));
    if (isSofficeAvailable) {
      try {
        const binary = (await hasBinary('soffice')) ? 'soffice' : 'libreoffice';
        await execSafe(
          binary,
          [
            '--headless',
            '--infilter=writer_pdf_import',
            '--convert-to',
            'xlsx',
            '--outdir',
            outputDir,
            inputFile.filepath,
          ],
          { timeoutMs: 60000 }
        );

        const generatedFiles = fs.readdirSync(outputDir).filter((f) => f.endsWith('.xlsx'));
        if (generatedFiles.length > 0) {
          return {
            outputPath: path.join(outputDir, generatedFiles[0]),
            outputFilename: generatedFiles[0],
            mimeType:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          };
        }
      } catch (err: any) {
        console.warn('LibreOffice PDF-to-Excel failed, falling back...', err?.message);
      }
    }

    // Method 2: Python if available
    const hasPython = (await hasBinary('python')) || (await hasBinary('python3'));
    if (hasPython) {
      const pythonBin = (await hasBinary('python')) ? 'python' : 'python3';
      try {
        const pyScript = `
import sys, json
try:
    import pymupdf as fitz
except ImportError:
    import fitz

doc = fitz.open(sys.argv[1])
rows = []
for page in doc:
    tabs = page.find_tables()
    if tabs.tables:
        for tab in tabs:
            for row in tab.extract():
                rows.append([c or "" for c in row])
    else:
        text = page.get_text("text")
        for line in text.splitlines():
            line = line.strip()
            if line:
                import re
                cols = re.split(r'\\s{2,}|\\t', line)
                rows.append(cols)

print(json.dumps(rows))
`;
        const res = await execSafe(pythonBin, ['-c', pyScript, inputFile.filepath], {
          timeoutMs: 45000,
        });
        const rawJson = res.stdout.substring(res.stdout.indexOf('['));
        const rows: any[][] = JSON.parse(rawJson);

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(
          rows.length > 0 ? rows : [['PDF Data Extraction', 'No content detected']]
        );
        XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');
        XLSX.writeFile(wb, outputPath);

        if (fs.existsSync(outputPath)) {
          return {
            outputPath,
            outputFilename,
            mimeType:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          };
        }
      } catch (err: any) {
        console.warn('Python table extraction failed, falling back...', err?.message);
      }
    }

    // Method 3: Pure Node.js fallback via pdf-parse & SheetJS (100% Vercel Serverless compatible)
    const inBytes = fs.readFileSync(inputFile.filepath);
    const { PDFParse } = await import('pdf-parse');
    const parser = new (PDFParse as any)({ data: new Uint8Array(inBytes) });

    try {
      const textObj = await parser.getText();
      const wb = XLSX.utils.book_new();

      for (let i = 0; i < textObj.pages.length; i++) {
        const rawLines = (textObj.pages[i].text || '')
          .split(/\r?\n/)
          .filter((l: string) => l.trim().length > 0);

        const rows = rawLines.map((line: string) => {
          return line.split(/\t|\s{2,}|,\s*/).map((c: string) => c.trim());
        });

        const ws = XLSX.utils.aoa_to_sheet(
          rows.length > 0 ? rows : [['Document Page ' + (i + 1), 'No text detected']]
        );
        XLSX.utils.book_append_sheet(wb, ws, `Page ${i + 1}`);
      }

      XLSX.writeFile(wb, outputPath);

      return {
        outputPath,
        outputFilename,
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    } catch (parseErr: any) {
      if (
        parseErr?.name === 'PasswordException' ||
        parseErr?.message?.toLowerCase().includes('password')
      ) {
        throw new Error(
          'This PDF document is password-protected. Please unlock it using the Unlock PDF tool first.'
        );
      }
      throw parseErr;
    } finally {
      try {
        await parser.destroy();
      } catch {}
    }
  },
};
