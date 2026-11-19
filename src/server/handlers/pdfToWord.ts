import '../utils/nodePolyfill';
import fs from 'fs';
import path from 'path';
import { Document, Packer, Paragraph, TextRun } from 'docx';
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
        await execSafe(
          binary,
          [
            '--headless',
            '--infilter=writer_pdf_import',
            '--convert-to',
            'docx',
            '--outdir',
            outputDir,
            inputFile.filepath,
          ],
          { timeoutMs: 90000 }
        );

        const generatedFiles = fs.readdirSync(outputDir).filter((f) => f.endsWith('.docx'));
        if (generatedFiles.length > 0) {
          const actualDocx = path.join(outputDir, generatedFiles[0]);
          return {
            outputPath: actualDocx,
            outputFilename: generatedFiles[0],
            mimeType:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          };
        }
      } catch (err: any) {
        console.warn('LibreOffice PDF-to-DOCX failed, falling back...', err?.message);
      }
    }

    // Method 2: Python pdf2docx / PyMuPDF if Python is present
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
        await execSafe(pythonBin, ['-c', pyScript, inputFile.filepath, outputPath], {
          timeoutMs: 120000,
        });

        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
          return {
            outputPath,
            outputFilename,
            mimeType:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          };
        }
      } catch (err: any) {
        console.warn('Python pdf2docx failed, falling back to pure Node engine...', err?.message);
      }
    }

    // Method 3: Pure Node.js fallback via pdf-parse & docx (100% Vercel Serverless compatible)
    const inBytes = fs.readFileSync(inputFile.filepath);
    const { PDFParse } = await import('pdf-parse');
    const parser = new (PDFParse as any)({ data: new Uint8Array(inBytes) });

    try {
      const textObj = await parser.getText();
      const docChildren: Paragraph[] = [];

      for (let i = 0; i < textObj.pages.length; i++) {
        const pageText = textObj.pages[i].text || '';
        const lines = pageText.split(/\r?\n/).filter((l: string) => l.trim().length > 0);

        for (let j = 0; j < lines.length; j++) {
          const line = lines[j].trim();
          const isHeading = j === 0 && line.length < 60;
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  bold: isHeading,
                  size: isHeading ? 30 : 22,
                  font: 'Arial',
                }),
              ],
              pageBreakBefore: i > 0 && j === 0,
              spacing: { after: 120 },
            })
          );
        }
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children:
              docChildren.length > 0 ? docChildren : [new Paragraph('Converted Document')],
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(outputPath, buffer);

      return {
        outputPath,
        outputFilename,
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
