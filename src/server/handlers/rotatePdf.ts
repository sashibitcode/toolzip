import fs from 'fs';
import path from 'path';
import { PDFDocument, degrees } from 'pdf-lib';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { parsePageRanges } from '../utils/pageRange';

export const rotatePdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir, options } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF file provided for rotation');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const bytes = fs.readFileSync(inputFile.filepath);
    const pdfDoc = await PDFDocument.load(bytes);
    const totalPages = pdfDoc.getPageCount();

    if (totalPages === 0) {
      throw new Error('The uploaded PDF has 0 pages.');
    }

    const angle = Number(options?.angle) || 90;
    const targetPagesStr = options?.pages || 'all';
    const targetIndices = parsePageRanges(targetPagesStr, totalPages);

    for (const idx of targetIndices) {
      const page = pdfDoc.getPage(idx);
      const currentAngle = page.getRotation().angle;
      const newAngle = (currentAngle + angle) % 360;
      page.setRotation(degrees(newAngle >= 0 ? newAngle : newAngle + 360));
    }

    const rotatedBytes = await pdfDoc.save();
    const outputFilename = `${baseName}_rotated.pdf`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, rotatedBytes);

    return {
      outputPath,
      outputFilename,
      mimeType: 'application/pdf',
    };
  },
};
