import fs from 'fs';
import path from 'path';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { execSafe, hasBinary } from '../utils/execHelper';

export const pdfToWordHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF file provided');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const outputFilename = `${baseName}.docx`;
    const outputPath = path.join(outputDir, outputFilename);

    // Method 1: LibreOffice (if installed on host or in Docker)
    const isSofficeAvailable = (await hasBinary('soffice')) || (await hasBinary('libreoffice'));
    if (isSofficeAvailable) {
      try {
        const binary = (await hasBinary('soffice')) ? 'soffice' : 'libreoffice';
        await execSafe(binary, [
          '--headless',
          '--infilter=writer_pdf_import',
          '--convert-to',
          'docx',
          '--outdir',
          outputDir,
          inputFile.filepath,
        ], { timeoutMs: 90000 });

        const generatedFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.docx'));
        if (generatedFiles.length > 0) {
          const actualDocx = path.join(outputDir, generatedFiles[0]);
          return {
            outputPath: actualDocx,
            outputFilename: generatedFiles[0],
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          };
        }
      } catch (err: any) {
        console.warn('LibreOffice PDF-to-DOCX failed, falling back to pdf2docx...', err?.message);
      }
    }

    // Method 2: Python pdf2docx (high-fidelity layout, text, tables, styles)
    const hasPython = (await hasBinary('python')) || (await hasBinary('python3'));
    if (hasPython) {
      const pythonBin = (await hasBinary('python')) ? 'python' : 'python3';
      try {
        const pyScript = `
import sys
from pdf2docx import Converter
pdf_file = sys.argv[1]
docx_file = sys.argv[2]
cv = Converter(pdf_file)
cv.convert(docx_file, start=0, end=None)
cv.close()
`;
        await execSafe(pythonBin, ['-c', pyScript, inputFile.filepath, outputPath], { timeoutMs: 120000 });

        if (fs.existsSync(outputPath)) {
          return {
            outputPath,
            outputFilename,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          };
        }
      } catch (err: any) {
        console.warn('Python pdf2docx failed, falling back to text extractor...', err?.message);
      }
    }

    // Method 3: PyMuPDF block extractor + docx library
    if (hasPython) {
      const pythonBin = (await hasBinary('python')) ? 'python' : 'python3';
      try {
        const pyExtractScript = `
import sys, json
try:
    import pymupdf as fitz
except ImportError:
    import fitz

doc = fitz.open(sys.argv[1])
pages_data = []
for page in doc:
    blocks = page.get_text("blocks")
    page_blocks = []
    for b in blocks:
        # b = (x0, y0, x1, y1, text, block_no, block_type)
        if b[6] == 0: # text block
            txt = b[4].strip()
            if txt:
                page_blocks.append(txt)
    pages_data.append(page_blocks)

print(json.dumps(pages_data))
`;
        const res = await execSafe(pythonBin, ['-c', pyExtractScript, inputFile.filepath], { timeoutMs: 45000 });
        const pages: string[][] = JSON.parse(res.stdout.substring(res.stdout.indexOf('[')));

        const docChildren: Paragraph[] = [];
        for (let i = 0; i < pages.length; i++) {
          if (i > 0) {
            docChildren.push(
              new Paragraph({
                children: [new TextRun({ text: '', break: 1 })],
                pageBreakBefore: true,
              })
            );
          }
          for (const blockText of pages[i]) {
            const lines = blockText.split(/\r?\n/);
            for (const line of lines) {
              if (line.trim()) {
                docChildren.push(
                  new Paragraph({
                    children: [new TextRun({ text: line.trim(), size: 24 })],
                    spacing: { after: 120 },
                  })
                );
              }
            }
          }
        }

        const doc = new Document({
          sections: [
            {
              properties: {},
              children: docChildren.length > 0 ? docChildren : [new Paragraph('Converted Document')],
            },
          ],
        });

        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(outputPath, buffer);

        return {
          outputPath,
          outputFilename,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };
      } catch (err: any) {
        console.warn('PyMuPDF extraction failed...', err?.message);
      }
    }

    throw new Error(
      'Could not convert PDF to Word. Please ensure Python (with pdf2docx or pymupdf) or LibreOffice is installed.'
    );
  },
};
