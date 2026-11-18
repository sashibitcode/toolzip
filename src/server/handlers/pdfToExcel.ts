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

    // Method 1: Try LibreOffice Calc conversion
    const isSofficeAvailable = (await hasBinary('soffice')) || (await hasBinary('libreoffice'));
    if (isSofficeAvailable) {
      try {
        const binary = (await hasBinary('soffice')) ? 'soffice' : 'libreoffice';
        await execSafe(binary, [
          '--headless',
          '--infilter=calc_pdf_import',
          '--convert-to',
          'xlsx',
          '--outdir',
          outputDir,
          inputFile.filepath,
        ], { timeoutMs: 90000 });

        const generatedFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.xlsx'));
        if (generatedFiles.length > 0) {
          return {
            outputPath: path.join(outputDir, generatedFiles[0]),
            outputFilename: generatedFiles[0],
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          };
        }
      } catch (err: any) {
        console.warn('LibreOffice Calc conversion failed, checking fallback...', err?.message);
      }
    }

    // Method 2: Python PyMuPDF table extraction (built-in find_tables)
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
all_rows = []

for page in doc:
    # Try finding structured tables first
    tabs = page.find_tables()
    if tabs.tables:
        for tab in tabs:
            for row in tab.extract():
                all_rows.append([c if c is not None else "" for c in row])
    else:
        # Fallback to text blocks
        blocks = page.get_text("blocks")
        for b in blocks:
            if b[6] == 0:
                line_parts = [p.strip() for p in b[4].split("\\n") if p.strip()]
                if line_parts:
                    all_rows.append(line_parts)

print(json.dumps(all_rows))
`;
        const res = await execSafe(pythonBin, ['-c', pyScript, inputFile.filepath], { timeoutMs: 45000 });
        const rawJson = res.stdout.substring(res.stdout.indexOf('['));
        const rows: any[][] = JSON.parse(rawJson);

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows.length > 0 ? rows : [['PDF Data Extraction', 'No content detected']]);
        XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');
        XLSX.writeFile(wb, outputPath);

        if (fs.existsSync(outputPath)) {
          return {
            outputPath,
            outputFilename,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          };
        }
      } catch (err: any) {
        console.warn('PyMuPDF table extraction failed...', err?.message);
      }
    }

    // Method 3: Poppler pdftotext layout
    const isPdftotext = await hasBinary('pdftotext');
    if (isPdftotext) {
      const txtPath = path.join(outputDir, `${baseName}_layout.txt`);
      await execSafe('pdftotext', ['-layout', inputFile.filepath, txtPath], { timeoutMs: 30000 });

      if (fs.existsSync(txtPath)) {
        const rawContent = fs.readFileSync(txtPath, 'utf8');
        const lines = rawContent.split(/\r?\n/);
        const dataRows: string[][] = [];

        for (const line of lines) {
          if (!line.trim()) continue;
          const cols = line.split(/\s{2,}|\t/).map(c => c.trim()).filter(Boolean);
          if (cols.length > 0) {
            dataRows.push(cols);
          }
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(dataRows.length > 0 ? dataRows : [['PDF Text Export', 'No structured tables found']]);
        XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');
        XLSX.writeFile(wb, outputPath);

        try { fs.unlinkSync(txtPath); } catch {}

        return {
          outputPath,
          outputFilename,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
      }
    }

    throw new Error(
      'PDF to Excel requires Python (PyMuPDF), LibreOffice, or Poppler.'
    );
  },
};
