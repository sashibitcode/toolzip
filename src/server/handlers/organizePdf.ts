import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { parsePageSequence } from '../utils/pageRange';

export const organizePdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir, options } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF file provided');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const bytes = fs.readFileSync(inputFile.filepath);
    const srcDoc = await PDFDocument.load(bytes);
    const totalPages = srcDoc.getPageCount();

    if (totalPages === 0) {
      throw new Error('The uploaded PDF has 0 pages.');
    }

    const pageOrderStr = options?.pageOrder || options?.sequence || 'reverse';
    const sequenceIndices = parsePageSequence(pageOrderStr, totalPages);

    const newDoc = await PDFDocument.create();
    for (const idx of sequenceIndices) {
      const [copiedPage] = await newDoc.copyPages(srcDoc, [idx]);
      newDoc.addPage(copiedPage);
    }

    const newBytes = await newDoc.save();
    const outputFilename = `${baseName}_organized.pdf`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, newBytes);

    return {
      outputPath,
      outputFilename,
      mimeType: 'application/pdf',
    };
  },
};
