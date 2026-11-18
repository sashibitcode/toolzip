import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { execSafe, hasBinary } from '../utils/execHelper';

export const compressPdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir, options } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF file provided for compression');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const outputFilename = `${baseName}_compressed.pdf`;
    const outputPath = path.join(outputDir, outputFilename);

    const level = options?.level || 'recommended';
    const hasPython = (await hasBinary('python')) || (await hasBinary('python3'));

    if (hasPython) {
      const pythonBin = (await hasBinary('python')) ? 'python' : 'python3';
      const script = `
import sys
try:
    import pymupdf as fitz
except ImportError:
    import fitz

input_path = sys.argv[1]
output_path = sys.argv[2]
level = sys.argv[3] if len(sys.argv) > 3 else 'recommended'

doc = fitz.open(input_path)

if level == 'extreme':
    garbage_val = 4
    deflate_val = True
    clean_val = True
elif level == 'low':
    garbage_val = 1
    deflate_val = True
    clean_val = False
else: # recommended
    garbage_val = 3
    deflate_val = True
    clean_val = True

doc.save(output_path, garbage=garbage_val, deflate=deflate_val, clean=clean_val)
doc.close()
`;
      try {
        await execSafe(pythonBin, ['-c', script, inputFile.filepath, outputPath, level], { timeoutMs: 60000 });
        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
          return {
            outputPath,
            outputFilename,
            mimeType: 'application/pdf',
          };
        }
      } catch (pyErr) {
        console.warn('Python compression failed, falling back to pdf-lib:', pyErr);
      }
    }

    // Pure Node fallback using pdf-lib object stream compression
    const bytes = fs.readFileSync(inputFile.filepath);
    const pdfDoc = await PDFDocument.load(bytes);
    const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
    fs.writeFileSync(outputPath, compressedBytes);

    return {
      outputPath,
      outputFilename,
      mimeType: 'application/pdf',
    };
  },
};
