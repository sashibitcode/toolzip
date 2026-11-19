import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { parsePageRanges } from '../utils/pageRange';

export const extractPdfPagesHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir, options } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF file provided');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const bytes = fs.readFileSync(inputFile.filepath);
    const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();

    if (totalPages === 0) {
      throw new Error('The uploaded PDF has 0 pages.');
    }

    const pagesToExtractStr = options?.pagesToExtract || options?.pages || '1';
    const targetIndices = parsePageRanges(pagesToExtractStr, totalPages);

    if (targetIndices.length === 0) {
      throw new Error(`No matching pages to extract in range "${pagesToExtractStr}". Document has ${totalPages} page(s).`);
    }

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, targetIndices);
    copiedPages.forEach((p) => newDoc.addPage(p));

    const newBytes = await newDoc.save();
    const outputFilename = `${baseName}_extracted_pages.pdf`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, newBytes);

    return {
      outputPath,
      outputFilename,
      mimeType: 'application/pdf',
    };
  },
};
